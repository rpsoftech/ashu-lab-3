import { Socket } from 'net';
import { GlobalData } from './staticData';
import { NativeModules } from './nativeModules';
import { NgZone } from '@angular/core';

export interface CommunicatinMSG {
  type: number;
  msg: string;
  data?: {
    [key: string]: string;
  };
  dataArray?: {
    [key: string]: string[];
  };
}
export class ClientSock {
  private name = '';
  private timeOut: NodeJS.Timeout;
  private AlphanumericReg = new RegExp(
    '^[a-zA-Z0-9' + this.native.path.sep + this.native.path.sep + ']*$'
  );
  private UndoTasks: {
    type: number;
    data: any;
  }[] = [];
  constructor(
    private socket: Socket,
    private keysss: string,
    private native: NativeModules,
    private zone: NgZone
  ) {
    socket.on('data', (a) => {
      zone.run(() => this.dataFromClient(a));
    });
    socket.on('close', () => {
      this.DestroyObject();
    });
    socket.on('end', () => {
      this.DestroyObject();
    });
    this.Init();
  }
  private AffToActiviry(a: string) {
    this.zone.run(() => {
      GlobalData.serverCommandArray.push(a);
    });
  }
  DestroyObject(): void {
    if (this.socket.destroyed === false) {
      this.socket.destroy();
    }
    if (GlobalData.clientsArray.indexOf(this.name) > -1) {
      GlobalData.clientsArray.splice(
        GlobalData.clientsArray.indexOf(this.name),
        1
      );
      this.AffToActiviry('Disconnected: ' + this.name);
      GlobalData.clientArrayNotifier.next(1);
    }
    if (this.name && GlobalData.clients[this.name]) {
      delete GlobalData.clients[this.name];
    }
    this.socket.removeAllListeners();
    if (GlobalData.objs[this.keysss]) {
      delete GlobalData.objs[this.keysss];
    }
    Object.keys(GlobalData.watcher).forEach((c) =>
      GlobalData.watcher[c][this.name]
        ? delete GlobalData.watcher[c][this.name]
        : ''
    );
  }
  private Init(s?: string): void {
    this.WriteToUser({
      type: 0,
      msg: s || 'Please Enter Your Name:',
    });
    this.timeOut = setTimeout(() => {
      this.WriteToUser({
        type: -1,
        msg: 'Sorry TimeOut..',
      });
      this.AffToActiviry('Client TimeOut:' + this.keysss);
      GlobalData.clientArrayNotifier.next(1);
      this.socket.destroy();
    }, 10000);
  }
  private WriteToUser(obj: any): void {
    if (this.socket.destroyed === false) {
      this.socket.write(JSON.stringify(obj));
    }
  }
  private AddRemoveWatcher(a: 'add' | 'delete', path: string) {
    if (a === 'add') {
      if (typeof GlobalData.watcher[path] === 'undefined') {
        GlobalData.watcher[path] = {};
      }
      if (typeof GlobalData.watcher[path][this.name] === 'undefined') {
        GlobalData.watcher[path][this.name] = GlobalData.objs[this.keysss];
      }
    } else {
      if (typeof GlobalData.watcher[path][this.name] !== 'undefined') {
        delete GlobalData.watcher[path][this.name];
      }
      if (Object.keys(GlobalData.watcher[path]).length === 0) {
        delete GlobalData.watcher[path];
      }
    }
  }
  private ValidateDirName(name: string) {
    return this.AlphanumericReg.test(name);
  }
  private createDirIfNotExist(path: string) {
    const exist = this.native.fs.existsSync(path);
    if (exist === false) {
      this.native.fs.mkdirSync(path);
    }
    return exist;
  }

  private async dataFromClient(d: Buffer): Promise<void> {
    try {
      console.log(d.toString());
      const m: CommunicatinMSG = JSON.parse(d.toString());
      this.HandleMsgs(m);
    } catch (e) {
      this.WriteToUser({
        type: -2,
        msg: 'Something Went Wrong ' + e.message ? e.message : '' + '...!!',
      });
    }
  }
  private HandleMsgs(m: CommunicatinMSG, push = true) {
    if (m.type === 0) {
      this.ValidateUserWithName(m.msg);
    } else if (m.type === 11) {
      const path = this.GetPath(m.msg, false);
      this.AddRemoveWatcher('add', path);
      this.WriteToUser({
        type: m.type,
        msg: 'ok',
      });
    } else if (m.type === 21) {
      const path = this.GetPath(m.msg, false);
      this.AddRemoveWatcher('delete', path);
      this.WriteToUser({
        type: m.type,
        msg: 'ok',
      });
    } else if (m.type === 51 || m.type === 61) {
      this.WriteToUser({
        type: m.type,
        msg: this.native.getDirectories(this.GetPath(m.msg, false)),
      });
    } else if (m.type === 1) {
      console.log('Create:', this.name, ':', m.msg);
      if (m.msg && this.ValidateDirName(m.msg)) {
        const c = this.createDirIfNotExist(this.GetPath(m.msg));
        if (c) {
          this.WriteToUser({
            type: -2,
            msg: 'Dir Already Exist..!!',
          });
        } else {
          if (push) {
            this.UndoTasks.push({
              data: m.msg,
              type: m.type,
            });
          }
          this.WriteToUser({ type: 1, msg: `${m.msg} Dir Created` });
        }
      } else {
        this.WriteToUser({ type: -2, msg: 'Please Enter Valid Dir Name:' });
      }
    } else if (m.type === 4) {
      //delete
      if (m.msg && this.ValidateDirName(m.msg)) {
        console.log('Delete:', this.name, ':', m.msg);
        const a = this.native.fs.existsSync(this.GetPath(m.msg));
        if (a) {
          const a1: string[] = [];
          this.deleteFolderRecursive(this.GetPath(m.msg), a1);
          this.WriteToUser({ type: 4, msg: `${m.msg} Dir Deleted` });
          if (push) {
            this.UndoTasks.push({
              data: a1,
              type: m.type,
            });
          }
        } else {
          this.WriteToUser({ type: -2, msg: `${m.msg} Dir Not Exist..!!` });
        }
      } else {
        this.WriteToUser({ type: -2, msg: 'Please Enter Valid Dir Name:' });
      }
    } else if (m.type === 2) {
      if (this.MoveDir(m as any)) {
        if (push) {
          this.UndoTasks.push({
            data: {
              source: m.data.target,
              target: m.data.source,
            },
            type: m.type,
          });
        }
      }
    } else if (m.type === 3) {
      if (this.RenameDir(m as any)) {
        if (push) {
          this.UndoTasks.push({
            data: {
              source: m.data.target,
              target: m.data.source,
            },
            type: m.type,
          });
        }
      }
    } else if (m.type === 5) {
      m.dataArray = {
        dir: this.getDirectories(
          this.native.path.join(GlobalData.dirPath, this.name, m.msg)
        ),
      };
      this.socket.write(JSON.stringify(m));
    } else if (m.type === 101) {
      try {
        if (this.UndoTasks.length === 0) {
          throw new Error('There Is No task');
        }
        const c = this.UndoTasks.pop();
        if (c.type === 1) {
          this.HandleMsgs(
            {
              type: 4,
              msg: c.data,
            },
            false
          );
        } else if (c.type === 4) {
          c.data.reverse().forEach((a) => {
            this.createDirIfNotExist(a);
          });
          this.WriteToUser({ type: 1, msg: `${c.data[0]} Dir Created` });
        } else if (c.type === 2) {
          this.HandleMsgs(
            {
              type: 2,
              msg: '',
              data: c.data,
            },
            false
          );
        } else if (c.type === 3) {
          this.HandleMsgs(
            {
              type: 3,
              msg: '',
              data: c.data,
            },
            false
          );
          // this.WriteToUser({ type: 1, msg: `${m.msg} Dir Created` });
        }
      } catch (e) {
        this.WriteToUser({
          type: -2,
          msg: e.message ? e.message : 'Something Went Wrong',
        });
      }
    }
    setTimeout(() => {
      this.WriteToUser({
        type: 101,
        data: this.UndoTasks,
      });
    }, 200);
  }
  private ValidateUserWithName(name: string): void {
    if (typeof GlobalData.clients[name] === 'undefined') {
      this.name = name;
      GlobalData.clients[name] = GlobalData.objs[this.keysss];
      GlobalData.clientsArray.push(name);
      this.createDirIfNotExist(
        this.native.path.join(GlobalData.dirPath, this.name)
      );
      // this.AddRemoveWatcher('add',GlobalData.dirPath);
      this.AffToActiviry('Client Connected:' + name);
      this.WriteToUser({
        type: 0,
        msg: 'ok',
      });
    } else {
      this.WriteToUser({
        type: -1,
        msg: 'Sorry User Already Exist..',
      });
      this.AffToActiviry('Username Already Exist:' + name);
      this.socket.destroy();
    }
    GlobalData.clientArrayNotifier.next(1);
    clearTimeout(this.timeOut);
  }
  WatcherNotification(
    type1: 'add' | 'delete',
    path1: string,
    dir: string
  ): void {
    const c = {
      type: type1,
      data: {
        path: path1,
        watch: dir,
      },
    };
    this.socket.write(JSON.stringify(c));
  }
  private MoveDir(m: {
    data: {
      source: string;
      target: string;
    };
    type: number;
  }) {
    try {
      //Move Dir
      if (typeof m.data === 'undefined') {
        throw new Error('Please Enter All Required Details');
      }
      if (
        typeof m.data.source === 'undefined' ||
        this.ValidateDirName(m.data.source) === false
      ) {
        throw new Error('Please Enter Sorce Dir Name');
      } else if (
        this.native.fs.existsSync(this.GetPath(m.data.source)) === false
      ) {
        throw new Error('Please Sorce Dir Not Exist');
      }
      if (
        typeof m.data.target === 'undefined' ||
        this.ValidateDirName(m.data.target) === false
      ) {
        throw new Error('Please Enter Target Dir Name');
      } else if (
        this.native.fs.existsSync(this.GetPath(m.data.source)) === false
      ) {
        throw new Error('Please Target Dir Not Exist');
      }
      const s = m.data.source.split(this.native.path.sep);
      const t = this.GetPath(m.data.target).split(this.native.path.sep);
      t[t.length] = s[s.length - 1];
      // For Moving Dir Just Changing Path Of the Folder
      this.native.fs.renameSync(
        this.GetPath(m.data.source),
        this.native.path.join( ...t)
      );
      this.WriteToUser({
        type: 2,
        msg: `${m.data.source} Successfully Moved to ${m.data.target}`,
      });
      return true;
    } catch (e) {
      this.WriteToUser({
        type: -2,
        msg: e.message ? e.message : 'Something Went Wrong',
      });
      return false;
    }
  }
  private RenameDir(m: {
    data: {
      source: string;
      target: string;
    };
    type: number;
  }) {
    try {
      //Rename
      if (typeof m.data === 'undefined') {
        throw new Error('Please Enter All Required Details');
      }
      if (
        typeof m.data.source === 'undefined' ||
        this.ValidateDirName(m.data.source) === false
      ) {
        throw new Error('Please Enter Sorce Dir Name');
      } else if (
        this.native.fs.existsSync(this.GetPath(m.data.source)) === false
      ) {
        throw new Error('Please Sorce Dir Not Exist');
      }
      if (
        typeof m.data.target === 'undefined' ||
        this.ValidateDirName(m.data.target) === false
      ) {
        throw new Error('Please Enter Target Dir Name');
      } else if (
        this.native.fs.existsSync(this.GetPath(m.data.source)) === false
      ) {
        throw new Error('Please Target Dir Not Exist');
      }
      let s = this.GetPath(m.data.source).split(this.native.path.sep);
      const t = m.data.target.split(this.native.path.sep);
      s[s.length - 1] = t[t.length - 1];
      s = s.filter((a) => a !== '');
      this.native.fs.renameSync(
        this.GetPath(m.data.source),
        this.native.path.join(...s)
      );
      this.WriteToUser({
        type: 3,
        msg: `${m.data.source} Successfully Renamed to ${m.data.target}`,
      });
      return true;
    } catch (e) {
      this.WriteToUser({
        type: -2,
        msg: e.message ? e.message : 'Something Went Wrong',
      });
      return false;
    }
  }
  private GetPath(dir: string, addname = true): string {
    return this.native.path.join(
      GlobalData.dirPath,
      addname ? this.name : '',
      dir
    );
  }
  private deleteFolderRecursive(path: string, a: string[]) {
    if (this.native.fs.existsSync(path)) {
      this.native.fs.readdirSync(path).forEach((file) => {
        // Get Full Path
        const curPath = this.native.path.join(path, file);
        // Check If It is Dir
        if (this.native.fs.lstatSync(curPath).isDirectory()) {
          // recurse
          this.deleteFolderRecursive(curPath, a);
        } else {
          // delete file
          this.native.fs.unlinkSync(curPath);
          a.push(curPath);
        }
      });
      // Delete Empty Dir
      this.native.fs.rmdirSync(path);
      a.push(path);
    }
  }
  private isDirectory(source: string) {
    return this.native.fs.lstatSync(source).isDirectory();
  }
  getDirectories(source: string) {
    return this.native.fs
      .readdirSync(source)
      .filter((n1) => this.isDirectory(this.native.path.join(source, n1)));
  }
}
