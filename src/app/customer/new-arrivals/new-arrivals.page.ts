import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonModal, IonRefresher, IonRefresherContent,
  IonRow,
  IonTabBar,
  IonTabButton, IonText,
  IonTitle,
  IonToolbar,
  NavController,
  Platform
} from '@ionic/angular/standalone';
import {
  TuiButton,
  TuiFallbackSrcPipe,
  TuiIcon, TuiLoader,
  TuiTextfieldComponent,
  TuiTextfieldDirective,
  TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {Subscription} from "rxjs";
import {ConnectionService} from "../../service/connection.service";
import {Router, RouterLink} from "@angular/router";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {TuiAvatar, TuiChip} from "@taiga-ui/kit";
import {Preferences} from "@capacitor/preferences";
import {GlobalComponent} from "../../global-component";
import {Search} from "../../class/search";
import {Labels} from "../../class/labels";
import {TranslatePipe} from "../../translate.pipe";
import {Products} from "../../class/products";
import {InfiniteScrollCustomEvent} from "@ionic/angular";

@Component({
  selector: 'app-search',
  templateUrl: './new-arrivals.page.html',
  styleUrls: ['./new-arrivals.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, FormsModule, IonButtons, IonCard, IonCardContent, IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton, TuiButton, TuiIcon, RouterLink, IonButton, IonCol, IonGrid, IonRow, TuiAvatar, TuiFallbackSrcPipe, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, IonItem, IonList, IonModal, TuiLoader, TranslatePipe, TuiChip, IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher, IonRefresherContent, IonText]
})
export class NewArrivalsPage implements OnInit, OnDestroy {
  new_arrivals: Products[] = [];
  categories: Labels[] = [];
  isOnline = true;
  isWishOpen = false; // or control this as you like
  private sub: Subscription;
  product = {
    name: "",
    isFavorite: false,
    description: "",
    price: "",
    quantity: "",
    size: undefined
  };
  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private platform: Platform,
    private router: Router,
    private networkService: NetworkService,
    private toast: HotToastService
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
  ui_controls = {
    is_loading: false,
    is_creating: false,
    is_loading_category: false,
    is_empty: false
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
  initial = {
    id: 0,
    token: "",
    limit: 10,
    offset: 0,
    maxPrice: 20000
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
  addCloset = {
    id: 0,
    token: "",
    label_id: 0,
    product_id: 0,
    product_name: "",
    product_image: ""
  }
  ngOnInit() {
    this.getObject().then(r => console.log(r));
  }
  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.initial.id = this.single_user.id;
      this.initial.token = this.single_user.token;
      this.newArrivals();
    }
  }
  newArrivals() {
    this.ui_controls.is_loading = true;
    this.ui_controls.is_empty = false;
    this.initial.limit = 10;
    this.initial.offset = 0;
    this.initial.maxPrice = 20000;
    this.networkService.post_request(this.initial, GlobalComponent.new_arrivals_listing)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.new_arrivals = response.data;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }

  get_label() {
    this.ui_controls.is_loading_category = true;
    this.networkService.post_request(this.initial, GlobalComponent.readWishlistLabel)
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
    this.initial.id = this.single_user.id;
    this.initial.token = this.single_user.token;
    this.get_label();
    this.isWishOpen = true;
  }
  open_product(id: number, name: string) {
    this.router.navigate(
      ['/', 'product'],
      { queryParams: { id, name } }
    ).then(r => console.log(r));
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
  onDismiss() {
    this.isWishOpen= false;
  }
  triggerBack() {
    this.nav.back();
  }


  getMoreItems() {
    this.initial.id = this.single_user.id;
    this.initial.token = this.single_user.token;
    this.initial.offset = this.initial.offset + this.initial.limit
    this.networkService.post_request(this.initial, GlobalComponent.new_arrivals_listing)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.new_arrivals.push(...response.data);
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

  handleRefresh(event: any) {
    setTimeout(() => {
      this.ui_controls.is_loading = true;
      this.newArrivals();
      event.target.complete();
    }, 200);
  }

  filterByPrice(number: number) {
    this.ui_controls.is_loading = true;
    this.ui_controls.is_empty = false;
    this.initial.maxPrice = number;
    this.initial.offset = 0;
    this.networkService.post_request(this.initial, GlobalComponent.new_arrivals_listing)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.new_arrivals = response.data;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }

  toggleClass(event: Event) {
    document.querySelectorAll('.cat_active')
      .forEach(el => el.classList.remove('cat_active'));
    const el = event.currentTarget as HTMLElement;
    el.classList.add('cat_active');
  }
}
