// src/screens/GuideScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import {
  WARNING_LIGHTS,
  COMMON_OBD_CODES,
  WarningLight,
  ObdCode,
} from '../constants/vehicleGuideData';

type GuideTab = 'lights' | 'obd';
type SeverityFilter = 'all' | 'critical' | 'warning' | 'electric';

export const GuideScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<GuideTab>('lights');

  // İkaz Lambaları Filtreleri
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  // OBD-II Arama State
  const [obdQuery, setObdQuery] = useState('');

  // Lambaları filtreleme
  const filteredLights = WARNING_LIGHTS.filter((item) => {
    if (severityFilter === 'all') return true;
    if (severityFilter === 'critical') return item.severity === 'critical';
    if (severityFilter === 'warning') return item.severity === 'warning';
    if (severityFilter === 'electric') return item.category === 'electric';
    return true;
  });

  // OBD kodlarını filtreleme
  const filteredObdCodes = COMMON_OBD_CODES.filter(
    (item) =>
      item.code.toLowerCase().includes(obdQuery.toLowerCase().trim()) ||
      item.titleTr.toLowerCase().includes(obdQuery.toLowerCase().trim()) ||
      item.system.toLowerCase().includes(obdQuery.toLowerCase().trim())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }]}>
      {/* Büyük Başlık */}
      <View style={styles.header}>
        <Text style={styles.title}>Rehber & Arıza</Text>
      </View>

      {/* Üst Tab Bar (İkaz Lambaları / OBD-II Kodları) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'lights' && styles.tabBtnActive]}
          onPress={() => setActiveTab('lights')}
        >
          <Ionicons
            name="warning"
            size={16}
            color={activeTab === 'lights' ? COLORS.primary : COLORS.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabBtnText, activeTab === 'lights' && styles.tabBtnTextActive]}>
            İkaz Lambaları
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'obd' && styles.tabBtnActive]}
          onPress={() => setActiveTab('obd')}
        >
          <Ionicons
            name="hardware-chip"
            size={16}
            color={activeTab === 'obd' ? COLORS.primary : COLORS.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabBtnText, activeTab === 'obd' && styles.tabBtnTextActive]}>
            OBD-II Arama
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'lights' ? (
          /* ==================================================== */
          /* 1. İKAZ LAMBALARI BÖLÜMÜ                             */
          /* ==================================================== */
          <>
            {/* Filtre Çipleri */}
            <View style={styles.filterChipsRow}>
              <TouchableOpacity
                style={[styles.chip, severityFilter === 'all' && styles.chipActive]}
                onPress={() => setSeverityFilter('all')}
              >
                <Text style={[styles.chipText, severityFilter === 'all' && styles.chipTextActive]}>
                  Tümü ({WARNING_LIGHTS.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, severityFilter === 'critical' && styles.chipActiveRed]}
                onPress={() => setSeverityFilter('critical')}
              >
                <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.chipText, severityFilter === 'critical' && { color: '#EF4444', fontWeight: '800' }]}>
                  Kritik (Kırmızı)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, severityFilter === 'warning' && styles.chipActiveAmber]}
                onPress={() => setSeverityFilter('warning')}
              >
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.chipText, severityFilter === 'warning' && { color: '#D97706', fontWeight: '800' }]}>
                  Uyarı (Sarı)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, severityFilter === 'electric' && styles.chipActiveGreen]}
                onPress={() => setSeverityFilter('electric')}
              >
                <Ionicons name="flash" size={11} color="#059669" style={{ marginRight: 4 }} />
                <Text style={[styles.chipText, severityFilter === 'electric' && { color: '#059669', fontWeight: '800' }]}>
                  Elektrikli (EV)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Liste */}
            {filteredLights.map((light: WarningLight) => {
              const isCritical = light.severity === 'critical';
              return (
                <View key={light.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.lightIconBadge,
                        { backgroundColor: isCritical ? '#FEE2E2' : '#FEF3C7' },
                      ]}
                    >
                      <Ionicons
                        name={light.iconName as any}
                        size={20}
                        color={isCritical ? '#DC2626' : '#D97706'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{light.name}</Text>
                      <Text
                        style={[
                          styles.severityLabel,
                          { color: isCritical ? '#DC2626' : '#D97706' },
                        ]}
                      >
                        {isCritical ? '🔴 Acil Durdurma Gerektirir' : '🟡 Uyarı - Servise Başvurun'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.meaningRow}>
                    <Text style={styles.guideSubTitle}>Ne Anlama Gelir?</Text>
                    <Text style={styles.guideDesc}>{light.meaning}</Text>
                  </View>

                  <View style={styles.actionBox}>
                    <Ionicons name="hand-right" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.actionText}>{light.action}</Text>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          /* ==================================================== */
          /* 2. OBD-II HATA KODU ARAMA MOTORU                     */
          /* ==================================================== */
          <>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Kod veya arıza ara (örn: P0300, katalizör, tekleme)"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={obdQuery}
                onChangeText={setObdQuery}
              />
              {obdQuery.length > 0 && (
                <TouchableOpacity onPress={() => setObdQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {filteredObdCodes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="search-outline" size={36} color="#CBD5E1" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyTitle}>Kod Bulunamadı</Text>
                <Text style={styles.emptySub}>
                  Aradığınız kod standart veri setimizde yer almıyor olabilir. (Örnek: P0300, P0420, P0171)
                </Text>
              </View>
            ) : (
              filteredObdCodes.map((item: ObdCode) => (
                <View key={item.code} style={styles.obdCard}>
                  <View style={styles.obdTopRow}>
                    <View style={styles.obdCodeBadge}>
                      <Text style={styles.obdCodeText}>{item.code}</Text>
                    </View>
                    <View style={styles.systemBadge}>
                      <Text style={styles.systemBadgeText}>{item.system}</Text>
                    </View>
                  </View>

                  <Text style={styles.obdTitle}>{item.titleTr}</Text>

                  <Text style={styles.obdSectionHeader}>Olası Nedenler:</Text>
                  {item.causes.map((c, i) => (
                    <Text key={i} style={styles.bulletItem}>
                      • {c}
                    </Text>
                  ))}

                  <View style={styles.solutionBox}>
                    <Text style={styles.solutionLabel}>💡 Önerilen Çözüm Adımı:</Text>
                    <Text style={styles.solutionText}>{item.solution}</Text>
                  </View>
                </View>
              ))
            )}
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
    paddingBottom: SPACING.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: SPACING.md,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipActiveRed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  chipActiveAmber: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  chipActiveGreen: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  chipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  severityLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  meaningRow: {
    marginBottom: 8,
  },
  guideSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  guideDesc: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 2,
    lineHeight: 17,
  },
  actionBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    lineHeight: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  obdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  obdTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  obdCodeBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  obdCodeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  systemBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  systemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  obdTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  obdSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: 4,
  },
  bulletItem: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginLeft: 4,
  },
  solutionBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: 10,
  },
  solutionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 2,
  },
  solutionText: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
  },
});