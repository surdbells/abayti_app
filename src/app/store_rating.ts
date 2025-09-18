// File: store_rating.ts

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-store-rating',
  template: `
    <div class="store-box">
      <div class="name">{{ name }}</div>
      <div class="rating">⭐ {{ rating }} ({{ ratingsCount }} ratings)</div>
    </div>
  `,
  standalone: true,
  styles: [`
    .store-box {
      border-radius: 12px;
      padding: 18px 12px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
      border: 1px solid rgba(255, 255, 255, 0.3);
      max-width: 100%;
    }

    .name {
      font-weight: 700;
      font-size: 16px;
    }

    .rating {
      font-size: 14px;
      color: #444;
    }
  `]
})
export class StoreRatingSimpleComponent {
  @Input() name: string = 'Store Name';
  @Input() rating: number = 0;
  @Input() ratingsCount: number | string = '0+';
}
