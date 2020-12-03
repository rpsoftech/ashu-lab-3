import * as cryptoModel from 'crypto';
import { Remote } from 'electron';
import * as fsModel from 'fs';
import * as net from 'net';
import * as pathModel from 'path';
import { watch } from 'chokidar';
export class NativeModules {
  crypto: typeof cryptoModel;
  remoteElectron: Remote;
  netObj: typeof net;
  socket: net.Socket;
  fs: typeof fsModel;
  path: typeof pathModel;
  watcher: typeof watch;
  constructor(require: any) {
    this.netObj = require('net');
    this.remoteElectron = require('electron').remote;
    this.path = require('path');
    this.fs = require('fs');
    this.crypto = require('crypto');
    this.watcher = require('chokidar').watch;
  }
  getDirectories(source: string): string[] {
    return this.fs
      .readdirSync(source)
      .filter((n1) => this.isDirectory(this.path.join(source, n1)));
  }
  private isDirectory(source: string): boolean {
    return this.fs.lstatSync(source).isDirectory();
  }
}
