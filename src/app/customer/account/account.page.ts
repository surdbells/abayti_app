import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject, Input,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Preferences} from "@capacitor/preferences";
import { Subscription } from 'rxjs';
import {TuiResponsiveDialogService} from '@taiga-ui/addon-mobile';
import {
  IonAvatar,
  IonButton,
  IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol,
  IonContent,
  IonFooter, IonGrid,
  IonHeader, IonIcon, IonInput, IonItem,
  IonLabel, IonList, IonModal, IonNote, IonRange,
  IonRefresher, IonRefresherContent, IonRow,
  IonSearchbar, IonSelect, IonSelectOption,
  IonTabBar,
  IonTabButton, IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {
  TuiAlertService,
  TuiButton,
  TuiDialogService,
  TuiFallbackSrcPipe,
  TuiIcon, TuiLabel, TuiLoader,
  TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldDropdownDirective, TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {Router} from "@angular/router";
import {ActionSheetController, Platform} from '@ionic/angular';
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import { ConnectionService } from '../../service/connection.service';
import {GlobalComponent} from "../../global-component";
import {
  TuiAvatar,
  TuiChevron,
  TuiDataListWrapperComponent, tuiItemsHandlersProvider, TuiRadioComponent,
  TuiSelectDirective,
  TuiShimmer
} from "@taiga-ui/kit";
import {Products} from "../../class/products";
import {Labels} from "../../class/labels";
import {CartIconComponent} from "../../cart-icon.component";
import {BlockerService} from "../../blocker.service";
import {StoreRatingSimpleComponent} from "../../store_rating";
interface Category {
  readonly id: number;
  readonly name: string;
}
type DualRange = { lower: number; upper: number };
export interface Product {
  product_id: number;
  product_name: string;
  image: string;
}
export interface Store {
  store_id: number;
  store_name: string;
  rating: number | null;        // allow null if no rating yet
  rating_count: number;
  products: Product[];
}
@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, CommonModule, FormsModule, IonButton, IonButtons, IonSearchbar, IonAvatar, IonTabBar, IonTabButton, IonLabel, IonFooter, TuiIcon, IonRefresher, IonRefresherContent, TuiShimmer, TuiAvatar, TuiFallbackSrcPipe, IonRow, IonCol, IonGrid, IonIcon, IonItem, IonList, IonModal, IonTitle, TuiButton, IonCard, IonCardContent, TuiTextfieldComponent, TuiSelectDirective, TuiLabel, TuiTextfieldOptionsDirective, TuiChevron, TuiDataListWrapperComponent, TuiTextfieldDropdownDirective, IonRange, IonCardHeader, IonCardTitle, IonInput, IonNote, TuiRadioComponent, IonSelect, IonSelectOption, TuiLoader, TuiTextfieldDirective, CartIconComponent, StoreRatingSimpleComponent]
})

export class AccountPage implements OnInit, OnDestroy {
  best_sellers: Products[] = [];
  vendor_featured: Store[] = [];
  isOnline = true;
  categories: Labels[] = [];
  isWishOpen = false; // or control this as you like
  isFilterOpen = false; // or control this as you like
  @Input() rating: number = 4.5;
  @Input() ratingsCount: number | string = '100+';
  isActive = false;

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
    {id: 7, name: 'Dresses'},
    {id: 8, name: 'Active wear'}
  ];
  protected value: Category | null = {id: 1, name: 'Abayas'}; // !== this.users[0]
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
   is_loading: false,
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
    token: ""
  }
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
  filter = {
    id: 0,
    token: "",
    category: 1,
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
      this.get_featured_products();
    }
  }

  ngOnDestroy(): void {
    this.blocker.unblock(); // ✅ restore when leaving
    this.sub?.unsubscribe();
  }
  user_profile() {
    this.router.navigate(['/', 'settings']).then(r => console.log(r));
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
  search() {
    this.router.navigate(['/', 'search']).then(r => console.log(r));
  }

  user_explore() {
    this.router.navigate(['/', 'explore']).then(r => console.log(r));
  }
  user_search() {
    this.router.navigate(['/', 'search']).then(r => console.log(r));
  }
  user_orders() {
    this.router.navigate(['/', 'orders']).then(r => console.log(r));
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
      this.get_best_sellers();
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
  readonly max = 1500;
  readonly step = 5;
  // Fired when user moves either knob
  onRangeChange(ev: any) {
    const v = ev?.detail?.value as DualRange | number;
    if (typeof v === 'number') return; // single knob (not our case)
    const lower = this.clamp(v.lower, this.min, Math.min(v.upper, this.max));
    const upper = this.clamp(v.upper, Math.max(v.lower, this.min), this.max);
    this.range.set({ lower: this.snap(lower), upper: this.snap(upper) });
  }

  // Inputs -> Range (lower)
  onLowerInput(ev: any) {
    const raw = Number(ev?.target?.value ?? this.range().lower);
    const snapped = this.snap(this.clamp(raw, this.min, this.range().upper));
    this.range.set({ lower: snapped, upper: this.range().upper });
  }

  // Inputs -> Range (upper)
  onUpperInput(ev: any) {
    const raw = Number(ev?.target?.value ?? this.range().upper);
    const snapped = this.snap(this.clamp(raw, this.range().lower, this.max));
    this.range.set({ lower: this.range().lower, upper: snapped });
  }

  private clamp(n: number, lo: number, hi: number) {
    return Math.min(Math.max(n, lo), hi);
  }
  private snap(n: number) {
    // snap to step
    return Math.round(n / this.step) * this.step;
  }

  get_filtered_products() {
    this.isFilterOpen = false;
    this.ui_controls.is_loading = true;
    this.ui_controls.is_empty = false;
    this.filter.id = this.single_user.id;
    this.filter.token = this.single_user.token;
    this.networkService.post_request(this.filter, GlobalComponent.filtered_products)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.best_sellers = response.data;
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
          }else {
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
          }
        }
      }))
  }
  products_by_category(category: number) {
    this.ui_controls.is_loading = true;
    this.ui_controls.is_empty = false;
    this.rqst_param_products_by_category.id = this.single_user.id;
    this.rqst_param_products_by_category.token = this.single_user.token;
    this.rqst_param_products_by_category.category = category;
    this.networkService.post_request(this.rqst_param_products_by_category, GlobalComponent.product_by_category)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.best_sellers = response.data;
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = false;
            console.log(this.ui_controls.is_loading);
          }else{
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
          }
        }
      }))
  }
  get_best_sellers() {
    this.best_sellers = [];
    this.ui_controls.is_loading = true;
    this.ui_controls.is_empty = true;
    this.best_seller.id = this.single_user.id;
    this.best_seller.token = this.single_user.token;
    this.rqst_param_products_by_category.category = 0;
    this.networkService.post_request(this.best_seller, GlobalComponent.best_sellers)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.best_sellers = response.data;
            this.ui_controls.is_empty = false;
            this.ui_controls.is_loading = false;
          }else{
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
          }
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
          this.ui_controls.is_loading = false;
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
      position: "bottom-center"
    });
  }
  success_notification(message: string) {
    this.toast.success(message, {
      position: 'bottom-center'
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
}
