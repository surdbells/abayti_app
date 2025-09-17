import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'intro', pathMatch: 'full' },
  { path: 'start', loadComponent: () => import('./start/start.page').then(m => m.StartPage) },
  {
    path: 'login',
    loadComponent: () => import('./public/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./public/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'reset',
    loadComponent: () => import('./public/reset/reset.page').then( m => m.ResetPage)
  },
  {
    path: 'account',
    loadComponent: () => import('./customer/account/account.page').then( m => m.AccountPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./customer/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./customer/wishlist/wishlist.page').then( m => m.WishlistPage)
  },
  {
    path: 'messages',
    loadComponent: () => import('./customer/messages/messages.page').then( m => m.MessagesPage)
  },
  {
    path: 'vertican',
    loadComponent: () => import('./customer/explore/explore.page').then( m => m.ExplorePage)
  },
  {
    path: 'cart',
    loadComponent: () => import('./customer/cart/cart.page').then( m => m.CartPage)
  },
  {
    path: 'measurements',
    loadComponent: () => import('./customer/measurements/measurements.page').then( m => m.MeasurementsPage)
  },
  {
    path: 'orders',
    loadComponent: () => import('./customer/orders/orders.page').then(m => m.OrdersPage)
  },
  {
    path: 'reviews',
    loadComponent: () => import('./customer/reviews/reviews.page').then( m => m.ReviewsPage)
  },
  {
    path: 'addresses',
    loadComponent: () => import('./customer/addresses/addresses.page').then( m => m.AddressesPage)
  },
  {
    path: 'start',
    loadComponent: () => import('./start/start.page').then( m => m.StartPage)
  },
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.page').then( m => m.WelcomePage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./customer/profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'product',
    loadComponent: () => import('./customer/product/product.page').then( m => m.ProductPage)
  },
  {
    path: 'search',
    loadComponent: () => import('./customer/search/search.page').then( m => m.SearchPage)
  },
  {
    path: 'conversations',
    loadComponent: () => import('./customer/conversations/conversations.page').then(m => m.ConversationsPage)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./customer/checkout/checkout.page').then(m => m.CheckoutPage)
  },
  {
    path: 'intro',
    loadComponent: () => import('./public/intro/intro.page').then( m => m.IntroPage)
  },
  {
    path: 'vendors',
    loadComponent: () => import('./customer/vendors/vendors.page').then( m => m.VendorsPage)
  },
  {
    path: 'explore',
    loadComponent: () => import('./customer/vertican/vertican.page').then( m => m.VerticanPage)
  },
];
