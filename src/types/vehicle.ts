// src/types/vehicle.ts

export interface Vehicle {
  id: string;
  plate: string;          // Örn: 34 ABC 123
  brand: string;          // Örn: Renault
  model: string;          // Örn: Megane
  year: number;           // Örn: 2020
  fuelType: 'gasoline' | 'diesel' | 'lpg' | 'electric' | 'hybrid';
  currentOdo: number;     // Güncel KM
}

export interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string;           // YYYY-MM-DD
  odometer: number;       // Alım anındaki KM
  liters: number;         // Alınan litre
  totalPrice: number;     // Toplam ödenen (TL)
  pricePerLiter: number;  // Birim fiyat
  isFullTank: boolean;    // Depo tam dolduruldu mu?
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  title: string;          // Örn: Periyodik Bakım (Yağ + Filtreler)
  date: string;           // YYYY-MM-DD
  odometer: number;       // Bakım anındaki KM
  cost: number;           // Maliyet (TL)
  nextDueOdo?: number;    // Sonraki bakım KM'si (Örn: +15.000 KM)
  nextDueDate?: string;   // Sonraki bakım tarihi
  notes?: string;
}