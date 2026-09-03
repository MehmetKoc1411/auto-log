// src/screens/ServiceScreen.tsx
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
  getActiveVehicleId,
  getVehicles,
  getServiceRecords,
  addServiceRecord,
} from '../services/storageService';
import { Vehicle, ServiceRecord } from '../types/vehicle';
import { DatePickerModal } from '../components/DatePickerModal';

type ServiceCategory = 'maintenance' | 'legal';

const TEMPLATES: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: ServiceCategory;
  defaultPlusKm?: number;
  defaultPlusDays?: number;
}[] = [
  { title: 'Periyodik Bakım', icon: 'construct', category: 'maintenance', defaultPlusKm: 15000 },
  { title: 'Fren Balatası', icon: 'disc', category: 'maintenance', defaultPlusKm: 30000 },
  { title: 'Akü Değişimi', icon: 'flash', category: 'maintenance', defaultPlusKm: 50000 },
  { title: 'TÜVTÜRK Muayene', icon: 'shield-checkmark', category: 'legal', defaultPlusDays: 730 },
  { title: 'Trafik Sigortası', icon: 'document-text', category: 'legal', defaultPlusDays: 365 },
  { title: 'Kasko Poliçesi', icon: 'car', category: 'legal', defaultPlusDays: 365 },
];

export const ServiceScreen = () => {
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState<ServiceCategory>('maintenance');
  const [title, setTitle] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [nextDueOdo, setNextDueOdo] = useState('');
  const [notes, setNotes] = useState('');

  // Tarih State
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<'service' | 'nextDue'>('service');

  useFocusEffect(
    useCallback(() => {
      loadServiceData();
    }, [])
  );

  const loadServiceData = async () => {
    const activeId = await getActiveVehicleId();
    const list = await getVehicles();
    const current = list.find((v) => v.id === activeId) || list[0] || null;
    setVehicle(current);

    if (current) {
      const data = await getServiceRecords(current.id);
      setServices(data);
    } else {
      setServices([]);
    }
  };

  const openAddModal = () => {
    if (!vehicle) {
      Alert.alert('Uyarı', 'Lütfen önce Gösterge sekmesinden bir araç tanımlayın.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    setServiceDate(today);
    setNextDueDate('');
    setCategory('maintenance');
    setOdometer(vehicle.currentOdo ? String(vehicle.currentOdo) : '');
    setTitle('Periyodik Bakım (Yağ & Filtre)');
    setCost('');
    setNextDueOdo(vehicle.currentOdo ? String(vehicle.currentOdo + 15000) : '');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSelectTemplate = (tpl: typeof TEMPLATES[0]) => {
    setTitle(tpl.title);
    setCategory(tpl.category);
    const currentKm = parseInt(odometer, 10) || vehicle?.currentOdo || 0;

    if (tpl.category === 'maintenance' && tpl.defaultPlusKm) {
      setNextDueOdo(String(currentKm + tpl.defaultPlusKm));
      setNextDueDate('');
    } else if (tpl.category === 'legal' && tpl.defaultPlusDays) {
      const target = new Date();
      target.setDate(target.getDate() + tpl.defaultPlusDays);
      setNextDueDate(target.toISOString().split('T')[0]);
      setNextDueOdo('');
    }
  };

  const addKmOffset = (kmToAdd: number) => {
    const baseKm = parseInt(odometer, 10) || vehicle?.currentOdo || 0;
    setNextDueOdo(String(baseKm + kmToAdd));
  };

  const handleSaveService = async () => {
    if (!vehicle) return;

    const odoNum = parseInt(odometer.replace(/\D/g, ''), 10);
    const costNum = parseFloat(cost.replace(',', '.'));
    const nextOdoNum = nextDueOdo.trim() ? parseInt(nextDueOdo.replace(/\D/g, ''), 10) : undefined;

    if (!title.trim() || isNaN(odoNum) || isNaN(costNum)) {
      Alert.alert('Eksik Bilgi', 'Lütfen işlem başlığı, kilometre ve maliyet tutarını eksiksiz girin.');
      return;
    }

    const newRecord: ServiceRecord = {
      id: `srv_${Date.now()}`,
      vehicleId: vehicle.id,
      title: title.trim(),
      date: serviceDate,
      odometer: odoNum,
      cost: costNum,
      nextDueOdo: category === 'maintenance' ? nextOdoNum : undefined,
      nextDueDate: category === 'legal' ? nextDueDate.trim() || undefined : undefined,
      notes: notes.trim() || undefined,
    };

    const updated = await addServiceRecord(newRecord);
    setServices(updated);
    setIsModalOpen(false);
    loadServiceData();
  };

  const getDaysRemaining = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalSpent = services.reduce((sum, s) => sum + s.cost, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }]}>
      {/* Üst Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bakım & Masraflar</Text>
          <Text style={styles.subtitle}>
            {vehicle ? `${vehicle.plate} • Toplam Masraf: ${totalSpent.toLocaleString('tr-TR')} ₺` : 'Araç Seçilmedi'}
          </Text>
        </View>
        <TouchableOpacity style={styles.quickAddBtn} onPress={openAddModal}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.quickAddBtnText}>İşlem Gir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {services.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="construct-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Henüz Bakım Kaydı Yok</Text>
            <Text style={styles.emptySub}>
              Yağ değişimi, muayene veya sigorta kayıtlarını ekleyerek araç geçmişini takip et.
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={openAddModal}>
              <Text style={styles.emptyActionBtnText}>+ İlk Kaydı Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          services.map((item) => {
            const daysLeft = item.nextDueDate ? getDaysRemaining(item.nextDueDate) : null;
            return (
              <View key={item.id} style={styles.serviceCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name={item.nextDueDate ? 'shield-checkmark' : 'construct'}
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>
                      📅 {item.date} • {item.odometer.toLocaleString('tr-TR')} km
                    </Text>
                  </View>
                  <Text style={styles.cardCost}>{item.cost.toLocaleString('tr-TR')} ₺</Text>
                </View>

                <View style={styles.badgesWrapper}>
                  {item.nextDueOdo && (
                    <View style={styles.nextDueBadge}>
                      <Ionicons name="speedometer-outline" size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.nextDueText}>
                        Hedef: {item.nextDueOdo.toLocaleString('tr-TR')} km
                        {vehicle?.currentOdo && item.nextDueOdo > vehicle.currentOdo
                          ? ` (${(item.nextDueOdo - vehicle.currentOdo).toLocaleString('tr-TR')} km kaldı)`
                          : ' (Süresi Geldi)'}
                      </Text>
                    </View>
                  )}

                  {item.nextDueDate && daysLeft !== null && (
                    <View
                      style={[
                        styles.nextDueBadge,
                        daysLeft < 0
                          ? styles.badgeDanger
                          : daysLeft <= 30
                          ? styles.badgeWarning
                          : styles.badgeSuccess,
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={13}
                        color={daysLeft < 0 ? COLORS.danger : daysLeft <= 30 ? '#D97706' : COLORS.success}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.nextDueText,
                          { color: daysLeft < 0 ? COLORS.danger : daysLeft <= 30 ? '#D97706' : COLORS.success },
                        ]}
                      >
                        Bitiş: {item.nextDueDate}
                        {daysLeft < 0 ? ` (${Math.abs(daysLeft)} gün gecikti!)` : ` (${daysLeft} gün kaldı)`}
                      </Text>
                    </View>
                  )}
                </View>

                {item.notes && <Text style={styles.cardNotes}>💡 {item.notes}</Text>}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Yenilenmiş Bottom Sheet Tarzı Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            {/* Tutma Çubuğu */}
            <View style={styles.handleBar} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Masraf / Bakım</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Kategori Seçici Sekmeler */}
              <View style={styles.categoryTabs}>
                <TouchableOpacity
                  style={[styles.categoryTab, category === 'maintenance' && styles.categoryTabActive]}
                  onPress={() => {
                    setCategory('maintenance');
                    setNextDueDate('');
                  }}
                >
                  <Ionicons
                    name="construct"
                    size={15}
                    color={category === 'maintenance' ? COLORS.primary : COLORS.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.categoryTabText, category === 'maintenance' && styles.categoryTabTextActive]}>
                    Mekanik / Periyodik
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.categoryTab, category === 'legal' && styles.categoryTabActive]}
                  onPress={() => {
                    setCategory('legal');
                    setNextDueOdo('');
                  }}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={15}
                    color={category === 'legal' ? COLORS.primary : COLORS.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.categoryTabText, category === 'legal' && styles.categoryTabTextActive]}>
                    Muayene & Sigorta
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Hızlı Şablonlar (Seçili Kategoriye Göre Filtreli) */}
              <Text style={styles.fieldLabel}>Önerilen İşlem:</Text>
              <View style={styles.templateRow}>
                {TEMPLATES.filter((t) => t.category === category).map((t, idx) => {
                  const isSel = title.startsWith(t.title);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.templatePill, isSel && styles.templatePillActive]}
                      onPress={() => handleSelectTemplate(t)}
                    >
                      <Ionicons
                        name={t.icon}
                        size={14}
                        color={isSel ? COLORS.primary : COLORS.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.templatePillText, isSel && styles.templatePillTextActive]}>
                        {t.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* İşlem Adı */}
              <Text style={styles.fieldLabel}>İşlem Başlığı *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 10.000 Bakımı veya Trafik Sigortası"
                value={title}
                onChangeText={setTitle}
              />

              {/* Tarih & KM & Tutar Satırları */}
              <View style={styles.formGridRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>İşlem KM *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="95000"
                    keyboardType="numeric"
                    value={odometer}
                    onChangeText={setOdometer}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Tutar (₺) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="3500"
                    keyboardType="numeric"
                    value={cost}
                    onChangeText={setCost}
                  />
                </View>
              </View>

              {/* İşlem Tarihi */}
              <Text style={styles.fieldLabel}>İşlem Tarihi:</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => {
                  setCalendarTarget('service');
                  setIsCalendarOpen(true);
                }}
              >
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.datePickerBtnText}>{serviceDate}</Text>
                <Text style={styles.changeText}>Takvimden Değiştir</Text>
              </TouchableOpacity>

              {/* Kategoriye Özel Dinamik Hatırlatıcı Bölümü */}
              {category === 'maintenance' ? (
                /* MEKANİK BAKIM: Yalnızca Hedef KM ve Hızlı +10k / +15k Çipleri */
                <View style={styles.targetSection}>
                  <Text style={styles.fieldLabel}>Sonraki Bakım Hedef Kilometresi:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: 110000"
                    keyboardType="numeric"
                    value={nextDueOdo}
                    onChangeText={setNextDueOdo}
                  />
                  <View style={styles.quickKmRow}>
                    <Text style={styles.quickKmLabel}>Hızlı Ekle:</Text>
                    <TouchableOpacity style={styles.quickKmChip} onPress={() => addKmOffset(10000)}>
                      <Text style={styles.quickKmChipText}>+10.000 km</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickKmChip} onPress={() => addKmOffset(15000)}>
                      <Text style={styles.quickKmChipText}>+15.000 km</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickKmChip} onPress={() => addKmOffset(20000)}>
                      <Text style={styles.quickKmChipText}>+20.000 km</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* YASAL/POLİÇE: Yalnızca Bitiş / Geçerlilik Tarihi */
                <View style={styles.targetSection}>
                  <Text style={styles.fieldLabel}>Poliçe / Muayene Bitiş Tarihi (Geri Sayım):</Text>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => {
                      setCalendarTarget('nextDue');
                      setIsCalendarOpen(true);
                    }}
                  >
                    <Ionicons name="alarm-outline" size={16} color={COLORS.secondary} style={{ marginRight: 8 }} />
                    <Text style={styles.datePickerBtnText}>
                      {nextDueDate ? nextDueDate : 'Tarih Seçilmedi (Dokun)'}
                    </Text>
                    <Text style={styles.changeText}>Seç</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Notlar */}
              <Text style={styles.fieldLabel}>Usta / Servis Notları (Opsiyonel)</Text>
              <TextInput
                style={[styles.input, { height: 50 }]}
                placeholder="Örn: Yağ ve filtreler değişti, rot-balans yapıldı."
                value={notes}
                onChangeText={setNotes}
              />

              {/* Kaydet Butonu */}
              <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSaveService}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Masrafı Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tarih Seçim Takvimi */}
      <DatePickerModal
        visible={isCalendarOpen}
        selectedDate={calendarTarget === 'service' ? serviceDate : nextDueDate || serviceDate}
        onSelect={(newDate) => {
          if (calendarTarget === 'service') {
            setServiceDate(newDate);
          } else {
            setNextDueDate(newDate);
          }
        }}
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
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.primaryLight,
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  cardCost: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  badgesWrapper: {
    gap: 6,
    marginTop: 10,
  },
  nextDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  nextDueText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardNotes: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },

  /* Bottom Sheet Stilleri */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    maxHeight: '88%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  categoryTabActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryTabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 6,
  },
  templateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  templatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  templatePillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  templatePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  templatePillTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  formGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 11,
    fontSize: 13,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 11,
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
  targetSection: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  quickKmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  quickKmLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  quickKmChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickKmChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: SPACING.md,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});