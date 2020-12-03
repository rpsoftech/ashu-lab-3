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
  dirArray: string[] = [];
  watchDirArray: string[] = [];
  constructor(public socketservice: SocketService, private zone: NgZone) {
    socketservice.dirArrayObse.subscribe((a) => {
      if (a !== null) {
        console.log(a);
        zone.run(() => {
          this.dirArray = a;
          this.selected = '';
        });
        // this.cd.detectChanges();
      }
    });
  }
  singleClick(d: string) {
    this.selected = this.selected === d ? '' : d;
    this.show = this.selected === '' ? false : true;
    // this.cd.detectChanges();
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
}
