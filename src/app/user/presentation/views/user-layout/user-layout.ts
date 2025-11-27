import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { UserStore } from '../../../application/user.store';
import { UserStats } from '../user-stats/user-stats';
import { UserSettings } from '../user-settings/user-settings';
import { UserSection } from '../user-section/user-section';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [
    CommonModule,
    UserStats,
    UserSettings,
    UserSection
  ],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.css'
})
export class UserLayout implements OnInit {
  private readonly userStore = inject(UserStore);

  ngOnInit(): void {
    this.userStore.loadUsers();
  }
}

