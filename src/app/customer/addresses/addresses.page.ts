import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol,
  IonContent, IonFab, IonFabButton,
  IonHeader, IonItem, IonLabel, IonList, IonModal, IonRow,
  IonTitle,
  IonToolbar, NavController, Platform
} from '@ionic/angular/standalone';
import {
    TuiButton,
    TuiIcon,
    TuiLabel,
    TuiLoader,
    TuiTextfieldComponent,
    TuiTextfieldDirective,
    TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {Router, RouterLink} from "@angular/router";
import {Subscription} from "rxjs";
import {ConnectionService} from "../../service/connection.service";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {Preferences} from "@capacitor/preferences";
import {GlobalComponent} from "../../global-component";
import {Billing} from "../../class/billing";
import {City} from "../../class/city";
import {Area} from "../../class/area";
import {CartIconComponent} from "../../cart-icon.component";
import {TranslatePipe} from "../../translate.pipe";

@Component({
  selector: 'app-addresses',
  templateUrl: './addresses.page.html',
  styleUrls: ['./addresses.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonCard, IonCardContent, IonFab, IonFabButton, TuiButton, TuiIcon, TuiLoader, RouterLink, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCol, IonRow, TuiLabel, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, IonButton, IonItem, IonLabel, IonList, IonModal, CartIconComponent, TranslatePipe]
})
export class AddressesPage implements OnInit, OnDestroy {
  billing: Billing[] = [];
  city: City[] = [];
  area: Area[] = [];
  isOnline = true;
  private sub: Subscription;
  private backSub?: Subscription;
  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private platform: Platform,
    private router: Router,
    private networkService: NetworkService,
    private toast: HotToastService,
  ) {
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  ui_controls = {
    is_empty: false,
    is_loading: false,
    is_loading_area: false,
    is_updating: false
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
    delivery_address: "",
    billing_name: "",
    billing_phone: "",
    billing_email: "",
    billing_country: "",
    billing_city: "",
    billing_area: "",
    billing_street: "",
    villa_number: "",
    is_2fa: false,
    is_active: false,
    is_admin: false,
    is_vendor: false,
    is_customer: false
  }
  update = {
    id: 0,
    token: '',
    name: '',
    phone: '',
    email: '',
    city: 'Dubai',
    area: 'Al Marmoom',
    street: '',
    villa_number: ''
  };

  ngOnInit() {
    this.getObject().then(r => console.log(r));
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
  ionViewWillLeave() {
    this.backSub?.unsubscribe();
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
      this.update.name = this.single_user.first_name + " " + this.single_user.last_name;
      this.update.phone = this.single_user.phone;
      this.update.email = this.single_user.email;
      this.get_billing();
      this.getCities();
      this.getArea(2);
    }
  }
  get_billing() {
    this.ui_controls.is_loading = true;
    this.networkService.post_request(this.rqst_param, GlobalComponent.readBilling)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.update = response.data;
            this.ui_controls.is_loading = false;
          }else{
            this.ui_controls.is_empty = true;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }
  getCities() {
    this.ui_controls.is_loading = true;
    this.networkService.get_request(GlobalComponent.topexCities)
      .subscribe(({
        next: (response) => {
          this.city = response.data;
          this.ui_controls.is_loading = false;
        }
      }))
  }
  getArea(city: number) {
    this.ui_controls.is_loading_area = true;
    this.networkService.get_request(GlobalComponent.topexAreaURL+city)
      .subscribe(({
        next: (response) => {
          this.area = response.data;
          this.ui_controls.is_loading_area = false;
        }
      }))
  }
  selectCode(d: string, id: number) {
    this.update.city = d;
    this.getArea(id);
  }
  selectArea(d: string) {
    this.update.area = d;
  }
  update_billing() {
    if(this.isOnline){
      this.update.id = this.single_user.id;
      this.update.token = this.single_user.token;
      if (this.update.city.length == 0) {
        this.error_notification("City is require");
        return;
      }
      if (this.update.area.length == 0) {
        this.error_notification("Area is require");
        return;
      }
      if (this.update.street.length == 0) {
        this.error_notification("Street is required");
        return;
      }
      if (this.update.villa_number.length == 0) {
        this.error_notification("Villa number is required is required");
        return;
      }
      this.ui_controls.is_updating = true;
      this.networkService.post_request(this.update, GlobalComponent.updateBilling, )
        .subscribe(({
          next: (response) => {

            if (response.response_code === 200 && response.status === "success") {
              this.ui_controls.is_updating = false;
              this.success_notification(response.message);
              this.single_user.delivery_address = this.update.city + ", " + this.update.area + ", " + this.update.street;
              this.single_user.billing_name = this.update.name;
              this.single_user.billing_phone = this.update.phone;
              this.single_user.billing_email = this.update.email;
              this.single_user.billing_city = this.update.city;
              this.single_user.billing_area = this.update.area;
              this.single_user.billing_street = this.update.street;
              this.single_user.villa_number = this.update.villa_number;
              Preferences.set({
                key: 'user',
                value: JSON.stringify(this.single_user)
              }).then(r => console.log(r));
              this.get_billing();
            }else{
              this.ui_controls.is_updating = false
              this.error_notification(response.message);
            }
          },
          error: () => {
            this.ui_controls.is_updating = false;
            this.error_notification("unable to save billing address");
          }
        }))
    }else {
      this.error_notification("You are not online, check your connection")
    }
  }

  user_wishlist() {
    this.router.navigate(['/', 'wishlist']).then(r => console.log(r));
  }
  user_messages() {
    this.router.navigate(['/', 'messages']).then(r => console.log(r));
  }
  user_cart() {
    this.router.navigate(['/', 'cart']).then(r => console.log(r));
  }
  error_notification(message: string) {
    this.toast.error(message, {
      position: "bottom-center"
    });
  }
  success_notification(message: string) {
    this.toast.success(message, {
      position: "bottom-center"
    });
  }
}
