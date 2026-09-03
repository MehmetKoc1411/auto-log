# 🚗 AutoLog - Araç Bakım & Yakıt Verimliliği Takip Sistemi

**AutoLog**, araç sahiplerinin yakıt alımlarını, kilometre geçmişini ve periyodik servis/muayene periyotlarını çevrimdışı (offline-first) olarak takip etmelerini sağlayan, tüketim verilerini grafiklere döken modern bir React Native & Expo mobil uygulamasıdır.

---

## 🌟 Temel Özellikler

- **🚘 Çoklu Araç Garajı:** Plaka, marka, model, model yılı ve yakıt türüne göre (Benzin, Dizel, Benzin / LPG, Hibrit, Elektrik) birden fazla araç yönetimi.
- **⛽ Akıllı Yakıt Günlüğü:**
  - Depo tam dolumu yapıldığında iki alım arasındaki $\Delta \text{KM}$ üzerinden otomatik $L/100\text{ km}$ tüketim hesabı.
  - Alınan litre ve toplam tutardan anlık litre birim fiyatı hesaplama.
- **🛠️ Periyodik Bakım & Masraf Takibi:**
  - Yağ/filtre değişimi, fren balataları, muayene ve sigorta için hızlı şablonlar.
  - Hedef kilometre belirleme (Örn: +15.000 km) ve kalan kilometre sayacı.
- **📊 Gelişmiş Grafikler & Analiz:**
  - Tüketim trendi çizgi grafiği (`LineChart`).
  - Yakıt vs. Servis harcamaları karşılaştırmalı çubuk grafiği (`BarChart`).
- **🔒 Güvenli & Çevrimdışı (Offline-First):** Tüm veriler cihaz üzerinde `AsyncStorage` ile güvenle saklanır, internet bağlantısı gerektirmez.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Framework:** React Native (Expo SDK 51+)
- **Dil:** TypeScript
- **Navigasyon:** React Navigation v6 (Bottom Tabs)
- **Grafikler:** `react-native-gifted-charts`, `react-native-svg`, `expo-linear-gradient`
- **Depolama:** `@react-native-async-storage/async-storage`
- **Tasarım:** Custom Modern SaaS UI (`#F8FAFC` slate arka plan, pastel aksiyon kartları, `Ionicons`)

---

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için:

1. Depoyu klonlayın:
   ```bash
   git clone [https://github.com/](https://github.com/)<KULLANICI_ADIN>/autolog-app.git
   cd autolog-app

   npm install
   npx expo start

   ---

### Adım 22: Son Değişiklikleri GitHub'a Gönderme

Terminalde son adımı tamamlayalım:

```bash
git add src/services/storageService.ts README.md
git commit -m "docs: complete comprehensive README and add vehicle deletion service"
git push
