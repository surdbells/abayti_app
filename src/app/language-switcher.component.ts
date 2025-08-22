import { Component, inject } from '@angular/core';
import { NgFor, AsyncPipe } from '@angular/common';
import { I18nService, LangCode } from './i18n.service';
import { IonicModule } from '@ionic/angular';
import {TranslatePipe} from "./translate.pipe";

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [IonicModule, NgFor, AsyncPipe, TranslatePipe],
  template: `
    <ion-item lines="none" class="lang-item">
      <ion-label class="ion-padding-horizontal">{{ 'language' | translate }}</ion-label>

      <ion-select
        interface="popover"
        justify="space-between"
        [value]="i18n.lang"
        (ionChange)="select($any($event.detail.value))">

        <ion-select-option *ngFor="let l of langs" [value]="l.code">
          {{ l.flag }} {{ l.label }} ({{ l.native }})
        </ion-select-option>

      </ion-select>
    </ion-item>
  `,
  styles: [`
    .lang-item {
      --padding-start: 0;
      min-width: 12rem;
    }
    :host-context(html[dir="rtl"]) .lang-item {
      direction: rtl;
      text-align: right;
    }
  `]
})
export class LanguageSwitcherComponent {
  i18n = inject(I18nService);

  langs = [
    { code: 'en' as LangCode, label: 'English', native: 'English', flag: '🇺🇸' },
    { code: 'ar' as LangCode, label: 'Arabic',  native: 'العربية', flag: '🇦🇪' }
  ];

  select(code: LangCode) {
    this.i18n.use(code);
  }
}
