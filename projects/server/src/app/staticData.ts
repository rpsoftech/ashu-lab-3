import { Subject } from 'rxjs';
import { ClientSock } from './client';
export const GlobalData: {
  clients: {
    [key: string]: ClientSock;
  };
  dirPath?: string;
  objs: {
    [key: string]: ClientSock;
  };
  clientsArray: string[];
  serverCommandArray: string[];
  clientArrayNotifier: Subject<number>;
  watcher: {
    [key: string]: {
      [key: string]: ClientSock;
    };
  };
} = {
  clients: {},
  objs: {},
  clientArrayNotifier: new Subject<number>(),
  watcher: {},
  clientsArray: [],
  serverCommandArray: [],
};
