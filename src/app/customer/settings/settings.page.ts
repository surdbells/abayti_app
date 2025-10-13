import {Component, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonAvatar,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonList,
  IonRow,
  IonTitle,
  IonImg,
  IonToolbar,
  IonItem,
  IonLabel,
  IonNote,
  IonRadioGroup,
  IonRadio,
  NavController,
  Platform,
  IonButtons,
  IonModal,
  IonSearchbar,
  IonFooter,
  IonIcon,
  IonTabBar,
  IonTabButton,
  IonText,
  IonCard,
  IonCardContent,
  IonSelect,
  IonSelectOption, IonSpinner
} from '@ionic/angular/standalone';
import {
    TuiButton, TuiFallbackSrcPipe,
    TuiIcon,
    TuiLabel, TuiLoader,
    TuiTextfieldComponent,
    TuiTextfieldDirective,
    TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {Router, RouterModule} from "@angular/router";
import {Subscription} from "rxjs";
import {Preferences} from "@capacitor/preferences";
import {LanguageSwitcherComponent} from "../../language-switcher.component";
import {TranslatePipe} from "../../translate.pipe";
import {ActionSheetController, LoadingController, ToastController} from "@ionic/angular";
import {GlobalComponent} from "../../global-component";
import {ConnectionService} from "../../service/connection.service";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {TuiAvatar} from "@taiga-ui/kit";
import {BottomNavComponent} from "../../bottom-nav/bottom-nav.component";
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule, DatePipe, CurrencyPipe,
    IonContent, IonGrid, IonRow, IonCol, IonAvatar, IonImg, IonButton,
    IonList, IonItem, IonLabel, IonNote, IonRadioGroup, IonRadio,
    TuiIcon, RouterModule, IonButtons, IonToolbar, IonHeader, LanguageSwitcherComponent, TranslatePipe, IonModal, IonSearchbar, IonTitle, FormsModule, TuiLabel, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, TuiButton, TuiLoader, TuiAvatar, TuiFallbackSrcPipe, IonFooter, IonIcon, IonTabBar, IonTabButton, IonText, BottomNavComponent, IonCard, IonCardContent, IonSelect, IonSelectOption, IonSpinner
  ],
})
export class SettingsPage implements OnInit {
  private backSub?: Subscription;
  @ViewChild(IonModal) modal!: IonModal;
  isOnline = true;
  private sub: Subscription;
  isLoading = false;
  constructor(
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private platform: Platform,
    private nav: NavController,
    private actionSheetCtrl: ActionSheetController,
    private net: ConnectionService,
    private networkService: NetworkService,
    private toast: HotToastService
  ) {
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }

  ui_controls = {
    is_loading: false,
    updating_location: false
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
    delivery_address: "",
    is_2fa: false,
    is_active: false,
    is_admin: false,
    is_vendor: false,
    is_customer: false
  }
  u_location = {
    id: 0,
    token: "",
    location: ""
  }

  ngOnInit() {
    this.getObject().then(r => console.log(r));
  }

  async getObject() {
    const ret: any = await Preferences.get({key: 'user'});
    if (ret.value == null) {
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    } else {
      this.single_user = JSON.parse(ret.value);
      this.u_location.id = this.single_user.id
      this.u_location.token = this.single_user.token
      this.u_location.location = this.single_user.location
      console.log(this.single_user);
    }
  }

  user = signal({name: 'User', avatar: 'assets/img/avatar-placeholder.jpg', points: 0, pending: 0});
  language = signal<'en' | 'ar'>('en');

  openReturns() {
  }

  openReviews() {
    this.router.navigate(['/', 'reviews']).then(r => console.log(r));

  }

  openHelp() {
    const phone = '971504559975';
    const msg = encodeURIComponent('Hello 3bayti, I need assistance.');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_system');
  }

  openMeasurement() {
    this.router.navigate(['/', 'measurements']).then(r => console.log(r));
  }

  openProfile() {
    this.router.navigate(['/', 'profile']).then(r => console.log(r));
  }

  async signOut() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Are you sure you want to sign out of this account?',
      buttons: [
        {
          text: 'Sign out',
          role: 'destructive',
          handler: () => {
            Preferences.remove({key: 'keep_session'}).then(r => console.log(r));
            Preferences.remove({key: 'user'}).then(r => console.log(r));
            this.router.navigate(['/', 'home']).then(r => console.log(r));
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

  // Called when the page becomes active (Ionic RouterOutlet triggers this)
  ionViewDidEnter() {
    this.backSub = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.nav.navigateRoot('/account').then(r => console.log(r)); // or Router: navigateByUrl('/account', { replaceUrl: true })
    });
  }

  // Clean up when you leave the page
  ionViewWillLeave() {
    this.backSub?.unsubscribe();
  }

  ngOnDestroy() {
    this.backSub?.unsubscribe();
  }

  openAddresses() {
    this.router.navigate(['/', 'addresses']).then(r => console.log(r));
  }

  async update_location() {
    if (this.isOnline) {
      if (this.u_location.location.length == 0) {
        this.show_error("Location must be set");
        return;
      }
      this.ui_controls.updating_location = true;
      this.networkService.post_request(this.u_location, GlobalComponent.UpdateLocation)
        .subscribe(({
          next: (response) => {
            if (response.response_code === 200 && response.status === "success") {
              this.single_user.location = this.u_location.location;
              Preferences.set({
                key: 'user',
                value: JSON.stringify(this.single_user)
              }).then(r => console.log(r));
              this.getObject();
              this.ui_controls.updating_location = false;
              this.cancel();
              this.show_success(response.message)
            }
          }
        }))
    } else {
      this.show_error("You are not online, check your connection")
    }
  }

  cancel() {
    this.modal.dismiss(null, 'cancel').then(r => console.log(r));
  }

  show_error(message: string) {
    this.toast.error(message, {
      position: 'top-center'
    });
  }

  show_success(message: string) {
    this.toast.success(message, {
      position: 'top-center'
    });
  }

  user_profile() {
    this.router.navigate(['/', 'settings']).then(r => console.log(r));
  }

  user_home() {
    this.router.navigate(['/', 'account']).then(r => console.log(r));
  }

  user_cart() {
    this.router.navigate(['/', 'cart']).then(r => console.log(r));
  }

  user_explore() {
    this.router.navigate(['/', 'explore']).then(r => console.log(r));
  }

  orders() {
    this.router.navigate(['/', 'orders']).then(r => console.log(r));
  }

  OpenEmail() {
    const email = 'support@3bayti.com';
    window.open(`mailto:${email}`);
  }

  async confirmDelete() {
    this.show_success('Your account has been scheduled for removal successfully');
  }
}
