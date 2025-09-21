import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Cart} from "../../class/cart";
import {Labels} from "../../class/labels";
import {Subscription} from "rxjs";
import {
  IonButton, IonButtons,
  IonCard, IonCol, IonContent,
  IonFooter, IonGrid, IonHeader,
  IonItem,
  IonLabel,
  IonList, IonNote, IonRefresher, IonRefresherContent, IonRow,
  IonText,
  IonTitle, IonToolbar,
  NavController,
  Platform
} from "@ionic/angular/standalone";
import {ConnectionService} from "../../service/connection.service";
import {Router, RouterLink} from "@angular/router";
import {ActionSheetController} from "@ionic/angular";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {Preferences} from "@capacitor/preferences";
import {GlobalComponent} from "../../global-component";
import {
  TuiIcon,
  TuiLoader,
  TuiTextfieldComponent,
  TuiTextfieldDirective,
  TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {InAppBrowser} from "@capgo/inappbrowser";

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  imports: [
    TuiLoader,
    IonFooter,
    IonItem,
    IonText,
    IonLabel,
    IonList,
    IonTitle,
    IonCard,
    IonContent,
    TuiIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    RouterLink,
    IonRefresher,
    IonRefresherContent,
    IonNote,
    IonCol,
    IonGrid,
    IonRow,
    TuiTextfieldComponent,
    TuiTextfieldDirective,
    TuiTextfieldOptionsDirective
  ],
  standalone: true
})
export class CheckoutPage implements OnInit, OnDestroy {
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
    checking_out: false,
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
  checkout_ready = {
    resultCode: 0,
    message: "",
    resultClass: 0,
    classDescription: "",
    actionHint: "",
    requestReference: "",
    result: {
      nextActions: "",
      order: {
        status: "",
        creationTime: "",
        errorCode: 0,
        id: 0,
        amount: 0,
        currency: "",
        name: "",
        reference: "",
        category: "",
        channel: ""
      },
      configuration: {
        tokenizeCc: false,
        locale: "",
        paymentAction: ""
      },
      business: {
        id: "",
        name: ""
      },
      checkoutData: {
        postUrl: "",
        jsUrl: ""
      },
      deviceFingerPrint: {
        sessionId: ""
      }
    }
  }
  parameter = "";
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
    delivery_address: "",
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
  checkout = {
    apiOperation: "INITIATE",
    order: {
      reference: "",
      amount: 0,
      currency: "AED",
      name: "",
      channel: "web",
      category: "pay",
      items: []
    },
    configuration: {
      paymentAction: "SALE",
      tokenizeCc: "true",
      locale: "en",
      returnUrl: "https://api.3bayti.com/customer/complete"
    }
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
  ionViewWillEnter() {
    this.getObject().then(r => console.log(r));
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
            this.checkout.order.items = response.status;
            this.ui_controls.is_loading = false;
          }else{
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
          }
        }
      }))
  }

  checkout_initiate() {
    this.checkout.order.amount = this.bill.total;
    this.checkout.order.reference = GlobalComponent.generateTransactionReference();
    this.checkout.order.name = this.single_user.first_name + " " + this.single_user.last_name;
    this.ui_controls.checking_out = true;

    const returnUrlPrefix = 'https://api.3bayti.com/customer/complete';
    let listenerHandle: any = null;
    let processed = false; // ensure we only handle the redirect once

    this.networkService.post_request(this.checkout, GlobalComponent.initiatePayment)
      .subscribe({
        next: (response) => {
          this.ui_controls.checking_out = false;
          this.checkout_ready = response;
          console.log('checkout_ready', this.checkout_ready);
          InAppBrowser.openWebView({
            url: this.checkout_ready.result.checkoutData.postUrl,
            title: 'Checkout'
          })
            .then(openRes => {
              console.log('webview opened', openRes);
            })
            .catch(err => {
              console.error('openWebView failed', err);
            });
          InAppBrowser.addListener('urlChangeEvent', (info: any) => {
            try {
              if (processed) return;              // already handled once
              if (!info || !info.url) return;    // defensive
              const urlStr: string = info.url;
              if (!urlStr.startsWith(returnUrlPrefix)) return;
              const params = new URL(urlStr).searchParams;
              const orderId = params.get('orderId');
              const merchantReference = params.get('merchantReference');
              const paymentType = params.get('paymentType');
              console.log('Captured redirect:', { orderId, merchantReference, paymentType });
              processed = true; // prevent re-entry
              try {
                if (listenerHandle) {
                  if (typeof listenerHandle.remove === 'function') {
                    listenerHandle.remove();
                  } else if (typeof listenerHandle === 'function') {
                    listenerHandle(); // some libs return an unsubscribe function
                  }
                }
              } catch (e) {
                console.warn('Listener cleanup failed', e);
              }
              const closeWebview = async () => {
                try {
                  if (InAppBrowser.close) {
                    await InAppBrowser.close();
                  } else {
                    console.warn('No close method found on InAppBrowser plugin');
                  }
                } catch (e) {
                  console.warn('Error closing webview', e);
                } finally {
                  this.open_processing(orderId, merchantReference, paymentType);
                }
              };
              closeWebview().then(r => console.log(r));
            } catch (err) {
              console.error('Error handling urlChangeEvent', err);
            }
          })
            .then((handle: any) => {
              listenerHandle = handle;
              console.log('urlChangeEvent listener attached', listenerHandle);
            })
            .catch((err: any) => {
              console.error('addListener failed', err);
            });

          console.log(response);
        },
        error: (e) => {
          this.ui_controls.checking_out = false;
          console.log('initiatePayment error', e.toString());
          return;
        },
        complete: () => {
          this.ui_controls.checking_out = false;
          console.info('complete');
        }
      });
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
      position: "bottom-center"
    });
  }
  success_notification(message: string) {
    this.toast.success(message, {
      position: 'bottom-center'
    });
  }

  open_delivery() {
    this.nav.navigateRoot('/addresses').then(r => console.log(r));
  }

  open_processing(orderId: any, merchantReference: any, paymentType: any) {
    this.router.navigate(
      ['/', 'process'],
      { queryParams: { orderId, merchantReference, paymentType } }
    ).then(r => console.log(r));
  }
}
