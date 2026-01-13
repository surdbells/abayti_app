import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSkeletonText,
  IonTabBar,
  IonTabButton,
  IonText,
  IonTitle,
  IonToolbar,
  NavController,
  Platform
} from '@ionic/angular/standalone';
import {TuiIcon, TuiLoader} from "@taiga-ui/core";
import {Router} from "@angular/router";
import {ConnectionService} from "../../../service/connection.service";
import {BlockerService} from "../../../blocker.service";
import {ActionSheetController} from "@ionic/angular";
import {NetworkService} from "../../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {TranslatePipe} from "../../../translate.pipe";
import {GlobalComponent} from "../../../global-component";
import {Preferences} from "@capacitor/preferences";
import {Labels} from "../../../class/labels";
export interface StyleProduct {
  product_id: number;
  product_name: string;
  price: number;
  image: string;
}

export interface Styles {
  id: number;
  total_price: number;
  category: string;
  style_name: string;
  products: StyleProduct[];
}
@Component({
  selector: 'app-style-view',
  templateUrl: './style-view.page.html',
  styleUrls: ['./style-view.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonCard, IonFooter, IonLabel, IonRefresher, IonRefresherContent, IonSkeletonText, IonTabBar, IonTabButton, TuiIcon, IonText, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonButton, IonIcon, IonCol, IonItem, IonList, IonModal, IonRow, TranslatePipe, TuiLoader]
})
export class StyleViewPage implements  OnInit {
  isOnline = true;
  isWishOpen = false; // or control this as you like
  categories: Labels[] = [];
  style!: Styles;
  addCloset = {
    id: 0,
    token: "",
    label_id: 0,
    product_id: 0,
    product_name: "",
    product_image: ""
  }
  rqst_param = {
    id: 0,
    token: ""
  }
  constructor(
    private router: Router,
    private platform: Platform,
    private nav: NavController,
    private net: ConnectionService,
    private blocker: BlockerService,
    private actionSheetCtrl: ActionSheetController,
    private networkService: NetworkService,
    private toast: HotToastService
  ) { }
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

  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
    }
  }
  ngOnInit() {
    this.style = history.state?.style;
    if (!this.style) {
      this.router.navigate(['/styles']).then(r => console.log(r));
    }
   this.getObject().then(r => console.log(r));
  }
  open_product(id: number) {
    this.router.navigate(
      ['/', 'product'],
      { queryParams: { id, name } }
    ).then(r => console.log(r));
  }
  ui_controls = {
    is_loading: false,
    is_empty: false,
    is_loading_category: false
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
  user_profile() {
    this.router.navigate(['/', 'settings']).then(r => console.log(r));
  }
  user_home() {
    this.router.navigate(['/', 'account']).then(r => console.log(r));
  }
  user_explore() {
    this.router.navigate(['/', 'explore']).then(r => console.log(r));
  }
  user_styles() {
    this.router.navigate(['/', 'styles']).then(r => console.log(r));
  }
  getTotal() {
    return this.style.products.reduce((a, b) => a + b.price, 0);
  }
  triggerBack() {
    this.nav.back();
  }
  OnDidDismiss() {
    this.isWishOpen = false;
  }
}
