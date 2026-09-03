// src/screens/DashboardScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import {
  getVehicles,
  getActiveVehicleId,
  setActiveVehicleId,
  saveVehicle,
  getFuelEntries,
  calculateAverageConsumption,
  getServiceRecords,
} from '../services/storageService';
import { Vehicle, FuelEntry, ServiceRecord } from '../types/vehicle';

const FUEL_TYPE_LABELS = {
  gasoline: 'Benzin',
  diesel: 'Dizel',
  lpg: 'LPG / Otogaz',
  electric: 'Elektrik',
  hybrid: 'Hibrit',
};

export const DashboardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [lastFuel, setLastFuel] = useState<FuelEntry | null>(null);
  const [avgConsumption, setAvgConsumption] = useState<number | null>(null);
  const [nextService, setNextService] = useState<ServiceRecord | null>(null);

  // Modallar
  const [isSwitchModalVisible, setIsSwitchModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Yeni Araç Formu State
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [currentOdo, setCurrentOdo] = useState('');
  const [fuelType, setFuelType] = useState<Vehicle['fuelType']>('gasoline');

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const loadDashboard = async () => {
    const list = await getVehicles();
    setVehicles(list);

    const activeId = await getActiveVehicleId();
    const current = list.find((v) => v.id === activeId) || list[0] || null;
    setVehicle(current);

    if (current) {
      const fuels = await getFuelEntries(current.id);
      setLastFuel(fuels[0] || null);
      setAvgConsumption(calculateAverageConsumption(fuels));

      const services = await getServiceRecords(current.id);
      // Gelecek KM'si olan ilk bakımı bul
      const upcoming = services.find((s) => s.nextDueOdo && s.nextDueOdo > current.currentOdo);
      setNextService(upcoming || null);
    } else {
      setLastFuel(null);
      setAvgConsumption(null);
      setNextService(null);
    }
  };

  const handleSelectVehicle = async (selected: Vehicle) => {
    await setActiveVehicleId(selected.id);
    setIsSwitchModalVisible(false);
    loadDashboard();
  };

  const handleCreateVehicle = async () => {
    if (!plate.trim() || !brand.trim() || !model.trim() || !currentOdo.trim()) {
      Alert.alert('Eksik Bilgi', 'Plaka, marka, model ve güncel KM alanları zorunludur.');
      return;
    }

    const odoNum = parseInt(currentOdo.replace(/\D/g, ''), 10);
    const yearNum = parseInt(year.trim(), 10) || new Date().getFullYear();

    const newVehicle: Vehicle = {
      id: `veh_${Date.now()}`,
      plate: plate.trim().toUpperCase(),
      brand: brand.trim(),
      model: model.trim(),
      year: yearNum,
      fuelType,
      currentOdo: isNaN(odoNum) ? 0 : odoNum,
    };

    await saveVehicle(newVehicle);
    setIsAddModalVisible(false);
    setPlate('');
    setBrand('');
    setModel('');
    setYear('');
    setCurrentOdo('');
    loadDashboard();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.xs }]}>
      {/* Üst Bar: Araç Değiştirici */}
      {vehicle && (
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.vehicleSwitchBadge}
            onPress={() => setIsSwitchModalVisible(true)}
          >
            <Ionicons name="car-sport" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.plateText}>{vehicle.plate}</Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {!vehicle ? (
          /* Araç Yoksa Boş Durum Kartı */
          <View style={styles.emptyHeroCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="car-sport-outline" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyHeroTitle}>Kayıtlı Araç Bulunamadı</Text>
            <Text style={styles.emptyHeroSub}>
              Yakıt tüketimi, kilometre ve periyodik bakım takibi için aracını sisteme ekle.
            </Text>
            <TouchableOpacity
              style={styles.heroButton}
              activeOpacity={0.85}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroButtonText}>İlk Aracını Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Ana Araç Bilgi Kartı */}
            <View style={styles.mainVehicleCard}>
              <View style={styles.vehicleHeaderRow}>
                <View>
                  <Text style={styles.brandTitle}>
                    {vehicle.brand} {vehicle.model}
                  </Text>
                  <Text style={styles.subModelText}>
                    {vehicle.year} • {FUEL_TYPE_LABELS[vehicle.fuelType]}
                  </Text>
                </View>
                <View style={styles.odoBadge}>
                  <Text style={styles.odoBadgeLabel}>GÜNCEL KM</Text>
                  <Text style={styles.odoBadgeValue}>
                    {vehicle.currentOdo.toLocaleString('tr-TR')} km
                  </Text>
                </View>
              </View>
            </View>

            {/* İstatistik Göstergeleri */}
            <Text style={styles.sectionHeading}>Verimlilik & Tüketim</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="speedometer-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.metricLabel}>Ort. Tüketim</Text>
                <Text style={styles.metricValue}>
                  {avgConsumption ? `${avgConsumption} L` : '- -'}
                </Text>
                <Text style={styles.metricSub}>/100 km</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: COLORS.secondaryLight }]}>
                  <Ionicons name="flame-outline" size={20} color={COLORS.secondary} />
                </View>
                <Text style={styles.metricLabel}>Son Yakıt</Text>
                <Text style={styles.metricValue}>
                  {lastFuel ? `${lastFuel.liters} L` : '- -'}
                </Text>
                <Text style={styles.metricSub}>
                  {lastFuel ? `${lastFuel.totalPrice.toFixed(0)} ₺` : 'Kayıt Yok'}
                </Text>
              </View>
            </View>

            {/* Hızlı Eylemler */}
            <Text style={styles.sectionHeading}>Hızlı Kayıt</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#F0FDF4' }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('FuelTab')}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="funnel" size={20} color={COLORS.success} />
                </View>
                <Text style={styles.actionBtnTitle}>Yakıt Ekle</Text>
                <Text style={styles.actionBtnSub}>Depo Dolumu Gir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ServiceTab')}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="construct" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.actionBtnTitle}>Bakım Ekle</Text>
                <Text style={styles.actionBtnSub}>Servis / Muayene</Text>
              </TouchableOpacity>
            </View>

            {/* Yaklaşan Bakım Uyarısı */}
            <Text style={styles.sectionHeading}>Servis & Bakım Durumu</Text>
            {nextService && nextService.nextDueOdo ? (
              <View style={styles.serviceCard}>
                <View style={styles.serviceIconCircle}>
                  <Ionicons name="build-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceTitle}>{nextService.title}</Text>
                  <Text style={styles.serviceSub}>
                    Hedef: {nextService.nextDueOdo.toLocaleString('tr-TR')} km (Kalan:{' '}
                    {(nextService.nextDueOdo - vehicle.currentOdo).toLocaleString('tr-TR')} km)
                  </Text>
                </View>
                <View style={styles.badgeWarning}>
                  <Text style={styles.badgeWarningText}>Planlı</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyServiceCard}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color={COLORS.success} style={{ marginRight: 8 }} />
                <Text style={styles.emptyServiceText}>Gecikmiş veya acil bir servis kaydı yok.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Araç Seçim Modalı */}
      <Modal visible={isSwitchModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Garajdaki Araçlar</Text>
            {vehicles.map((v) => {
              const isSelected = v.id === vehicle?.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vehicleRow, isSelected && styles.selectedVehicleRow]}
                  onPress={() => handleSelectVehicle(v)}
                >
                  <Ionicons name="car-sport" size={20} color={isSelected ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehiclePlate, isSelected && { color: COLORS.primary }]}>
                      {v.plate}
                    </Text>
                    <Text style={styles.vehicleSub}>
                      {v.brand} {v.model} • {v.currentOdo.toLocaleString('tr-TR')} km
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.modalAddVehicleBtn}
              onPress={() => {
                setIsSwitchModalVisible(false);
                setIsAddModalVisible(true);
              }}
            >
              <Text style={styles.modalAddVehicleBtnText}>+ Yeni Araç Ekle</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsSwitchModalVisible(false)}>
              <Text style={styles.closeBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Yeni Araç Ekleme Modalı */}
      <Modal visible={isAddModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalHeading}>🚗 Yeni Araç Tanımla</Text>

              <Text style={styles.fieldLabel}>Plaka *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 34 ABC 123"
                autoCapitalize="characters"
                value={plate}
                onChangeText={setPlate}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Marka *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Renault"
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Model *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Megane"
                    value={model}
                    onChangeText={setModel}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Model Yılı</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2020"
                    keyboardType="numeric"
                    value={year}
                    onChangeText={setYear}
                  />
                </View>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.fieldLabel}>Güncel Kilometre *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: 95000"
                    keyboardType="numeric"
                    value={currentOdo}
                    onChangeText={setCurrentOdo}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Yakıt Türü:</Text>
              <View style={styles.fuelChipRow}>
                {(['gasoline', 'diesel', 'lpg', 'hybrid', 'electric'] as const).map((t) => {
                  const isSel = fuelType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.fuelChip, isSel && styles.selectedFuelChip]}
                      onPress={() => setFuelType(t)}
                    >
                      <Text style={[styles.fuelChipText, isSel && styles.selectedFuelChipText]}>
                        {FUEL_TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsAddModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreateVehicle}>
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  vehicleSwitchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  plateText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  emptyHeroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: SPACING.lg,
    alignItems: 'center',
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyHeroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptyHeroSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  mainVehicleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subModelText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  odoBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  odoBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  odoBadgeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs + 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 18,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtnTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  actionBtnSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  serviceSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeWarningText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  emptyServiceCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyServiceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: SPACING.lg,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedVehicleRow: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  vehiclePlate: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  vehicleSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  modalAddVehicleBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 14,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  modalAddVehicleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  closeBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  fuelChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  fuelChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedFuelChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  fuelChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  selectedFuelChipText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.xs,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});