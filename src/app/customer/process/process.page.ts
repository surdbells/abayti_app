import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonRow,
  IonTitle,
  IonToolbar,
  Platform
} from '@ionic/angular/standalone';
import {Subscription} from "rxjs";
import {ConnectionService} from "../../service/connection.service";
import {ActivatedRoute, Router} from "@angular/router";
import {BlockerService} from "../../blocker.service";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {Preferences} from "@capacitor/preferences";
import {GlobalComponent} from "../../global-component";

@Component({
  selector: 'app-process',
  templateUrl: './process.page.html',
  styleUrls: ['./process.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonGrid, IonRow, IonCol, IonCard]
})
export class ProcessPage implements OnInit {
  isOnline = true;
  private sub: Subscription;
  constructor(
    private net: ConnectionService,
    private platform: Platform,
    private router: Router,
    private blocker: BlockerService,
    private route: ActivatedRoute,
    private networkService: NetworkService,
    private toast: HotToastService
  ) {
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  ngOnInit() {
    this.rqst_param.orderId = this.route.snapshot.queryParamMap.get('orderId') || '';
    this.rqst_param.merchantReference = this.route.snapshot.queryParamMap.get('merchantReference') || '';
    this.rqst_param.paymentType = this.route.snapshot.queryParamMap.get('paymentType') || '';
    this.blocker.block({ disableSwipe: true, disableHardwareBack: true });
    this.getObject().then(r => console.log(r));
  }
  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.rqst_param.id = this.single_user.id;
      this.rqst_param.token = this.single_user.token;
      this.finalize();
    }
  }
  rqst_param = {
    id: 0,
    token: "",
    orderId: "",
    merchantReference: "",
    paymentType: ""
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
    is_2fa: false,
    is_active: false,
    is_admin: false,
    is_vendor: false,
    is_customer: false
  }
  ui_controls = {
    confirming_transaction: true,
    isConfirmed: false
  }
finalize() {
      this.ui_controls.confirming_transaction = true;
      this.networkService.post_request(this.rqst_param, GlobalComponent.finalizePayment)
        .subscribe(({
          next: (response) => {
            if (response.status === "SUCCESS") {
              this.ui_controls.confirming_transaction = false;
              this.router.navigate(['/success'], {replaceUrl: true}).then(r =>console.log(r));
            }
            if (response.status === "FAILED") {
              this.ui_controls.confirming_transaction = false;
              this.router.navigate(['/failed'], {replaceUrl: true}).then(r =>console.log(r));
            }
            if (response.status === "UNKNOWN") {
              this.ui_controls.confirming_transaction = false;
              this.router.navigate(['/failed'], {replaceUrl: true}).then(r =>console.log(r));
            }
            if (response.status === "ERROR") {
              this.ui_controls.confirming_transaction = false;
              this.router.navigate(['/failed'], {replaceUrl: true}).then(r =>console.log(r));
            }
          },
          error: (e) => {
            this.ui_controls.confirming_transaction = false;
            this.router.navigate(['/failed'], {replaceUrl: true}).then(r =>console.log(r));
          },
          complete: () => {
            console.info('complete');
          }
        }))
  }
}
