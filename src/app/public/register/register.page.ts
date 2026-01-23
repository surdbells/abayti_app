import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCol,
  IonGrid,
  IonRow,
  IonText,
  Platform,
  IonItem,
  IonLabel,
  IonButton,
  IonInput,
  IonIcon,
  IonList,
  IonModal,
  IonSearchbar,
  IonButtons,
  IonSegmentButton,
  IonSegment,
  IonCheckbox,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAccordionGroup,
  IonAccordion
} from '@ionic/angular/standalone';
import { ConnectionService } from '../../service/connection.service';
import {defer, Subscription} from 'rxjs';

import { FormsModule } from '@angular/forms';
import {
  TuiButton,
  TuiIcon,
  TuiLabel, TuiLoader,
  TuiTextfieldComponent,
  TuiTextfieldDirective,
  TuiTextfieldOptionsDirective
} from "@taiga-ui/core";
import {tuiInputPhoneInternationalOptionsProvider, TuiPassword, TuiSortCountriesPipe,} from "@taiga-ui/kit";
import {Router} from "@angular/router";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";
import {GlobalComponent} from "../../global-component";
import {TuiCountryIsoCode} from "@taiga-ui/i18n";
import {getCountries} from "libphonenumber-js";
import {TranslatePipe} from "../../translate.pipe";
import {Preferences} from "@capacitor/preferences";
import {BlockerService} from "../../blocker.service";


@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, IonCol, IonGrid, IonRow, IonText, TuiButton, TuiIcon, TuiLabel, TuiPassword, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, TuiLoader, IonItem, IonLabel, IonButton, IonInput, IonIcon, IonList, IonToolbar, IonHeader, IonModal, IonTitle, IonSearchbar, IonButtons, IonSegmentButton, IonSegment, IonCheckbox, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonAccordionGroup, IonAccordion, TranslatePipe]
})
export class RegisterPage implements OnInit, OnDestroy {
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
    private blocker: BlockerService,
    private router: Router,
    private networkService: NetworkService,
    private toast: HotToastService,
  ) {
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.blocker.block({ disableSwipe: true, disableHardwareBack: true });
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
  login = {
    email: "",
    password: ""
  };
  register = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    countryCode: "+971",
    accepted_terms: false
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
  user_register() {
    if (this.register.first_name.length === 0) {
      this.error_notification("First name is required");
      return;
    }
    if (this.register.last_name.length === 0) {
      this.error_notification("Last name is required");
      return;
    }
    if (this.register.email.length === 0) {
      this.error_notification("Email address is required");
      return;
    }
    if (!GlobalComponent.validateEmail(this.register.email)) {
      this.error_notification("Invalid email format provided");
      return;
    }

    if (this.register.password.length === 0) {
      this.error_notification("Password is required");
      return;
    }
    if (this.register.confirm_password.length === 0) {
      this.error_notification("Password does not match");
      return;
    }
    if (this.register.password != this.register.confirm_password) {
      this.error_notification("Password does not match");
      return;
    }
    if (!this.register.accepted_terms) {
      this.error_notification("Accept our terms and conditions to proceed");
      return;
    }
    this.ui_controls.loading = true;
    this.networkService.post_request(this.register, GlobalComponent.UserRegister)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.ui_controls.loading = false;
            this.success_notification(response.message);
            this.signIn();
          }else{
            this.error_notification(response.message);
            this.ui_controls.loading = false;
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
  signIn() {
      this.login.email = this.register.email;
      this.login.password = this.register.password;
      this.networkService.post_request(this.login, GlobalComponent.UserLogin)
        .subscribe(({
          next: (response) => {
            if (response.response_code === 200 && response.status === "success") {
              Preferences.set({
                key: 'user',
                value: JSON.stringify(response.data)
              }).then(r => console.log(r));
              this.router.navigate(['/account'], { replaceUrl: true });
              this.blocker.block({ disableSwipe: true, disableHardwareBack: true });
            }
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
    if (this.register.phone.length === 0) {
      this.error_notification("Phone number is required");
      return;
    }
    if (this.smsToken.data.length === 0) {
      this.error_notification("Request cannot be completed at this time");
      return;
    }
    this.sendOTP.number = this.register.phone;
    this.sendOTP.token = this.smsToken.data;
    this.ui_controls.loading = true;
    this.networkService.post_request(this.sendOTP, GlobalComponent.sendOTP)
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
  forgot_password() {
    this.router.navigate(['/', 'reset']).then(r => console.log(r));
  }
}
