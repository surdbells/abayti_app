import { Component, OnInit } from '@angular/core';
import { IonCol, IonContent, IonGrid,  IonRow, Platform } from '@ionic/angular/standalone';
import { TuiTextfieldComponent} from "@taiga-ui/core";
import {Subscription} from "rxjs";
import {ConnectionService} from "../service/connection.service";
import {Router} from "@angular/router";


@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  imports: [
    IonCol,
    IonRow,
    IonContent,
    IonGrid,
    TuiTextfieldComponent
  ],
  standalone: true
})
export class WelcomePage implements OnInit {
  isOnline = true;
  private sub: Subscription;
  constructor(
    private net: ConnectionService,
    private platform: Platform,
    private router: Router
  ) {
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
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
  ui_controls = {
    page_loading: false,
    login_loading: false,
    logged_in: false
  };

  start_shopping() {
    this.router.navigate(['/', 'login']).then(r => console.log(r));
  }
  explore() {
    this.router.navigate(['/', 'home']).then(r => console.log(r));
  }

}
