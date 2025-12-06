
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataInitService } from '../../../../core/services/data-init.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private dataInitService = inject(DataInitService);
  private translate = inject(TranslateService);

  dataLoaded = false;
  loadingMessage = '';

  async ngOnInit(): Promise<void> {
    this.translate.get('auth.login.loadingMessage').subscribe(msg => {
      this.loadingMessage = msg;
    });

    this.dataInitService.dataLoaded$.subscribe(loaded => {
      this.dataLoaded = loaded;
    });
  }

  navigateToLogin() {
    this.router.navigate(['/auth/email-login']);
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
