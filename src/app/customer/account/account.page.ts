import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Preferences} from "@capacitor/preferences";
import { Subscription } from 'rxjs';
import {TuiResponsiveDialogService} from '@taiga-ui/addon-mobile';
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonLabel,
  IonRefresher, IonRefresherContent,
  IonSearchbar,
  IonTabBar,
  IonTabButton,
  IonToolbar
} from '@ionic/angular/standalone';
import {TuiAlertService, TuiDialogService, TuiIcon} from "@taiga-ui/core";
import {Router} from "@angular/router";
import {ActionSheetController, Platform} from '@ionic/angular';
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import { ConnectionService } from '../../service/connection.service';
import {GlobalComponent} from "../../global-component";
import {TUI_CONFIRM, TuiConfirmData, TuiShimmer} from "@taiga-ui/kit";
import {switchMap} from "rxjs/operators";
interface Category {
  id: number;
  icon: string;
  name: string;
}
@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, CommonModule, FormsModule, IonButton, IonButtons, IonSearchbar, IonAvatar, IonTabBar, IonTabButton, IonLabel, IonFooter, TuiIcon, IonRefresher, IonRefresherContent, TuiShimmer]
})
export class AccountPage implements OnInit {
  category: Category[] = [];
  isOnline = true;
  private readonly dialogs = inject(TuiResponsiveDialogService);
  private readonly alerts = inject(TuiAlertService);
  private sub: Subscription;
  constructor(
    private router: Router,
    private platform: Platform,
    private net: ConnectionService,
    private actionSheetCtrl: ActionSheetController,
    private networkService: NetworkService,
    private toast: HotToastService
  ) {
      this.platform.backButton.subscribeWithPriority(10, () => {
      console.log('Handler was called!');
      });
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
  ionViewWillEnter() {
    this.getObject().then(r => console.log(r));
  }
 ui_controls = {
   is_loading: false
  }
  rqst_param = {
    id: 0,
    token: ""
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
  ngOnInit() {
    this.getObject().then(r => console.log(r));
  }
   async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.rqst_param.id = this.single_user.id
      this.rqst_param.token = this.single_user.token
      await this.getCategory();
    }
  }


  user_profile() {
    this.router.navigate(['/', 'profile']).then(r => console.log(r));
  }
  user_wishlist() {
    this.router.navigate(['/', 'wishlist']).then(r => console.log(r));
  }
  user_messages() {
    this.router.navigate(['/', 'messages']).then(r => console.log(r));
  }

  user_cart() {
    this.router.navigate(['/', 'cart']).then(r => console.log(r));
  }

  user_explore() {
    this.router.navigate(['/', 'explore']).then(r => console.log(r));
  }
  user_support() {
    this.router.navigate(['/', 'orders']).then(r => console.log(r));
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.getCategory().then(r => console.log(r));
      event.target.complete();
    }, 200);
  }
  async getCategory() {
    this.ui_controls.is_loading = true;
    this.networkService.post_request(this.rqst_param, GlobalComponent.ProductCategory)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.category = response.data;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }

  x_user_sign_out() {
    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        label: 'Confirm sign out',
        data: {
          content: 'Your account will be logged out.',
          yes: 'Sign In',
          no: 'Cancel',
        },
      })
      .subscribe((response) => {
        if (response){
          Preferences.remove({key: 'keep_session'}).then(r => console.log(r));
          Preferences.remove({ key: 'user' }).then(r => console.log(r));
          this.router.navigate(['/', 'login']).then(r => console.log(r));
        }
      });
  }

async user_sign_out() {
  const actionSheet = await this.actionSheetCtrl.create({
    header: 'Are you sure you want to sign out of this account?',
    buttons: [
      {
        text: 'Sign out',
        role: 'destructive',
        handler: () => {
          Preferences.remove({key: 'keep_session'}).then(r => console.log(r));
          Preferences.remove({key: 'user'}).then(r => console.log(r));
          this.router.navigate(['/', 'login']).then(r => console.log(r));
        }
      }, {
        text: 'Cancel',
        role: 'cancel',
        data: {action: 'cancel'},
      },
    ],
  });
  await actionSheet.present();
}
}
