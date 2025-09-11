import {AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, signal, ViewChild} from '@angular/core';
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
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonRange,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonTabBar,
  IonTabButton,
  IonText,
  IonTitle,
  IonToolbar, NavController
} from '@ionic/angular/standalone';
import {Router, RouterLink} from "@angular/router";
import {
  TuiButton,
  TuiIcon,
  TuiLabel,
  TuiLoader,
  TuiSurface,
  TuiTextfieldComponent,
  TuiTextfieldDirective, TuiTextfieldOptionsDirective,
  TuiTitle
} from "@taiga-ui/core";
import {Subscription} from "rxjs";
import {Platform} from "@ionic/angular";
import {ConnectionService} from "../../service/connection.service";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {TuiCardLarge, TuiHeader} from "@taiga-ui/layout";
import {TuiAvatar, TuiButtonGroup, TuiRadioComponent} from "@taiga-ui/kit";
import {GlobalComponent} from "../../global-component";
import {Preferences} from "@capacitor/preferences";

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonImg, RouterLink, IonButton, TuiIcon, IonCard, TuiCardLarge, TuiHeader, TuiSurface, TuiAvatar, TuiTitle, TuiButtonGroup, IonCardHeader, IonCardContent, IonCardTitle, IonCardSubtitle, IonText, IonItem, IonSelect, IonLabel, IonSelectOption, IonInput, IonCol, IonGrid, IonModal, IonRange, IonRow, TuiLabel, TuiRadioComponent, IonFooter, IonIcon, IonTabBar, IonTabButton, TuiButton, TuiLoader, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective]
})
export class ProductPage implements AfterViewInit, OnInit {
  @ViewChild('swiper', { static: true }) swiperEl!: ElementRef<HTMLElement>;
  @ViewChild(IonModal) modal!: IonModal;
  index = signal(0);
  isOnline = true;
  private sub: Subscription;
  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private platform: Platform,
    private router: Router,
    private networkService: NetworkService,
    private toast: HotToastService,
  ) {
    this.platform.backButton.subscribeWithPriority(10, () => {
      console.log('Handler was called!');
    });
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  ngAfterViewInit(): void {
    const el = this.swiperEl.nativeElement as any;
    const attach = () => {
      const sw: any = el.swiper;
      if (!sw) {
        setTimeout(attach, 30);
        return;
      }
      this.index.set(sw.activeIndex ?? 0);
      sw.on('slideChange', () => {
        this.index.set(sw.activeIndex ?? 0);
      });
    };

    attach();
  }
  ngOnInit() {
    this.getObject().then(r => console.log(r));
  }
  update = {
    id: 0,
    token: '',
    bust: 0,
    neck: 0,
    waist: 0,
    length: 0,
    hip: 0,
    arm: 0
  };
  ui_controls = {
    is_loading: false,
    is_creating: false,
    is_empty: false
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
  user_wishlist() {
    this.router.navigate(['/', 'wishlist']).then(r => console.log(r));
  }

  user_cart() {
    this.router.navigate(['/', 'cart']).then(r => console.log(r));
  }
  rqst_param = {
    id: 0,
    token: ""
  }
  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.rqst_param.id = this.single_user.id
      this.rqst_param.token = this.single_user.token
      this.get_measurement();
    }
  }
  get_measurement() {
    this.ui_controls.is_loading = true;
    this.networkService.post_request(this.rqst_param, GlobalComponent.readMeasurement)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.update.bust =  response.data[0].bust
            this.update.neck = response.data[0].neck
            this.update.waist = response.data[0].waist
            this.update.length = response.data[0].length
            this.update.hip = response.data[0].hip
            this.update.arm = response.data[0].arm
            this.ui_controls.is_loading = false;
          }else{
            this.ui_controls.is_empty = true;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }
  update_measurement() {
    if(this.isOnline){
      this.update.id = this.single_user.id;
      this.update.token = this.single_user.token;
      this.ui_controls.is_loading = true;
      this.networkService.post_request(this.update, GlobalComponent.updateMeasurement)
        .subscribe(({
          next: (response) => {
            if (response.response_code === 200 && response.status === "success") {
              this.success_notification(response.message);
              this.ui_controls.is_loading = false;
              this.get_measurement();
              this.cancel();
            }else{
              this.ui_controls.is_loading = false
              this.error_notification(response.message);
            }
          },
          error: () => {
            this.ui_controls.is_loading = false;
            this.error_notification("unable to save measurement");
          }
        }))
    }else {
      this.error_notification("You are not online, check your connection")
    }
  }
  cancel() {
    this.modal.dismiss(null, 'cancel').then(r => console.log(r));
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
}
