import { Component } from '@angular/core';
import {IonApp, IonRouterOutlet, Platform} from '@ionic/angular/standalone';
import { App as CapacitorApp } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';
import {ActionPerformed, PushNotifications, PushNotificationSchema, Token} from "@capacitor/push-notifications";
import {ToastController} from "@ionic/angular";
import {fadeTransition} from "../fade.transition";
import {AxNotificationHostComponent} from "./shared/ax-mobile/notification";
import {AxUpdatePromptComponent} from "./shared/ax-mobile/update-prompt";
import {AppUpdateService} from "./service/app-update.service";
import {I18nService} from "./i18n.service";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, AxNotificationHostComponent, AxUpdatePromptComponent],
  standalone: true
})
export class AppComponent {
  fadeTransition = fadeTransition;

  /* Force-update prompt state. Driven by AppUpdateService.check() — the
     service runs on app launch and on every resume from background, so
     a kill-switch flip will activate the prompt within at most 5 minutes
     (the in-memory remote-config cache window) for already-running apps,
     or immediately for cold launches. */
  showForceUpdate = false;
  forceUpdateTitle = '';
  forceUpdateMessage = '';
  forceUpdateVersionLabel = '';
  forceUpdateButton = '';
  /* Soft-prompt mode: shows a Later button, dismisses for 24h per
     version. Driven by remote config force_mode. Default false (hard). */
  forceUpdateCanDismiss = false;
  forceUpdateLaterLabel = '';
  /* Tracked so onDismissed() knows which version's dismissal to record. */
  private currentPromptVersion: string | null = null;

  constructor(
    private platform: Platform,
    private toastCtrl: ToastController,
    private appUpdate: AppUpdateService,
    private i18n: I18nService,
  ) {
      this.initializeApp();
      this.platform.ready().then(async () => {
          // Dismiss the native splash now that Angular has bootstrapped
          // and platform.ready() has resolved. The 200ms fade hands off
          // to the canvas-color #faf8f5 body bg (set inline in
          // src/index.html — see M29) so there is no visible flash.
          try {
            await SplashScreen.hide({ fadeOutDuration: 200 });
          } catch (e) {
            // Plugin not available (e.g. web build) — safe to ignore.
            console.warn('SplashScreen.hide failed:', e);
          }

          /* Run an update check on cold launch. Failing-safe — if the
             service fails for any reason, no prompt shows. */
          this.runUpdateCheck();

          /* Re-check whenever the app resumes from background. Important
             for users who keep the app suspended for hours/days while a
             new release ships. The plugin's internal cache + our 5-minute
             in-memory cache prevent excessive API hits on rapid switches. */
          CapacitorApp.addListener('appStateChange', (state) => {
            if (state.isActive) {
              this.runUpdateCheck();
            }
          });
      });
      this.initPush();
  }

  initializeApp() {
    ScreenOrientation.lock({orientation: 'portrait'}).then(r => console.log('ScreenOrientation loaded'));
  }

  /* Run AppUpdateService.check() and update local UI state.
     Always async, never throws — the service handles errors internally. */
  private async runUpdateCheck(): Promise<void> {
    try {
      const result = await this.appUpdate.check();
      if (result.shouldForceUpdate) {
        const isArabic = this.i18n.lang === 'ar';
        this.forceUpdateTitle = this.i18n.t('update_available_title');
        this.forceUpdateMessage = isArabic ? result.messageAr : result.messageEn;
        this.forceUpdateButton = this.i18n.t('update_now');
        this.forceUpdateVersionLabel = result.availableVersion
          ? this.i18n.t('update_available_version', { version: result.availableVersion })
          : '';
        this.forceUpdateCanDismiss = result.canDismiss;
        this.forceUpdateLaterLabel = result.canDismiss ? this.i18n.t('update_later') : '';
        this.currentPromptVersion = result.availableVersion;
        this.showForceUpdate = true;
      }
      /* Note: we don't auto-dismiss here when shouldForceUpdate becomes
         false. Once the prompt is up, it stays until the user updates
         (which restarts the app from scratch). If the kill-switch is
         flipped off remotely, the next cold launch won't show it — which
         is the right behavior. */
    } catch {
      /* Failing safe: any unexpected error keeps the prompt hidden. */
    }
  }

  /* Tapped "Update now" in the prompt. Hand off to the service which
     either triggers in-app update flow (Android, when supported) or
     opens the store listing (iOS or Android fallback). */
  async onUpdateClicked(): Promise<void> {
    await this.appUpdate.startUpdate();
  }

  /* Tapped "Later" in the prompt (only emitted in soft-prompt mode).
     Record the dismissal so the user gets a 24h grace window for this
     specific version, then hide the prompt. */
  async onDismissed(): Promise<void> {
    if (this.currentPromptVersion) {
      await this.appUpdate.markDismissed(this.currentPromptVersion);
    }
    this.showForceUpdate = false;
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
        this.toastCtrl.create({
          message: `Received: ${notification.title || ''}`,
          duration: 3000
        }).then(t => t.present());
      });
      await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Action performed:', action);
      });
    } catch (e) {
      console.error('initPush error', e);
    }
  }
}
