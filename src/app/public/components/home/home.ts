import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { HeaderComponent } from '../header/header';

@Component({
  selector: 'app-home',
  imports: [
    RouterOutlet,
    SidebarComponent,
    HeaderComponent
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
