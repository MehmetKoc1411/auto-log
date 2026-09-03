// src/constants/vehicleGuideData.ts

export interface WarningLight {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  iconName: string;
  category: 'all' | 'engine' | 'safety' | 'electric';
  meaning: string;
  action: string;
}

export interface ObdCode {
  code: string;
  titleTr: string;
  system: 'Motor / Yakıt' | 'Ateşleme' | 'Emisyon / Egzoz' | 'Sensörler' | 'Şanzıman / Elektrik';
  causes: string[];
  solution: string;
}

export const WARNING_LIGHTS: WarningLight[] = [
  // KRİTİK (KIRMIZI)
  {
    id: 'wl_oil',
    name: 'Motor Yağ Basıncı Uyarısı',
    severity: 'critical',
    iconName: 'water',
    category: 'engine',
    meaning: 'Motor yağ basıncı tehlikeli seviyede düştü. Yağlama yetersiz.',
    action: 'Aracı derhal güvenli bir yere çekip motoru durdurun. Yağ seviyesini kontrol edin, devam etmeyin.',
  },
  {
    id: 'wl_temp',
    name: 'Motor Hararet / Soğutma Sıvısı',
    severity: 'critical',
    iconName: 'thermometer',
    category: 'engine',
    meaning: 'Motor soğutma suyu aşırı ısındı veya sıvı seviyesi kritik derecede düşük.',
    action: 'Kontağı kapatın, motorun soğumasını bekleyin. Sıcakken radyatör kapağını kesinlikle açmayın.',
  },
  {
    id: 'wl_brake',
    name: 'Fren Sistemi / Hidrolik Arızası',
    severity: 'critical',
    iconName: 'alert-circle',
    category: 'safety',
    meaning: 'Fren hidrolik seviyesi düşük veya elektronik fren dağılımında (EBD) arıza var.',
    action: 'Fren tepkisini dikkatlice test edin. Güvenli şekilde durun, hidrolik seviyesini kontrol edin.',
  },
  {
    id: 'wl_battery',
    name: 'Şarj / Akü Sistemi Arızası',
    severity: 'critical',
    iconName: 'battery-dead',
    category: 'engine',
    meaning: 'Alternatör (şarj dinamosu) aküyü şarj etmiyor ya da V kayışı kopmuş olabilir.',
    action: 'Gereksiz elektrik tüketen cihazları (klima, radyo) kapatın, en yakın oto elektrikçiye sürün.',
  },

  // UYARI (SARI / TURUNCU)
  {
    id: 'wl_check_engine',
    name: 'Motor Arıza Lambası (Check Engine)',
    severity: 'warning',
    iconName: 'construct',
    category: 'engine',
    meaning: 'Motor yönetim veya egzoz emisyon sisteminde bir arıza kodu (OBD-II) tespit edildi.',
    action: 'Yanıp sönmüyorsa aracı zorlamadan sürebilirsiniz. En kısa sürede OBD cihazı ile hata kodunu okutun.',
  },
  {
    id: 'wl_dpf',
    name: 'Dizel Partikül Filtresi (DPF)',
    severity: 'warning',
    iconName: 'cloud',
    category: 'engine',
    meaning: 'Dizel partikül filtresi kurumla tıkandı, rejenerasyon yapılması gerekiyor.',
    action: 'Aracı çevre yolunda 2000-2500 devir bandında kesintisiz 20-30 dakika kullanarak rejenerasyonu tamamlayın.',
  },
  {
    id: 'wl_epc',
    name: 'EPC (Elektronik Güç Kontrolü)',
    severity: 'warning',
    iconName: 'speedometer',
    category: 'engine',
    meaning: 'Gaz kelebeği, gaz pedalı potansiyometresi veya ateşleme sisteminde elektronik aksaklık.',
    action: 'Araç güç kısıtlamasına (limp mode) geçebilir. Servise giderek sensör kontrolü yaptırın.',
  },
  {
    id: 'wl_tpms',
    name: 'Lastik Basınç Uyarısı (TPMS)',
    severity: 'warning',
    iconName: 'disc',
    category: 'safety',
    meaning: 'En az bir lastiğin hava basıncı belirlenen eşiğin altına indi.',
    action: 'En yakın benzinlikte tüm lastiklerin PSI/Bar değerlerini üretici etiketine göre ayarlayın.',
  },
  {
    id: 'wl_abs_esp',
    name: 'ABS / ESP Çekiş Kontrolü',
    severity: 'warning',
    iconName: 'shield',
    category: 'safety',
    meaning: 'Elektronik denge kontrolü veya tekerlek devir sensörlerinden birinde arıza var.',
    action: 'Normal frenler çalışır fakat ani frenlerde tekerlekler kilitlenebilir. Kaygan zeminde dikkatli sürün.',
  },

  // ELEKTRİKLİ ARAÇ (EV) ÖZEL
  {
    id: 'wl_ev_power',
    name: 'Sınırlı Sürüş Gücü (Kaplumbağa Modu)',
    severity: 'warning',
    iconName: 'flash-off',
    category: 'electric',
    meaning: 'Batarya şarjı kritik derecede düşük veya batarya aşırı ısındığı için güç sınırlandırıldı.',
    action: 'Sakin sürüşle derhal en yakın AC/DC şarj istasyonuna yönelin.',
  },
  {
    id: 'wl_ev_high_voltage',
    name: 'Yüksek Voltaj Sistemi Uyarısı',
    severity: 'critical',
    iconName: 'flash',
    category: 'electric',
    meaning: 'EV batarya paketi, inverter veya şarj modülünde elektrik kaçağı/sistem hatası tespit edildi.',
    action: 'Aracı güvenli alana çekip kapatın. Turuncu yüksek voltaj kablolarına kesinlikle dokunmayın, çekici çağırın.',
  },
];

export const COMMON_OBD_CODES: ObdCode[] = [
  {
    code: 'P0300',
    titleTr: 'Rastgele / Çoklu Silindirde Tekleme (Misfire)',
    system: 'Ateşleme',
    causes: ['Aşınmış bujiler', 'Arızalı ateşleme bobinleri', 'Düşük yakıt basıncı', 'Hava kaçağı'],
    solution: 'Buji ve bobinler kontrol edilmeli, gerekirse takım halinde yenilenmelidir.',
  },
  {
    code: 'P0420',
    titleTr: 'Katalitik Konvertör Verimliliği Eşik Altında (Bank 1)',
    system: 'Emisyon / Egzoz',
    causes: ['Ömrünü tamamlamış katalizör', 'Arızalı Oksijen (Lambda) sensörü', 'Egzoz manifoldu sızıntısı'],
    solution: 'Önce oksijen sensörü voltajı kontrol edilmeli; sorun devam ederse katalizör temizlenmeli veya değişmelidir.',
  },
  {
    code: 'P0171',
    titleTr: 'Sistem Çok Fakir (System Too Lean - Bank 1)',
    system: 'Motor / Yakıt',
    causes: ['MAF (Hava akış) sensörü kirliliği', 'Vakum/hava emiş hortumu çatlağı', 'Tıkalı yakıt filtresi'],
    solution: 'MAF sensörünü özel sprey ile temizleyin, emiş manifoldu hortumlarında hava kaçağı arayın.',
  },
  {
    code: 'P0101',
    titleTr: 'Hava Akış (MAF) Sensörü Devre / Performans Sorunu',
    system: 'Sensörler',
    causes: ['Kirli hava filtresi', 'MAF sensörü soket gevşekliği', 'Yağlanmış sensör teli'],
    solution: 'Hava filtresini yenileyin, MAF soket bağlantısını ve sensör temizliğini kontrol edin.',
  },
  {
    code: 'P0113',
    titleTr: 'Emme Havası Sıcaklık Sensörü (IAT) Yüksek Giriş',
    system: 'Sensörler',
    causes: ['Sensör kablosu kopukluğu', 'IAT sensörü arızası'],
    solution: 'Soket temasını ölçün, sensör direncini multimetre ile test edin.',
  },
  {
    code: 'P0401',
    titleTr: 'EGR Valfi Yetersiz Akış Algılandı',
    system: 'Emisyon / Egzoz',
    causes: ['Kurum bağlamış EGR valfi', 'Tıkalı EGR borusu'],
    solution: 'EGR valfini söküp kurum çözücü ile temizleyin veya diyaframını kontrol edin.',
  },
  {
    code: 'P0500',
    titleTr: 'Araç Hız Sensörü (VSS) Arızası',
    system: 'Şanzıman / Elektrik',
    causes: ['Hız sensörü arızası', 'ABS modülü veri iletişim kopukluğu'],
    solution: 'Tekerlek ABS sensörleri ve şanzıman hız sensörü kablolaması taranmalıdır.',
  },
  {
    code: 'P0700',
    titleTr: 'Otomatik Şanzıman Kontrol Sistemi Hatası (TCM)',
    system: 'Şanzıman / Elektrik',
    causes: ['Şanzıman solenoid arızası', 'Düşük şanzıman yağı seviyesi', 'TCM iletişim hatası'],
    solution: 'Şanzıman yağ seviyesini ve rengini kontrol edin, şanzıman beynini yetkili serviste okutun.',
  },
];