import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit, QueryList,
  signal,
  ViewChild, ViewChildren,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRange,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonTabBar,
  IonTabButton,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  NavController
} from '@ionic/angular/standalone';
import {Gesture, GestureController, Platform, ToastController} from "@ionic/angular";
import {
  TuiButton,
  TuiIcon,
  TuiLabel,
  TuiLoader,
  TuiTextfieldComponent,
  TuiTextfieldDirective,
  TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import { Products } from "../../class/products";
import { Labels } from "../../class/labels";
import { Subscription } from "rxjs";
import { ConnectionService } from "../../service/connection.service";
import { Router, RouterLink } from "@angular/router";
import { NetworkService } from "../../service/network.service";
import { AxNotificationService } from '../../shared/ax-mobile/notification';
import { Preferences } from "@capacitor/preferences";
import { GlobalComponent } from "../../global-component";
import { TuiCarouselButtons, TuiCarouselComponent, TuiRadioComponent } from "@taiga-ui/kit";
import { TuiItem } from "@taiga-ui/cdk";
import {TranslatePipe} from "../../translate.pipe";

import { AxIconComponent } from '../../shared/ax-mobile/icon';
interface Category {
  readonly id: number;
  readonly name: string;
}

type DualRange = { lower: number; upper: number };

@Component({
  selector: 'app-vertican',
  templateUrl: './vertican.page.html',
  styleUrls: ['./vertican.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonToolbar,
    FormsModule,
    IonButtons,
    IonCard,
    IonCardContent,
    TuiIcon,
    RouterLink,
    IonCardHeader,
    IonCardTitle,
    IonCol,
    IonGrid,
    IonInput,
    IonItem,
    IonLabel,
    IonModal,
    IonRange,
    IonRow,
    IonSelect,
    IonSelectOption,
    IonTitle,
    TuiLabel,
    TuiRadioComponent,
    IonImg,
    IonText,
    TuiLoader,
    TuiButton,
    TuiTextfieldComponent,
    TuiTextfieldDirective,
    TuiTextfieldOptionsDirective,
    IonList,
    IonFooter,
    IonIcon,
    IonTabBar,
    IonTabButton,
    IonFab,
    IonFabButton,
    IonSkeletonText,
    IonThumbnail,
    TuiCarouselComponent,
    TuiItem,
    TuiCarouselButtons,
    NgOptimizedImage,
    TranslatePipe, AxIconComponent]
})
export class VerticanPage implements OnInit, OnDestroy, AfterViewInit {
  products: Products[] = [];
  categories: Labels[] = [];
  private swiperInitialized = false;
  private verticalSwiper: any = null;
  @ViewChildren('swipeArea', { read: ElementRef })
  swipeAreas!: QueryList<ElementRef>;

  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('filter_modal', { read: ElementRef }) filterModal!: ElementRef<HTMLIonModalElement>;
  @ViewChild('swiper', { static: false }) swiperEl!: ElementRef<HTMLElement>;
  @ViewChild(IonContent, { static: false }) ionContent!: IonContent;

  // Track active image index for each product: productId -> imageIndex
  activeImageIndices: Map<number, number> = new Map();

  // Track image loading states: "productId-imageIndex" -> boolean
  imageLoaded: { [key: string]: boolean } = {};

  // Vertical pagination
  verticalDots: number[] = [0, 1, 2];
  currentProductDot = 0;
  currentProductIndex = 0;

  index = signal(0);
  isOnline = true;
  range = signal<DualRange>({ lower: 5, upper: 500 });

  protected readonly category: Category[] = [
    { id: 1, name: 'Abayas' },
    { id: 2, name: 'Mukhawars' },
    { id: 3, name: 'Kaftans' },
    { id: 4, name: 'Bags' },
    { id: 5, name: 'Accessories' },
    { id: 6, name: 'Modest clothes' },
    { id: 7, name: 'Dresses' }
  ];

  protected value: Category | null = { id: 1, name: 'Abayas' };
  isFilterOpen = false;
  isWishOpen = false;
  images: string[] = [];
  private sub: Subscription;

  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private gestureCtrl: GestureController,
    private toastController: ToastController,
    private platform: Platform,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private networkService: NetworkService,
    private toast: AxNotificationService,
    private ngZone: NgZone
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.verticalSwiper = null;
  }

  ui_controls = {
    is_loading: false,
    is_loaded: false,
    is_empty: false,
    hasMore: true,
    is_loading_category: false
  }

  filter = {
    id: 0,
    token: "",
    category: [1] as number[],
    price_start: 5,
    price_end: 500,
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
    if (!this.isOnline) {
      console.log('You are offline');
    }
  }

  ionViewWillEnter() {
    console.log('[Vertican] ionViewWillEnter');
    this.getObject().then(r => console.log(r));
  }

  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null) {
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    } else {
      this.single_user = JSON.parse(ret.value);
      if (this.products.length === 0) {
        this.explore_products();
      }
    }
  }

  // ========================================
  // Image handling
  // ========================================

  getProductImages(product: any): string[] {
    if (!product) return [];

    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }

    if (typeof product.images === 'string' && product.images.length > 0) {
      const imgs = product.images.split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0);
      if (imgs.length > 0) return imgs;
    }

    if (product.image_1) {
      return [product.image_1];
    }

    return [];
  }

  getActiveImageIndex(productId: number): number {
    return this.activeImageIndices.get(productId) || 0;
  }

  getCurrentImage(product: any): string {
    if (!product) return '';
    const images = this.getProductImages(product);
    const activeIndex = this.getActiveImageIndex(product.product_id);
    return images[activeIndex] || product.image_1 || '';
  }

  setActiveImage(productId: number, index: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('[Image] setActiveImage:', productId, index);
    this.activeImageIndices.set(productId, index);
    this.cdr.markForCheck();
  }

  nextImage(productId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const product = this.products.find(p => p.product_id === productId);
    if (!product) return;

    const images = this.getProductImages(product);
    const currentIndex = this.getActiveImageIndex(productId);

    if (currentIndex < images.length - 1) {
      console.log('[Image] nextImage:', productId, currentIndex + 1);
      this.activeImageIndices.set(productId, currentIndex + 1);
      this.cdr.markForCheck();
    }
  }

  prevImage(productId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const currentIndex = this.getActiveImageIndex(productId);

    if (currentIndex > 0) {
      console.log('[Image] prevImage:', productId, currentIndex - 1);
      this.activeImageIndices.set(productId, currentIndex - 1);
      this.cdr.markForCheck();
    }
  }

  onImageLoad(productId: number, imageIndex: number) {
    const key = `${productId}-${imageIndex}`;
    console.log('[Image] Loaded:', key);
    this.imageLoaded[key] = true;
    this.cdr.markForCheck();
  }

  onImageError(productId: number, imageIndex: number) {
    const key = `${productId}-${imageIndex}`;
    console.log('[Image] Error:', key);
    this.imageLoaded[key] = true; // Hide skeleton even on error
    this.cdr.markForCheck();
  }

  // ========================================
  // Vertical swiper
  // ========================================

  onVerticalSlideChange(event: any) {
    try {
      const swiper = event?.target?.swiper;
      if (swiper) {
        this.ngZone.run(() => {
          const totalSlides = swiper.slides?.length || this.products.length;
          const currentIndex = swiper.activeIndex ?? 0;

          console.log('[Swiper] Slide changed:', currentIndex);

          this.currentProductIndex = currentIndex;
          this.index.set(currentIndex);
          this.updateVerticalPagination(currentIndex, totalSlides);

          // Fetch more when near end
          if (totalSlides - currentIndex <= 5 && !this.ui_controls.is_loading && this.ui_controls.hasMore) {
            this.getMoreItems();
          }

          this.cdr.markForCheck();
        });
      }
    } catch (error) {
      console.error('[Swiper] Error:', error);
    }
  }

  goToNext(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('[Nav] goToNext, current:', this.currentProductIndex);

    if (!this.verticalSwiper) {
      const el = this.swiperEl?.nativeElement as any;
      this.verticalSwiper = el?.swiper;
    }

    if (this.verticalSwiper && this.currentProductIndex < this.products.length - 1) {
      this.verticalSwiper.slideNext();
    }
  }

  goToPrevious(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('[Nav] goToPrevious, current:', this.currentProductIndex);

    if (!this.verticalSwiper) {
      const el = this.swiperEl?.nativeElement as any;
      this.verticalSwiper = el?.swiper;
    }

    if (this.verticalSwiper && this.currentProductIndex > 0) {
      this.verticalSwiper.slidePrev();
    }
  }

  updateVerticalPagination(activeIndex: number, totalSlides: number) {
    if (totalSlides <= 3) {
      this.currentProductDot = activeIndex;
    } else {
      const chunk = Math.floor(totalSlides / 3);
      if (activeIndex < chunk) {
        this.currentProductDot = 0;
      } else if (activeIndex < chunk * 2) {
        this.currentProductDot = 1;
      } else {
        this.currentProductDot = 2;
      }
    }
  }

  // ========================================
  // Filter methods
  // ========================================

  closeFilter() {
    this.isFilterOpen = false;
  }

  isCategorySelected(categoryId: number): boolean {
    return this.filter.category.includes(categoryId);
  }

  toggleCategory(categoryId: number) {
    const index = this.filter.category.indexOf(categoryId);
    if (index > -1) {
      if (this.filter.category.length > 1) {
        this.filter.category.splice(index, 1);
      }
    } else {
      this.filter.category.push(categoryId);
    }
  }

  resetFilters() {
    this.filter.category = [1];
    this.range.set({ lower: 5, upper: 500 });
    this.filter.price_start = 5;
    this.filter.price_end = 500;
  }

  // ========================================
  // API request parameters
  // ========================================

  explore = {
    id: 0,
    token: "",
    limit: 10,
    offset: 0
  }

  rqst_param = {
    id: 0,
    token: ""
  }

  addCloset = {
    id: 0,
    token: "",
    label_id: 0,
    product_id: 0,
    product_name: "",
    product_image: ""
  }

  // ========================================
  // Range slider
  // ========================================

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

  // ========================================
  // API calls
  // ========================================

  get_filtered_products() {
    this.isFilterOpen = false;
    this.resetState();

    this.ui_controls.is_loading = true;
    this.cdr.markForCheck();

    this.filter.id = this.single_user.id;
    this.filter.token = this.single_user.token;

    this.networkService.post_request(this.filter, GlobalComponent.filterexplore)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.products = response.data;
            this.ui_controls.is_loading = false;
            this.ui_controls.is_loaded = true;
            this.cdr.markForCheck();
            setTimeout(() => this.initializeSwipers(), 200);
          } else {
            this.ui_controls.is_loading = false;
            this.cdr.markForCheck();
            this.presentToast('middle', "No product for the selected filter");
          }
        }
      });
  }

  explore_products() {
    console.log('[Vertican] explore_products');
    this.resetState();

    this.ui_controls.is_loading = true;
    this.ui_controls.hasMore = true;
    this.cdr.markForCheck();

    this.explore.id = this.single_user.id;
    this.explore.token = this.single_user.token;
    this.explore.offset = 0;

    this.networkService.post_request(this.explore, GlobalComponent.explore_listing)
      .subscribe({
        next: (response) => {
          console.log('[Vertican] Products:', response.data?.length);
          if (response.response_code === 200 && response.status === "success") {
            this.products = response.data;
            this.ui_controls.is_loading = false;
            this.ui_controls.is_loaded = true;
            this.ui_controls.is_empty = false;
            this.cdr.markForCheck();
            setTimeout(() => this.initializeSwipers(), 200);
          } else {
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
            this.cdr.markForCheck();
          }
        }
      });
  }

  private resetState() {
    this.products = [];
    this.swiperInitialized = false;
    this.verticalSwiper = null;
    this.currentProductIndex = 0;
    this.activeImageIndices.clear();
    this.imageLoaded = {};
    this.ui_controls.is_loaded = false;
    this.ui_controls.is_empty = false;
  }

  getMoreItems() {
    if (this.ui_controls.is_loading || !this.ui_controls.hasMore) return;

    console.log('[Vertican] getMoreItems');
    this.ui_controls.is_loading = true;
    this.cdr.markForCheck();

    this.explore.id = this.single_user.id;
    this.explore.token = this.single_user.token;
    this.explore.offset += this.explore.limit;

    this.networkService.post_request(this.explore, GlobalComponent.explore_listing)
      .subscribe({
        next: (response: any) => {
          if (response.response_code !== 200 || response.status !== 'success') {
            this.ui_controls.hasMore = false;
            this.ui_controls.is_loading = false;
            this.cdr.markForCheck();
            return;
          }

          this.products = [...this.products, ...response.data];

          if (response.data.length < this.explore.limit) {
            this.ui_controls.hasMore = false;
          }

          this.ui_controls.is_loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.ui_controls.hasMore = false;
          this.ui_controls.is_loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  get_label() {
    this.ui_controls.is_loading_category = true;
    this.networkService.post_request(this.rqst_param, GlobalComponent.readWishlistLabel)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.categories = response.data;
            this.ui_controls.is_loading_category = false;
            this.cdr.markForCheck();
          }
        }
      });
  }

  addToCloset(label: number) {
    this.ui_controls.is_loading_category = true;
    this.addCloset.label_id = label;
    this.isWishOpen = false;

    this.networkService.post_request(this.addCloset, GlobalComponent.addWishlist)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.success_notification(response.message);
          }
          this.ui_controls.is_loading_category = false;
          this.cdr.markForCheck();
        }
      });
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

  // ========================================
  // Notifications
  // ========================================

  error_notification(message: string) {
    this.toast.error(message, { position: "top-center" });
  }

  success_notification(message: string) {
    this.toast.success(message, { position: 'top-center' });
  }

  // ========================================
  // Navigation
  // ========================================

  open_vendor(id: number, name: string) {
    this.router.navigate(['/', 'vendors'], { queryParams: { id, name } });
  }

  triggerBack() {
    this.nav.back();
  }

  open_product(id: number) {
    this.router.navigate(['/', 'product'], { queryParams: { id } });
  }

  closeWish() {
    this.isWishOpen = false;
  }

  openHome() {
    this.router.navigate(['/', 'account']);
  }
  OnDidDismiss() {
    this.isWishOpen = false;
  }
  // ========================================
  // Swiper initialization
  // ========================================

  initializeSwipers() {
    if (this.swiperInitialized) return;
    this.swiperInitialized = true;

    console.log('[Swiper] Initializing...');

    const el = this.swiperEl?.nativeElement as any;
    if (!el) {
      console.log('[Swiper] No element');
      return;
    }

    const attachSwiper = () => {
      const sw: any = el.swiper;
      if (!sw) {
        setTimeout(attachSwiper, 100);
        return;
      }

      console.log('[Swiper] Attached, slides:', sw.slides?.length);
      this.verticalSwiper = sw;

      this.index.set(sw.activeIndex ?? 0);
      this.currentProductIndex = sw.activeIndex ?? 0;
      this.updateVerticalPagination(sw.activeIndex ?? 0, sw.slides?.length ?? this.products.length);
      this.cdr.markForCheck();
    };

    attachSwiper();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeSwipers(), 200);
    // Handle DOM changes (important when product changes)
    this.swipeAreas.changes.subscribe(() => {
      this.initSwipeGestures();
    });
  }

  onSwipeLeft(index: number) {
    console.log('Swipe left on product', index);
    this.nextImage(this.products[index].product_id);
  }
  onSwipeRight(index: number) {
    console.log('Swipe right on product', index);
    this.prevImage(this.products[index].product_id);
  }

  async presentToast(position: 'top' | 'middle' | 'bottom', message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: position,
    });
    await toast.present();
  }
  private initSwipeGestures() {
    if (!this.swipeAreas || this.swipeAreas.length === 0) return;

    this.swipeAreas.forEach((area, index) => {
      const gesture = this.gestureCtrl.create({
        el: area.nativeElement,
        gestureName: `swipe-gesture-${index}`,
        threshold: 15,
        onEnd: ev => {
          if (ev.deltaX < -50) this.onSwipeLeft(index);
          if (ev.deltaX > 50) this.onSwipeRight(index);
        }
      });

      gesture.enable();
    });
  }
}
