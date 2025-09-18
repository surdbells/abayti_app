import {AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, signal, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle, IonChip,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel, IonList,
  IonModal,
  IonRange,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonTabBar,
  IonTabButton,
  IonText, IonTextarea,
  IonTitle,
  IonToolbar, NavController
} from '@ionic/angular/standalone';
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {
  TuiButton,
  TuiIcon,
  TuiLabel,
  TuiLoader,
  TuiSurface,
  TuiTextfieldComponent,
  TuiTextfieldDirective, TuiTextfieldOptionsDirective,
  TuiTitle
} from "@taiga-ui/core";
import {single, Subscription} from "rxjs";
import {Platform} from "@ionic/angular";
import {ConnectionService} from "../../service/connection.service";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {TuiAvatar, TuiButtonGroup, TuiRadioComponent, TuiShimmer, TuiTextarea} from "@taiga-ui/kit";
import {GlobalComponent} from "../../global-component";
import {Preferences} from "@capacitor/preferences";
import {CartIconComponent} from "../../cart-icon.component";
import {SizeChipsComponent} from "../../size-chips/size-chips.component";

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonImg, RouterLink, IonButton, TuiIcon, IonCard, TuiSurface, TuiAvatar, TuiTitle, TuiButtonGroup, IonCardHeader, IonCardContent, IonCardTitle, IonCardSubtitle, IonText, IonItem, IonSelect, IonLabel, IonSelectOption, IonInput, IonCol, IonGrid, IonModal, IonRange, IonRow, TuiLabel, TuiRadioComponent, IonFooter, IonIcon, IonTabBar, IonTabButton, TuiButton, TuiLoader, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, TuiShimmer, IonList, IonTextarea, CartIconComponent, SizeChipsComponent, TuiTextarea, IonChip]
})
export class ProductPage implements AfterViewInit, OnInit {
  @ViewChild('swiper', { static: true }) swiperEl!: ElementRef<HTMLElement>;
  @ViewChild(IonModal) modal!: IonModal;
  index = signal(0);
  isOnline = true;
  private sub: Subscription;
  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private platform: Platform,
    private router: Router,
    private route: ActivatedRoute,
    private networkService: NetworkService,
    private toast: HotToastService,
  ) {
    this.platform.backButton.subscribeWithPriority(10, () => {
      console.log('Handler was called!');
    });
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  ngAfterViewInit(): void {
    const el = this.swiperEl.nativeElement as any;
    const attach = () => {
      const sw: any = el.swiper;
      if (!sw) {
        setTimeout(attach, 30);
        return;
      }
      this.index.set(sw.activeIndex ?? 0);
      sw.on('slideChange', () => {
        this.index.set(sw.activeIndex ?? 0);
      });
    };

    attach();
  }
  ngOnInit() {
    this.rqst_param.product = Number(this.route.snapshot.queryParamMap.get('id'));
    this.rqst_param.product_name = this.route.snapshot.queryParamMap.get('name') || '';
    this.getObject().then(r => console.log(r));
  }
  colors: string[] = [];
  images: string[] = [];
  apiSizes = { };
  chosenSize: string | null = null;
  single = {
    id: 0,
    token: "",
    product: 0,
    store: 0,
    store_name: "",
    category_id: "",
    category_name: "",
    name: "",
    description: "",
    image_1: "assets/img/placeholder-1.png",
    images: [] as string[],
    collection: {},
    quantity: 0,
    allow_checkout_when_out_of_stock: false,
    with_storehouse_management: false,
    stock_status: "in_stock",
    sale_price: 0,
    price: 0,
    price_formated: "",
    minimum_order_quantity: 1,
    maximum_order_quantity: 1,
    height: 0,
    weight: 0,
    wide: 0,
    length: 0,
    cost_per_item: 0,
    delivery_time: "",
    custom_delivery_time: "",
    size_xs: false,
    size_s: false,
    size_m: false,
    size_l: false,
    size_xl: false,
    size_xxl: false,
    size_50: false,
    size_52: false,
    size_54: false,
    size_56: false,
    size_58: false,
    size_60: false,
    size_62: false,
    require_extra_msmt: false,
    extra_msmt: "",
    size_custom: false,
    is_hot: false,
    is_new: false,
    is_sale: false,
    is_featured: false,
    delivery_note: "",
    colors: "",
    try_on_active: false,
    label: 0
  };
  update = {
    id: 0,
    token: '',
    bust: 0,
    neck: 0,
    waist: 0,
    length: 0,
    hip: 0,
    arm: 0
  };
  ui_controls = {
    is_loading: false,
    loading: true,
    is_creating: false,
    is_adding_to_cart: false,
    is_loading_measurement: false,
    is_empty: false
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
  user_wishlist() {
    this.router.navigate(['/', 'wishlist']).then(r => console.log(r));
  }

  user_cart() {
    this.router.navigate(['/', 'cart']).then(r => console.log(r));
  }
  rqst_param = {
    id: 0,
    token: "",
    product: 0,
    product_name: ""
  }
  add_cart = {
    id: 0,
    token: "",
    cart_code: "PND",
    store: 0,
    discount: 0,
    product_id: 0,
    product_name: "",
    product_desc: "",
    product_image: "",
    quantity: 1,
    price: 0,
    size: "",
    color: "black",
    is_custom: false,
    measurement: "",
    extra_measurement: ""
  }
  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.rqst_param.id = this.single_user.id
      this.rqst_param.token = this.single_user.token
      this.get_measurement();
      this.get_single();
      this.add_cart.id = this.single_user.id
      this.add_cart.token = this.single_user.token
    }
  }
  get_measurement() {
    this.ui_controls.is_loading_measurement = true;
    this.networkService.post_request(this.rqst_param, GlobalComponent.readMeasurement)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.update.bust =  response.data[0].bust
            this.update.neck = response.data[0].neck
            this.update.waist = response.data[0].waist
            this.update.length = response.data[0].length
            this.update.hip = response.data[0].hip
            this.update.arm = response.data[0].arm
            this.ui_controls.is_loading_measurement = false;
            this.add_cart.measurement = JSON.stringify(this.update);
          }else{
            this.ui_controls.is_empty = true;
            this.ui_controls.is_loading_measurement = false;
          }
        }
      }))
  }
  addToCart() {
    if (this.add_cart.quantity == 0){
      this.error_notification("Quantity is require.")
      return;
    }

      if (!this.single.size_custom){
        if (this.add_cart.size.length == 0){
          this.error_notification("Select your preferred size.")
          return;
        }
      }
    if (this.add_cart.color.length == 0){
      this.error_notification("Select your preferred color.")
      return;
    }
    if (this.add_cart.size == 'custom'){
      this.add_cart.is_custom = true;
    }
    if (this.add_cart.is_custom){
      if (this.update.arm == 0){
        this.error_notification("Update your measurement to proceed")
        return;
      }
      if (this.update.length == 0){
        this.error_notification("Update your measurement to proceed")
        return;
      }
      if (this.update.hip == 0){
        this.error_notification("Update your measurement to proceed")
        return;
      }
      if (this.update.bust == 0){
        this.error_notification("Update your measurement to proceed")
        return;
      }
      if (this.update.neck == 0){
        this.error_notification("Update your measurement to proceed")
        return;
      }
      if (this.update.waist == 0){
        this.error_notification("Update your measurement to proceed")
        return;
      }
    }
    if (this.single.require_extra_msmt){
      if (this.add_cart.extra_measurement.length == 0){
        this.error_notification("provide extra measurement to proceed")
        return;
      }
    }
    this.ui_controls.is_adding_to_cart = true;
    this.networkService.post_request(this.add_cart, GlobalComponent.addToCart)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
              this.success_notification(response.message);
              this.ui_controls.is_adding_to_cart = false;
          }else{
            this.ui_controls.is_empty = true;
            this.ui_controls.is_adding_to_cart = false;
          }
        }
      }))
  }
  get_single() {
    this.ui_controls.is_loading = true;
    this.networkService.post_request(this.rqst_param, GlobalComponent.singleProduct)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.single = response.data;
            this.colors = response.data.colors.split(',');
            this.images = response.data.images.split(',');
            this.add_cart.product_id = this.single.product;
            this.add_cart.product_name = this.single.name;
            this.add_cart.product_desc = this.single.description;
            this.add_cart.product_image = this.single.image_1;
            this.add_cart.price = this.single.price;
            this.add_cart.store = this.single.store;
            this.apiSizes = {
              xxl: this.single.size_xxl,
              xl: this.single.size_xl,
              l: this.single.size_l,
              m: this.single.size_m,
              xs: this.single.size_s,
              s: this.single.size_xs
            };
            console.log(this.single);
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }
  update_measurement() {
    if(this.isOnline){
      this.update.id = this.single_user.id;
      this.update.token = this.single_user.token;
      this.ui_controls.is_loading_measurement = true;
      this.networkService.post_request(this.update, GlobalComponent.updateMeasurement)
        .subscribe(({
          next: (response) => {
            if (response.response_code === 200 && response.status === "success") {
              this.success_notification(response.message);
              this.ui_controls.is_loading_measurement = false;
              this.get_measurement();
              this.cancel();
            }else{
              this.ui_controls.is_loading_measurement = false
              this.error_notification(response.message);
            }
          },
          error: () => {
            this.ui_controls.is_loading_measurement = false;
            this.error_notification("unable to save measurement");
          }
        }))
    }else {
      this.error_notification("You are not online, check your connection")
    }
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
  imgLoaded: boolean[] = [false, false, false, false];
  onWillLoad(index: number) {
    this.imgLoaded[index] = false;
  }
  onDidLoad(index: number) {
    this.imgLoaded[index] = true;
  }
  user_messages() {
    this.router.navigate(['/', 'messages']).then(r => console.log(r));
  }
  onSizeSelected(sizeKey: string | any) {
    this.add_cart.size = sizeKey;
    console.log(this.chosenSize);
    // do whatever you need with the selection
  }
  increaseQuantity() {
    this.add_cart.quantity++;
  }
  decreaseQuantity() {
    if (this.add_cart.quantity > 1) {
      this.add_cart.quantity--;
    }
  }

  triggerBack() {
    this.nav.back();
  }
}
