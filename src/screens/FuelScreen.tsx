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
  const [date, setDate] = useState('');

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
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
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
        `Girilen kilometre (${odoNum.toLocaleString('tr-TR')} km), aracın mevcut kilometresinden (${vehicle.currentOdo.toLocaleString('tr-TR')} km) daha düşük olamaz.`
      );
      return;
    }

    const unitPrice = parseFloat((priceNum / literNum).toFixed(2));

    const newEntry: FuelEntry = {
      id: `fuel_${Date.now()}`,
      vehicleId: vehicle.id,
      date: date.trim() || new Date().toISOString().split('T')[0],
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

  // İki dolum arasındaki tüketimi hesaplama
  const getConsumptionForEntry = (currentIndex: number): string | null => {
    const current = entries[currentIndex];
    const previous = entries[currentIndex + 1]; // Liste ters sıralı olduğu için önceki kayıt currentIndex + 1

    if (!current || !previous || !current.isFullTank || !previous.isFullTank) return null;

    const kmDiff = current.odometer - previous.odometer;
    if (kmDiff <= 0) return null;

    const l100 = (current.liters / kmDiff) * 100;
    return `${l100.toFixed(1)} L/100km`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }]}>
      {/* Başlık Alanı */}
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
            const consumption = getConsumptionForEntry(idx);
            return (
              <View key={item.id} style={styles.fuelCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.fuelIconBadge}>
                    <Ionicons name="funnel" size={16} color={COLORS.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardOdo}>
                      {item.odometer.toLocaleString('tr-TR')} km
                    </Text>
                    <Text style={styles.cardDate}>📅 {item.date}</Text>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={styles.totalPriceText}>
                      {item.totalPrice.toFixed(0)} ₺
                    </Text>
                    <Text style={styles.unitPriceText}>
                      {item.pricePerLiter.toFixed(2)} ₺/L
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBottomRow}>
                  <View style={styles.badgeItem}>
                    <Text style={styles.badgeLabel}>Litre</Text>
                    <Text style={styles.badgeVal}>{item.liters} L</Text>
                  </View>

                  <View style={styles.badgeItem}>
                    <Text style={styles.badgeLabel}>Depo Durumu</Text>
                    <Text style={[styles.badgeVal, { color: item.isFullTank ? COLORS.success : COLORS.textSecondary }]}>
                      {item.isFullTank ? 'Full Dolum ✅' : 'Kısmi Dolum'}
                    </Text>
                  </View>

                  {consumption && (
                    <View style={[styles.badgeItem, styles.consumptionBadge]}>
                      <Text style={styles.consumptionLabel}>Ort. Tüketim</Text>
                      <Text style={styles.consumptionVal}>{consumption}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Yakıt Ekleme Modalı */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>⛽ Yakıt Dolum Kaydı</Text>

              <Text style={styles.fieldLabel}>Alım Tarihi (YYYY-AA-GG):</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-09-03"
                value={date}
                onChangeText={setDate}
              />

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

              {/* Birim Fiyat Önizlemesi */}
              {liters && totalPrice && (
                <View style={styles.unitPricePreview}>
                  <Text style={styles.unitPricePreviewText}>
                    Tahmini Birim Fiyat:{' '}
                    {(parseFloat(totalPrice.replace(',', '.')) / parseFloat(liters.replace(',', '.'))).toFixed(2)}{' '}
                    ₺/Litre
                  </Text>
                </View>
              )}

              {/* Full Depo Switch */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Depo Tamamen Dolduruldu mu?</Text>
                  <Text style={styles.switchSub}>Hassas tüketim hesabı için gereklidir</Text>
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
  consumptionBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  consumptionLabel: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: '700',
  },
  consumptionVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
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