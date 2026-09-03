// src/services/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, FuelEntry, ServiceRecord } from '../types/vehicle';

const VEHICLES_KEY = '@autolog_vehicles';
const ACTIVE_VEHICLE_KEY = '@autolog_active_vehicle_id';
const FUEL_KEY = '@autolog_fuel_entries';
const SERVICE_KEY = '@autolog_service_records';

// -------------------------------------------------------------
// ARAÇ İŞLEMLERİ (VEHICLE OPERATIONS)
// -------------------------------------------------------------

export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const json = await AsyncStorage.getItem(VEHICLES_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('getVehicles error:', error);
    return [];
  }
};

export const saveVehicle = async (vehicle: Vehicle): Promise<Vehicle[]> => {
  try {
    const currentList = await getVehicles();
    const index = currentList.findIndex((v) => v.id === vehicle.id);
    let updatedList: Vehicle[];

    if (index >= 0) {
      updatedList = [...currentList];
      updatedList[index] = vehicle;
    } else {
      updatedList = [...currentList, vehicle];
    }

    await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updatedList));

    // İlk eklenen aracı otomatik olarak aktif araç yap
    const activeId = await getActiveVehicleId();
    if (!activeId) {
      await setActiveVehicleId(vehicle.id);
    }

    return updatedList;
  } catch (error) {
    console.error('saveVehicle error:', error);
    return [];
  }
};

export const deleteVehicle = async (vehicleId: string): Promise<Vehicle[]> => {
  try {
    const list = await getVehicles();
    const updatedVehicles = list.filter((v) => v.id !== vehicleId);
    await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updatedVehicles));

    // Araca ait yakıt kayıtlarını temizle
    const fuelData = await AsyncStorage.getItem(FUEL_KEY);
    if (fuelData) {
      const allFuels: FuelEntry[] = JSON.parse(fuelData);
      await AsyncStorage.setItem(
        FUEL_KEY,
        JSON.stringify(allFuels.filter((f) => f.vehicleId !== vehicleId))
      );
    }

    // Araca ait bakım/servis kayıtlarını temizle
    const serviceData = await AsyncStorage.getItem(SERVICE_KEY);
    if (serviceData) {
      const allServices: ServiceRecord[] = JSON.parse(serviceData);
      await AsyncStorage.setItem(
        SERVICE_KEY,
        JSON.stringify(allServices.filter((s) => s.vehicleId !== vehicleId))
      );
    }

    // Aktif araç silindiyse bir sonraki araca geç veya sıfırla
    const activeId = await getActiveVehicleId();
    if (activeId === vehicleId) {
      const nextId = updatedVehicles.length > 0 ? updatedVehicles[0].id : '';
      if (nextId) {
        await setActiveVehicleId(nextId);
      } else {
        await AsyncStorage.removeItem(ACTIVE_VEHICLE_KEY);
      }
    }

    return updatedVehicles;
  } catch (error) {
    console.error('deleteVehicle error:', error);
    return [];
  }
};

export const getActiveVehicleId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACTIVE_VEHICLE_KEY);
  } catch (error) {
    console.error('getActiveVehicleId error:', error);
    return null;
  }
};

export const setActiveVehicleId = async (id: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACTIVE_VEHICLE_KEY, id);
  } catch (error) {
    console.error('setActiveVehicleId error:', error);
  }
};

// -------------------------------------------------------------
// YAKIT & ŞARJ İŞLEMLERİ (FUEL & EV CHARGE OPERATIONS)
// -------------------------------------------------------------

export const getFuelEntries = async (vehicleId: string): Promise<FuelEntry[]> => {
  try {
    const json = await AsyncStorage.getItem(FUEL_KEY);
    if (!json) return [];
    const all: FuelEntry[] = JSON.parse(json);
    return all
      .filter((e) => e.vehicleId === vehicleId)
      .sort((a, b) => b.odometer - a.odometer);
  } catch (error) {
    console.error('getFuelEntries error:', error);
    return [];
  }
};

export const addFuelEntry = async (entry: FuelEntry): Promise<FuelEntry[]> => {
  try {
    const json = await AsyncStorage.getItem(FUEL_KEY);
    const all: FuelEntry[] = json ? JSON.parse(json) : [];
    const updated = [entry, ...all];
    await AsyncStorage.setItem(FUEL_KEY, JSON.stringify(updated));

    // Aracın güncel kilometresini otomatik güncelle
    const vehicles = await getVehicles();
    const current = vehicles.find((v) => v.id === entry.vehicleId);
    if (current && entry.odometer > current.currentOdo) {
      current.currentOdo = entry.odometer;
      await saveVehicle(current);
    }

    return updated
      .filter((e) => e.vehicleId === entry.vehicleId)
      .sort((a, b) => b.odometer - a.odometer);
  } catch (error) {
    console.error('addFuelEntry error:', error);
    return [];
  }
};

export const deleteFuelEntry = async (entryId: string, vehicleId: string): Promise<FuelEntry[]> => {
  try {
    const list = await getFuelEntries(vehicleId);
    const updated = list.filter((e) => e.id !== entryId);

    const json = await AsyncStorage.getItem(FUEL_KEY);
    if (json) {
      const all: FuelEntry[] = JSON.parse(json);
      const filteredAll = all.filter((e) => e.id !== entryId);
      await AsyncStorage.setItem(FUEL_KEY, JSON.stringify(filteredAll));
    }

    // Kilometreyi kalan en yüksek kilometreye senkronize et
    const services = await getServiceRecords(vehicleId);
    const maxFuelOdo = updated.length > 0 ? Math.max(...updated.map((f) => f.odometer)) : 0;
    const maxServiceOdo = services.length > 0 ? Math.max(...services.map((s) => s.odometer)) : 0;
    const newMaxOdo = Math.max(maxFuelOdo, maxServiceOdo);

    if (newMaxOdo > 0) {
      const vList = await getVehicles();
      const targetVehicle = vList.find((v) => v.id === vehicleId);
      if (targetVehicle && targetVehicle.currentOdo > newMaxOdo) {
        targetVehicle.currentOdo = newMaxOdo;
        await saveVehicle(targetVehicle);
      }
    }

    return updated;
  } catch (error) {
    console.error('deleteFuelEntry error:', error);
    return [];
  }
};

// -------------------------------------------------------------
// BAKIM & MASRAF İŞLEMLERİ (SERVICE & EXPENSE OPERATIONS)
// -------------------------------------------------------------

export const getServiceRecords = async (vehicleId: string): Promise<ServiceRecord[]> => {
  try {
    const json = await AsyncStorage.getItem(SERVICE_KEY);
    if (!json) return [];
    const all: ServiceRecord[] = JSON.parse(json);
    return all
      .filter((s) => s.vehicleId === vehicleId)
      .sort((a, b) => b.odometer - a.odometer);
  } catch (error) {
    console.error('getServiceRecords error:', error);
    return [];
  }
};

export const addServiceRecord = async (record: ServiceRecord): Promise<ServiceRecord[]> => {
  try {
    const json = await AsyncStorage.getItem(SERVICE_KEY);
    const all: ServiceRecord[] = json ? JSON.parse(json) : [];
    const updated = [record, ...all];
    await AsyncStorage.setItem(SERVICE_KEY, JSON.stringify(updated));

    // Aracın kilometresini güncelle
    const vehicles = await getVehicles();
    const current = vehicles.find((v) => v.id === record.vehicleId);
    if (current && record.odometer > current.currentOdo) {
      current.currentOdo = record.odometer;
      await saveVehicle(current);
    }

    return updated
      .filter((s) => s.vehicleId === record.vehicleId)
      .sort((a, b) => b.odometer - a.odometer);
  } catch (error) {
    console.error('addServiceRecord error:', error);
    return [];
  }
};

export const deleteServiceRecord = async (recordId: string, vehicleId: string): Promise<ServiceRecord[]> => {
  try {
    const list = await getServiceRecords(vehicleId);
    const updated = list.filter((s) => s.id !== recordId);

    const json = await AsyncStorage.getItem(SERVICE_KEY);
    if (json) {
      const all: ServiceRecord[] = JSON.parse(json);
      const filteredAll = all.filter((s) => s.id !== recordId);
      await AsyncStorage.setItem(SERVICE_KEY, JSON.stringify(filteredAll));
    }

    // Kilometreyi senkronize et
    const fuels = await getFuelEntries(vehicleId);
    const maxFuelOdo = fuels.length > 0 ? Math.max(...fuels.map((f) => f.odometer)) : 0;
    const maxServiceOdo = updated.length > 0 ? Math.max(...updated.map((s) => s.odometer)) : 0;
    const newMaxOdo = Math.max(maxFuelOdo, maxServiceOdo);

    if (newMaxOdo > 0) {
      const vList = await getVehicles();
      const targetVehicle = vList.find((v) => v.id === vehicleId);
      if (targetVehicle && targetVehicle.currentOdo > newMaxOdo) {
        targetVehicle.currentOdo = newMaxOdo;
        await saveVehicle(targetVehicle);
      }
    }

    return updated;
  } catch (error) {
    console.error('deleteServiceRecord error:', error);
    return [];
  }
};

// -------------------------------------------------------------
// HESAPLAMA YARDIMCILARI (CALCULATION HELPERS)
// -------------------------------------------------------------

export const calculateAverageConsumption = (entries: FuelEntry[]): number | null => {
  // Tam dolum yapılanları kilometre sırasına göre diz
  const fullTanks = entries
    .filter((e) => e.isFullTank)
    .sort((a, b) => a.odometer - b.odometer);

  if (fullTanks.length < 2) return null;

  let totalLiters = 0;
  const initialKm = fullTanks[0].odometer;
  const finalKm = fullTanks[fullTanks.length - 1].odometer;
  const totalKm = finalKm - initialKm;

  if (totalKm <= 0) return null;

  for (let i = 1; i < fullTanks.length; i++) {
    totalLiters += fullTanks[i].liters;
  }

  const consumption = (totalLiters / totalKm) * 100;
  return Number(consumption.toFixed(1));
};