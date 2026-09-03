// src/screens/AnalyticsScreen.tsx
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import {
  getActiveVehicleId,
  getVehicles,
  getFuelEntries,
  getServiceRecords,
  calculateAverageConsumption,
} from '../services/storageService';
import { Vehicle, FuelEntry, ServiceRecord } from '../types/vehicle';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const AnalyticsScreen = () => {
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [avgConsumption, setAvgConsumption] = useState<number | null>(null);

  const isEV = vehicle?.fuelType === 'electric';
  const unitLabel = isEV ? 'kWh' : 'L';

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const activeId = await getActiveVehicleId();
    const list = await getVehicles();
    const current = list.find((v) => v.id === activeId) || list[0] || null;
    setVehicle(current);

    if (current) {
      const fuels = await getFuelEntries(current.id);
      const services = await getServiceRecords(current.id);
      setFuelEntries(fuels);
      setServiceRecords(services);
      setAvgConsumption(calculateAverageConsumption(fuels));
    } else {
      setFuelEntries([]);
      setServiceRecords([]);
      setAvgConsumption(null);
    }
  };

  const getConsumptionChartData = () => {
    const fullTanks = fuelEntries
      .filter((e) => e.isFullTank)
      .sort((a, b) => a.odometer - b.odometer);

    if (fullTanks.length < 2) return [];

    const dataPoints: { value: number; label: string; dataPointText?: string }[] = [];

    for (let i = 1; i < fullTanks.length; i++) {
      const prev = fullTanks[i - 1];
      const curr = fullTanks[i];
      const kmDiff = curr.odometer - prev.odometer;

      if (kmDiff > 0) {
        const val = Number(((curr.liters / kmDiff) * 100).toFixed(1));
        const dateParts = curr.date.split('-');
        const shortDate = `${dateParts[2]}/${dateParts[1]}`;
        dataPoints.push({
          value: val,
          label: shortDate,
          dataPointText: String(val),
        });
      }
    }
    return dataPoints;
  };

  const totalFuelCost = fuelEntries.reduce((sum, f) => sum + f.totalPrice, 0);
  const totalServiceCost = serviceRecords.reduce((sum, s) => sum + s.cost, 0);
  const grandTotalCost = totalFuelCost + totalServiceCost;

  const costComparisonData = [
    {
      value: totalFuelCost,
      label: isEV ? 'Şarj' : 'Yakıt',
      frontColor: isEV ? '#059669' : COLORS.secondary,
      topLabelComponent: () => (
        <Text style={styles.barTopLabel}>{totalFuelCost.toLocaleString('tr-TR')} ₺</Text>
      ),
    },
    {
      value: totalServiceCost,
      label: 'Bakım',
      frontColor: COLORS.primary,
      topLabelComponent: () => (
        <Text style={styles.barTopLabel}>{totalServiceCost.toLocaleString('tr-TR')} ₺</Text>
      ),
    },
  ];

  const consumptionData = getConsumptionChartData();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }]}>
      {/* Sade, Ferah & Büyük Başlık */}
      <View style={styles.header}>
        <Text style={styles.title}>Analiz</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {!vehicle ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={40} color={COLORS.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>Analiz İçin Araç Gerekli</Text>
            <Text style={styles.emptySub}>Lütfen Gösterge sekmesinden ilk aracınızı kaydedin.</Text>
          </View>
        ) : (
          <>
            {/* 3'lü Özet İstatistik Kartı */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Ortalama</Text>
                <Text style={styles.summaryValue}>
                  {avgConsumption ? `${avgConsumption}` : '- -'}
                </Text>
                <Text style={styles.summarySub}>{unitLabel} / 100 km</Text>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>{isEV ? 'Şarj Masrafı' : 'Yakıt Masrafı'}</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: isEV ? '#059669' : COLORS.secondary },
                  ]}
                >
                  {totalFuelCost.toLocaleString('tr-TR')}
                </Text>
                <Text style={styles.summarySub}>TL Toplam</Text>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Genel Masraf</Text>
                <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
                  {grandTotalCost.toLocaleString('tr-TR')}
                </Text>
                <Text style={styles.summarySub}>{isEV ? 'Şarj + Servis' : 'Yakıt + Servis'}</Text>
              </View>
            </View>

            {/* Tüketim Çizgi Grafiği */}
            <Text style={styles.sectionHeading}>
              Tüketim Trendi ({unitLabel} / 100 km)
            </Text>
            <View style={styles.chartCard}>
              {consumptionData.length >= 1 ? (
                <LineChart
                  data={consumptionData}
                  width={SCREEN_WIDTH - 80}
                  height={190}
                  color={isEV ? '#059669' : COLORS.primary}
                  thickness={3}
                  startFillColor={isEV ? 'rgba(5, 150, 105, 0.25)' : 'rgba(2, 132, 199, 0.25)'}
                  endFillColor={isEV ? 'rgba(5, 150, 105, 0.01)' : 'rgba(2, 132, 199, 0.01)'}
                  areaChart
                  isAnimated
                  textColor1={COLORS.textPrimary}
                  textFontSize1={11}
                  dataPointsColor={isEV ? '#059669' : COLORS.primary}
                  dataPointsRadius={5}
                  xAxisColor={COLORS.border}
                  yAxisColor={COLORS.border}
                  yAxisTextStyle={{ color: COLORS.textLight, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: COLORS.textLight, fontSize: 10 }}
                  noOfSections={4}
                />
              ) : (
                <View style={styles.chartEmptyNotice}>
                  <Ionicons name="information-circle-outline" size={24} color={COLORS.textLight} />
                  <Text style={styles.chartEmptyText}>
                    Trend grafiğinin oluşması için en az 2 adet {isEV ? '"%100 Şarj"' : '"Full Dolum"'} kaydı gereklidir.
                  </Text>
                </View>
              )}
            </View>

            {/* Gider Dağılım Çubuk Grafiği */}
            <Text style={styles.sectionHeading}>Maliyet Dağılımı</Text>
            <View style={styles.chartCard}>
              {grandTotalCost > 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 20 }}>
                  <BarChart
                    data={costComparisonData}
                    width={SCREEN_WIDTH - 120}
                    height={160}
                    barWidth={44}
                    spacing={60}
                    roundedTop
                    isAnimated
                    xAxisColor={COLORS.border}
                    yAxisColor={COLORS.border}
                    yAxisTextStyle={{ color: COLORS.textLight, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' }}
                    noOfSections={3}
                  />
                </View>
              ) : (
                <View style={styles.chartEmptyNotice}>
                  <Ionicons name="receipt-outline" size={24} color={COLORS.textLight} />
                  <Text style={styles.chartEmptyText}>
                    Henüz kaydedilmiş {isEV ? 'şarj' : 'yakıt'} veya servis masrafı bulunmuyor.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: SPACING.md,
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  summarySub: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs + 2,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    alignItems: 'center',
  },
  chartEmptyNotice: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  chartEmptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  barTopLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
});