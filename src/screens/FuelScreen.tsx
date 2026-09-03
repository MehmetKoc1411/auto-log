// src/screens/FuelScreen.tsx
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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import {
  getActiveVehicleId,
  getVehicles,
  getFuelEntries,
  addFuelEntry,
} from '../services/storageService';
import { Vehicle, FuelEntry } from '../types/vehicle';
import { DatePickerModal } from '../components/DatePickerModal';

export const FuelScreen = () => {
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [isFullTank, setIsFullTank] = useState(true);

  // Tarih State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFuelData();
    }, [])
  );

  const loadFuelData = async () => {
    const activeId = await getActiveVehicleId();
    const list = await getVehicles();
    const current = list.find((v) => v.id === activeId) || list[0] || null;
    setVehicle(current);

    if (current) {
      const data = await getFuelEntries(current.id);
      setEntries(data);
    } else {
      setEntries([]);
    }
  };

  const openAddModal = () => {
    if (!vehicle) {
      Alert.alert('Uyarı', 'Lütfen önce Gösterge sekmesinden bir araç ekleyin.');
      return;
    }
    setDate(new Date().toISOString().split('T')[0]);
    setOdometer(vehicle.currentOdo ? String(vehicle.currentOdo) : '');
    setLiters('');
    setTotalPrice('');
    setIsFullTank(true);
    setIsModalOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!vehicle) return;

    const odoNum = parseInt(odometer.replace(/\D/g, ''), 10);
    const literNum = parseFloat(liters.replace(',', '.'));
    const priceNum = parseFloat(totalPrice.replace(',', '.'));

    if (isNaN(odoNum) || isNaN(literNum) || isNaN(priceNum) || literNum <= 0 || priceNum <= 0) {
      Alert.alert('Hatalı Giriş', 'Lütfen kilometre, litre ve tutar bilgilerini eksiksiz girin.');
      return;
    }

    if (odoNum < vehicle.currentOdo) {
      Alert.alert(
        'Kilometre Uyarısı',
        `Girilen kilometre (${odoNum.toLocaleString('tr-TR')} km), mevcut kilometreden (${vehicle.currentOdo.toLocaleString('tr-TR')} km) daha düşük olamaz.`
      );
      return;
    }

    const unitPrice = parseFloat((priceNum / literNum).toFixed(2));

    const newEntry: FuelEntry = {
      id: `fuel_${Date.now()}`,
      vehicleId: vehicle.id,
      date,
      odometer: odoNum,
      liters: literNum,
      totalPrice: priceNum,
      pricePerLiter: unitPrice,
      isFullTank,
    };

    const updated = await addFuelEntry(newEntry);
    setEntries(updated);
    setIsModalOpen(false);
    loadFuelData();
  };

  const getConsumptionAndCostPerKm = (currentIndex: number) => {
    const current = entries[currentIndex];
    const previous = entries[currentIndex + 1];

    if (!current || !previous || !current.isFullTank || !previous.isFullTank) return null;

    const kmDiff = current.odometer - previous.odometer;
    if (kmDiff <= 0) return null;

    const l100 = (current.liters / kmDiff) * 100;
    const costPerKm = current.totalPrice / kmDiff;

    return {
      consumption: `${l100.toFixed(1)} L/100km`,
      costPerKm: `${costPerKm.toFixed(2)} ₺/km`,
    };
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Yakıt Günlüğü</Text>
          <Text style={styles.subtitle}>
            {vehicle ? `${vehicle.plate} • ${vehicle.brand} ${vehicle.model}` : 'Araç Seçilmedi'}
          </Text>
        </View>
        <TouchableOpacity style={styles.quickAddBtn} onPress={openAddModal}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.quickAddBtnText}>Yakıt Gir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="funnel-outline" size={32} color={COLORS.secondary} />
            </View>
            <Text style={styles.emptyTitle}>Henüz Yakıt Kaydı Yok</Text>
            <Text style={styles.emptySub}>
              Depoyu doldurduğunda fiş bilgilerini kaydederek tüketim ortalamanı hesapla.
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={openAddModal}>
              <Text style={styles.emptyActionBtnText}>+ İlk Yakıt Alımını Kaydet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          entries.map((item, idx) => {
            const stats = getConsumptionAndCostPerKm(idx);
            return (
              <View key={item.id} style={styles.fuelCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.fuelIconBadge}>
                    <Ionicons name="funnel" size={16} color={COLORS.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardOdo}>{item.odometer.toLocaleString('tr-TR')} km</Text>
                    <Text style={styles.cardDate}>📅 {item.date}</Text>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={styles.totalPriceText}>{item.totalPrice.toFixed(0)} ₺</Text>
                    <Text style={styles.unitPriceText}>{item.pricePerLiter.toFixed(2)} ₺/L</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBottomRow}>
                  <View style={styles.badgeItem}>
                    <Text style={styles.badgeLabel}>Alınan Litre</Text>
                    <Text style={styles.badgeVal}>{item.liters} L</Text>
                  </View>

                  <View style={styles.badgeItem}>
                    <Text style={styles.badgeLabel}>Depo Durumu</Text>
                    <Text
                      style={[
                        styles.badgeVal,
                        { color: item.isFullTank ? COLORS.success : COLORS.textSecondary },
                      ]}
                    >
                      {item.isFullTank ? 'Full Dolum ✅' : 'Kısmi'}
                    </Text>
                  </View>

                  {stats && (
                    <View style={styles.statsContainer}>
                      <View style={styles.consumptionBadge}>
                        <Text style={styles.consumptionVal}>{stats.consumption}</Text>
                      </View>
                      <View style={styles.costBadge}>
                        <Text style={styles.costVal}>{stats.costPerKm}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>⛽ Yakıt Dolum Kaydı</Text>

              <Text style={styles.fieldLabel}>Alım Tarihi:</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setIsCalendarOpen(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.datePickerBtnText}>{date}</Text>
                <Text style={styles.changeText}>Takvimden Seç</Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Kilometre Göstergesi *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 95400"
                keyboardType="numeric"
                value={odometer}
                onChangeText={setOdometer}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Alınan Litre *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="45.5"
                    keyboardType="numeric"
                    value={liters}
                    onChangeText={setLiters}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Ödenen Tutar (₺) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2100"
                    keyboardType="numeric"
                    value={totalPrice}
                    onChangeText={setTotalPrice}
                  />
                </View>
              </View>

              {liters && totalPrice && (
                <View style={styles.unitPricePreview}>
                  <Text style={styles.unitPricePreviewText}>
                    Birim Fiyat:{' '}
                    {(parseFloat(totalPrice.replace(',', '.')) / parseFloat(liters.replace(',', '.'))).toFixed(2)}{' '}
                    ₺/Litre
                  </Text>
                </View>
              )}

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Depo Tamamen Dolduruldu mu?</Text>
                  <Text style={styles.switchSub}>Tüketim (L/100km) hesabı için tam dolum gerekir</Text>
                </View>
                <Switch
                  value={isFullTank}
                  onValueChange={setIsFullTank}
                  trackColor={{ false: '#E2E8F0', true: COLORS.primaryLight }}
                  thumbColor={isFullTank ? COLORS.primary : '#94A3B8'}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsModalOpen(false)}
                >
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEntry}>
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tarih Seçim Takvimi */}
      <DatePickerModal
        visible={isCalendarOpen}
        selectedDate={date}
        onSelect={(newDate) => setDate(newDate)}
        onClose={() => setIsCalendarOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs + 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quickAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  emptyActionBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  fuelCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fuelIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardOdo: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  unitPriceText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeItem: {
    alignItems: 'flex-start',
  },
  badgeLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  badgeVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  consumptionBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  consumptionVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  costBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  costVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: 6,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: SPACING.xs,
  },
  datePickerBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.xs,
  },
  unitPricePreview: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginVertical: 4,
  },
  unitPricePreviewText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '700',
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 12,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  switchSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
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
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});