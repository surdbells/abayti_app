import {Component, OnDestroy, OnInit} from '@angular/core';
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
import {TranslatePipe} from "../../translate.pipe";

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
    TuiTextfieldOptionsDirective,
    TranslatePipe
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
    billing_name: "",
    billing_phone: "",
    billing_email: "",
    billing_country: "",
    billing_city: "",
    billing_area: "",
    billing_street: "",
    villa_number: "",
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
    shipping: {
      address: {
        street: "",
        city: "",
        stateProvince: "",
        country: "AE",
        postalCode: null
      },
      contact: {
        firstName: "",
        lastName: "",
        phone: "",
        mobilePhone: "",
        email: ""
      }
    },
    configuration: {
      paymentAction: "SALE",
      tokenizeCc: "true",
      locale: "en",
      returnUrl: "https://api.3bayti.ae/customer/complete"
    },
    deliveryConfiguration: {
      link: {
        isAutomatedInvoiceDeliveryRequired: true,
        method: "email",
        toRecipients: [] as string[]
      },
      receipt: {
        receiptNumber: "",
        isAutomatedReceiptDeliveryRequired: true,
        method: "email",
        toRecipients: [] as string[]
      }
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
    this.checkout.shipping.address.street = this.single_user.billing_street;
    this.checkout.shipping.address.city = this.single_user.billing_city;
    this.checkout.shipping.address.country = "AE";
    this.checkout.shipping.address.stateProvince = this.single_user.billing_area;

    this.checkout.shipping.contact.email = this.single_user.email;
    this.checkout.shipping.contact.phone = this.single_user.billing_phone;
    this.checkout.shipping.contact.firstName = this.single_user.first_name;
    this.checkout.shipping.contact.lastName = this.single_user.last_name;

    this.checkout.deliveryConfiguration.link.toRecipients.push(this.single_user.email);
    this.checkout.deliveryConfiguration.receipt.receiptNumber = GlobalComponent.generateTransactionReceipt();
    this.checkout.deliveryConfiguration.receipt.toRecipients.push(this.single_user.email);

    this.ui_controls.checking_out = true;
    const returnUrlPrefix = 'https://api.3bayti.ae/customer/complete';
    let listenerHandle: any = null;
    let processed = false; // ensure we only handle the redirect once
    this.networkService.post_request(this.checkout, GlobalComponent.initiatePayment)
      .subscribe({
        next: (response) => {
          this.ui_controls.checking_out = false;
          if (response.resultCode != 0) {
            this.error_notification(response.message);
            return;
          }
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
              const deliveryFee = this.bill.delivery;
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
                  this.open_processing(orderId, merchantReference, paymentType, deliveryFee);
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

  open_processing(orderId: any, merchantReference: any, paymentType: any, deliveryFee: number) {
    this.router.navigate(
      ['/', 'process'],
      { queryParams: { orderId, merchantReference, paymentType, deliveryFee } }
    ).then(r => console.log(r));
  }
}
