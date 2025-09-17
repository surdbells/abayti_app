import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {Preferences} from "@capacitor/preferences";
import {IonicModule} from "@ionic/angular";
import {Platform} from "@ionic/angular/standalone";
import {BlockerService} from "../../blocker.service";

@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
  standalone: true,
  imports: [
    IonicModule
  ]
})
export class IntroPage implements OnInit, OnDestroy {
  constructor(
    private platform: Platform,
    private blocker: BlockerService,
    private router: Router
  ) {}
  ngOnInit() {
    this.blocker.block({ disableSwipe: true, disableHardwareBack: true });
    this.getObject().then(r => console.log(r));
  }
  ngOnDestroy(): void {
    this.blocker.unblock(); // ✅ restore when leaving
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
  async getObject() {
    setTimeout(async () => {
      const ret: any = await Preferences.get({key: 'user'});
      if (ret.value == null) {
        this.router.navigate(['/', 'login']).then(r => console.log(r));
      } else {
        this.single_user = JSON.parse(ret.value);
        this.router.navigate(['/', 'account']).then(r => console.log(r));
      }
    }, 1000); // 2000 milliseconds = 2 seconds

  }
}
