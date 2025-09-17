import { Component, ElementRef, Input, ViewChild, AfterViewInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-content-box',
  templateUrl: './content-box.component.html',
  styleUrls: ['./content-box.component.scss'],
  standalone: true,
  // If you use standalone components in your project, you can add `standalone: true` and imports.
})
export class ContentBoxComponent implements AfterViewInit {
  @Input() title = '';
  @Input() description = '';

  @ViewChild('desc', { static: true }) descEl!: ElementRef<HTMLElement>;
  @ViewChild('box', { static: true }) boxEl!: ElementRef<HTMLElement>;

  expanded = false;
  showToggle = false;

  constructor(private renderer: Renderer2, private host: ElementRef) {}

  ngAfterViewInit(): void {
    // Measure if description needs "Read more"
    this.showToggle = this.needsToggle();
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    // Set aria-expanded on the box for accessibility (optional)
    this.renderer.setAttribute(this.boxEl.nativeElement, 'aria-expanded', String(this.expanded));
  }

  private needsToggle(): boolean {
    const desc = this.descEl.nativeElement;

    // Create a hidden clone that has no clamp so we can measure full height reliably
    const clone = this.renderer.createElement('div') as HTMLElement;
    this.renderer.setStyle(clone, 'position', 'absolute');
    this.renderer.setStyle(clone, 'visibility', 'hidden');
    this.renderer.setStyle(clone, 'white-space', 'normal');
    this.renderer.setStyle(clone, 'width', `${desc.clientWidth}px`);
    // copy font styles that affect layout
    const cs = getComputedStyle(desc);
    this.renderer.setStyle(clone, 'font', cs.font);
    this.renderer.setStyle(clone, 'line-height', cs.lineHeight);
    this.renderer.setStyle(clone, 'padding', cs.padding);
    this.renderer.setProperty(clone, 'innerText', this.description || '');

    // append to same offsetParent to get accurate width/rendering
    const parent = desc.offsetParent as HTMLElement || document.body;
    this.renderer.appendChild(parent, clone);

    const lineHeight = parseFloat(getComputedStyle(desc).lineHeight || '0');
    const fullHeight = clone.scrollHeight;
    const twoLineHeight = lineHeight * 2;

    // cleanup
    this.renderer.removeChild(parent, clone);

    return fullHeight > (twoLineHeight + 1); // small tolerance
  }
}
