import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  IonContent,
  IonCol,
  IonGrid,
  IonRow,
  Platform, IonText
} from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';
import { ConnectionService } from '../../service/connection.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {TuiPassword} from '@taiga-ui/kit';
import {
  TuiButton, TuiIcon,
  TuiLabel, TuiLoader,
  TuiTextfieldComponent,
  TuiTextfieldDirective,
  TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {Router} from "@angular/router";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {GlobalComponent} from "../../global-component";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonGrid,
    IonRow,
    TuiIcon,
    IonCol,
    CommonModule,
    TuiTextfieldComponent,
    TuiTextfieldDirective,
    TuiTextfieldOptionsDirective,
    TuiLabel,
    TuiButton,
    FormsModule,
    IonText,
    TuiPassword,
    TuiLoader
  ]
})
export class LoginPage implements OnInit, OnDestroy {
    isOnline = true;
    private sub: Subscription;
    constructor(
      private net: ConnectionService,
      private platform: Platform,
      private router: Router,
      private networkService: NetworkService,
      private toast: HotToastService
    ) {
      this.net.setReachabilityCheck(true);
      this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  ngOnInit() {
    this.getObject().then(r => console.log(r));
  }
  single_user = {
    id: 0,
    token: "",
    first_name: "",
    last_name: "",
    user_type: "",
    email: "",
    phone: "",
    avatar: "",
    location: "",
    is_2fa: false,
    is_active: false,
    is_admin: false,
    is_vendor: false,
    is_customer: false
  }
  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      //
    }else{
      this.single_user = JSON.parse(ret.value);
      this.router.navigate(['/', 'account']).then(r => console.log(r));
    }
  }
  ui_controls = {
    page_loading: false,
    login_loading: false,
    logged_in: false
  };
  login = {
    email: "surdbells@gmail.com",
    password: "@2025GoBeta",
    remember: false,
  };
  async signIn() {
    if(this.isOnline){
      if (this.login.email.length == 0) {
        this.show_error("Email address is required");
        return;
      }
      if (!GlobalComponent.validateEmail(this.login.email)) {
        this.show_error("The email you entered is invalid. Check and ensure you enter a correct email address.");
        return;
      }
      if (this.login.password.length == 0) {
        this.show_error("Password is required");
        return;
      }
      if (this.login.remember) {
        Preferences.set({key: 'keep_session', value: JSON.stringify(this.login)}).then(r => console.log(r));
      }
      if (!this.login.remember) {
        Preferences.remove({key: 'keep_session'}).then(r => console.log(r));
      }
      console.log(this.login);
      this.ui_controls.login_loading = true;
      this.networkService.post_request(this.login, GlobalComponent.UserLogin, )
        .subscribe(({
          next: (response) => {
            if (response.response_code === 200 && response.status === "success") {
              Preferences.set({
                key: 'user',
                value: JSON.stringify(response.data)
              }).then(r => console.log(r));
              this.ui_controls.login_loading = false;
              this.router.navigate(['/', 'account']).then(r => console.log(r));
            }
            if (response.status === "failed") {
              this.ui_controls.logged_in = false;
              this.ui_controls.login_loading = false;
              this.show_error(response.message);
              return;
            }
          },
          error: (e) => {
            this.ui_controls.logged_in = false;
            this.ui_controls.login_loading = false;
            this.show_error(e.toString());
            return;
          },
          complete: () => {
            console.info('complete');
          }
        }))
    }else {
      this.show_error("You are not online, check your connection")
    }
  }
  show_error(message: string) {
    this.toast.error(message, {
      position: 'top-right'
    });
  }
  show_success(message: string, position: any) {
    this.toast.success(message, {
      position: 'top-right'
    });
  }

  user_register() {
    this.router.navigate(['/', 'register']).then(r => console.log(r));
  }
  forgot_password() {
    this.router.navigate(['/', 'reset']).then(r => console.log(r));
  }
  google_signin(): void {
    this.show_error("Google sign in is currently unavailable");
  }
  apple_signin(): void {
    this.show_error("Apple sign in is currently unavailable");
  }
}
