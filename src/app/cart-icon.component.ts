import {Component, Input, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {TuiIcon} from "@taiga-ui/core";
import {Preferences} from "@capacitor/preferences";

@Component({
  selector: 'app-cart-icon',
  standalone: true,
  imports: [CommonModule, IonicModule, TuiIcon],
  template: `
    <button class="cart-wrapper" fill="clear" aria-label="Open cart">
      <tui-icon icon="@tui.shopping-cart" [style.color]="'var(--text)'" aria-hidden="true"></tui-icon>
      <span class="cart-badge" *ngIf="count && count > 0" [attr.aria-label]="count + ' items in cart'">
        {{ displayCount }}
      </span>
    </button>
  `,
  styles: [`
    .cart-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      height: 44px; /* adjust to match your header icon size */
      width: 44px;
    }
    /* badge */
    .cart-badge {
      position: absolute;
      top: 4px;      /* tweak to move up/down */
      right: 2px;    /* tweak to move left/right */
      transform: translate(25%, -25%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 6px;
      font-size: 11px;
      line-height: 1;
      border-radius: 999px;
      background: var(--ion-color-danger, #ef4444);
      color: #fff;
      font-weight: 600;
      box-shadow: 0 1px 2px rgba(0,0,0,0.25);
      pointer-events: none; /* lets clicks pass through to the button */
    }
    /* smaller screens / larger numbers adjustment */
    @media (max-width: 420px) {
      .cart-badge { font-size: 10px; min-width: 16px; height: 16px; padding: 0 5px; }
    }
  `]
})
export class CartIconComponent {
  /** number of items in cart */
  @Input() count = 3;
  /** Maximum number to show before displaying 'max+' */
  @Input() maxDisplay = 99;
  get displayCount(): string {
    if (!this.count || this.count <= 0) return '';
    return this.count > this.maxDisplay ? `${this.maxDisplay}+` : `${this.count}`;
  }
}
