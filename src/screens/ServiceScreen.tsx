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

const SERVICE_TEMPLATES = [
  { title: 'Periyodik Bakım (Yağ & Filtre)', defaultPlusKm: 15000 },
  { title: 'Ön / Arka Fren Balatası', defaultPlusKm: 30000 },
  { title: 'TÜVTÜRK Araç Muayenesi', defaultPlusKm: 0 },
  { title: 'Zorunlu Trafik Sigortası', defaultPlusKm: 0 },
  { title: 'Kasko Poliçesi', defaultPlusKm: 0 },
  { title: 'Akü Değişimi', defaultPlusKm: 50000 },
];

export const ServiceScreen = () => {
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [nextDueOdo, setNextDueOdo] = useState('');
  const [notes, setNotes] = useState('');

  // Tarih State
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
    setServiceDate(new Date().toISOString().split('T')[0]);
    setOdometer(vehicle.currentOdo ? String(vehicle.currentOdo) : '');
    setTitle('');
    setCost('');
    setNextDueOdo('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSelectTemplate = (tpl: { title: string; defaultPlusKm: number }) => {
    setTitle(tpl.title);
    const currentKm = vehicle?.currentOdo || parseInt(odometer, 10) || 0;
    if (tpl.defaultPlusKm > 0 && currentKm > 0) {
      setNextDueOdo(String(currentKm + tpl.defaultPlusKm));
    }
  };

  const handleSaveService = async () => {
    if (!vehicle) return;

    const odoNum = parseInt(odometer.replace(/\D/g, ''), 10);
    const costNum = parseFloat(cost.replace(',', '.'));
    const nextOdoNum = nextDueOdo.trim() ? parseInt(nextDueOdo.replace(/\D/g, ''), 10) : undefined;

    if (!title.trim() || isNaN(odoNum) || isNaN(costNum)) {
      Alert.alert('Eksik Bilgi', 'Lütfen işlem adı, kilometre ve maliyet tutarını girin.');
      return;
    }

    const newRecord: ServiceRecord = {
      id: `srv_${Date.now()}`,
      vehicleId: vehicle.id,
      title: title.trim(),
      date: serviceDate,
      odometer: odoNum,
      cost: costNum,
      nextDueOdo: nextOdoNum,
      notes: notes.trim() || undefined,
    };

    const updated = await addServiceRecord(newRecord);
    setServices(updated);
    setIsModalOpen(false);
    loadServiceData();
  };

  const totalSpent = services.reduce((sum, s) => sum + s.cost, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }]}>
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
              Yağ değişimi, muayene veya parça onarımlarını kaydederek araç geçmişini garantiye al.
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={openAddModal}>
              <Text style={styles.emptyActionBtnText}>+ İlk Bakım Kaydını Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          services.map((item) => (
            <View key={item.id} style={styles.serviceCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="build" size={16} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDate}>
                    📅 {item.date} • {item.odometer.toLocaleString('tr-TR')} km
                  </Text>
                </View>
                <Text style={styles.cardCost}>{item.cost.toLocaleString('tr-TR')} ₺</Text>
              </View>

              {item.nextDueOdo && (
                <View style={styles.nextDueBadge}>
                  <Ionicons name="time-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.nextDueText}>
                    Sonraki Hedef: {item.nextDueOdo.toLocaleString('tr-TR')} km
                    {vehicle?.currentOdo && item.nextDueOdo > vehicle.currentOdo
                      ? ` (${(item.nextDueOdo - vehicle.currentOdo).toLocaleString('tr-TR')} km kaldı)`
                      : ' (Süresi Geldi/Geçti)'}
                  </Text>
                </View>
              )}

              {item.notes && <Text style={styles.cardNotes}>💡 {item.notes}</Text>}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalHeading}>🛠️ Yeni Bakım / Masraf Kaydı</Text>

              <Text style={styles.fieldLabel}>Hızlı Şablon:</Text>
              <View style={styles.templateGrid}>
                {SERVICE_TEMPLATES.map((t, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.templateChip, title === t.title && styles.selectedTemplateChip]}
                    onPress={() => handleSelectTemplate(t)}
                  >
                    <Text style={[styles.templateChipText, title === t.title && styles.selectedTemplateChipText]}>
                      {t.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Yapılan İşlem *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Yağ, Yağ Filtresi, Hava Filtresi"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.fieldLabel}>İşlem Tarihi:</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setIsCalendarOpen(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.datePickerBtnText}>{serviceDate}</Text>
                <Text style={styles.changeText}>Takvimden Seç</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>İşlem KM'si *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="95000"
                    keyboardType="numeric"
                    value={odometer}
                    onChangeText={setOdometer}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Maliyet Tutarı (₺) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="3500"
                    keyboardType="numeric"
                    value={cost}
                    onChangeText={setCost}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Sonraki Bakım Hedef KM'si (İsteğe Bağlı)</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 110000"
                keyboardType="numeric"
                value={nextDueOdo}
                onChangeText={setNextDueOdo}
              />

              <Text style={styles.fieldLabel}>Usta / Servis Notları (Opsiyonel)</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Castrol 5W-30 Edge kullanıldı, fren hidroliği kontrol edildi"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveService}>
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
        selectedDate={serviceDate}
        onSelect={(newDate) => setServiceDate(newDate)}
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
  nextDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
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
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  templateChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedTemplateChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  templateChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  selectedTemplateChipText: {
    color: COLORS.primary,
    fontWeight: '700',
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