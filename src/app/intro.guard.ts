import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';

/**
 * Guard that checks if intro has been seen
 * Use on the intro route to redirect already-onboarded users
 * 
 * Usage in routes:
 * {
 *   path: 'intro',
 *   loadComponent: () => import('./pages/intro/intro.page').then(m => m.IntroPage),
 *   canActivate: [introGuard]
 * }
 */
export const introGuard: CanActivateFn = async () => {
  const navCtrl = inject(NavController);
  
  try {
    const { value } = await Preferences.get({ key: 'intro_seen' });
    
    if (value === 'true') {
      // Already seen intro, redirect to home
      navCtrl.navigateRoot('/home', { animated: false });
      return false;
    }
    
    // First time user, show intro
    return true;
  } catch (e) {
    // On error, allow access to intro
    return true;
  }
};

/**
 * Guard that ensures intro has been completed before accessing app
 * Use on protected routes like /home to force intro completion
 * 
 * Usage in routes:
 * {
 *   path: 'home',
 *   loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
 *   canActivate: [introCompletedGuard]
 * }
 */
export const introCompletedGuard: CanActivateFn = async () => {
  const navCtrl = inject(NavController);
  
  try {
    const { value } = await Preferences.get({ key: 'intro_seen' });
    
    if (value !== 'true') {
      // Intro not completed, redirect to intro
      navCtrl.navigateRoot('/intro', { animated: false });
      return false;
    }
    
    // Intro completed, allow access
    return true;
  } catch (e) {
    // On error, redirect to intro to be safe
    navCtrl.navigateRoot('/intro', { animated: false });
    return false;
  }
};
