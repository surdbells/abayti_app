import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { register } from 'swiper/element/bundle';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import {NG_EVENT_PLUGINS} from "@taiga-ui/event-plugins";
import {provideHttpClient} from "@angular/common/http";
import {provideHotToastConfig} from "@ngxpert/hot-toast";
import {I18nService} from "./app/i18n.service";
import {APP_INITIALIZER} from "@angular/core";
function initI18n(i18n: I18nService) {
  return () => i18n.init();
}
register();
bootstrapApplication(AppComponent, {
  providers: [ NG_EVENT_PLUGINS,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    { provide: APP_INITIALIZER, useFactory: initI18n, deps: [I18nService], multi: true },
    provideIonicAngular({ animated: false }),
    provideHttpClient(),
    provideHotToastConfig(),

    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
