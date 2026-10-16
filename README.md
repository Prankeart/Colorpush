# Optik Transfer

İnternet ve Bluetooth olmadan, sadece **ekran + kamera** ile veri aktarımı.

## Nasıl Çalışır?
1. **Verici** telefondaki sayfada metin yazılır ve "Başlat"a basılır
2. Metin byte'lara, byte'lar 4 renkli 8×8 karelere dönüştürülür
3. Ekranda saniyede 5 kare hızında döner
4. **Alıcı** telefondaki sayfa kamerayı açar
5. İki telefon 5–15 cm mesafede karşı karşıya tutulur
6. Alıcı kareleri okur, CRC16 ile doğrular, veriyi birleştirir
7. Tüm frame'ler alınınca metin ekranda belirir

## Protokol
Her frame 16 byte = 8×8 hücre × 2 bit/hücre (4 renk)

| Byte | İçerik |
|------|--------|
| 0–1  | Frame index (uint16) |
| 2–3  | Toplam frame sayısı |
| 4–5  | Toplam veri uzunluğu |
| 6–13 | 8 byte veri |
| 14–15| CRC16-CCITT |

**Renkler:** Siyah(00), Kırmızı(01), Yeşil(10), Beyaz(11)

## GitHub Pages'e Deploy
1. Bu dosyaları bir repo'ya push'la
2. **Settings → Pages → Branch: main / root**
3. `https://kullanıcıadı.github.io/repo-adı/` adresinden aç
4. Kamera erişimi için **HTTPS zorunlu** (Pages zaten HTTPS sağlar)

## Test İpuçları
- Verici ekran parlaklığı **maksimum** olsun
- Karanlık bir odada test et (ortam ışığı yansımaları bozar)
- Telefonları 10–15 cm mesafede tut
- Titremeyi önlemek için verici telefonu masaya yatay koy
- Alıcıdaki kesikli mavi kareyi ekrandaki grid ile hizala

## Yol Haritası
- [x] v0.1 — 4 renk, 8×8 grid, metin transferi, CRC16
- [ ] v0.2 — Renk kalibrasyon şeridi (ortam ışığı düzeltme)
- [ ] v0.3 — Perspektif düzeltme (köşe bulucular)
- [ ] v0.4 — 8 renk (3 bit/hücre) → daha hızlı
- [ ] v0.5 — Fountain code (frame kaybı toleransı)
- [ ] v0.6 — Resim/dosya transferi
- [ ] v0.7 — WebGL ile hız optimizasyonu