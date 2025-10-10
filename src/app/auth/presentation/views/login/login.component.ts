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
    console.log('LoginComponent iniciado - Cargando datos automaticamente...');
    
    await this.dataInitService.initializeData();

    this.dataInitService.dataLoaded$.subscribe(loaded => {
      this.dataLoaded = loaded;
      if (loaded) {
        this.loadingMessage = 'Datos cargados exitosamente';
        console.log('Datos disponibles en el componente de login');
        this.showSampleData();
      } else {
        this.loadingMessage = 'Error cargando datos. Reintentando...';
      }
    });
  }

  private showSampleData(): void {
    const users = this.dataInitService.getUsers();
    const vehicles = this.dataInitService.getVehicles();
    const plans = this.dataInitService.getPlans();

    console.log('Usuarios disponibles:', users.length);
    console.log('Vehiculos disponibles:', vehicles.length);
    console.log('Planes disponibles:', plans.length);

    const availableVehicles = vehicles.filter(v => v.status === 'available');
    console.log('Vehiculos disponibles ahora:', availableVehicles.length);
  }

  navigateToPhoneLogin() {
    this.router.navigate(['/auth/phone-login']);
  }

  navigateToEmailLogin() {
    this.router.navigate(['/auth/email-login']);
  }

  loginWithGoogle() {
    console.log('Login with Google');
  }

  loginAsGuest() {
    this.authStore.loginAsGuest();
    this.router.navigate(['/home']);
  }
}
