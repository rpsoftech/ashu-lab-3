import { ChangeDetectorRef, Injectable, NgZone } from '@angular/core';
import { OpenDialogReturnValue } from 'electron/main';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';
import { ClientSock } from './client';
import { GlobalData } from './staticData';
import { FSWatcher } from 'fs';
import { NativeModules } from './nativeModules';
import { Socket, Server } from 'net';

declare const require: any;
@Injectable({
  providedIn: 'root',
})
export class ServerService {
  GlobalDirPath: string;
  swal = Swal;
  private port = 5000;
  private server: Server;
  private Fswatcher: FSWatcher;
  private host = '';
  ServerStarted = false;
  native: NativeModules;
  constructor(private zone: NgZone) {
    this.native = new NativeModules(window.require);
    if (environment.production === false) {
      this.GlobalDirPath = this.native.path.join(
        this.native.remoteElectron.app.getPath('desktop'),
        'test'
      );
    }
    // setInterval(()=>{
    //   console.log(GlobalData.serverCommandArray);

    // },2000);
    this.init();
  }
  startIt() {}
  async init() {
    try {
      if (!this.GlobalDirPath) {
        const a = await this.OpenFolderSelection();
        if (a.canceled) {
          throw Error('Please Select Dir For Server To Start');
        }
        this.GlobalDirPath = a.filePaths[0];
      }
      GlobalData.dirPath = this.GlobalDirPath;
      if (this.native.fs.existsSync(this.GlobalDirPath) === false) {
        this.native.fs.mkdirSync(this.GlobalDirPath);
      }
      if (this.Fswatcher) {
        this.Fswatcher.removeAllListeners();
      }
      this.Fswatcher = this.native
        .watcher(this.GlobalDirPath)
        .on('addDir', (c) => {
          this.WatcherNotification('add', c);
        })
        .on('unlinkDir', (c) => {
          this.WatcherNotification('delete', c);
        });
    } catch (e) {
      this.swal
        .fire({
          title: 'Error',
          icon: 'error',
          text: e.message,
          confirmButtonText: 'Yes Restart It.!!',
          cancelButtonText: 'Close this..',
          showCancelButton: true,
        })
        .then((a) => {
          if (a.isConfirmed) {
            this.init();
          } else {
            this.swal
              .fire({
                title: 'Okay Byyy!',
                timer: 1500,
                text: 'See You again!',
                showConfirmButton: false,
              })
              .then(() => {
                this.native.remoteElectron.getCurrentWindow().close();
              });
          }
        });
    }
  }
  private OpenFolderSelection(): Promise<OpenDialogReturnValue> {
    // return {} as any;
    return this.native.remoteElectron.dialog.showOpenDialog(
      this.native.remoteElectron.getCurrentWindow(),
      {
        properties: ['openDirectory'],
        buttonLabel: 'Select',
        defaultPath: this.native.remoteElectron.app.getPath('desktop'),
        title: 'Choose Dir For Server',
      }
    );
  }
  private WatcherNotification(type: 'add' | 'delete', path: string): void {
    Object.keys(GlobalData.watcher)
      .filter((k) => path.includes(k))
      .forEach((k) => {
        console.log(path);
        const l = Object.keys(GlobalData.watcher[k]);
        if (l.length === 0) {
          delete GlobalData.watcher[k];
        } else {
          const s = GlobalData.watcher[k];
          l.forEach((l1) => {
            s[l1].WatcherNotification(
              type,
              path.replace(k, ''),
              k.replace(this.GlobalDirPath, '')
            );
          });
        }
      });
  }
  StartTheServer(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ServerStarted === false) {
        this.server = this.native.netObj
          .createServer((s) => this.OnClientConnect(s))
          .listen(5000,'192.168.1.74',() => {
            console.log('started');
            this.ServerStarted = true;
            resolve();
          });
      }
    });
  }
  StopServer() {
    Object.keys(GlobalData.clients).forEach((a) => {
      GlobalData.clients[a].DestroyObject();
    });
    if (this.server) {
      this.server.removeAllListeners();
      this.server.close();
      this.ServerStarted = false;
    }
  }
  RemoveUser(key: string) {
    GlobalData.clients[key].DestroyObject();
  }
  private OnClientConnect(s: Socket): void {
    const c = this.native.crypto.randomBytes(5).toString('hex') + Date.now();
    GlobalData.serverCommandArray.push('Client Connecting...id ' + c);
    GlobalData.clientArrayNotifier.next(1);
    GlobalData.objs[c] = new ClientSock(s, c, this.native, this.zone);
  }
}
