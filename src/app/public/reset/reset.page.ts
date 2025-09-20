import { Component, OnInit } from '@angular/core';
import {
  IonContent,
  IonCol,
  IonGrid,
  IonRow,
  IonText,
  Platform
} from '@ionic/angular/standalone';
import { ConnectionService } from '../../service/connection.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    TuiButton,
    TuiLabel,
    TuiTextfieldComponent,
    TuiTextfieldDirective,
    TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {Router} from "@angular/router";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {DomSanitizer} from "@angular/platform-browser";
@Component({
  selector: 'app-reset',
  templateUrl: './reset.page.html',
  styleUrls: ['./reset.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonGrid,
    IonCol,
    IonRow,
    CommonModule,
    TuiTextfieldComponent,
    FormsModule,
    TuiLabel,
    TuiButton,
    TuiTextfieldDirective,
    TuiTextfieldOptionsDirective,
    IonText
  ]
})
export class ResetPage implements OnInit {
    isOnline = true;
    private sub: Subscription;
    constructor(
      private net: ConnectionService,
      private platform: Platform,
      private router: Router,
      private networkService: NetworkService,
      private toast: HotToastService,
      public sanitizer: DomSanitizer
    ) {
      this.net.setReachabilityCheck(true);
      this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
  ui_controls = {
    page_loading: false,
    login_loading: false,
    logged_in: false
  };
  reset = {
    email: ""
  };
   ngOnInit() {
    if (this.isOnline) {
          console.log('You are online');
        } else {
          console.log('You are offline');
      }
    }
  show_error(message: string) {
    this.toast.error(message, {
      position: "bottom-center"
    });
  }
  show_success(message: string) {
    this.toast.success(message, {
      position: "bottom-center"
    });
  }

  user_register() {
    this.router.navigate(['/', 'register']).then(r => console.log(r));
  }

  forgot_password() {
    this.router.navigate(['/', 'reset']).then(r => console.log(r));
  }

  start_reset() {

  }
}
