import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';

export interface NavItem {
  icon: string;     // e.g. "home", "search", "cart"
  route?: string;   // optional route to navigate
  href?: string;    // optional external link
  badge?: string|number; // optional badge text
  ariaLabel?: string;    // accessibility label
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss']
})
export class BottomNavComponent implements OnInit, OnDestroy {
  @Input() items: NavItem[] = [
    { icon: 'assets/icon/home.svg', route: '/account', ariaLabel: 'Home' },
    { icon: 'assets/icon/explore.svg', route: '/explore', ariaLabel: 'Explore' },
    { icon: 'assets/icon/cart.svg', route: '/create', ariaLabel: 'Cart' },
    { icon: 'assets/icon/my_closet.svg', route: '/orders', ariaLabel: 'Orders' },
    { icon: 'assets/icon/profile.svg', route: '/settings', ariaLabel: 'Profile' }
  ];

  activeRoute = '';
  private sub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.activeRoute = this.router.url;
    this.sub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) this.activeRoute = ev.urlAfterRedirects;
    });
  }

  navTo(item: NavItem) {
    if (item.route) {
      this.router.navigateByUrl(item.route, {replaceUrl: false}).then(r =>console.log(r));
    } else if (item.href) {
      window.open(item.href, '_blank');
    }
  }

  isActive(item: NavItem) {
    if (!item.route) return false;
    // exact or prefix match (adjust as desired)
    return this.activeRoute === item.route || this.activeRoute.startsWith(item.route + '/');
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
