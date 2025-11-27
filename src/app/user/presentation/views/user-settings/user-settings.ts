import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.css'
})
export class UserSettings {

}
