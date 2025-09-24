import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef, HostListener,
  OnDestroy,
  OnInit, signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
import {Platform} from "@ionic/angular";
import {
  TuiButton,
  TuiIcon,
  TuiLabel,
  TuiLoader,
  TuiTextfieldComponent,
  TuiTextfieldDirective,
  TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {Products} from "../../class/products";
import {Labels} from "../../class/labels";
import {Subscription} from "rxjs";
import {ConnectionService} from "../../service/connection.service";
import {Router, RouterLink} from "@angular/router";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {Preferences} from "@capacitor/preferences";
import {GlobalComponent} from "../../global-component";
import {TuiCarouselButtons, TuiCarouselComponent, TuiRadioComponent} from "@taiga-ui/kit";
import {TuiItem} from "@taiga-ui/cdk";
interface Category {
  readonly id: number;
  readonly name: string;
}
type DualRange = { lower: number; upper: number };
@Component({
  selector: 'app-vertican',
  templateUrl: './vertican.page.html',
  styleUrls: ['./vertican.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonButton, IonContent, IonHeader, IonToolbar, CommonModule, FormsModule, IonButtons, IonCard, IonCardContent, TuiIcon, RouterLink, IonCardHeader, IonCardTitle, IonCol, IonGrid, IonInput, IonItem, IonLabel, IonModal, IonRange, IonRow, IonSelect, IonSelectOption, IonTitle, TuiLabel, TuiRadioComponent, IonImg, IonText, TuiLoader, TuiButton, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, IonList, IonFooter, IonIcon, IonTabBar, IonTabButton, IonFab, IonFabButton, IonSkeletonText, IonThumbnail, TuiCarouselComponent, TuiItem, TuiCarouselButtons]
})
export class VerticanPage implements OnInit, OnDestroy {
  products: Products[] = [];
  categories: Labels[] = [];
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('filter_modal', { read: ElementRef }) filterModal!: ElementRef<HTMLIonModalElement>;
  @ViewChild('scroller', { read: ElementRef, static: true }) scroller!: ElementRef<HTMLDivElement>;
  private pageWidth(): number {
    return window.innerWidth;
  }

  index = signal(0);
  isOnline = true;
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
  isFilterOpen = false; // or control this as you like
  isWishOpen = false; // or control this as you like
  images: string[] = [];
  private sub: Subscription;
  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private platform: Platform,
    private router: Router,
    private networkService: NetworkService,
    private toast: HotToastService,
  ) {
    /*    this.platform.backButton.subscribeWithPriority(10, () => {
          console.log('Handler was called!');
        });*/
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  @HostListener('window:ionBackButton', ['$event'])
  onHardwareBack(ev: CustomEvent) {
    ev.detail.register(100, () => {
      this.nav.navigateRoot('/account').then(r => console.log(r));
    });
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
  ui_controls = {
    is_loading: false,
    is_loaded: false,
    is_empty: false,
    is_loading_category: false
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
   // this.getObject().then(r => console.log(r));
    if (this.isOnline) {
    } else {
      console.log('You are offline');
    }
  }
  ionViewWillEnter(){
    this.getObject().then(r => console.log(r));
  }
  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.explore_products();
    }
  }
  closeFilter() {
    this.isFilterOpen = false;
    this.filterModal?.nativeElement.dismiss(undefined, 'cancel'); // role optional
  }
  explore = {
    id: 0,
    token: ""
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
    this.ui_controls.is_loaded = false;
    this.ui_controls.is_empty = false;
    this.filter.id = this.single_user.id;
    this.filter.token = this.single_user.token;
    this.networkService.post_request(this.filter, GlobalComponent.filtered_products)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.products = response.data;
            this.ui_controls.is_loading = false;
            this.ui_controls.is_loaded = true;
            this.ui_controls.is_empty = false;
          }else {
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
          }
        }
      }))
  }
  explore_products() {
    this.products = [];
    this.ui_controls.is_loading = true;
    this.ui_controls.is_loaded = false;
    this.ui_controls.is_empty = false;
    this.explore.id = this.single_user.id;
    this.explore.token = this.single_user.token;
    this.networkService.post_request(this.explore, GlobalComponent.explore)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.products = response.data;
            this.ui_controls.is_loading = false;
            this.ui_controls.is_loaded = true;
            this.images = response.data.images.split(',');
            this.ui_controls.is_empty = false;
          }else{
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
          }
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
  open_vendor(id: number, name: string) {
    this.router.navigate(
      ['/', 'vendors'],
      { queryParams: { id, name } }
    ).then(r => console.log(r));
  }

  triggerBack() {
    this.router.navigate(['/', 'account']).then(r => console.log(r));
  }
}
