/**
 * AxIconComponent — abayti's icon primitive.
 *
 * Thin wrapper around lucide-angular's <lucide-icon> with M2-aligned
 * token defaults: editorial stroke 1.5, size tokens xs/sm/md/lg/xl,
 * currentColor inheritance.
 *
 * Usage:
 *
 *   <ax-icon name="arrow-left"></ax-icon>
 *   <ax-icon name="shopping-bag" size="lg"></ax-icon>
 *   <ax-icon name="heart" [size]="28"></ax-icon>
 *   <ax-icon name="check" color="var(--ax-palette-success-500)"></ax-icon>
 *   <ax-icon name="alert-circle" strokeWidth="bold"></ax-icon>
 *
 * See docs/m4-icons-loader-skeleton-spec.md for design rationale.
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  AX_ICON_SIZES,
  AX_ICON_STROKES,
  type AxIconSize,
  type AxIconStrokeWidth,
} from './ax-icon.types';

@Component({
  selector: 'ax-icon',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lucide-icon
    [name]="name"
    [size]="resolvedSize"
    [strokeWidth]="resolvedStrokeWidth"
    [style.color]="color || null"
  ></lucide-icon>`,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
  `],
})
export class AxIconComponent {
  /** Lucide icon name (kebab-case). Required. */
  @Input({ required: true }) name!: string;

  /** Size token or numeric pixel value. Default 'md' (20px). */
  @Input() size: AxIconSize | number = 'md';

  /** Stroke width token or numeric. Default 'regular' (1.5). */
  @Input() strokeWidth: AxIconStrokeWidth | number = 'regular';

  /** Optional CSS color value. If omitted, inherits via currentColor. */
  @Input() color?: string;

  get resolvedSize(): number {
    return typeof this.size === 'number' ? this.size : AX_ICON_SIZES[this.size];
  }

  get resolvedStrokeWidth(): number {
    return typeof this.strokeWidth === 'number'
      ? this.strokeWidth
      : AX_ICON_STROKES[this.strokeWidth];
  }
}
