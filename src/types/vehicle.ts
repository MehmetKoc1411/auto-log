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
  liters: number;           // Elektrikli araçlarda kWh değerini tutar
  totalPrice: number;       // Toplam harcama (₺)
  pricePerLiter: number;    // ₺/L veya ₺/kWh
  isFullTank: boolean;      // Tam dolum / %100 Şarj
  chargeType?: 'AC' | 'DC'; // Elektrikli araçlar için şarj tipi
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