import { Component } from '@angular/core';
import {IonApp, IonRouterOutlet, Platform} from '@ionic/angular/standalone';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import {ActionPerformed, PushNotifications, PushNotificationSchema, Token} from "@capacitor/push-notifications";
import {ToastController} from "@ionic/angular";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  standalone: true
})
export class AppComponent {
  constructor(private platform: Platform,private toastCtrl: ToastController) {
      this.initializeApp();
      this.platform.ready().then(async () => {
          //  try {
          // await StatusBar.setOverlaysWebView({ overlay: false }); // push content below status bar
          // Optional:
          // await StatusBar.setStyle({ style: Style.Light });
          // await StatusBar.setBackgroundColor({ color: '#ffffff' });
      // } catch {}
      });
      this.initPush().then(r => console.log(r));
  }
  initializeApp() {
    ScreenOrientation.lock({orientation: 'portrait'}).then(r => console.log('ScreenOrientation loaded'));
  }
  async initPush() {
    try {
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive === 'granted') {
        await PushNotifications.register();
      } else {
        console.warn('Push permission denied:', perm);
        return;
      }
      await PushNotifications.addListener('registration', (token: Token) => {
        console.log('FCM token:', token.value);
        // send token to your server here
      });
      await PushNotifications.addListener('registrationError', (err) => {
        console.error('Push registration error:', err);
      });
      await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Received in foreground:', notification);
        /*        this.toastCtrl.create({
                  message: `Received: ${notification.title || ''}`,
                  duration: 3000
                }).then(t => t.present());*/
      });
      await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Action performed:', action);
      });
    } catch (e) {
      console.error('initPush error', e);
    }
  }
}
