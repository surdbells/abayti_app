import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
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
    NgOptimizedImage
  ]
})
export class VerticanPage implements OnInit, OnDestroy, AfterViewInit {
  products: Products[] = [];
  categories: Labels[] = [];
  private swiperInitialized = false;
  
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('filter_modal', { read: ElementRef }) filterModal!: ElementRef<HTMLIonModalElement>;
  @ViewChild('swiper', { static: false }) swiperEl!: ElementRef<HTMLElement>;
  @ViewChild(IonContent, { static: false }) ionContent!: IonContent;

  // Track active image index for each product
  activeImageIndices: Map<number, number> = new Map();

  // Track image loading states
  imageLoaded: { [key: string]: boolean } = {};

  // Track horizontal swiper instances
  horizontalSwipers: Map<number, any> = new Map();

  // Vertical pagination
  verticalDots: number[] = [0, 1, 2];
  currentProductDot = 0;
  currentProductIndex = 0;

  // Touch tracking for manual swipe
  private touchStartY = 0;
  private touchStartX = 0;
  private touchStartTime = 0;
  private isSwiping = false;
  private swipeDirection: 'vertical' | 'horizontal' | null = null;

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
    private elementRef: ElementRef,
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
    this.restoreBodyScroll();
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
    this.lockBodyScroll();
    this.getObject().then(r => console.log(r));
  }
  
  ionViewWillLeave() {
    this.restoreBodyScroll();
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
  // LOCK BODY SCROLL (iOS fix)
  // ========================================
  
  private lockBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.bottom = '0';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
  }
  
  private restoreBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.bottom = '';
    document.body.style.touchAction = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.touchAction = '';
  }

  // ========================================
  // TOUCH EVENT HANDLERS (for touch-blocker)
  // ========================================
  
  onTouchStart(event: TouchEvent) {
    // Always prevent default to stop iOS pull-to-refresh
    event.preventDefault();
    event.stopPropagation();
    
    const touch = event.touches[0];
    this.touchStartY = touch.clientY;
    this.touchStartX = touch.clientX;
    this.touchStartTime = Date.now();
    this.isSwiping = true;
    this.swipeDirection = null;
  }
  
  onTouchMove(event: TouchEvent) {
    // Always prevent default
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.isSwiping) return;
    
    const touch = event.touches[0];
    const deltaY = touch.clientY - this.touchStartY;
    const deltaX = touch.clientX - this.touchStartX;
    
    // Determine swipe direction if not yet determined
    if (!this.swipeDirection) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        this.swipeDirection = 'vertical';
      } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        this.swipeDirection = 'horizontal';
      }
    }
  }
  
  onTouchEnd(event: TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.isSwiping) return;
    
    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - this.touchStartY;
    const deltaX = touch.clientX - this.touchStartX;
    const duration = Date.now() - this.touchStartTime;
    
    // Calculate velocity
    const velocityY = Math.abs(deltaY) / duration;
    const velocityX = Math.abs(deltaX) / duration;
    
    // Thresholds
    const minSwipeDistance = 50;
    const minVelocity = 0.3;
    
    this.ngZone.run(() => {
      if (this.swipeDirection === 'vertical') {
        // Vertical swipe - change products
        if (Math.abs(deltaY) > minSwipeDistance || velocityY > minVelocity) {
          if (deltaY < 0) {
            // Swiped up - go to next
            this.goToNext();
          } else {
            // Swiped down - go to previous
            this.goToPrevious();
          }
        }
      } else if (this.swipeDirection === 'horizontal') {
        // Horizontal swipe - change images
        if (Math.abs(deltaX) > minSwipeDistance || velocityX > minVelocity) {
          const currentProduct = this.products[this.currentProductIndex];
          if (currentProduct) {
            const images = this.getProductImages(currentProduct);
            const currentImageIndex = this.getActiveImageIndex(this.currentProductIndex);
            
            if (deltaX < 0 && currentImageIndex < images.length - 1) {
              // Swiped left - next image
              this.activeImageIndices.set(this.currentProductIndex, currentImageIndex + 1);
              this.updateHorizontalSwiper(currentImageIndex + 1);
            } else if (deltaX > 0 && currentImageIndex > 0) {
              // Swiped right - previous image
              this.activeImageIndices.set(this.currentProductIndex, currentImageIndex - 1);
              this.updateHorizontalSwiper(currentImageIndex - 1);
            }
          }
        }
      }
      
      this.cdr.markForCheck();
    });
    
    this.isSwiping = false;
    this.swipeDirection = null;
  }
  
  private updateHorizontalSwiper(index: number) {
    const currentProduct = this.products[this.currentProductIndex];
    if (currentProduct) {
      const swiper = this.horizontalSwipers.get(currentProduct.product_id);
      if (swiper) {
        swiper.slideTo(index, 300);
      }
    }
  }

  // ========================================
  // NAVIGATION BUTTONS
  // ========================================
  
  goToNext() {
    if (this.currentProductIndex >= this.products.length - 1) return;
    
    const el = this.swiperEl?.nativeElement as any;
    const swiper = el?.swiper;
    
    if (swiper) {
      swiper.slideNext(300);
    } else {
      // Fallback if swiper not available
      this.currentProductIndex++;
      this.updateVerticalPagination(this.currentProductIndex, this.products.length);
      this.index.set(this.currentProductIndex);
      this.cdr.markForCheck();
    }
    
    // Check if need to load more
    if (this.products.length - this.currentProductIndex <= 5 && !this.ui_controls.is_loading && this.ui_controls.hasMore) {
      this.getMoreItems();
    }
  }
  
  goToPrevious() {
    if (this.currentProductIndex <= 0) return;
    
    const el = this.swiperEl?.nativeElement as any;
    const swiper = el?.swiper;
    
    if (swiper) {
      swiper.slidePrev(300);
    } else {
      // Fallback
      this.currentProductIndex--;
      this.updateVerticalPagination(this.currentProductIndex, this.products.length);
      this.index.set(this.currentProductIndex);
      this.cdr.markForCheck();
    }
  }

  // ========================================
  // Image loading handlers
  // ========================================

  onImageLoad(productId: number, imageIndex: number) {
    const key = `${productId}-${imageIndex}`;
    this.imageLoaded[key] = true;
    this.cdr.markForCheck();
  }

  onImageError(productId: number, imageIndex: number) {
    const key = `${productId}-${imageIndex}`;
    this.imageLoaded[key] = true;
    this.cdr.markForCheck();
  }

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

  // ========================================
  // Image slide tracking
  // ========================================

  onImageSlideChange(event: any, productIndex: number) {
    const swiper = event?.target?.swiper;
    if (swiper) {
      this.activeImageIndices.set(productIndex, swiper.activeIndex);
      this.cdr.markForCheck();
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
    this.cdr.markForCheck();
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
    this.swiperInitialized = false;
    this.ui_controls = { ...this.ui_controls, is_loading: true };
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
            this.currentProductIndex = 0;
            this.ui_controls = { ...this.ui_controls, is_loading: false };
            this.cdr.markForCheck();
            this.ui_controls.is_loaded = true;
            this.activeImageIndices.clear();
            this.imageLoaded = {};
            this.horizontalSwipers.clear();
            setTimeout(() => this.initializeSwipers(), 150);
          } else {
            this.ui_controls = { ...this.ui_controls, is_loading: false };
            this.cdr.markForCheck();
            this.presentToast('middle', "No product for the selected filter").then(r => console.log(r));
            this.ui_controls.is_loaded = true;
          }
        }
      });
  }

  explore_products() {
    this.products = [];
    this.swiperInitialized = false;
    this.explore.offset = 0;
    this.currentProductIndex = 0;
    this.ui_controls = { ...this.ui_controls, is_loading: true, hasMore: true };
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
            this.ui_controls = { ...this.ui_controls, is_loading: false };
            this.cdr.markForCheck();
            this.updateSwiper();
            this.ui_controls.is_loaded = true;
            this.ui_controls.is_empty = false;
            this.activeImageIndices.clear();
            this.imageLoaded = {};
            this.horizontalSwipers.clear();
            setTimeout(() => this.initializeSwipers(), 150);
          } else {
            this.ui_controls = { ...this.ui_controls, is_loading: false };
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

          this.products = [...this.products, ...response.data];

          const el: any = this.swiperEl?.nativeElement;
          const sw = el?.swiper;

          const excess = this.products.length - MAX_RENDERED_PRODUCTS;

          if (excess > 0 && sw) {
            const currentIndex = sw.activeIndex;

            if (currentIndex > excess) {
              for (let i = 0; i < excess; i++) {
                const product = this.products[i];
                const swiper = this.horizontalSwipers.get(product.product_id);
                if (swiper) {
                  swiper.destroy();
                  this.horizontalSwipers.delete(product.product_id);
                }
              }
              this.products.splice(0, excess);
              sw.slideTo(currentIndex - excess, 0);
              sw.update();
              this.activeImageIndices.clear();
              this.imageLoaded = {};
            }
          }

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
    this.ui_controls.is_loading_category = true;
    this.networkService.post_request(this.rqst_param, GlobalComponent.readWishlistLabel)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.categories = response.data;
            this.ui_controls.is_loading_category = false;
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
    this.toast.error(message, { position: "top-center" });
  }

  success_notification(message: string) {
    this.toast.success(message, { position: 'top-center' });
  }

  // ========================================
  // Navigation
  // ========================================

  open_vendor(id: number, name: string) {
    this.router.navigate(['/', 'vendors'], { queryParams: { id, name } }).then(r => console.log(r));
  }

  triggerBack() {
    this.nav.back();
  }

  open_product(id: number) {
    this.products = this.products.slice(Math.max(0, this.index() - 1), this.index() + 2);
    this.router.navigate(['/', 'product'], { queryParams: { id } }).then(r => console.log(r));
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

      // Disable swiper's touch handling - we handle it manually
      sw.allowTouchMove = false;

      this.index.set(sw.activeIndex ?? 0);
      this.updateVerticalPagination(sw.activeIndex ?? 0, sw.slides?.length ?? 0);

      sw.on('slideChange', () => {
        const totalSlides = sw.slides.length;
        const currentIndex = sw.activeIndex;

        this.updateVerticalPagination(currentIndex, totalSlides);
        this.index.set(currentIndex);

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

          // Disable horizontal swiper touch - we handle it manually
          sw.allowTouchMove = false;

          this.horizontalSwipers.set(key, sw);
          sw.on('slideChange', () => {
            this.activeImageIndices.set(index, sw.activeIndex);
            this.cdr.markForCheck();
          });
        };

        attachHorizontal();
      });
    }, 250);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeSwipers(), 150);
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

  protected readonly Math = Math;
}