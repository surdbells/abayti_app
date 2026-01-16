import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  signal,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
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
import { Platform, ToastController } from "@ionic/angular";
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
import { HotToastService } from "@ngxpert/hot-toast";
import { Preferences } from "@capacitor/preferences";
import { GlobalComponent } from "../../global-component";
import { TuiCarouselButtons, TuiCarouselComponent, TuiRadioComponent } from "@taiga-ui/kit";
import { TuiItem } from "@taiga-ui/cdk";

interface Category {
  readonly id: number;
  readonly name: string;
}
const MAX_RENDERED_PRODUCTS = 8;
type DualRange = { lower: number; upper: number };

@Component({
  selector: 'app-vertican',
  templateUrl: './vertican.page.html',
  styleUrls: ['./vertican.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonButton, IonContent, IonHeader, IonToolbar, CommonModule, FormsModule,
    IonButtons, IonCard, IonCardContent, TuiIcon, RouterLink, IonCardHeader,
    IonCardTitle, IonCol, IonGrid, IonInput, IonItem, IonLabel, IonModal,
    IonRange, IonRow, IonSelect, IonSelectOption, IonTitle, TuiLabel,
    TuiRadioComponent, IonImg, IonText, TuiLoader, TuiButton, TuiTextfieldComponent,
    TuiTextfieldDirective, TuiTextfieldOptionsDirective, IonList, IonFooter,
    IonIcon, IonTabBar, IonTabButton, IonFab, IonFabButton, IonSkeletonText,
    IonThumbnail, TuiCarouselComponent, TuiItem, TuiCarouselButtons, NgOptimizedImage
  ]
})
export class VerticanPage implements OnInit, OnDestroy, AfterViewInit {
  products: Products[] = [];
  categories: Labels[] = [];
  private swiperInitialized = false;
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('filter_modal', { read: ElementRef }) filterModal!: ElementRef<HTMLIonModalElement>;
  @ViewChild('swiper', { static: false }) swiperEl!: ElementRef<HTMLElement>;
  @ViewChild(IonContent, { read: ElementRef })
  ionContentEl!: ElementRef<HTMLElement>;
  slideOpts = {
    direction: 'vertical',
    initialSlide: 0,
    speed: 400,
    // Optional: add threshold if vertical scrolling content causes issues on iOS
    // threshold: 10,
  };
  // Track active image index for each product
  activeImageIndices: Map<number, number> = new Map();

  // Track image loading states: key = "productId-imageIndex"
  imageLoaded: { [key: string]: boolean } = {};

  // Track horizontal swiper instances: key = product_id
  horizontalSwipers: Map<number, any> = new Map();

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
    private toastController: ToastController,
    private platform: Platform,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private networkService: NetworkService,
    private toast: HotToastService,
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
    for (const swiper of this.horizontalSwipers.values()) {
      swiper.destroy();
    }
    this.horizontalSwipers.clear();
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
    this.getObject().then(r => console.log(r));
  }

  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null) {
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    } else {
      this.single_user = JSON.parse(ret.value);
      this.explore_products();
    }
  }

  // ========================================
  // Image loading handlers
  // ========================================

  onImageLoad(productId: number, imageIndex: number) {
    const key = `${productId}-${imageIndex}`;
    this.imageLoaded[key] = true;
  }

  onImageError(productId: number, imageIndex: number) {
    // Mark as loaded even on error to hide skeleton
    const key = `${productId}-${imageIndex}`;
    this.imageLoaded[key] = true;
  }

  /**
   * Get product images as array
   * Handles: array, comma-separated string, or single string
   */
  getProductImages(product: any): string[] {
    if (!product) return [];

    // If images is already an array
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }

    // If images is a comma-separated string
    if (typeof product.images === 'string' && product.images.length > 0) {
      const imgs = product.images.split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0);
      if (imgs.length > 0) return imgs;
    }

    // Fallback to image_1
    if (product.image_1) {
      return [product.image_1];
    }

    return [];
  }

  // ========================================
  // Image slide tracking
  // ========================================

  onImageSlideChange(event: any, productIndex: number) {
    const swiper = event?.target?.swiper;
    if (swiper) {
      this.activeImageIndices.set(productIndex, swiper.activeIndex);
    }
  }

  getActiveImageIndex(productIndex: number): number {
    return this.activeImageIndices.get(productIndex) || 0;
  }

  // ========================================
  // Vertical pagination update
  // ========================================

  updateVerticalPagination(activeIndex: number, totalSlides: number) {
    this.currentProductIndex = activeIndex;

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
    limit: 20,
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
    this.ui_controls = {
      ...this.ui_controls,
      is_loading: true
    };
    this.cdr.markForCheck();
    this.ui_controls.is_loaded = false;
    this.ui_controls.is_empty = false;
    this.filter.id = this.single_user.id;
    this.filter.token = this.single_user.token;

    this.networkService.post_request(this.filter, GlobalComponent.filterexplore)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.products = response.data;
            this.ui_controls = {
              ...this.ui_controls,
              is_loading: false
            };
            this.cdr.markForCheck();
            this.ui_controls.is_loaded = true;
            this.activeImageIndices.clear();
            this.imageLoaded = {};
            this.horizontalSwipers.clear();
            setTimeout(() => this.initializeSwipers(), 100);
          } else {
            this.ui_controls = {
              ...this.ui_controls,
              is_loading: false
            };
            this.cdr.markForCheck();
            this.presentToast('middle', "No product for the selected filter").then(r => console.log(r));
            this.ui_controls.is_loaded = true;
          }
        }
      });
  }

  explore_products() {
    this.products = [];
    this.ui_controls = {
      ...this.ui_controls,
      is_loading: true
    };
    this.cdr.markForCheck();
    this.ui_controls.is_loaded = false;
    this.ui_controls.is_empty = false;
    this.explore.id = this.single_user.id;
    this.explore.token = this.single_user.token;

    this.networkService.post_request(this.explore, GlobalComponent.explore_listing)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.products = response.data;
            this.ui_controls = {
              ...this.ui_controls,
              is_loading: false
            };
            this.cdr.markForCheck();
            this.updateSwiper();
            this.ui_controls.is_loaded = true;
            this.ui_controls.is_empty = false;
            this.activeImageIndices.clear();
            this.imageLoaded = {};
            this.horizontalSwipers.clear();
            setTimeout(() => this.initializeSwipers(), 100);
          } else {
            this.ui_controls = {
              ...this.ui_controls,
              is_loading: false
            };
            this.cdr.markForCheck();
            this.ui_controls.is_empty = true;
          }
        }
      });
  }


  getMoreItems() {
    if (this.ui_controls.is_loading || !this.ui_controls.hasMore) return;

    this.ui_controls = { ...this.ui_controls, is_loading: true };
    this.cdr.markForCheck();

    this.explore.id = this.single_user.id;
    this.explore.token = this.single_user.token;
    this.explore.offset += this.explore.limit;

    this.networkService.post_request(this.explore, GlobalComponent.explore_listing)
      .subscribe({
        next: (response: any) => {
          if (response.response_code !== 200 || response.status !== 'success') {
            this.ui_controls = { ...this.ui_controls, hasMore: false };
            return;
          }

          // 1️⃣ Append new products
          this.products = [...this.products, ...response.data];

          const el: any = this.swiperEl?.nativeElement;
          const sw = el?.swiper;

          // 2️⃣ Calculate how many can be safely removed
          const excess = this.products.length - MAX_RENDERED_PRODUCTS;

          if (excess > 0 && sw) {
            const currentIndex = sw.activeIndex;

            // 🔥 Only remove items the user already passed
            if (currentIndex > excess) {
              // Destroy swipers for removed products
              for (let i = 0; i < excess; i++) {
                const product = this.products[i];
                const swiper = this.horizontalSwipers.get(product.product_id);
                if (swiper) {
                  swiper.destroy();
                  this.horizontalSwipers.delete(product.product_id);
                }
              }
              this.products.splice(0, excess);

              // Fix swiper index
              sw.slideTo(currentIndex - excess, 0);
              sw.update();

              this.activeImageIndices.clear();
              this.imageLoaded = {};
            }
          }

          // 3️⃣ No more data
          if (response.data.length < this.explore.limit) {
            this.ui_controls = { ...this.ui_controls, hasMore: false };
          }

          this.cdr.markForCheck();
        },
        error: () => {
          this.ui_controls = { ...this.ui_controls, hasMore: false };
          this.cdr.markForCheck();
        },
        complete: () => {
          this.ui_controls = { ...this.ui_controls, is_loading: false };
          this.cdr.markForCheck();
        }
      });
  }



  get_label() {
    this.ui_controls = {
      ...this.ui_controls,
      is_loading_category: true
    };
    this.networkService.post_request(this.rqst_param, GlobalComponent.readWishlistLabel)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.categories = response.data;
            this.ui_controls = {
              ...this.ui_controls,
              is_loading_category: false
            };
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
            this.ui_controls.is_loading_category = false;
          } else {
            this.ui_controls.is_loading_category = false;
          }
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
    this.toast.error(message, {
      position: "top-center"
    });
  }

  success_notification(message: string) {
    this.toast.success(message, {
      position: 'top-center'
    });
  }

  // ========================================
  // Navigation
  // ========================================

  open_vendor(id: number, name: string) {
    this.router.navigate(
      ['/', 'vendors'],
      { queryParams: { id, name } }
    ).then(r => console.log(r));
  }

  triggerBack() {
    this.nav.back();
  }

  open_product(id: number) {
    this.products = this.products.slice(
      Math.max(0, this.index() - 1),
      this.index() + 2
    );
    this.router.navigate(
      ['/', 'product'],
      { queryParams: { id } }
    ).then(r => console.log(r));
  }

  closeWish() {
    this.isWishOpen = false;
  }

  openHome() {
    this.router.navigate(['/', 'account']).then(r => console.log(r));
  }

  // ========================================
  // Swiper initialization
  // ========================================

  initializeSwipers() {
    if (this.swiperInitialized) return;
    this.swiperInitialized = true;

    const el = this.swiperEl?.nativeElement as any;
    if (!el) return;

    const attachVertical = () => {
      const sw: any = el.swiper;
      if (!sw) {
        setTimeout(attachVertical, 50);
        return;
      }

      this.index.set(sw.activeIndex ?? 0);
      this.updateVerticalPagination(sw.activeIndex ?? 0, sw.slides?.length ?? 0);

      sw.on('slideChange', () => {
        const totalSlides = sw.slides.length;
        const currentIndex = sw.activeIndex;

        this.updateVerticalPagination(currentIndex, totalSlides);
        this.index.set(currentIndex);

        // Only fetch more if near the end, not loading, and more data exists
        if (totalSlides - currentIndex <= 5 && !this.ui_controls.is_loading && this.ui_controls.hasMore) {
          requestAnimationFrame(() => this.getMoreItems());
        }
      });
    };

    attachVertical();

    // Initialize nested horizontal swipers
    setTimeout(() => {
      const horizontalSwipers = document.querySelectorAll('.horizontal-slides');
      horizontalSwipers.forEach((hSwiper: any, index: number) => {
        const product = this.products[index];
        if (!product) return;
        const key = product.product_id;
        const attachHorizontal = () => {
          const sw = hSwiper.swiper;
          if (!sw) {
            setTimeout(attachHorizontal, 50);
            return;
          }

          this.horizontalSwipers.set(key, sw);
          sw.on('slideChange', () => {
            this.activeImageIndices.set(index, sw.activeIndex);
          });
        };

        attachHorizontal();
      });
    }, 200);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeSwipers(), 100);
    this.disableIOSPullToRefresh();
  }

  async presentToast(position: 'top' | 'middle' | 'bottom', message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: position,
    });
    await toast.present();
  }
  updateSwiper() {
    requestAnimationFrame(() => {
      const el: any = this.swiperEl?.nativeElement;
      const sw = el?.swiper;
      if (sw) {
        sw.update();
      }
    });
  }

  private disableIOSPullToRefresh() {
    const el = this.ionContentEl.nativeElement;

    el.addEventListener(
      'touchmove',
      (event: TouchEvent) => {
        if (event.cancelable) {
          event.preventDefault();
        }
      },
      { passive: false }
    );
  }
}
