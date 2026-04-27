import {Component, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonFooter,
  IonHeader,
  IonLabel,
  IonModal,
  IonRow,
  IonTabBar,
  IonTabButton,
  IonTitle,
  IonToolbar,
  NavController,
  Platform
} from '@ionic/angular/standalone';
import {Subscription} from "rxjs";
import {ConnectionService} from "../../service/connection.service";
import {Router, RouterLink} from "@angular/router";
import {NetworkService} from "../../service/network.service";
import {AxNotificationService} from '../../shared/ax-mobile/notification';
import {ActionSheetController} from "@ionic/angular";
import {Preferences} from "@capacitor/preferences";
import {GlobalComponent} from "../../global-component";
import {Labels} from "../../class/labels";
import {Wishlist} from "../../class/wishlist";
import {TranslatePipe} from "../../translate.pipe";

import { AxIconComponent } from '../../shared/ax-mobile/icon';
import { AxLoaderComponent } from '../../shared/ax-mobile/loader';
import { AxTextFieldComponent } from '../../shared/ax-mobile/text-field';
@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.page.html',
  styleUrls: ['./wishlist.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    FormsModule,
    IonButtons,
    RouterLink,
    IonButton,
    IonCol,
    IonModal,
    IonRow,
    IonFooter,
    IonTabBar,
    IonTabButton,
    TranslatePipe,
    IonLabel,
    AxIconComponent,
    AxLoaderComponent,
    AxTextFieldComponent,
  ]
})
export class WishlistPage implements OnInit, OnDestroy {
  wishlists: Wishlist[] = [];
  categories: Labels[] = [];
  isOnline = true;
  private sub: Subscription;
  private backSub?: Subscription;
  @ViewChild(IonModal) modal!: IonModal;
  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private platform: Platform,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private networkService: NetworkService,
    private toast: AxNotificationService,
  ) {
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  @HostListener('window:ionBackButton', ['$event'])
  onHardwareBack(ev: Event) {
    (ev as CustomEvent).detail.register(100, () => {
      this.nav.navigateRoot('/account').then(r => console.log(r));
    });
  }
  ui_controls = {
    is_empty: false,
    is_loading: false,
    is_creating: false,
    is_deleting: false
  }
  /** Currently selected category name. Empty string means no selection yet. */
  selected_label = ""
  /** Currently selected category id. 0 means no selection yet. */
  selected_label_id = 0
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
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
  ionViewDidEnter() {
    this.backSub = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.nav.navigateRoot('/settings').then(r => console.log(r));
    });
  }
  ionViewWillLeave() {
    this.backSub?.unsubscribe();
  }
  rqst_param = {
    id: 0,
    token: "",
    label: 4
  }
  add_label = {
    id: 0,
    token: "",
    label_name: ""
  }
  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.rqst_param.id = this.single_user.id
      this.rqst_param.token = this.single_user.token
      this.get_label();
    }
  }
  add_wishlist_label() {
    this.add_label.id = this.single_user.id;
    this.add_label.token = this.single_user.token;
    if (this.add_label.label_name.length == 0){
      this.error_notification("Name is required");
      return;
    }
    this.ui_controls.is_empty = false;
    this.ui_controls.is_creating = true;
    this.networkService.post_request(this.add_label, GlobalComponent.addWishlistLabel)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.add_label.label_name = "";
            this.cancel();
            this.get_label();
            this.success_notification(response.message);
            this.ui_controls.is_creating = false;
          }
        }
      }))
  }
  cancel() {
    this.modal.dismiss(null, 'cancel').then(r => console.log(r));
  }
  error_notification(message: string) {
    this.toast.error(message, {
      position: "top-center"
    });
  }
  success_notification(message: string) {
    this.toast.success(message, {
      position: 'top-center'
    });
  }
  get_wishlist_by_label(label: number, name: string) {
    this.rqst_param.label = label;
    this.selected_label = name;
    this.selected_label_id = label;
    this.ui_controls.is_empty = false;
    this.ui_controls.is_loading = true;
    this.wishlists = [];
    this.networkService.post_request(this.rqst_param, GlobalComponent.readWishlist)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.wishlists = response.data;
            this.ui_controls.is_loading = false;
          }else{
            this.ui_controls.is_empty = true;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }
  get_label() {
    this.ui_controls.is_empty = false;
    this.ui_controls.is_loading = true;
    this.networkService.post_request(this.rqst_param, GlobalComponent.readWishlistLabel)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.categories = response.data;
            this.ui_controls.is_loading = false;
          }else{
            this.ui_controls.is_empty = true;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }
  user_profile() {
    this.router.navigate(['/', 'settings']).then(r => console.log(r));
  }
  user_home() {
    this.router.navigate(['/', 'account']).then(r => console.log(r));
  }
  user_styles() {
    this.router.navigate(['/', 'styles']).then(r => console.log(r));
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
  open_product(id: number) {
    this.router.navigate(
      ['/', 'product'],
      { queryParams: { id, name } }
    ).then(r => console.log(r));
  }
}
