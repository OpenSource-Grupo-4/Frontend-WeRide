import { Component } from '@angular/core';
import {GarageFilter} from '../garage-filter/garage-filter';
import {VehicleCard} from '../vehicle-card/vehicle-card';
import {MatCard, MatCardActions, MatCardContent, MatCardImage} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon-module.d';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-garage-layout',
  imports: [
    GarageFilter,
    VehicleCard,
    MatCard,
    MatCardContent,
    MatCardActions,
    MatIcon,
    MatButton,
    MatCardImage
  ],
  templateUrl: './garage-layout.html',
  styleUrl: './garage-layout.css'
})
export class GarageLayout {

}
