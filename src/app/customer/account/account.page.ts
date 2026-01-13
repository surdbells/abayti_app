import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Preferences} from "@capacitor/preferences";
import { Subscription } from 'rxjs';
import {
  IonAvatar,
  IonButton,
  IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol,
  IonContent,
  IonFooter, IonGrid,
  IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonInput, IonItem,
  IonLabel, IonList, IonModal, IonNote, IonRange,
  IonRefresher, IonRefresherContent, IonRow,
  IonSearchbar, IonSelect, IonSelectOption,
  IonTabBar,
  IonTabButton, IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {
  TuiButton,
  TuiFallbackSrcPipe,
  TuiIcon, TuiLabel, TuiLoader,
  TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldDropdownDirective, TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {Router} from "@angular/router";
import {ActionSheetController, InfiniteScrollCustomEvent, Platform} from '@ionic/angular';
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import { ConnectionService } from '../../service/connection.service';
import {GlobalComponent} from "../../global-component";
import {
  TuiAvatar,
  TuiChevron, TuiChip,
  TuiDataListWrapperComponent, tuiItemsHandlersProvider, TuiRadioComponent,
  TuiSelectDirective,
  TuiShimmer
} from "@taiga-ui/kit";
import {Products} from "../../class/products";
import {Labels} from "../../class/labels";
import {CartIconComponent} from "../../cart-icon.component";
import {BlockerService} from "../../blocker.service";
import {StoreRatingSimpleComponent} from "../../store_rating";
import {TranslatePipe} from "../../translate.pipe";
import {HScrollProgressComponent} from "../../h-scroll-progress/h-scroll-progress.component";

interface Category {
  readonly id: number;
  readonly name: string;
}
type DualRange = { lower: number; upper: number };

export interface Product {
  product_id: number;
  product_name: string;
  price: string;
  image: string;
}

export interface Store {
  store_id: number;
  store_name: string;
  store_desc: string;
  rating: number | null;
  rating_count: number;
  products: Product[];
}

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, CommonModule, FormsModule, IonButton, IonButtons, IonSearchbar, IonAvatar, IonTabBar, IonTabButton, IonLabel, IonFooter, TuiIcon, IonRefresher, IonRefresherContent, TuiShimmer, TuiAvatar, TuiFallbackSrcPipe, IonRow, IonCol, IonGrid, IonIcon, IonItem, IonList, IonModal, IonTitle, TuiButton, IonCard, IonCardContent, TuiTextfieldComponent, TuiSelectDirective, TuiLabel, TuiTextfieldOptionsDirective, TuiChevron, TuiDataListWrapperComponent, TuiTextfieldDropdownDirective, IonRange, IonCardHeader, IonCardTitle, IonInput, IonNote, TuiRadioComponent, IonSelect, IonSelectOption, TuiLoader, TuiTextfieldDirective, CartIconComponent, StoreRatingSimpleComponent, TranslatePipe, HScrollProgressComponent, IonChip, TuiChip, IonInfiniteScroll, IonInfiniteScrollContent]
})

export class AccountPage implements OnInit, OnDestroy {
  best_sellers: Products[] = [];
  new_arrivals: Products[] = [];
  vendor_featured: Store[] = [];
  @ViewChild('myRefresher') refresher!: IonRefresher;
  isOnline = true;
  categories: Labels[] = [];
  isWishOpen = false;
  isFilterOpen = false;
  @Input() rating: number = 4.5;
  @Input() ratingsCount: number | string = '100+';
  isActive = false;

  // Track image loading states
  imageLoaded: { [key: string]: boolean } = {};

  // Helper to return full / half / empty stars array for template
  get stars(): ('full' | 'half' | 'empty')[] {
    const out: ('full' | 'half' | 'empty')[] = [];
    let remaining = this.rating;
    for (let i = 0; i < 5; i++) {
      if (remaining >= 1) {
        out.push('full');
      } else if (remaining >= 0.5) {
        out.push('half');
      } else {
        out.push('empty');
      }
      remaining -= 1;
    }
    return out;
  }


  range = signal<DualRange>({ lower: 5, upper: 500 });
  protected readonly category: Category[] = [
    {id: 1, name: 'Abayas'},
    {id: 2, name: 'Mukhawars'},
    {id: 3, name: 'Kaftans'},
    {id: 4, name: 'Bags'},
    {id: 5, name: 'Accessories'},
    {id: 6, name: 'Modest clothes'},
    {id: 7, name: 'Dresses'}
  ];
  protected value: Category | null = {id: 1, name: 'Abayas'};
  private sub: Subscription;

  constructor(
    private router: Router,
    private platform: Platform,
    private net: ConnectionService,
    private blocker: BlockerService,
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


  ui_controls = {
    is_loading: true,
    is_empty: false,
    is_loading_category: false
  }
  best_seller = {
    id: 0,
    token: ""
  }
  rqst_param = {
    id: 0,
    token: ""
  }
  get_featured = {
    id: 0,
    token: "",
    limit: 5,
    offset: 0
  }
  meta = {
    total: 0,
    page: 0,
    per_page: 0,
    total_pages: 0
  };
  rqst_param_products_by_category = {
    id: 0,
    token: "",
    category: 0
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
  filter = {
    id: 0,
    token: "",
    category: [1],
    price_start: this.range().lower,
    price_end: this.range().upper,
    delivery: "1 - 3"
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
    this.blocker.block({ disableSwipe: true, disableHardwareBack: true });
    this.getObject().then(r => console.log(r));
  }

  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.get_best_sellers();
      this.get_new_arrivals();
      this.get_featured_products();
      this.load_cart();
    }
  }

  ionViewDidEnter(){
    this.load_cart();
  }

  ngOnDestroy(): void {
    this.blocker.unblock();
    this.sub?.unsubscribe();
  }

  // ========================================
  // Image loading handlers
  // ========================================

  onImageLoad(key: string) {
    this.imageLoaded[key] = true;
  }

  onImageError(key: string) {
    // Mark as loaded even on error to hide skeleton
    this.imageLoaded[key] = true;
  }

  // ========================================
  // Navigation methods
  // ========================================

  user_profile() {
    this.router.navigate(['/', 'settings']).then(r => console.log(r));
  }
  user_wishlist() {
    this.router.navigate(['/', 'wishlist']).then(r => console.log(r));
  }
  user_messages() {
    this.router.navigate(['/', 'messages']).then(r => console.log(r));
  }
  bestSellers() {
    this.router.navigate(['/', 'best-sellers']).then(r => console.log(r));
  }
  newArrivals() {
    this.router.navigate(['/', 'new-arrivals']).then(r => console.log(r));
  }
  search() {
    this.router.navigate(['/', 'search']).then(r => console.log(r));
  }
  user_explore() {
    this.router.navigate(['/', 'explore']).then(r => console.log(r));
  }
  user_cart() {
    this.router.navigate(['/', 'cart']).then(r => console.log(r));
  }
  user_search() {
    this.router.navigate(['/', 'search']).then(r => console.log(r));
  }
  user_styles() {
    this.router.navigate(['/', 'styles']).then(r => console.log(r));
  }
  open_product(id: number) {
    this.router.navigate(
      ['/', 'product'],
      { queryParams: { id, name } }
    ).then(r => console.log(r));
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.ui_controls.is_loading = true;
      this.imageLoaded = {}; // Reset image loading states
      this.get_best_sellers();
      this.get_new_arrivals();
      this.get_featured_products();
      event.target.complete();
    }, 200);
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

  readonly min = 1;
  readonly max = 5000;
  readonly step = 5;

  onRangeChange(ev: any) {
    const v = ev?.detail?.value as DualRange | number;
    if (typeof v === 'number') return;
    const lower = this.clamp(v.lower, this.min, Math.min(v.upper, this.max));
    const upper = this.clamp(v.upper, Math.max(v.lower, this.min), this.max);
    this.range.set({ lower: this.snap(lower), upper: this.snap(upper) });
    this.filter.price_start = this.range().lower;
    this.filter.price_end = this.range().upper;
  }

  onLowerInput(ev: any) {
    const raw = Number(ev?.target?.value ?? this.range().lower);
    const snapped = this.snap(this.clamp(raw, this.min, this.range().upper));
    this.range.set({ lower: snapped, upper: this.range().upper });
    this.filter.price_start = this.range().lower;
    this.filter.price_end = this.range().upper;
  }

  onUpperInput(ev: any) {
    const raw = Number(ev?.target?.value ?? this.range().upper);
    const snapped = this.snap(this.clamp(raw, this.range().lower, this.max));
    this.range.set({ lower: this.range().lower, upper: snapped });
    this.filter.price_start = this.range().lower;
    this.filter.price_end = this.range().upper;
  }

  private clamp(n: number, lo: number, hi: number) {
    return Math.min(Math.max(n, lo), hi);
  }
  private snap(n: number) {
    return Math.round(n / this.step) * this.step;
  }

  get_best_sellers() {
    this.ui_controls.is_loading = true;
    this.best_seller.id = this.single_user.id;
    this.best_seller.token = this.single_user.token;
    this.rqst_param_products_by_category.category = 0;
    this.networkService.post_request(this.best_seller, GlobalComponent.best_sellers)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.best_sellers = response.data;
            this.ui_controls.is_loading = false;
          }else{
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }

  get_new_arrivals() {
    this.ui_controls.is_loading = true;
    this.best_seller.id = this.single_user.id;
    this.best_seller.token = this.single_user.token;
    this.rqst_param_products_by_category.category = 0;
    this.networkService.post_request(this.best_seller, GlobalComponent.new_arrivals)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.new_arrivals = response.data;
            this.ui_controls.is_loading = false;
          }else{ this.ui_controls.is_loading = false; }
        }
      }))
  }

  get_featured_products() {
    this.ui_controls.is_loading = true;
    this.get_featured.id = this.single_user.id;
    this.get_featured.token = this.single_user.token;
    this.networkService.post_request(this.get_featured, GlobalComponent.featured)
      .subscribe(({
        next: (response) => {
          this.vendor_featured = response.data;
          this.meta = response.message;
          this.ui_controls.is_loading = false;
        }
      }))
  }

  get_filter_featured_products() {
    this.get_featured.id = this.single_user.id;
    this.get_featured.token = this.single_user.token;
    this.filter.id = this.single_user.id;
    this.filter.token = this.single_user.token;
    this.networkService.post_request(this.filter, GlobalComponent.filterfeatured)
      .subscribe(({
        next: (response) => {
          this.vendor_featured = [];
          this.vendor_featured = response.data;
        }
      }))
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
      position: 'top-center'
    });
  }

  openCart() {
    this.router.navigate(['/', 'cart']).then(r => console.log(r));
  }

  open_reviews(id: any, name: any) {
    this.router.navigate(
      ['/', 'store_reviews'],
      { queryParams: { id, name } }
    ).then(r => console.log(r));
  }

  toggleClass(event: Event) {
    const el = event.currentTarget as HTMLElement;
    el.classList.toggle('cat_active');
  }

  open_vendor(id: number, name: string) {
    this.router.navigate(
      ['/', 'vendors'],
      { queryParams: { id, name } }
    ).then(r => console.log(r));
  }

  open_category(id: number, name: string) {
    this.router.navigate(
      ['/', 'category'],
      { queryParams: { id, name } }
    ).then(r => console.log(r));
  }

  refresh_products() {
    if(this.refresher){
      this.handleRefresh({target: this.refresher});
    }
  }

  load_cart() {
    this.rqst_param.id = this.single_user.id;
    this.rqst_param.token = this.single_user.token;
    this.networkService.post_request(this.rqst_param, GlobalComponent.customerCart)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200) {
            this.bill = response.message;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }

  OnDidDismiss() {
    this.isWishOpen = false;
  }

  onDidDismiss() {
    this.isFilterOpen = false;
  }

  products_by_category(number: number) {

  }

  getMoreItems() {
    this.get_featured.id = this.single_user.id;
    this.get_featured.token = this.single_user.token;
    this.get_featured.offset = this.get_featured.offset + this.get_featured.limit
    this.networkService.post_request(this.get_featured, GlobalComponent.featured)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.vendor_featured.push(...response.data);
          }else{
            this.ui_controls.is_empty = true;
          }
        }
      }))
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    this.getMoreItems();
    setTimeout(() => {
      event.target.complete().then(r => console.log(r));
    }, 500);
  }

  explore_products() {
    // Placeholder for filter explore functionality
  }
}
