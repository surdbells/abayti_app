import {Component, Input, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle, IonChip,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRange,
  IonRefresher,
  IonRefresherContent,
  IonRow, IonSelect, IonSelectOption, IonTabBar, IonTabButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {CartIconComponent} from "../../cart-icon.component";
import {TranslatePipe} from "../../translate.pipe";
import {TuiAvatar, TuiRadioComponent} from "@taiga-ui/kit";
import {
    TuiButton,
    TuiFallbackSrcPipe,
    TuiIcon,
    TuiLabel,
    TuiLoader,
    TuiTextfieldComponent,
    TuiTextfieldDirective, TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {Products} from "../../class/products";
import {Labels} from "../../class/labels";
import {Subscription} from "rxjs";
import {Router} from "@angular/router";
import {ActionSheetController, Platform} from "@ionic/angular";
import {ConnectionService} from "../../service/connection.service";
import {BlockerService} from "../../blocker.service";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {Preferences} from "@capacitor/preferences";
import {GlobalComponent} from "../../global-component";
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
  price: string;
  rating: number | null;        // allow null if no rating yet
  rating_count: number;
  products: Product[];
}
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CartIconComponent, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonFooter, IonGrid, IonIcon, IonInput, IonItem, IonLabel, IonList, IonModal, IonRange, IonRefresher, IonRefresherContent, IonRow, IonSelect, IonSelectOption, IonTabBar, IonTabButton, TranslatePipe, TuiAvatar, TuiButton, TuiFallbackSrcPipe, TuiIcon, TuiLabel, TuiLoader, TuiRadioComponent, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, HScrollProgressComponent, IonChip]
})
export class HomePage implements OnInit, OnDestroy {
  best_sellers: Products[] = [];
  vendor_featured: Store[] = [];
  @ViewChild('myRefresher') refresher!: IonRefresher;
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
    category: 0
  }

  filter = {
    id: 0,
    token: "",
    category: 1,
    price_start: this.range().lower,
    price_end: this.range().upper,
    delivery: "1 - 3"
  }
  ngOnInit() {
    this.blocker.block({ disableSwipe: true, disableHardwareBack: true });
    this.get_best_sellers();
    this.get_featured_products();
  }

  ngOnDestroy(): void {
    this.blocker.unblock(); // ✅ restore when leaving
    this.sub?.unsubscribe();
  }

  open_product(id: number) {
    this.router.navigate(
      ['/', 'single'],
      { queryParams: { id } }
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

  products_by_category(category: number) {
    this.ui_controls.is_loading = true;
    this.rqst_param_products_by_category.category = category;
    this.networkService.post_request(this.rqst_param_products_by_category, GlobalComponent.product_by_categoryUtility)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.best_sellers = response.data;
            this.ui_controls.is_loading = false;
            console.log(this.ui_controls.is_loading);
          }else{
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }
  get_best_sellers() {
    this.ui_controls.is_loading = true;
    this.networkService.get_request(GlobalComponent.best_sellersUtility)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.best_sellers = response.data;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }
  get_featured_products() {
    this.ui_controls.is_loading = true;
    this.networkService.get_request(GlobalComponent.featuredUtility)
      .subscribe(({
        next: (response) => {
          this.vendor_featured = response.data;
          this.ui_controls.is_loading = false;
        }
      }))
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
  toggleClass(event: Event) {
    const el = event.currentTarget as HTMLElement;
    el.classList.toggle('cat_active');
  }
  refresh_products() {
    if(this.refresher){
      this.handleRefresh({refresher: this.refresher});
    }
  }
  user_register() {
    this.router.navigate(['/', 'register']).then(r => console.log(r));
  }
  user_login() {
    this.router.navigate(['/', 'login']).then(r => console.log(r));
  }
  SignInContinue() {
    this.show_error("You need to sign in to continue");
    this.router.navigate(['/', 'login']).then(r => console.log(r));
  }
  show_error(message: string) {
    this.toast.error(message, {
      position: 'top-center'
    });
  }
  show_success(message: string, position: any) {
    this.toast.success(message, {
      position: 'top-center'
    });
  }
}
