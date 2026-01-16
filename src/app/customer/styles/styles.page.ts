import {Component, OnInit, ViewChild} from '@angular/core';

import { FormsModule } from '@angular/forms';
import {ActionSheetController, InfiniteScrollCustomEvent, IonicModule, Platform} from "@ionic/angular";
import {TranslatePipe} from "../../translate.pipe";
import {
  IonButtons, IonCard, IonCardContent,
  IonContent,
  IonFooter,
  IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonLabel, IonRefresher, IonRefresherContent, IonSkeletonText,
  IonTabBar,
  IonTabButton,
  IonTitle,
  IonToolbar, NavController
} from "@ionic/angular/standalone";
import {Router, RouterLink} from "@angular/router";
import {TuiIcon} from "@taiga-ui/core";
import {Subscription} from "rxjs";
import {ConnectionService} from "../../service/connection.service";
import {BlockerService} from "../../blocker.service";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {Preferences} from "@capacitor/preferences";
import {GlobalComponent} from "../../global-component";

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
  selector: 'app-styles',
  templateUrl: './styles.page.html',
  styleUrls: ['./styles.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonTitle,
    RouterLink,
    IonContent,
    IonFooter,
    IonTabBar,
    TuiIcon,
    IonTabButton,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonSkeletonText,
    IonCardContent,
    TranslatePipe,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ]
})
export class StylesPage implements OnInit {
  activeTab: 'community' | 'abayti' | 'personal' = 'community';
  styles: Styles[] = [];
  @ViewChild('myRefresher') refresher!: IonRefresher;
  isOnline = true;
  private sub: Subscription;
  constructor(
    private router: Router,
    private nav: NavController,
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

  ngOnInit() {
    this.ui_controls.is_loading = true;
    setTimeout(() => {
      this.ui_controls.is_loading = false;
    }, 3000);
    this.getObject().then(r => console.log(r));
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
  ui_controls = {
    is_loading: false,
    is_empty: false,
    is_loading_category: false
  }
  initial = {
    id: 0,
    token: "",
    type: "community",
    limit: 5,
    offset: 0
  }
  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.initial.id = this.single_user.id;
      this.initial.token = this.single_user.token;
      this.get_styles('community');
    }
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

  switchTab(tab: 'community' | 'abayti' | 'personal') {
    this.activeTab = tab;
  }
  handleRefresh(event: any) {
    setTimeout(() => {
      this.ui_controls.is_loading = true;
     // this.get_best_sellers();
    //  this.get_featured_products();
      event.target.complete();
    }, 200);
  }
  refresh() {
    if(this.refresher){
      this.handleRefresh({refresher: this.refresher});
    }
  }
  get_styles(type: string) {
    this.styles = [];
    this.initial.type = type;
    this.ui_controls.is_loading = true;
    this.networkService.post_request(this.initial, GlobalComponent.styles_list)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.styles = response.data;
            this.ui_controls.is_loading = false;
          }else {
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }
  getMoreItems() {
    this.initial.id = this.single_user.id;
    this.initial.token = this.single_user.token;
    this.initial.offset = this.initial.offset + this.initial.limit
    this.networkService.post_request(this.initial, GlobalComponent.styles_list)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.styles.push(...response.data);
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
  open_style(style: Styles) {
    this.router.navigate(['/style-view'], {
      state: {style}
    }).then(r => console.log(r));
  }
  triggerBack() {
    this.nav.back();
  }
  createStyle() {
    this.router.navigate(['/', 'create']).then(r => console.log(r));
  }
}
