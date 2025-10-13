import { Component } from '@angular/core';
import {IonApp, IonRouterOutlet, Platform} from '@ionic/angular/standalone';
import { ScreenOrientation } from '@capacitor/screen-orientation';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  standalone: true
})
export class AppComponent {
  constructor(private platform: Platform) {
      this.initializeApp();
      this.platform.ready().then(async () => {
          //  try {
          // await StatusBar.setOverlaysWebView({ overlay: false }); // push content below status bar
          // Optional:
          // await StatusBar.setStyle({ style: Style.Light });
          // await StatusBar.setBackgroundColor({ color: '#ffffff' });
      // } catch {}
      });
  }
  initializeApp() {
    ScreenOrientation.lock({orientation: 'portrait'}).then(r => console.log('ScreenOrientation loaded'));
  }
}
