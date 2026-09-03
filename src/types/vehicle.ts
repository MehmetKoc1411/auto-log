// src/types/vehicle.ts

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  fuelType: 'gasoline' | 'diesel' | 'gasoline_lpg' | 'electric' | 'hybrid';
  currentOdo: number;
}

export interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  liters: number;
  totalPrice: number;
  pricePerLiter: number;
  isFullTank: boolean;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  title: string;
  date: string;
  odometer: number;
  cost: number;
  nextDueOdo?: number;
  nextDueDate?: string;
  notes?: string;
}