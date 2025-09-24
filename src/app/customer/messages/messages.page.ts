import {Component, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent, IonChip,
  IonCol,
  IonContent, IonFab, IonFabButton,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem, IonLabel, IonList,
  IonModal, IonNote,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSearchbar,
  IonTabBar,
  IonTabButton, IonText,
  IonTitle,
  IonToolbar,
  NavController,
  Platform
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
import {ActionSheetController} from "@ionic/angular";
import {Preferences} from "@capacitor/preferences";

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonCard, IonCardContent, IonRefresher, IonRefresherContent, IonSearchbar, TuiIcon, RouterLink, IonButton, IonCol, IonFooter, IonIcon, IonModal, IonRow, IonTabBar, IonTabButton, TuiButton, TuiLabel, TuiLoader, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, IonItem, IonLabel, IonList, IonNote, IonAvatar, IonChip, IonFab, IonFabButton, IonText]
})
export class MessagesPage implements OnInit, OnDestroy {
  isOnline = true;
  private sub: Subscription;
  private backSub?: Subscription;
  @ViewChild(IonModal) modal!: IonModal;
  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private platform: Platform,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
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
    is_empty: false,
    is_loading: false,
    is_creating: false,
    is_deleting: false
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
  delete = {
    id: 0,
    token: '',
    review: 0
  };
  ngOnInit() {
    this.getObject().then(r => console.log(r));
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
  rqst_param = {
    id: 0,
    token: "",
    label: 4
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
  cancel() {
    this.modal.dismiss(null, 'cancel').then(r => console.log(r));
  }
  get_messaged(){

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
  user_profile() {
    this.router.navigate(['/', 'settings']).then(r => console.log(r));
  }
  user_home() {
    this.router.navigate(['/', 'account']).then(r => console.log(r));
  }
  user_cart() {
    this.router.navigate(['/', 'cart']).then(r => console.log(r));
  }
  user_explore() {
    this.router.navigate(['/', 'explore']).then(r => console.log(r));
  }
  orders() {
    this.router.navigate(['/', 'orders']).then(r => console.log(r));
  }
  conversations(vendor: number, userId: number) {
    this.router.navigate(['/', 'conversations']).then(r => console.log(r));
  }
  triggerBack() {
    this.nav.back();
  }
}
