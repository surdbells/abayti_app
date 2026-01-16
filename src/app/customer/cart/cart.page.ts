import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList, IonModal,
  IonRefresher,
  IonRefresherContent, IonRow,
  IonSearchbar,
  IonTabBar,
  IonTabButton, IonText,
  IonTitle,
  IonToolbar,
  NavController,
  Platform
} from '@ionic/angular/standalone';
import {TuiButton, TuiIcon, TuiLoader} from "@taiga-ui/core";
import {Subscription} from "rxjs";
import {ConnectionService} from "../../service/connection.service";
import {Router, RouterLink} from "@angular/router";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {Cart} from "../../class/cart";
import {GlobalComponent} from "../../global-component";
import {Preferences} from "@capacitor/preferences";
import {ActionSheetController} from "@ionic/angular";
import {Labels} from "../../class/labels";
import {TranslatePipe} from "../../translate.pipe";
@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, FormsModule, IonButtons, IonCard, IonCardContent, IonRefresher, IonRefresherContent, IonSearchbar, TuiIcon, TuiButton, RouterLink, IonButton, IonIcon, IonFooter, IonLabel, IonTabBar, IonTabButton, TuiLoader, IonCol, IonItem, IonList, IonModal, IonRow, IonText, TranslatePipe]
})
export class CartPage implements OnInit, OnDestroy {
  carts: Cart[] = [];
  categories: Labels[] = [];
  isOnline = true;
  isWishOpen = false; // or control this as you like
  private sub: Subscription;
  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private platform: Platform,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private networkService: NetworkService,
    private toast: HotToastService
  ) {
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  ui_controls = {
    is_loading: false,
    is_creating: false,
    is_loading_category: false,
    is_empty: false
  }
  rqst_param = {
    id: 0,
    token: ""
  }
  request = {
    id: 0,
    token: ""
  }
  remove = {
    id: 0,
    token: "",
    item: 0,
  }
  increase = {
    id: 0,
    token: "",
    item: 0,
    quantity: 0,
  }
  decrease = {
    id: 0,
    token: "",
    item: 0,
    quantity: 0,
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
  addCloset = {
    id: 0,
    token: "",
    label_id: 0,
    product_id: 0,
    product_name: "",
    product_image: ""
  }
  bill = {
    count: 0,
    discount: 0,
    delivery: 0,
    subtotal: 0,
    total: 0,
    f_discount: "",
    f_delivery: "",
    f_subtotal: "",
    f_total: ""
  };
  @HostListener('window:ionBackButton', ['$event'])
  onHardwareBack(ev: Event) {
    (ev as CustomEvent).detail.register(100, () => {
      this.nav.navigateRoot('/account').then(r => console.log(r));
    });
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
  user_profile() {
    this.router.navigate(['/', 'settings']).then(r => console.log(r));
  }
  ngOnInit() {
    this.getObject().then(r => console.log(r));
    if (this.isOnline) {
      console.log('You are online');
    } else {
      console.log('You are offline');
    }
  }
  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.request.id = this.single_user.id
      this.request.token = this.single_user.token

      this.remove.id = this.single_user.id
      this.remove.token = this.single_user.token

      this.increase.id = this.single_user.id
      this.increase.token = this.single_user.token

      this.decrease.id = this.single_user.id
      this.decrease.token = this.single_user.token
      this.load_cart();
    }
  }
  load_cart() {
    this.carts = [];
    this.ui_controls.is_loading = true;
    this.ui_controls.is_empty = false;
    this.request.id = this.single_user.id;
    this.networkService.post_request(this.request, GlobalComponent.customerCart)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200) {
            this.carts = response.data;
            this.bill = response.message;
            Preferences.set({key: 'count', value: String(this.bill.count)}).then(r => console.log(r));
            this.ui_controls.is_loading = false;
          }else{
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
          }
        }
      }))
  }
  removeItem(item: number) {
    this.remove.item = item;
    this.networkService.post_request(this.remove, GlobalComponent.RemoveCartItem)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.success_notification(response.message);
            this.load_cart();
          }
        }
      }))
  }
  IncreaseItem(item: number, quantity: number) {
    this.increase.item = item;
    this.increase.quantity = quantity+1;
    this.networkService.post_request(this.increase, GlobalComponent.IncreaseItem)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.load_cart();
          }
        }
      }))
  }
  DecreaseItem(item: number, quantity: number) {
    this.decrease.item = item;
    this.decrease.quantity = quantity - 1;
    this.networkService.post_request(this.decrease, GlobalComponent.DecreaseItem)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.load_cart();
          }
        }
      }))
  }
  async startRemove(item: number, name: string) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Remove ' + name + " from cart ?",
      buttons: [
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.removeItem(item);
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
  user_home() {
    this.router.navigate(['/', 'account']).then(r => console.log(r));
  }
  user_wishlist() {
    this.router.navigate(['/', 'wishlist']).then(r => console.log(r));
  }
  user_explore() {
    this.router.navigate(['/', 'explore']).then(r => console.log(r));
  }
  user_orders() {
    this.router.navigate(['/', 'orders']).then(r => console.log(r));
  }
  user_cart() {
    this.router.navigate(['/', 'cart']).then(r => console.log(r));
  }
  user_messages() {
    this.router.navigate(['/', 'messages']).then(r => console.log(r));
  }
  user_styles() {
    this.router.navigate(['/', 'styles']).then(r => console.log(r));
  }
  handleRefresh(event: any) {
    setTimeout(() => {
      this.load_cart();
      event.target.complete();
    }, 200);
  }
  get_label() {
    this.ui_controls.is_loading_category = true;
    this.networkService.post_request(this.rqst_param, GlobalComponent.readWishlistLabel)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.categories = response.data;
            this.ui_controls.is_loading_category = false;
          }
        }
      }))
  }
  addToCloset(label: number) {
    this.ui_controls.is_loading_category = true;
    this.addCloset.label_id = label;
    this.isWishOpen = false;
    this.networkService.post_request(this.addCloset, GlobalComponent.addWishlist)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.success_notification(response.message);
            this.ui_controls.is_loading_category = false;
          }else{
            this.ui_controls.is_loading_category = false;
          }
        }
      }))
  }
  startAddToCloset(product: number, product_name: string, image_1: string) {
    this.addCloset.id = this.single_user.id;
    this.addCloset.token = this.single_user.token;
    this.addCloset.product_id = product;
    this.addCloset.product_name = product_name;
    this.addCloset.product_image = image_1;
    this.rqst_param.id = this.single_user.id;
    this.rqst_param.token = this.single_user.token;
    this.get_label();
    this.isWishOpen = true;
  }

  error_notification(message: string) {
    this.toast.error(message, {
      position: "top-center"
    });
  }
  success_notification(message: string) {
    this.toast.success(message, {
      position: "top-center"
    });
  }

  check_out() {
    this.router.navigate(['/', 'checkout']).then(r => console.log(r));
  }
  triggerBack() {
    this.nav.back();
  }
  open_product(id: number) {
    this.router.navigate(
      ['/', 'product'],
      { queryParams: { id, name } }
    ).then(r => console.log(r));
  }

  onDismiss() {
    this.isWishOpen= false;
  }
}
