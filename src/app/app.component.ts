import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { SocketService } from './socket-service.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  selected = '';
  show = false;
  movePath = '';
  syncServer=false;
  dirArray: string[] = [];
  dirArraySync:string[] = [];
  watchDirArray: string[] = [];
  constructor(public socketservice: SocketService, private zone: NgZone) {
    socketservice.dirArrayObse.subscribe((a) => {
      if (a !== null) {
        zone.run(() => {
          this.dirArray = a;
          this.selected = '';
        });
        // this.cd.detectChanges();
      }
    });
    socketservice.dirArrayObseSyncServer.subscribe((a) => {
      if (a !== null) {
        zone.run(() => {
          this.dirArraySync = a;
          this.selected = '';
        });
        // this.cd.detectChanges();
      }
    });
  }
  PathClicked(i:number){
    if(this.syncServer){
      return;
    }
    this.socketservice.PathArrayClicked(i);
  }
  refresh(){
    if(this.syncServer){
      this.socketservice.GetAndUpdateArray();
    }else{
      this.socketservice.GetAndUpdateArrayLab1();
    }
  }
  AddYoSync(a: string): void {
    this.watchDirArray.push(a);
    this.socketservice.AddToSync(a);
  }
  RemoveFromSync(a: string): void {
    this.watchDirArray.splice(this.watchDirArray.indexOf(a), 1);
    this.socketservice.DeSync(a);
  }
  close() {
    this.socketservice.swal
      .fire({
        title: 'Are You Sure..??',
        text: 'You Want To Close this..',
        icon: 'warning',
        showCancelButton: true,
        // confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes, Close it!',
        cancelButtonColor: '#d33',
      })
      .then((a) => {
        if (a.isConfirmed) {
          this.socketservice.close();
        }
      });
  }
  singleClick(d: string) {
    this.selected = this.selected === d ? '' : d;
    // this.cd.detectChanges();
  }
  doubleselectDir(a: string) {
    this.socketservice.patharray.push(a);
    this.socketservice.GetAndUpdateArrayLab1();
  }
  async CreateDir(): Promise<void> {
    const r = await this.socketservice.swal.fire({
      title: 'Please Enter Dir Name',
      input: 'text',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Create',
    });
    if (r.isConfirmed && r.value) {
      this.socketservice.Create(
        this.socketservice.path.join(this.getJoinPath(), r.value)
      );
    }
  }
  private getJoinPath(): string {
    return this.socketservice.path.join(...this.socketservice.patharray);
  }
  async Rename(): Promise<void> {
    if (this.selected === '') {
      this.socketservice.swal.fire(
        'Error',
        'Please Select Dir First,To Rename',
        'error'
      );
    } else {
      const r = await this.socketservice.swal.fire({
        title: 'Please Enter New Dir Name',
        input: 'text',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Create',
      });
      if (r.isConfirmed && r.value) {
        this.socketservice.ServerSendObse.next({
          type: 3,
          data: {
            source: this.socketservice.path.join(
              this.getJoinPath(),
              this.selected
            ),
            target: r.value,
          },
        });
      }
    }
  }
  Move(): void {
    if (this.selected === '' && this.movePath === '') {
      this.socketservice.swal.fire(
        'Error',
        'Please Select Dir First,To Rename',
        'error'
      );
    } else if (this.movePath === '') {
      this.movePath = this.socketservice.path.join(
        this.getJoinPath(),
        this.selected
      );
    } else {
      console.log(this.movePath);
      this.socketservice.ServerSendObse.next({
        type: 2,
        data: {
          source: this.movePath,
          target: this.getJoinPath(),
        },
      });
      this.movePath = '';
    }
  }
  async Delete(): Promise<void> {
    if (this.selected === '') {
      this.socketservice.swal.fire(
        'Error',
        'Please Select Dir First,To Delete',
        'error'
      );
    } else {
      const c = this.socketservice.path.join(this.getJoinPath(), this.selected);
      this.socketservice.ServerSendObse.next({
        type: 4,
        msg: c,
      });
    }
  }
}
