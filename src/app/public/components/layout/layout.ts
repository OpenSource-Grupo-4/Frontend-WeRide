import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { HeaderComponent } from '../header/header';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class LayoutComponent {
  sidebarCollapsed = window.matchMedia('(max-width: 768px)').matches;

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
