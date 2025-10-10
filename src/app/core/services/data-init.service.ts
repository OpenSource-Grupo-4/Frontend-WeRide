import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { UserService } from './user.service';
import { VehicleService } from './vehicle.service';
import { PlanService } from './plan.service';
import { LocationService } from './location.service';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DataInitService {
  private dataLoadedSubject = new BehaviorSubject<boolean>(false);
  public dataLoaded$ = this.dataLoadedSubject.asObservable();

  constructor(
    private userService: UserService,
    private vehicleService: VehicleService,
    private planService: PlanService,
    private locationService: LocationService,
    private apiService: ApiService
  ) {}

  async initializeData(): Promise<void> {
    try {
      console.log('Cargando datos iniciales de WeRide API...');
      
      const loadRequests = forkJoin({
        users: this.userService.loadUsers(),
        vehicles: this.vehicleService.loadVehicles(),
        plans: this.planService.loadPlans(),
        locations: this.locationService.loadLocations(),
        companies: this.apiService.getCompanies()
      });

      const results = await loadRequests.toPromise();

      console.log('Datos cargados exitosamente:', {
        users: results?.users?.length || 0,
        vehicles: results?.vehicles?.length || 0,
        plans: results?.plans?.length || 0,
        locations: results?.locations?.length || 0,
        companies: results?.companies?.length || 0
      });

      this.dataLoadedSubject.next(true);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      this.dataLoadedSubject.next(false);
    }
  }

  getUsers() { 
    return this.userService.getCachedUsers(); 
  }

  getVehicles() { 
    return this.vehicleService.getCachedVehicles(); 
  }

  getPlans() { 
    return this.planService.getCachedPlans(); 
  }

  getLocations() { 
    return this.locationService.getCachedLocations(); 
  }

  getAvailableVehicles() {
    return this.vehicleService.getAvailableVehicles();
  }

  getVehiclesByCompany(companyId: string) {
    return this.vehicleService.getVehiclesByCompany(companyId);
  }

  getUserById(id: string) {
    return this.userService.findUserById(id);
  }

  getVehicleById(id: string) {
    return this.vehicleService.findVehicleById(id);
  }

  getPlanById(id: string) {
    return this.planService.findPlanById(id);
  }
}