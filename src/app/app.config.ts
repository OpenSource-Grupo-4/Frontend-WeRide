import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideMapboxGL } from 'ngx-mapbox-gl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideMapboxGL({
      accessToken: 'pk.eyJ1IjoiamhpbXlwb29sIiwiYSI6ImNtZGY4cjVoMDBheHcyaXEzaDV5a2g4eGIifQ.QYmwDCEn26DEW-8RbIG2jg'
    })
  ]
};
