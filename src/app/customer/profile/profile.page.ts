import {Component, OnInit, signal} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonAvatar, IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader, IonList,
  IonRow,
  IonTitle,
  IonImg,
  IonToolbar, IonItem, IonLabel, IonNote, IonRadioGroup, IonRadio, NavController, Platform, IonButtons
} from '@ionic/angular/standalone';
import {TuiIcon} from "@taiga-ui/core";
import {Router, RouterModule} from "@angular/router";
import {Subscription} from "rxjs";
import {Preferences} from "@capacitor/preferences";
import {LanguageSwitcherComponent} from "../../language-switcher.component";
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, DatePipe, CurrencyPipe,
    IonContent, IonGrid, IonRow, IonCol, IonAvatar, IonImg, IonButton,
    IonList, IonItem, IonLabel, IonNote, IonRadioGroup, IonRadio,
    TuiIcon, RouterModule, IonButtons, IonToolbar, IonHeader, LanguageSwitcherComponent
  ],
})
export class ProfilePage implements OnInit {
  private backSub?: Subscription;
  constructor(
    private router: Router,
    private platform: Platform,
    private nav: NavController
  ) { }
  ui_controls = {
    is_loading: false
  }
  single_user = {
    id: 0,
    token: "",
    first_name: "",
    last_name: "",
    user_type: "",
    email: "",
    phone: "",
    is_2fa: false,
    is_active: false,
    is_admin: false,
    is_vendor: false,
    is_customer: false
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
    }
  }

  user = signal({ name: 'User', avatar: 'assets/img/avatar-placeholder.jpg', points: 0, pending: 0 });
  lastOrder = signal({ date: new Date('2025-01-29'), price: 560, status: 'Delivered' });
  language = signal<'en' | 'ar'>('en');
  country  = signal({ name: 'United Arab Emirates', flag: 'assets/flags/ae.svg' });

  openReturns() {}
  openWallet() {}
  openCards() {}
  openInfo() {}
  openReviews() {}
  viewAllOrders() {}
  sortOrders() {}
  openHelp() {}
  signOut() {}

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

  ngOnDestroy() {
    this.backSub?.unsubscribe();
  }

}
