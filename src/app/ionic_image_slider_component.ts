/*
  Single-file drop-in Ionic (Angular) image slider component
  - No external packages
  - Drop this file into your Ionic Angular project (e.g. src/app/components/)
  - Add the component to your module declarations (or put it in a shared module)

  Usage:
    <app-image-slider [product]="product"></app-image-slider>
  or
    <app-image-slider [images]="product.images" [direction]="'vertical' | 'horizontal'"></app-image-slider>

  Notes:
  - Keeps ion-img for Ionic lazy loading.
  - Supports toggling direction programmatically via @Input() direction: 'horizontal'|'vertical'
  - Thumbnails auto-sync with main slides.
*/

import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';

@Component({
  selector: 'app-image-slider',
  template: `
    <div class="ais-wrapper">
      <div class="ais-controls">
        <ion-button size="small" fill="outline" (click)="toggleDirection()">
          Switch to {{ direction === 'vertical' ? 'horizontal' : 'vertical' }}
        </ion-button>
        <ion-button size="small" fill="clear" (click)="prev()">Prev</ion-button>
        <ion-button size="small" fill="clear" (click)="next()">Next</ion-button>
      </div>

      <div
        #slidesContainer
        class="ais-slides-container"
        [class.vertical]="direction === 'vertical'"
        role="region"
        aria-label="Product images"
        tabindex="0"
      >
        <div
          class="ais-slide"
          *ngFor="let img of images; let i = index"
          [attr.data-index]="i"
          [class.active]="i === activeIndex"
        >
          <ion-img [src]="img" [alt]="product?.product_name || ('image ' + (i+1))" class="ais-main-image"></ion-img>
        </div>
      </div>

      <div class="ais-thumbs" *ngIf="images?.length">
        <div
          class="ais-thumb"
          *ngFor="let img of images; let i = index"
          (click)="goTo(i)"
          [class.active]="i === activeIndex"
          role="button"
          tabindex="0"
          (keydown.enter)="goTo(i)"
        >
          <ion-img [src]="img" [alt]="'thumb ' + (i+1)"></ion-img>
        </div>
      </div>
    </div>
  `,
  styles: [
    `:host { display:block; }
    .ais-wrapper { --thumb-size:72px; --main-height:360px; }
    .ais-controls { display:flex; gap:8px; align-items:center; margin-bottom:8px; }

    .ais-slides-container{ display:flex; overflow:auto; scroll-behavior:smooth; -webkit-overflow-scrolling:touch; scroll-snap-type:x mandatory; gap:8px; height:var(--main-height); border-radius:8px; background:#fff; padding:8px; }
    .ais-slides-container.vertical{ flex-direction:column; scroll-snap-type:y mandatory; height:calc(var(--main-height) + 40px); }

    .ais-slide{ flex:0 0 100%; scroll-snap-align:center; display:flex; align-items:center; justify-content:center; min-width:100%; min-height:100%; border-radius:6px; overflow:hidden; background:#f6f6f6; position:relative; }
    .ais-slides-container.vertical .ais-slide{ min-height:var(--main-height); min-width:100%; }

    .ais-main-image{ width:100%; height:100%; object-fit:cover; }

    .ais-thumbs{ display:flex; gap:8px; margin-top:10px; overflow-x:auto; padding-bottom:6px; }
    .ais-thumb{ width:var(--thumb-size); height:var(--thumb-size); border-radius:6px; overflow:hidden; flex:0 0 auto; cursor:pointer; border:2px solid transparent; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
    .ais-thumb ion-img, .ais-thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
    .ais-thumb.active{ border-color:var(--ion-color-primary, #3880ff); transform:scale(1.03); }
    .ais-slide.active{ box-shadow:0 6px 18px rgba(0,0,0,0.08); }
    `
  ]
})
export class ImageSliderComponent implements AfterViewInit, OnDestroy {
  /** Provide either product (with image_1..image_N or images[]) or images[] directly */
  @Input() product: any | null = null;
  @Input() images: string[] | null = null;
  /** 'horizontal' (default) or 'vertical' */
  @Input() direction: 'horizontal' | 'vertical' = 'horizontal';

  @ViewChild('slidesContainer', { static: true }) slidesContainer!: ElementRef<HTMLElement>;

  activeIndex = 0;

  private observer?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;

  constructor(private cd: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    // build images from product if images input not given
    if (!this.images || !this.images.length) this.buildImagesFromProduct();
    // ensure DOM has rendered slides before observing
    setTimeout(() => this.setupObservers(), 40);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
  }

  private buildImagesFromProduct() {
    if (!this.product) { this.images = []; return; }
    if (Array.isArray(this.product.images) && this.product.images.length) {
      this.images = this.product.images.filter(Boolean);
      return;
    }
    const imgs: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const key = `image_${i}`;
      if (this.product[key]) imgs.push(this.product[key]);
    }
    this.images = imgs;
  }

  private setupObservers() {
    const container = this.slidesContainer.nativeElement;
    if (!container) return;

    // IntersectionObserver to update activeIndex based on visibility
    this.observer = new IntersectionObserver((entries) => {
      let bestIdx = this.activeIndex;
      let bestRatio = 0;
      entries.forEach(entry => {
        const idx = Number((entry.target as HTMLElement).dataset.index);
        if (entry.intersectionRatio > bestRatio) { bestRatio = entry.intersectionRatio; bestIdx = idx; }
      });
      if (bestIdx !== this.activeIndex) {
        this.activeIndex = bestIdx;
        this.cd.detectChanges();
        this.ensureThumbInView();
      }
    }, { root: container, threshold: Array.from({length:21}, (_,i)=>i/20) });

    container.querySelectorAll('.ais-slide').forEach(el => this.observer!.observe(el));

    this.resizeObserver = new ResizeObserver(() => this.scrollTo(this.activeIndex, false));
    this.resizeObserver.observe(container);

    // initial ensure
    this.scrollTo(this.activeIndex, false);
  }

  toggleDirection() {
    this.direction = this.direction === 'vertical' ? 'horizontal' : 'vertical';
    // after layout change, ensure active slide visible
    setTimeout(() => this.scrollTo(this.activeIndex, false), 80);
  }

  goTo(index: number) { this.scrollTo(index, true); }
  next() { if (!this.images) return; this.goTo(Math.min(this.activeIndex + 1, this.images.length - 1)); }
  prev() { this.goTo(Math.max(this.activeIndex - 1, 0)); }

  private scrollTo(index: number, smooth = true) {
    const container = this.slidesContainer.nativeElement;
    const slide = container.querySelector<HTMLElement>(`.ais-slide[data-index=\"${index}\"]`);
    if (!slide) return;

    slide.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: this.direction === 'vertical' ? 'center' : 'nearest', inline: this.direction === 'vertical' ? 'nearest' : 'center' });
    this.activeIndex = index;
    this.cd.detectChanges();
    this.ensureThumbInView();
  }

  private ensureThumbInView() {
    // auto-center active thumbnail if possible
    try {
      const wrapper = (this.slidesContainer.nativeElement.parentElement as HTMLElement);
      const thumbs = wrapper.querySelector('.ais-thumbs') as HTMLElement | null;
      if (!thumbs) return;
      const activeThumb = thumbs.querySelector('.ais-thumb.active') as HTMLElement | null;
      if (!activeThumb) return;
      const margin = (thumbs.clientWidth - activeThumb.clientWidth) / 2;
      const left = activeThumb.offsetLeft - margin;
      thumbs.scrollTo({ left, behavior: 'smooth' });
    } catch (e) { /* ignore */ }
  }

  // keyboard navigation support
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(ev: KeyboardEvent) {
    if (this.direction === 'vertical') {
      if (ev.key === 'ArrowDown') this.next();
      else if (ev.key === 'ArrowUp') this.prev();
    } else {
      if (ev.key === 'ArrowRight') this.next();
      else if (ev.key === 'ArrowLeft') this.prev();
    }
  }
}
