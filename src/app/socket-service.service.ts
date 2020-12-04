import { Injectable } from '@angular/core';
import * as net from 'net';
import * as path from 'path';
import { BehaviorSubject, pipe, Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import * as Swal from 'sweetalert2';
import { Remote, OpenDialogReturnValue } from 'electron';
import * as fs1 from 'fs';
import { environment } from 'src/environments/environment';
declare var require: any;
export interface CommunicatinMSG {
  type: number | string;
  msg?: string;
  data?: {
    [key: string]: any;
  };
  dataArray?:{
    [key: string]: string[];
  }
}
@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private remoteElectron: Remote;
  swal = Swal.default;
  socket: net.Socket;
  fs: typeof fs1;
  conntected = true;
  path: typeof path;
  ServerRespoObse: Subject<CommunicatinMSG> = new Subject<CommunicatinMSG>();
  ServerSendObse: Subject<CommunicatinMSG> = new Subject<CommunicatinMSG>();
  private host: string='192.168.1.74';
  private port: string='5000';
  patharray: string[] = [];
  dirArrayObse: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(null);
  private basicPath: string = '';
  name = '';
  private netObj: typeof net;
  constructor() {
    this.netObj = window.require('net');
    this.remoteElectron = window.require('electron').remote;
    this.path = window.require('path');
    this.fs = window.require('fs');
    // require=()=>{}
    this.socket = new this.netObj.Socket();
    this.ServerSendObse.subscribe((a) => {
      this.socket.write(JSON.stringify(a));
    });
    this.socket
      .on('data', (a) => {
        try {
          const c = JSON.parse(a.toString());
          console.log(c);
          this.ServerRespoObse.next(c);
        } catch (e) {
          console.log(e);
        }
      })
      .on('close', () => {
        this.swal
          .fire({
            title: 'Error',
            text: 'Server Disconnected',
            icon: 'error',
            confirmButtonText: 'Restart It',
            showCancelButton: true,
            cancelButtonText: 'Close It',
          })
          .then((a) => {
            if (a.isConfirmed) {
              this.DestroyObj();
            } else {
              this.socket.destroy();
              this.remoteElectron.getCurrentWindow().close();
            }
          });
      });
    this.init();
    this.setObsevableLisnet();
  }
  private createDir(p: string): void {
    console.log(p);
    this.fs.mkdirSync(p);
  }
  Create(path1: string): void {
    this.ServerSendObse.next({
      type: 1,
      msg: path1,
    });
  }
  private deleteFolderRecursive(path1: string, deletecurrent = true): void {
    if (this.fs.existsSync(path1)) {
      this.fs.readdirSync(path1).forEach((file) => {
        // Get Full Path
        const curPath = this.path.join(path1, file);
        // Check If It is Dir
        if (this.fs.lstatSync(curPath).isDirectory()) {
          // recurse
          this.deleteFolderRecursive(curPath);
        } else {
          // delete file
          this.fs.unlinkSync(curPath);
        }
      });
      // Delete Empty Dir
      if (deletecurrent) {
        this.fs.rmdirSync(path1);
      }
    }
  }
  private OpenFolderSelection(): Promise<OpenDialogReturnValue> {
    // return {} as any;
    return this.remoteElectron.dialog.showOpenDialog(
      this.remoteElectron.getCurrentWindow(),
      {
        properties: ['openDirectory'],
        buttonLabel: 'Select',
        defaultPath: this.remoteElectron.app.getPath('desktop'),
        title: 'Choose Dir To Sync Server Dir',
      }
    );
  }
  setObsevableLisnet(): void {
    this.ServerRespoObse.subscribe(async (c) => {
      if (c.type === -1) {
        this.swal
          .fire({
            icon: 'error',
            title: 'Error',
            text: c.msg,
            confirmButtonText: 'Yes Restart It.!!',
            cancelButtonText: 'Close this..',
            showCancelButton: true,
          })
          .then((c1) => {
            if (c1.isConfirmed) {
              location.reload();
            } else {
              this.close();
            }
          });
      } else if (c.type === -2) {
        if (c.msg === 'name') {
          this.swal.fire({
            icon: 'success',
            title: 'Welcome To Dir Server ' + this.name + '..!!',
            timer: 3000,
          });
          this.GetAndUpdateArray();
        } else {
          this.swal.fire('Error', c.msg, 'error');
        }
      } else if (c.type === 11) {
        this.swal.fire('Success', 'Folder Is Synchronised', 'success');
      } else if (c.type === 21) {
        this.swal.fire('Success', 'Folder Is De-Synchronised', 'success');
      } else if (c.type === 'add') {
        this.createDir(
          this.path.join(this.basicPath, c.data.watch, c.data.path)
        );
      } else if (c.type === 'delete') {
        this.deleteFolderRecursive(
          this.path.join(this.basicPath, c.data.watch, c.data.path)
        );
      }
    });
  }
  async init(): Promise<void> {
    try {
      if (environment.production) {
        const a = await this.OpenFolderSelection();
        if (a.canceled) {
          throw Error('Please Select Dir Sync Path');
        }
        this.basicPath = a.filePaths[0];
      } else {
        this.basicPath = '/home/keyur/Desktop/test1';
      }
      console.log(this.basicPath);

      if (!this.port && !this.host) {
        const result: any = await this.swal
          .mixin({
            input: 'text',
            confirmButtonText: 'Next &rarr;',
            showCancelButton: true,
            progressSteps: ['1', '2'],
          })
          .queue([
            {
              title: 'Please Enter Host Name.',
              text: 'Enter The Host Name To Connect',
             },
            {
              title: 'Please Enter Port Number.',
              text: 'Enter The Port Number To Connect',
            },
          ]);
        if (result.value) {
          if (isNaN(+result.value[1])) {
            throw new Error('Please Enter Valid Port Number');
          }
          this.host = result.value[0];
          this.port = result.value[1];
        }
      }
      this.socket.connect(5000,'192.168.1.74', () => {}).once('error',console.log);
      const t = setTimeout(() => {
        this.swal.fire('Error', 'Something went Wrong', 'error').then(() => {
          // this.DestroyObj();
        });
      }, 11000);
      const c = await this.ServerRespoObse.pipe(first()).toPromise();
      clearTimeout(t);
      if (c.type !== 0) {
        throw new Error('Server Responded with Invalid');
      }
      if (environment.production) {
        let timerInterval;
        const name = await this.swal.fire({
          icon: 'question',
          title: c.msg,
          html: 'Server Will Wait For <b></b> milliseconds.',
          input: 'text',
          // inputValidator:console.log,
          timer: 10000,
          willOpen: () => {
            timerInterval = setInterval(() => {
              const content = this.swal.getContent();
              if (content) {
                const b = content.querySelector('b');
                if (b) {
                  b.textContent = this.swal.getTimerLeft() as any;
                }
              }
            }, 100);
          },
          onClose: () => {
            clearInterval(timerInterval);
          },
        });
        this.name = name.value;
        if (name.value) {
          this.ServerSendObse.next({
            type: 0,
            msg: name.value,
          });
        }
      } else {
        this.name = 'keyurshah';
        this.ServerSendObse.next({
          type: 0,
          msg: 'keyurshah',
        });
      }
      await this.ServerRespoObse.pipe(first()).toPromise();
      this.GetAndUpdateArray();
      // this.socket.connect(5000, 'localhost', () => {
      //   console.log('asdasd');

      //   this.socket.write(
      //     JSON.stringify({
      //       type: 0,
      //       msg: 'keyurshah',
      //     })
      //   );
      // });
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
                this.close();
              });
          }
        });
    }
  }
  async GetAndUpdateArray(): Promise<void> {
    this.ServerSendObse.next({
      type: 51,
      msg: '',
    });
    const l = await this.ServerRespoObse.pipe(first()).toPromise();
    console.log(l);
    
    this.dirArrayObse.next(l.msg as any);
  }
  async DeSync(p: string): Promise<void> {
    this.ServerSendObse.next({
      type: 21,
      msg: p,
    });
    await this.ServerRespoObse.pipe(first()).toPromise();
    this.deleteFolderRecursive(this.path.join(this.basicPath, p));
  }
  async AddToSync(p: string): Promise<void> {
    const p1 = this.path.join(this.basicPath, p);
    this.deleteFolderRecursive(p1)
    this.createDir(p1);
    this.ServerSendObse.next({
      type: 11,
      msg: p,
    });
    await this.ServerRespoObse.pipe(first()).toPromise();
    this.ServerSendObse.next({
      type: 51,
      msg: p,
    });
    const a = await this.ServerRespoObse.pipe(first()).toPromise();
    const dir: string[] = a.msg as any;
    dir.forEach((c) => {
      this.createDir(this.path.join(this.basicPath, p, c));
    });
  }
  close(): void {
    if (Array.isArray(this.dirArrayObse.value)) {
      this.dirArrayObse.value.forEach((a) => {
        this.deleteFolderRecursive(this.path.join(this.basicPath, a));
      });
    }
    setTimeout(() => {
      this.remoteElectron.getCurrentWindow().close();
    });
  }
  private DestroyObj() {
    this.socket.destroy();
    location.reload();
  }
}
