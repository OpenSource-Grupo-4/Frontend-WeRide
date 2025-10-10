import { Component } from "@angular/core";
import { AppMapComponent } from "../../share/map-component/presentation/app-map-component";
import { MobilityOptionsComponent } from "../../Main/presentation/mobility-options-component/mobility-options-component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";


@Component({
    selector: 'app-home-component',
    imports: [
        AppMapComponent, 
        MobilityOptionsComponent,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule
    ],
    templateUrl: 'home-component.html',
    styleUrl: 'home-component.css'
})
export class HomeComponent {

}