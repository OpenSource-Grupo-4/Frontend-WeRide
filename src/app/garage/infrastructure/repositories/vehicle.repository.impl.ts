import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleRepository } from '../../application/repositories/vehicle.repository';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VehicleRepositoryImpl implements VehicleRepository {
  private vehicles: Vehicle[] = [
    {
      id: 1,
      name: 'Scooter X',
      type: 'E-SCOOTER',
      brand: 'Xiaomi',
      available: true,
      rating: 4.5,
      price: 1200,
      imageUrl: 'assets/images/scooter.jfif',
      favorite: false
    },
    {
      id: 2,
      name: 'Moto Y',
      type: 'MOTO',
      brand: 'Honda',
      available: false,
      rating: 4.0,
      price: 2500,
      imageUrl: 'https://powersports.honda.com/motorcycle/scooter/-/media/products/scooter/2025/pcx/pcx-abs/2025-pcx-abs-matte-black.jpg',
      favorite: false
    },
    {
      id: 3,
      name: 'Bici Z',
      type: 'BICICLETA',
      brand: 'Trek',
      available: true,
      rating: 5.0,
      price: 800,
      imageUrl: 'https://trek.scene7.com/is/image/TrekBicycleProducts/Marlin8_23_35134_A_Primary?$responsive-pjpg$&cache=on,on&wid=1920&hei=1440',
      favorite: false
    },
    {
      id: 4,
      name: 'CSC Monterey',
      type: 'MOTO',
      brand: 'CSC',
      available: true,
      rating: 4.8,
      price: 3200,
      imageUrl: 'https://cscmotorcycles.com/product_images/uploaded_images/monterey-electric-scooter.jpg',
      favorite: false
    },
    {
      id: 5,
      name: 'Revv1 E-Bike',
      type: 'E-BIKE',
      brand: 'Ride1Up',
      available: true,
      rating: 4.7,
      price: 1800,
      imageUrl: 'https://ride1up.com/wp-content/uploads/2023/02/revv1-fs-moped-style-electric-bike.jpg',
      favorite: false
    },
    {
      id: 6,
      name: 'Bird Scooter',
      type: 'E-SCOOTER',
      brand: 'Bird',
      available: true,
      rating: 4.2,
      price: 950,
      imageUrl: 'https://i5.walmartimages.com/asr/0a6c2b8b-4f7d-4f3e-9b3a-8e7b4c8a6c8d.9f6f6f6f6f.jpeg',
      favorite: false
    }
  ];

  async findAll(): Promise<Vehicle[]> {
    return this.vehicles;
  }
}
