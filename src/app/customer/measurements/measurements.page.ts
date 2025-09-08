import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {
  IonButtons,
  IonCard,
  IonCardContent, IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader, IonInput, IonItem, IonRow, IonSelect, IonSelectOption,
  IonToolbar,
  NavController,
  Platform
} from '@ionic/angular/standalone';
import {
  TuiButton,
  TuiIcon, TuiLoader
} from "@taiga-ui/core";
import {ConnectionService} from "../../service/connection.service";
import {Router, RouterLink} from "@angular/router";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {CommonModule} from "@angular/common";
import {Preferences} from "@capacitor/preferences";
import {GlobalComponent} from "../../global-component";
import {List} from "../../class/list";
import {TuiAccordionDirective, TuiCarouselComponent} from "@taiga-ui/kit";
import {TuiItem} from "@taiga-ui/cdk";
import {FormsModule} from "@angular/forms";
@Component({
  selector: 'app-measurements',
  standalone: true,
  templateUrl: './measurements.page.html',
  styleUrls: ['./measurements.page.scss'],
  imports: [
    IonHeader,
    CommonModule,
    IonToolbar,
    IonButtons,
    TuiIcon,
    RouterLink,
    IonContent,
    IonCard,
    IonCardContent,
    IonFab,
    IonFabButton,
    TuiButton,
    TuiLoader,
    TuiCarouselComponent,
    TuiItem,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    FormsModule,
    TuiAccordionDirective,
    IonCol,
    IonRow
  ]
})
export class MeasurementsPage implements OnInit, OnDestroy {
  list: List[] = [];
  isOnline = true;
  private sub: Subscription;
  private backSub?: Subscription;
  protected index = 0;
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
  @HostListener('window:ionBackButton', ['$event'])
  onHardwareBack(ev: CustomEvent) {
    ev.detail.register(100, () => {
      this.nav.navigateRoot('/account').then(r => console.log(r));
    });
  }
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

  ngOnInit() {
    this.getObject().then(r => console.log(r));
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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
  // Called when the page becomes active (Ionic RouterOutlet triggers this)
  ionViewDidEnter() {
  //  this.getObject().then(r => console.log(r));
    this.backSub = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.nav.navigateRoot('/account').then(r => console.log(r)); // or Router: navigateByUrl('/account', { replaceUrl: true })
    });
  }

  // Clean up when you leave the page
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
    }
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
              this.ui_controls.is_loading = false;
              this.success_notification(response.message);
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
