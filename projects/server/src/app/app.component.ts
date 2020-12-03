import { ChangeDetectorRef, Component } from '@angular/core';
import { ServerService } from './server.service';
import { GlobalData } from './staticData';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  array = GlobalData.clientsArray;
  commandArray=GlobalData.serverCommandArray;
  constructor(public ss: ServerService, private cd: ChangeDetectorRef) {
    // this.commandArray = ['asda','asdasd','asdad','dfghjkl;','fghjkliuyhgfghjk','rtyhujkl','rtyujiolp;','fghjkl;']
    GlobalData.clientArrayNotifier.subscribe(()=>{
      // cd.detectChanges();
    })
  }
  close() {
    this.ss.swal
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
        this.ss.StopServer();
        this.ss.native.remoteElectron.getCurrentWindow().close();
      }
    });
  }
  start() {
    this.ss.StartTheServer().then(() => {
      this.cd.detectChanges();
    });
  }
}
