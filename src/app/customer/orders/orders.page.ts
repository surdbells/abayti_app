import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent, IonFooter,
    IonHeader, IonIcon, IonLabel, IonRefresher, IonRefresherContent, IonSearchbar, IonTabBar, IonTabButton,
    IonTitle,
    IonToolbar, NavController, Platform
} from '@ionic/angular/standalone';
import {TuiButton, TuiIcon} from "@taiga-ui/core";
import {Router, RouterLink} from "@angular/router";
import {Subscription} from "rxjs";
import {ConnectionService} from "../../service/connection.service";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {GlobalComponent} from "../../global-component";
import {Products} from "../../class/products";

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonCard, IonCardContent, IonRefresher, IonRefresherContent, IonSearchbar, TuiButton, TuiIcon, RouterLink, IonButton, IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton]
})
export class OrdersPage implements OnInit, OnDestroy {

  isOnline = true;
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
  onHardwareBack(ev: CustomEvent) {
    ev.detail.register(100, () => {
      this.nav.navigateRoot('/account').then(r => console.log(r));
    });
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  ngOnInit() {
    if (this.isOnline) {
      console.log('You are online');
    } else {
      console.log('You are offline');
    }
  }
  handleRefresh(event: any) {
    setTimeout(() => {
      //
      event.target.complete();
    }, 200);
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
  user_orders() {
    this.router.navigate(['/', 'orders']).then(r => console.log(r));
  }
}
