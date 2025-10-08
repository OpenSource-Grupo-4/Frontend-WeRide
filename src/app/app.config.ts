import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideMapboxGL } from 'ngx-mapbox-gl';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideMapboxGL({
      accessToken: 'pk.eyJ1IjoiamhpbXlwb29sIiwiYSI6ImNtZGY4cjVoMDBheHcyaXEzaDV5a2g4eGIifQ.QYmwDCEn26DEW-8RbIG2jg'
    })
  ]
};
