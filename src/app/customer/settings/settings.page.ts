import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonModal,
  NavController,
  Platform,
  ActionSheetController, IonFooter, IonTabBar, IonTabButton, IonLabel
} from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';
import { Subscription } from 'rxjs';

// Lucide Icons
import { LucideAngularModule } from 'lucide-angular';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Camera,
  Pencil,
  User,
  MapPin,
  Navigation,
  Ruler,
  ShoppingBag,
  Star,
  Sparkles,
  Globe,
  Bell,
  MessageCircle,
  Mail,
  Ticket,
  Trash2,
  LogOut,
  X,
  Check
} from 'lucide-angular';

import { ConnectionService } from '../../service/connection.service';
import { NetworkService } from '../../service/network.service';
import { GlobalComponent } from '../../global-component';
import { TranslatePipe } from '../../translate.pipe';
import { LanguageSwitcherComponent } from '../../language-switcher.component';
import { AxNotificationService } from '../../shared/ax-mobile/notification';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonModal,
    LucideAngularModule,
    TranslatePipe,
    LanguageSwitcherComponent,
    IonFooter,
    IonTabBar,
    IonTabButton,
    IonLabel
  ]
})
export class SettingsPage implements OnInit, OnDestroy {
  @ViewChild(IonModal) modal!: IonModal;

  // Lucide Icons
  icons = {
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
    sun: Sun,
    moon: Moon,
    camera: Camera,
    pencil: Pencil,
    user: User,
    mapPin: MapPin,
    navigation: Navigation,
    ruler: Ruler,
    shoppingBag: ShoppingBag,
    star: Star,
    sparkles: Sparkles,
    globe: Globe,
    bell: Bell,
    messageCircle: MessageCircle,
    mail: Mail,
    ticket: Ticket,
    trash2: Trash2,
    logOut: LogOut,
    x: X,
    check: Check
  };

  // State
  isOnline = true;
  isDarkMode = false;
  notificationsEnabled = true;
  private sub: Subscription;
  private backSub?: Subscription;

  ui_controls = {
    is_loading: false,
    updating_location: false
  };

  single_user = {
    id: 0,
    token: '',
    first_name: '',
    last_name: '',
    user_type: '',
    email: '',
    phone: '',
    avatar: '',
    location: '',
    delivery_address: '',
    is_2fa: false,
    is_active: false,
    is_admin: false,
    is_vendor: false,
    is_customer: false
  };

  u_location = {
    id: 0,
    token: '',
    location: ''
  };

  constructor(
    private router: Router,
    private platform: Platform,
    private nav: NavController,
    private actionSheetCtrl: ActionSheetController,
    private net: ConnectionService,
    private networkService: NetworkService,
    private toast: AxNotificationService
  ) {
    this.net.setReachabilityCheck(true);
    this.sub = this.net.online$.subscribe(v => this.isOnline = v);
  }

  ngOnInit(): void {
    this.loadUser();
    this.loadThemePreference();
    this.loadNotificationPreference();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.backSub?.unsubscribe();
  }

  ionViewDidEnter(): void {
    this.backSub = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.nav.navigateRoot('/account');
    });
  }

  ionViewWillLeave(): void {
    this.backSub?.unsubscribe();
  }

  async loadUser(): Promise<void> {
    const ret: any = await Preferences.get({ key: 'user' });
    if (!ret.value) {
      this.router.navigate(['/login']);
    } else {
      this.single_user = JSON.parse(ret.value);
      this.u_location.id = this.single_user.id;
      this.u_location.token = this.single_user.token;
      this.u_location.location = this.single_user.location;
    }
  }

  async loadThemePreference(): Promise<void> {
    const ret = await Preferences.get({ key: 'dark_mode' });
    this.isDarkMode = ret.value === 'true';
    this.applyTheme();
  }

  async loadNotificationPreference(): Promise<void> {
    const ret = await Preferences.get({ key: 'notifications_enabled' });
    this.notificationsEnabled = ret.value !== 'false';
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    Preferences.set({ key: 'dark_mode', value: String(this.isDarkMode) });
    this.applyTheme();
  }

  applyTheme(): void {
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }

  toggleNotifications(): void {
    Preferences.set({ key: 'notifications_enabled', value: String(this.notificationsEnabled) });
    this.showSuccess(this.notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled');
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/avatar-placeholder.jpg';
  }

  // Navigation Methods
  goBack(): void {
    this.nav.navigateBack('/account');
  }

  openProfile(): void {
    this.router.navigate(['/profile']);
  }

  openAddresses(): void {
    this.router.navigate(['/addresses']);
  }

  openMeasurement(): void {
    this.router.navigate(['/measurements']);
  }

  openReviews(): void {
    this.router.navigate(['/reviews']);
  }

  my_orders(): void {
    this.router.navigate(['/my-orders']);
  }

  user_styles(): void {
    this.router.navigate(['/styles']);
  }

  openTickets(): void {
    this.router.navigate(['/ticketlist']);
  }

  openHelp(): void {
    const phone = '971504559975';
    const msg = encodeURIComponent('Hello, I need assistance.');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_system');
  }

  OpenEmail(): void {
    const email = 'support@3bayti.com';
    window.open(`mailto:${email}`);
  }

  // Location Update
  async update_location(): Promise<void> {
    if (!this.isOnline) {
      this.showError('You are not online, check your connection');
      return;
    }

    if (!this.u_location.location.trim()) {
      this.showError('Location must be set');
      return;
    }

    this.ui_controls.updating_location = true;

    this.networkService.post_request(this.u_location, GlobalComponent.UpdateLocation)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === 'success') {
            this.single_user.location = this.u_location.location;
            Preferences.set({
              key: 'user',
              value: JSON.stringify(this.single_user)
            });
            this.ui_controls.updating_location = false;
            this.cancel();
            this.showSuccess(response.message);
          } else {
            this.ui_controls.updating_location = false;
            this.showError(response.message || 'Failed to update location');
          }
        },
        error: (e) => {
          console.error(e);
          this.ui_controls.updating_location = false;
          this.showError('Failed to update location');
        }
      });
  }

  cancel(): void {
    this.modal?.dismiss(null, 'cancel');
  }

  // Account Actions
  async signOut(): Promise<void> {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Are you sure you want to sign out?',
      buttons: [
        {
          text: 'Sign Out',
          role: 'destructive',
          handler: () => {
            Preferences.remove({ key: 'keep_session' });
            Preferences.remove({ key: 'user' });
            this.router.navigate(['/home']);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async confirmDelete(): Promise<void> {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Delete your account? This action cannot be undone.',
      buttons: [
        {
          text: 'Delete Account',
          role: 'destructive',
          handler: () => {
            this.showSuccess('Your account has been scheduled for removal');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  // Toast Messages
  showError(message: string): void {
    this.toast.error(message, { position: 'top-center' });
  }

  showSuccess(message: string): void {
    this.toast.success(message, { position: 'top-center' });
  }
}
