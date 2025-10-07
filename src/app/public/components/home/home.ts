import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { HeaderComponent } from '../header/header';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  toggleSidebar() {
    // Sidebar toggle logic can be implemented here if needed
    console.log('Sidebar toggle requested');
  }
}
