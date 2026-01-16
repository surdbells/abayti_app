import {
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, Platform, ToastController } from '@ionic/angular';
import { Subscription } from "rxjs";
import { ConnectionService } from "../../service/connection.service";
import { Router } from "@angular/router";
import { NetworkService } from "../../service/network.service";
import { HotToastService } from "@ngxpert/hot-toast";
import { Preferences } from "@capacitor/preferences";
import { GlobalComponent } from "../../global-component";
import { Products } from "../../class/products";
import { Labels } from "../../class/labels";

@Component({
  selector: 'app-vertican',
  templateUrl: './vertican.page.html',
  styleUrls: ['./vertican.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ]
})
export class VerticanPage implements OnInit, OnDestroy {
  products: Products[] = [];
  categories: Labels[] = [];
  
  currentProductIndex = 0;
  currentImageIndex = 0;
  
  isOnline = true;
  isWishOpen = false;
  private sub: Subscription;

  ui_controls = {
    is_loading: false,
    is_loaded: false,
    is_empty: false,
    hasMore: true,
    is_loading_category: false
  };

  single_user = {
    id: 0,
    token: "",
  };

  explore = {
    id: 0,
    token: "",
    limit: 20,
    offset: 0
  };

  rqst_param = { id: 0, token: "" };
  
  addCloset = {
    id: 0,
    token: "",
    label_id: 0,
    product_id: 0,
    product_name: "",
    product_image: ""
  };

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

  ngOnInit() {
    console.log('🚀 VerticanPage ngOnInit');
  }
  
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  ionViewWillEnter() {
    console.log('🚀 VerticanPage ionViewWillEnter');
    this.getObject();
  }

  async getObject() {
    console.log('📦 getObject called');
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null) {
      this.router.navigate(['/', 'login']);
    } else {
      this.single_user = JSON.parse(ret.value);
      this.explore_products();
    }
  }

  // ========================================
  // NAVIGATION - These MUST work
  // ========================================
  
  goToNext() {
    console.log('⬇️ goToNext CLICKED! Current index:', this.currentProductIndex);
    alert('NEXT clicked! Current: ' + this.currentProductIndex); // Alert for debugging
    
    if (this.currentProductIndex < this.products.length - 1) {
      this.currentProductIndex++;
      this.currentImageIndex = 0;
      console.log('✅ Moved to product:', this.currentProductIndex);
      this.cdr.markForCheck();
      this.cdr.detectChanges(); // Force update
      
      // Load more if needed
      if (this.products.length - this.currentProductIndex <= 5 && this.ui_controls.hasMore) {
        this.getMoreItems();
      }
    }
  }
  
  goToPrevious() {
    console.log('⬆️ goToPrevious CLICKED! Current index:', this.currentProductIndex);
    alert('PREV clicked! Current: ' + this.currentProductIndex); // Alert for debugging
    
    if (this.currentProductIndex > 0) {
      this.currentProductIndex--;
      this.currentImageIndex = 0;
      console.log('✅ Moved to product:', this.currentProductIndex);
      this.cdr.markForCheck();
      this.cdr.detectChanges(); // Force update
    }
  }
  
  nextImage() {
    console.log('➡️ nextImage CLICKED');
    const images = this.getProductImages(this.products[this.currentProductIndex]);
    if (this.currentImageIndex < images.length - 1) {
      this.currentImageIndex++;
      this.cdr.markForCheck();
    }
  }
  
  prevImage() {
    console.log('⬅️ prevImage CLICKED');
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.cdr.markForCheck();
    }
  }

  // ========================================
  // IMAGE HELPERS
  // ========================================
  
  getCurrentImage(): string {
    const product = this.products[this.currentProductIndex];
    if (!product) return '';
    const images = this.getProductImages(product);
    return images[this.currentImageIndex] || '';
  }
  
  getProductImages(product: any): string[] {
    if (!product) return [];
    
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    
    if (typeof product.images === 'string' && product.images.length > 0) {
      return product.images.split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0);
    }
    
    if (product.image_1) {
      return [product.image_1];
    }
    
    return [];
  }
  
  onImgLoad() {
    console.log('🖼️ Image loaded');
  }
  
  onImgError() {
    console.log('❌ Image error');
  }

  // ========================================
  // API CALLS
  // ========================================
  
  explore_products() {
    console.log('📡 explore_products called');
    this.products = [];
    this.currentProductIndex = 0;
    this.currentImageIndex = 0;
    this.explore.offset = 0;
    this.ui_controls = { ...this.ui_controls, is_loading: true, hasMore: true, is_empty: false };
    this.cdr.markForCheck();
    
    this.explore.id = this.single_user.id;
    this.explore.token = this.single_user.token;

    this.networkService.post_request(this.explore, GlobalComponent.explore_listing)
      .subscribe({
        next: (response) => {
          console.log('📡 API Response:', response);
          if (response.response_code === 200 && response.status === "success") {
            this.products = response.data;
            this.ui_controls.is_loading = false;
            this.ui_controls.is_loaded = true;
            console.log('✅ Products loaded:', this.products.length);
          } else {
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ API Error:', err);
          this.ui_controls.is_loading = false;
          this.ui_controls.is_empty = true;
          this.cdr.markForCheck();
        }
      });
  }
  
  getMoreItems() {
    if (this.ui_controls.is_loading || !this.ui_controls.hasMore) return;
    
    console.log('📡 Loading more items...');
    this.explore.offset += this.explore.limit;
    
    this.networkService.post_request(this.explore, GlobalComponent.explore_listing)
      .subscribe({
        next: (response: any) => {
          if (response.response_code === 200 && response.status === 'success') {
            this.products = [...this.products, ...response.data];
            if (response.data.length < this.explore.limit) {
              this.ui_controls.hasMore = false;
            }
            console.log('✅ More items loaded. Total:', this.products.length);
          } else {
            this.ui_controls.hasMore = false;
          }
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // WISHLIST
  // ========================================
  
  get_label() {
    this.ui_controls.is_loading_category = true;
    this.cdr.markForCheck();
    
    this.networkService.post_request(this.rqst_param, GlobalComponent.readWishlistLabel)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.categories = response.data;
          }
          this.ui_controls.is_loading_category = false;
          this.cdr.markForCheck();
        }
      });
  }
  
  addToCloset(label: number) {
    this.addCloset.label_id = label;
    this.isWishOpen = false;
    
    this.networkService.post_request(this.addCloset, GlobalComponent.addWishlist)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.toast.success(response.message, { position: 'top-center' });
          }
          this.cdr.markForCheck();
        }
      });
  }
  
  startAddToCloset(product_id: number, product_name: string, image_1: string) {
    console.log('❤️ startAddToCloset clicked');
    this.addCloset.id = this.single_user.id;
    this.addCloset.token = this.single_user.token;
    this.addCloset.product_id = product_id;
    this.addCloset.product_name = product_name;
    this.addCloset.product_image = image_1;
    this.rqst_param.id = this.single_user.id;
    this.rqst_param.token = this.single_user.token;
    this.get_label();
    this.isWishOpen = true;
    this.cdr.markForCheck();
  }

  // ========================================
  // NAVIGATION
  // ========================================
  
  open_vendor(id: number, name: string) {
    console.log('🏪 open_vendor clicked:', id, name);
    this.router.navigate(['/', 'vendors'], { queryParams: { id, name } });
  }
  
  triggerBack() {
    console.log('⬅️ triggerBack clicked');
    this.nav.back();
  }
  
  open_product(id: number) {
    console.log('📦 open_product clicked:', id);
    this.router.navigate(['/', 'product'], { queryParams: { id } });
  }
  
  openHome() {
    console.log('🏠 openHome clicked');
    this.router.navigate(['/', 'account']);
  }
}