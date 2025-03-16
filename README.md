# Özet Geç P! Chrome Eklentisi

![Özet Geç P! İkonu](icons/icon128.png)

Bu Chrome eklentisi, web sayfalarındaki metinleri Gemini AI yardımıyla özetlemenizi sağlar. Hem seçili metinleri hem de tüm sayfayı özetleyebilirsiniz.

## Özellikler

- 🔍 Seçili metni özetleme
- 📄 Tüm sayfayı özetleme
- 🔑 Gemini API entegrasyonu
- 🎨 Modern ve kullanıcı dostu arayüz
- 🔒 Güvenli API anahtarı yönetimi
- 💫 Animasyonlu geçişler
- 📱 Duyarlı tasarım

## Kurulum

1. Bu repoyu bilgisayarınıza klonlayın:
```bash
git clone https://github.com/kullaniciadi/ozet-gec-p.git
```

2. Chrome tarayıcınızda `chrome://extensions/` adresine gidin
3. Sağ üst köşedeki "Geliştirici modu"nu aktif edin
4. "Paketlenmemiş öğe yükle" butonuna tıklayın
5. İndirdiğiniz klasörü seçin

## Kullanım

1. Gemini API Anahtarı Ayarlama:
   - Eklenti simgesine tıklayın
   - API anahtarı bölümünü açın
   - API anahtarınızı girin ve kaydedin
   - API anahtarınız yoksa [AI Studio](https://aistudio.google.com) üzerinden ücretsiz alabilirsiniz

2. Metin Özetleme:
   - Herhangi bir web sayfasında metni seçin
   - Sağ tıklayın ve "Özet Geç" seçeneğine tıklayın
   - Özet ekranda gösterilecektir

3. Sayfa Özetleme:
   - Eklenti simgesine tıklayın
   - "Tüm Sayfayı Özetle" butonuna tıklayın
   - Sayfanın özeti gösterilecektir

## Teknik Detaylar

- Manifest V3 kullanılmıştır
- Content Script ve Background Service Worker ile çalışır
- Modüler JavaScript yapısı
- Shadow DOM ile izole edilmiş CSS
- Güvenli HTML sanitizasyonu

## Dosya Yapısı

```
ozet-gec-p/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── content.js
├── utils.js
├── styles.css
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Güvenlik

- API anahtarı yerel depolama alanında güvenli bir şekilde saklanır
- HTML içeriği sanitize edilerek XSS saldırılarına karşı koruma sağlanır
- Content Security Policy (CSP) ile güvenlik artırılmıştır

## Katkıda Bulunma

1. Bu repoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: Açıklama'`)
4. Branch'inizi push edin (`git push origin feature/yeniOzellik`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Sorularınız veya önerileriniz için bir Issue açabilirsiniz. 
