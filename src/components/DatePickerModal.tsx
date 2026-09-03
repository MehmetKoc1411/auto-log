// src/components/DatePickerModal.tsx
import React from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Text } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { COLORS, SPACING } from '../constants/theme';

// Türkçe takvim yerelleştirmesi
LocaleConfig.locales['tr'] = {
  monthNames: [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ],
  monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: string; // YYYY-MM-DD
  onSelect: (dateString: string) => void;
  onClose: () => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  selectedDate,
  onSelect,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>📅 Tarih Seçin</Text>
          <Calendar
            current={selectedDate}
            maxDate={new Date().toISOString().split('T')[0]}
            onDayPress={(day: { dateString: string }) => {
              onSelect(day.dateString);
              onClose();
            }}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: COLORS.primary,
              },
            }}
            theme={{
              todayTextColor: COLORS.secondary,
              arrowColor: COLORS.primary,
              textDayFontWeight: '600',
              textMonthFontWeight: '800',
              textDayHeaderFontWeight: '700',
            }}
          />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: SPACING.md,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: SPACING.sm,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
});