import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule, NgIf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  TuiButton,
  TuiLabel,
  TuiLoader,
  TuiTextfieldComponent,
  TuiTextfieldDirective,
  TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {Subscription} from "rxjs";
import {ConnectionService} from "../../service/connection.service";
import {ActionSheetController, IonicModule} from "@ionic/angular";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {Preferences} from "@capacitor/preferences";
import {GlobalComponent} from "../../global-component";
import {StoreRecord} from "../messages/messages.page";
import {NavController, Platform} from "@ionic/angular/standalone";
import {TuiTextarea, TuiTextareaLimit} from "@taiga-ui/kit";
import {TranslatePipe} from "../../translate.pipe";

@Component({
  selector: 'app-create-ticket',
  templateUrl: './create-ticket.page.html',
  styleUrls: ['./create-ticket.page.scss'],
  standalone: true,
  imports: [TuiLoader, RouterLink, IonicModule, ReactiveFormsModule, FormsModule, TuiButton, NgIf, TuiTextarea, TuiTextareaLimit, TuiLabel, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, TranslatePipe]
})
export class CreateTicketPage implements OnInit, OnDestroy {
  isOnline = true;
  private sub: Subscription;
  private backSub?: Subscription;
  stores: StoreRecord[] = [];
  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private route: ActivatedRoute,
    private platform: Platform,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private networkService: NetworkService,
    private toast: HotToastService,
  ) {
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
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
    avatar: "",
    location: "",
    is_2fa: false,
    is_active: false,
    is_admin: false,
    is_vendor: false,
    is_customer: false
  }
  create = {
    id: 0,
    token: "",
    store: 0,
    subject: "",
    message: "",
  }
  ngOnInit() {
    this.getObject().then(r => console.log(r));
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
  request = {
    id: 0,
    token: ""
  }
  message = {
    id: 0,
    token: "",
    storeId: 0,
    userId: 0,
    message: ""
  }
  async getObject() {
    const ret: any = await Preferences.get({ key: 'user' });
    if (ret.value == null){
      this.router.navigate(['/', 'login']).then(r => console.log(r));
    }else{
      this.single_user = JSON.parse(ret.value);
      this.request.id = this.single_user.id;
      this.request.token = this.single_user.token;
      this.get_vendors();
    }
  }
  IonOnViewDidEnter(){
    this.getObject().then(r => console.log(r));
  }
  get_vendors() {
    this.ui_controls.is_loading = true;
    this.networkService.post_request(this.request, GlobalComponent.readCustomerOrders)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.stores =  response.data;
            this.ui_controls.is_loading = false;
          }
        }
      }))
  }
  create_ticket() {
    this.ui_controls.is_loading = true;
    this.create.id = this.single_user.id;
    this.create.token = this.single_user.token;
    if (this.create.subject.length == 0){
      this.error_notification("subject is required");
      return;
    }
    if (this.create.message.length == 0){
      this.error_notification("message is required");
      return;
    }
    if (this.create.store == 0){
      this.error_notification("Reference is required");
      return;
    }
    this.networkService.post_request(this.create, GlobalComponent.createTicket)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200) {
            this.success_notification(response.message)
            this.ui_controls.is_loading = false;
            this.router.navigate(['/', 'ticketlist']).then(r => console.log(r));
          }else{
            this.ui_controls.is_loading = false;
            this.error_notification(response.message);
          }
        },
        error: (e) => {
          this.ui_controls.is_loading = false;
          this.error_notification("Unable to complete your request");
          return;
        },
        complete: () => {
          this.ui_controls.is_loading = false;
          console.info('complete');
        }
      }))
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
