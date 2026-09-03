// src/services/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, FuelEntry, ServiceRecord } from '../types/vehicle';

const VEHICLES_KEY = '@autolog_vehicles';
const ACTIVE_VEHICLE_KEY = '@autolog_active_vehicle_id';
const FUEL_KEY = '@autolog_fuel_entries';
const SERVICE_KEY = '@autolog_service_records';

// --- ARAÇ İŞLEMLERİ ---
export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const data = await AsyncStorage.getItem(VEHICLES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('getVehicles error:', e);
    return [];
  }
};

export const saveVehicle = async (vehicle: Vehicle): Promise<Vehicle[]> => {
  try {
    const list = await getVehicles();
    const updated = [...list, vehicle];
    await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
    if (list.length === 0) {
      await setActiveVehicleId(vehicle.id);
    }
    return updated;
  } catch (e) {
    console.error('saveVehicle error:', e);
    return [];
  }
};

export const getActiveVehicleId = async (): Promise<string | null> => {
  try {
    const id = await AsyncStorage.getItem(ACTIVE_VEHICLE_KEY);
    if (id) return id;
    const list = await getVehicles();
    if (list.length > 0) {
      await AsyncStorage.setItem(ACTIVE_VEHICLE_KEY, list[0].id);
      return list[0].id;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const setActiveVehicleId = async (id: string): Promise<void> => {
  await AsyncStorage.setItem(ACTIVE_VEHICLE_KEY, id);
};

export const updateVehicleOdo = async (vehicleId: string, newOdo: number): Promise<void> => {
  const list = await getVehicles();
  const updated = list.map((v) => (v.id === vehicleId && newOdo > v.currentOdo ? { ...v, currentOdo: newOdo } : v));
  await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
};

// --- YAKIT İŞLEMLERİ & HESAPLAMA ---
export const getFuelEntries = async (vehicleId: string): Promise<FuelEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(FUEL_KEY);
    const all: FuelEntry[] = data ? JSON.parse(data) : [];
    return all.filter((f) => f.vehicleId === vehicleId).sort((a, b) => b.odometer - a.odometer);
  } catch (e) {
    return [];
  }
};

export const addFuelEntry = async (entry: FuelEntry): Promise<FuelEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(FUEL_KEY);
    const all: FuelEntry[] = data ? JSON.parse(data) : [];
    const updated = [entry, ...all];
    await AsyncStorage.setItem(FUEL_KEY, JSON.stringify(updated));
    await updateVehicleOdo(entry.vehicleId, entry.odometer);
    return updated.filter((f) => f.vehicleId === entry.vehicleId);
  } catch (e) {
    return [];
  }
};

// Ortalama tüketim hesabı (L / 100 km)
export const calculateAverageConsumption = (entries: FuelEntry[]): number | null => {
  const fullTankEntries = entries.filter((e) => e.isFullTank).sort((a, b) => a.odometer - b.odometer);
  if (fullTankEntries.length < 2) return null;

  const totalKm = fullTankEntries[fullTankEntries.length - 1].odometer - fullTankEntries[0].odometer;
  if (totalKm <= 0) return null;

  // İlk dolumdan sonrakilerin litresini topla
  const totalLiters = fullTankEntries.slice(1).reduce((acc, curr) => acc + curr.liters, 0);
  return Number(((totalLiters / totalKm) * 100).toFixed(1));
};

// --- BAKIM & SERVİS İŞLEMLERİ ---
export const getServiceRecords = async (vehicleId: string): Promise<ServiceRecord[]> => {
  try {
    const data = await AsyncStorage.getItem(SERVICE_KEY);
    const all: ServiceRecord[] = data ? JSON.parse(data) : [];
    return all.filter((s) => s.vehicleId === vehicleId).sort((a, b) => b.odometer - a.odometer);
  } catch (e) {
    return [];
  }
};

export const addServiceRecord = async (record: ServiceRecord): Promise<ServiceRecord[]> => {
  try {
    const data = await AsyncStorage.getItem(SERVICE_KEY);
    const all: ServiceRecord[] = data ? JSON.parse(data) : [];
    const updated = [record, ...all];
    await AsyncStorage.setItem(SERVICE_KEY, JSON.stringify(updated));
    await updateVehicleOdo(record.vehicleId, record.odometer);
    return updated.filter((s) => s.vehicleId === record.vehicleId);
  } catch (e) {
    return [];
  }
};