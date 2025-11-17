import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../application/auth.store';
import { DataInitService } from '../../../../core/services/data-init.service';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private dataInitService = inject(DataInitService);
  private apiService = inject(ApiService);

  dataLoaded = false;
  loadingMessage = 'Cargando datos de WeRide...';

  async ngOnInit(): Promise<void> {
    await this.dataInitService.initializeData();

    this.dataInitService.dataLoaded$.subscribe(loaded => {
      this.dataLoaded = loaded;
      if (loaded) {
        this.showSampleData();
      }
    });
  }

  private showSampleData(): void {
    const users = this.dataInitService.getUsers();
    const vehicles = this.dataInitService.getVehicles();
    const plans = this.dataInitService.getPlans();

    const availableVehicles = vehicles.filter(v => v.status === 'available');
  }

  navigateToPhoneLogin() {
    this.router.navigate(['/auth/phone-login']);
  }

  navigateToEmailLogin() {
    this.router.navigate(['/auth/email-login']);
  }

  loginWithGoogle() {
    //TODO : Implement Google login
  }

  loginAsGuest() {
    this.authStore.loginAsGuest();
    this.router.navigate(['/home']);
  }
}
