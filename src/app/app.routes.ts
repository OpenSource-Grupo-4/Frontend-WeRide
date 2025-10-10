import { Routes } from '@angular/router';
import { MobilityOptionsComponent } from './Main/presentation/mobility-options-component/mobility-options-component';
import { HomeComponent } from './pages/home/home-component';
import { TravelInformationComponent } from './travel/presentation/travel information/travel-information';

export const routes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
    },
    {
        path: 'mobility',
        component: MobilityOptionsComponent
    },
    {
        path: 'travel',
        component: TravelInformationComponent
    }
];
