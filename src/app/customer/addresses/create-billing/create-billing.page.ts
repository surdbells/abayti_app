import {Component, HostListener, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormsModule} from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol,
  IonContent,
  IonHeader, IonItem, IonLabel, IonList, IonModal, IonNote, IonRow, IonSearchbar, IonSegment, IonSegmentButton,
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
import {Subscription} from "rxjs";
import {ConnectionService} from "../../../service/connection.service";
import {Router, RouterLink} from "@angular/router";
import {NetworkService} from "../../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {GlobalComponent} from "../../../global-component";
import {Preferences} from "@capacitor/preferences";
import {City} from "../../../class/city";
import {DialCode} from "../../../dial-codes";
import {Area} from "../../../class/area";

@Component({
  selector: 'app-create-billing',
  templateUrl: './create-billing.page.html',
  styleUrls: ['./create-billing.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonLabel, IonNote, IonRow, IonSegment, IonSegmentButton, TuiButton, TuiIcon, TuiLabel, TuiLoader, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, RouterLink, IonButton, IonItem, IonList, IonModal, IonSearchbar]
})
export class CreateBillingPage implements OnInit, OnDestroy {
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
    private fb: FormBuilder,
    private toast: HotToastService,
  ) {
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  create = {
    id: 0,
    token: '',
    name: '',
    phone: '',
    email: '',
    city: 'Dubai',
    area: 'Al Marmoom',
    street: ''
  };
  @HostListener('window:ionBackButton', ['$event'])
  onHardwareBack(ev: CustomEvent) {
    ev.detail.register(100, () => {
      this.nav.navigateRoot('/account').then(r => console.log(r));
    });
  }
  ui_controls = {
    is_loading: false,
    is_loading_area: false,
    is_creating: false
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
    this.getObject().then(r => console.log(r));
    if (this.isOnline) {
      console.log('You are online');
    } else {
      console.log('You are offline');
    }
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // Called when the page becomes active (Ionic RouterOutlet triggers this)
  ionViewDidEnter() {
    this.backSub = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.nav.navigateRoot('/account').then(r => console.log(r)); // or Router: navigateByUrl('/account', { replaceUrl: true })
    });
  }

  // Clean up when you leave the page
  ionViewWillLeave() {
    this.backSub?.unsubscribe();
  }

  create_billing() {
    if(this.isOnline){
      this.create.id = this.single_user.id;
      this.create.token = this.single_user.token;
      if (this.create.city.length == 0) {
        this.error_notification("City is require");
        return;
      }
      if (this.create.area.length == 0) {
        this.error_notification("Area is require");
        return;
      }
      if (this.create.street.length == 0) {
        this.error_notification("Street is required");
        return;
      }
      this.ui_controls.is_creating = true;
      this.networkService.post_request(this.create, GlobalComponent.createBilling, )
        .subscribe(({
          next: (response) => {

            if (response.response_code === 200 && response.status === "success") {
              this.ui_controls.is_creating = false;
              this.success_notification(response.message);
              this.router.navigate(['/', 'addresses']).then(r => console.log(r));
            }else{
              this.ui_controls.is_creating = false
              this.error_notification(response.message);
            }
          },
          error: () => {
            this.ui_controls.is_creating = false;
            this.error_notification("unable to save billing address");
          }
        }))
    }else {
      this.error_notification("You are not online, check your connection")
    }
  }

  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.create.name = this.single_user.first_name + " " + this.single_user.last_name;
      this.create.phone = this.single_user.phone;
      this.create.email = this.single_user.email;
      console.log(this.single_user);
      this.getCities();
    }
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
    this.create.city = d;
    this.getArea(id);
  }

  selectArea(d: string) {
    this.create.area = d;
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
}
