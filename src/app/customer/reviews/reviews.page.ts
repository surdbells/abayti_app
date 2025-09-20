import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol,
  IonContent, IonFab, IonFabButton,
  IonHeader, IonItem, IonLabel, IonList, IonModal, IonRow, IonText,
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
import {City} from "../../class/city";
import {Area} from "../../class/area";
import {Reviews} from "../../class/reviews";
import {ActionSheetController} from "@ionic/angular";

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.page.html',
  styleUrls: ['./reviews.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonCard, IonCardContent, IonFab, IonFabButton, TuiButton, TuiIcon, TuiLoader, RouterLink, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCol, IonRow, TuiLabel, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, IonButton, IonItem, IonLabel, IonList, IonModal, IonText]
})
export class ReviewsPage implements OnInit, OnDestroy {
  reviews: Reviews[] = [];
  isOnline = true;
  private sub: Subscription;
  private backSub?: Subscription;
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
      this.nav.navigateRoot('/settings').then(r => console.log(r));
    });
  }
  ui_controls = {
    is_empty: false,
    is_loading: false,
    is_loading_area: false,
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
  // Called when the page becomes active (Ionic RouterOutlet triggers this)
  ionViewDidEnter() {
    //  this.getObject().then(r => console.log(r));
    this.backSub = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.nav.navigateRoot('/settings').then(r => console.log(r)); // or Router: navigateByUrl('/account', { replaceUrl: true })
    });
  }
  // Clean up when you leave the page
  ionViewWillLeave() {
    this.backSub?.unsubscribe();
  }
  star_items = Array(5).fill(0);
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
      this.get_reviews();
    }
  }
get_reviews() {
    this.ui_controls.is_empty = false;
    this.ui_controls.is_loading = true;
    this.networkService.post_request(this.rqst_param, GlobalComponent.readReviews)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.reviews = response.data;
            this.ui_controls.is_loading = false;
          }else{
            this.ui_controls.is_empty = true;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }
delete_reviews(review: number) {
    if(this.isOnline){
      this.delete.id = this.single_user.id;
      this.delete.token = this.single_user.token;
      this.ui_controls.is_deleting = true;
      this.networkService.post_request(this.delete, GlobalComponent.deleteReview, )
        .subscribe(({
          next: (response) => {
            if (response.response_code === 200 && response.status === "success") {
              this.ui_controls.is_deleting = false;
              this.success_notification(response.message);
              this.get_reviews();
            }
          }
        }))
    }else {
      this.error_notification("You are not online, check your connection")
    }
  }
  async start_delete_review(review: number) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Are you sure you want to delete this review?',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.delete_reviews(review);
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
