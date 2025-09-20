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
  IonSegmentButton, IonSegment, IonCheckbox, IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/angular/standalone';
import { ConnectionService } from '../../service/connection.service';
import {defer, Subscription} from 'rxjs';
import { CommonModule } from '@angular/common';
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
import {DIAL_CODES, DialCode} from '../../dial-codes';
import {TuiCountryIsoCode} from "@taiga-ui/i18n";
import {getCountries} from "libphonenumber-js";


@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonCol, IonGrid, IonRow, IonText, TuiButton, TuiIcon, TuiLabel, TuiPassword, TuiTextfieldComponent, TuiTextfieldDirective, TuiTextfieldOptionsDirective, TuiLoader, IonItem, IonLabel, IonButton, IonInput, IonIcon, IonList, IonToolbar, IonHeader, IonModal, IonTitle, IonSearchbar, IonButtons, IonSegmentButton, IonSegment, IonCheckbox, IonCard, IonCardHeader, IonCardTitle, IonCardContent]
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
  }
  ui_controls = {
    loading: false,
    registered: false
  };
  dialCodes: DialCode[] = DIAL_CODES;
  codeSearch = '';

  get selectedDial(): DialCode | undefined {
    return this.dialCodes.find(d => d.code === this.register.countryCode);
  }

  filteredDialCodes(): DialCode[] {
    const q = this.codeSearch.trim().toLowerCase();
    if (!q) return this.dialCodes;
    return this.dialCodes.filter(d =>
      d.name.toLowerCase().includes(q) || d.code.includes(q)
    );
  }

  selectCode(d: DialCode) {
    this.register.countryCode = d.code;
    this.codeSearch = '';
  }

// Optional: use when submitting
  get fullPhone(): string {
    return `${this.register.countryCode}${(this.register.phone || '').replace(/\D/g, '')}`;
  }
  // Toggle mode: 'email' or 'phone'
  registerMode: 'email' | 'phone' = 'email';
  register = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    countryCode: "+971",
    business_name: "",
    license_number: "",
    accepted_terms: false
  };
  confirm = {
    otp: "",
    input_otp: "",
    expires_at: 0,
    email: ""
  };
  send_otp_check = {
    first_name: "",
    email: ""
  };
  r_response = {
    otp: "",
    expires_at: 0
  };
  user_register() {
    this.ui_controls.loading = true;
    this.networkService.post_request(this.register, GlobalComponent.UserRegister)
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
  user_validate() {
    if (this.confirm.input_otp.length === 0) {
      this.error_notification("OTP is required");
      return;
    }
    this.ui_controls.loading = true;
    this.networkService.post_request(this.confirm, GlobalComponent.UserValidate)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.user_register();
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
    if (this.register.phone.length === 0) {
      this.error_notification("Phone number is required");
      return;
    }
    if (this.register.countryCode.length === 0) {
      this.error_notification("Country code is required");
      return;
    }
    if (!GlobalComponent.validateNumber(this.register.phone)) {
      this.error_notification("Invalid phone number format provided");
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
    this.send_otp_check.email = this.register.email;
    this.send_otp_check.first_name = this.register.first_name;
    this.ui_controls.loading = true;
    this.networkService.post_request(this.send_otp_check, GlobalComponent.EmailValidate)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.ui_controls.loading = false;
            this.ui_controls.registered = true;
            this.success_notification(response.message);
            this.r_response = response.data;
            this.confirm.otp = this.r_response.otp;
            this.confirm.expires_at = this.r_response.expires_at;
            this.confirm.email = this.register.email;
            setTimeout(() => {
              this.showResendToken = true;
            }, 30000);
          }
          if (response.response_code == 200 && response.status === "failed") {
            this.ui_controls.loading = false;
            this.error_notification(response.message);
          }
          if (response.response_code == 400 && response.status === "failed") {
            this.ui_controls.loading = false;
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
      position: 'bottom-center'
    });
  }
  success_notification(message: string) {
    this.toast.success(message, {
      position: 'bottom-center'
    });
  }
  sign_in() {
    this.router.navigate(['/', 'login']).then(r => console.log(r));
  }
  forgot_password() {
    this.router.navigate(['/', 'reset']).then(r => console.log(r));
  }

}
