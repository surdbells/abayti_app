import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  IonContent,
  IonCol,
  IonGrid,
  IonRow,
  IonText,
  Platform,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonHeader,
  IonLabel, IonModal, IonSegment, IonSegmentButton, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { ConnectionService } from '../../service/connection.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TuiButton, TuiIcon,
  TuiLabel, TuiLoader,
  TuiTextfieldComponent,
  TuiTextfieldDirective,
  TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {Router} from "@angular/router";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {DomSanitizer} from "@angular/platform-browser";
import {TranslatePipe} from "../../translate.pipe";
import {TuiPassword} from "@taiga-ui/kit";
import {getCountries} from "libphonenumber-js";
import {TuiCountryIsoCode} from "@taiga-ui/i18n";
import {GlobalComponent} from "../../global-component";
@Component({
  selector: 'app-reset',
  templateUrl: './reset.page.html',
  styleUrls: ['./reset.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonGrid,
    IonCol,
    IonRow,
    CommonModule,
    TuiTextfieldComponent,
    FormsModule,
    TuiLabel,
    TuiButton,
    TuiTextfieldDirective,
    TuiTextfieldOptionsDirective,
    IonText,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCheckbox,
    IonHeader,
    IonLabel,
    IonModal,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
    TranslatePipe,
    TuiIcon,
    TuiLoader,
    TuiPassword
  ]
})
export class ResetPage implements OnInit, OnDestroy {
  isOnline = true;
  private sub: Subscription;
  protected readonly countries = getCountries();
  protected countryIsoCode: TuiCountryIsoCode = 'CN';
  protected value = '';
  showResendToken: boolean = false; // Initially hide the button
  isTermsOpen = false; // or control this as you like
  constructor(
    private net: ConnectionService,
    private platform: Platform,
    private router: Router,
    private networkService: NetworkService,
    private toast: HotToastService,
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
    this.getAuthToken();
  }
  ui_controls = {
    loading: false,
    registered: false,
    otpValidated: false,
    otpSent: false,
    termsArabic: true,
    termsEnglish: false
  };

  reset_p = {
    phone: "",
    password: "",
    confirm_password: ""
  };

  smsToken = {
    response_code: 0,
    status: "",
    message: "",
    data: ""
  };

  sendOTP = {
    token: "",
    number: ""
  };
  validateOtp = {
    token: "",
    verificationId: "",
    code: ""
  };

  r_response = {
    responseCode: 0,
    message: "",
    data: {
      verificationId: "",
      mobileNumber: "",
      responseCode: "",
      errorMessage: "",
      timeout: "",
      smCLI: "",
      transactionId: ""
    }
  }
  v_response = {
    responseCode: 0,
    message: "",
    data: {
      verificationId: "",
      mobileNumber: "",
      responseCode: "",
      errorMessage: "",
      verificationStatus: "",
      authToken: "",
      transactionId: ""
    }
  }
  reset_password() {
    if (this.reset_p.password.length === 0) {
      this.error_notification("Password is required");
      return;
    }
    if (this.reset_p.confirm_password.length === 0) {
      this.error_notification("Password does not match");
      return;
    }
    if (this.reset_p.password != this.reset_p.confirm_password) {
      this.error_notification("Password does not match");
      return;
    }
    this.ui_controls.loading = true;
    this.networkService.post_request(this.reset_p, GlobalComponent.UserReset)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.ui_controls.loading = false;
            this.success_notification(response.message);
            this.router.navigate(['/login']).then(r => console.log(r));
          }
        },
        error: (e) => {
          console.error(e);
          this.error_notification(e);
          this.ui_controls.loading = false;
        },
        complete: () => {
          console.info('complete');
        }
      }))
  }
  getAuthToken() {
    this.ui_controls.loading = true;
    this.networkService.get_request(GlobalComponent.getToken)
      .subscribe(({
        next: (response) => {
          if (response.response_code == 200 && response.status == "success") {
            this.smsToken = response;
            this.ui_controls.loading = false;
            console.log(this.smsToken)
          }
        },
        error: (e) => {
          console.error(e);
          this.error_notification(e);
          this.ui_controls.loading = false;
        },
        complete: () => {
          console.info('complete');
        }
      }))
  }
  send_otp() {
    if (this.reset_p.phone.length === 0) {
      this.error_notification("Phone number is required");
      return;
    }
    if (this.smsToken.data.length === 0) {
      this.error_notification("Request cannot be completed at this time");
      return;
    }
    this.sendOTP.number = this.reset_p.phone;
    this.sendOTP.token = this.smsToken.data;
    this.ui_controls.loading = true;
    this.networkService.post_request(this.sendOTP, GlobalComponent.sendOOTP)
      .subscribe(({
        next: (response) => {
          if (response.responseCode === 200 && response.message === "SUCCESS") {
            this.r_response = response;
            this.ui_controls.loading = false;
            this.ui_controls.otpSent = true;
            this.ui_controls.otpValidated = false;
            this.success_notification(response.message);
          }else{
            this.ui_controls.loading = false;
            this.ui_controls.otpSent = false;
            this.error_notification(response.message);
          }
        },
        error: (e) => {
          console.error(e);
          this.error_notification(e);
          this.ui_controls.loading = false;
        },
        complete: () => {
          console.info('complete');
        }
      }))
  }
  validate_otp() {
    if (this.validateOtp.code.length === 0) {
      this.error_notification("otp code is required to proceed.");
      return;
    }
    this.validateOtp.token = this.smsToken.data;
    this.validateOtp.verificationId = this.r_response.data.verificationId;
    this.ui_controls.loading = true;
    this.networkService.post_request(this.validateOtp, GlobalComponent.validateOTP)
      .subscribe(({
        next: (response) => {
          if (response.responseCode === 200 && response.message === "SUCCESS") {
            this.v_response = response;
            this.ui_controls.loading = false;
            this.ui_controls.otpValidated = true;
            this.success_notification("Code validated successfully");
          }else {
            this.ui_controls.loading = false;
            this.ui_controls.otpValidated = false;
            this.error_notification(response.message);
          }
        },
        error: (e) => {
          console.error(e);
          this.error_notification(e);
          this.ui_controls.loading = false;
        },
        complete: () => {
          console.info('complete');
        }
      }))
  }
  error_notification(message: string) {
    this.toast.error(message, {
      position: 'top-center'
    });
  }
  success_notification(message: string) {
    this.toast.success(message, {
      position: 'top-center'
    });
  }
  sign_in() {
    this.router.navigate(['/', 'login']).then(r => console.log(r));
  }
  user_register() {
    this.router.navigate(['/', 'register']).then(r => console.log(r));
  }

}
