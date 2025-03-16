// Ana içerik çıkarma fonksiyonu
export function extractPageContent() {
  console.log("extractPageContent başlatıldı");
  
  try {
    // Ana içeriği bul ve temizle
    const mainContent = findMainContent();
    let extractedText = '';
    
    // Başlık ekle
    const title = document.title || '';
    if (title) {
      extractedText += `Başlık: ${title}\n\n`;
    }
    
    // URL ekle
    extractedText += `URL: ${window.location.href}\n\n`;
    
    // H1 başlıkları ekle
    const h1Elements = document.querySelectorAll('h1');
    if (h1Elements.length > 0) {
      extractedText += `Ana Başlık: ${h1Elements[0].textContent.trim()}\n\n`;
    }
    
    // Ana içeriği ekle
    const cleanedContent = cleanAndFormat(mainContent);
    console.log("Temizlenmiş içerik uzunluğu:", cleanedContent.length);
    
    if (cleanedContent.length < 50) {
      console.log("İçerik çok kısa, alternatif yöntem deneniyor");
      // Alternatif yöntem: Tüm paragrafları topla
      const allParagraphs = document.querySelectorAll('p');
      let paragraphText = '';
      allParagraphs.forEach(p => {
        paragraphText += p.textContent.trim() + '\n\n';
      });
      
      if (paragraphText.length > 50) {
        extractedText += `İçerik:\n${paragraphText}`;
      } else {
        // Son çare: Görünür tüm metni al
        extractedText += `İçerik:\n${document.body.innerText}`;
      }
    } else {
      extractedText += `İçerik:\n${cleanedContent}`;
    }
    
    // Karakter limitini kontrol et
    if (extractedText.length > 30000) {
      extractedText = extractedText.substring(0, 30000) + '...';
    }
    
    console.log("Çıkarılan metin uzunluğu:", extractedText.length);
    
    if (extractedText.length < 100) {
      console.log("Çıkarılan metin çok kısa, içerik bulunamadı olarak değerlendirilebilir");
    }
    
    return extractedText;
  } catch (error) {
    console.error("İçerik çıkarma hatası:", error);
    return "Hata: " + error.message;
  }
}

// Basit içerik çıkarma fonksiyonu
export function extractPageContentSimple() {
  console.log("Basit içerik çıkarma başlatıldı");
  
  try {
    // Başlık
    const title = document.title || '';
    let extractedText = '';
    
    if (title) {
      extractedText += `Başlık: ${title}\n\n`;
    }
    
    // URL
    extractedText += `URL: ${window.location.href}\n\n`;
    
    // Meta açıklama
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && metaDescription.content) {
      extractedText += `Açıklama: ${metaDescription.content}\n\n`;
    }
    
    // Tüm görünür metni topla
    const bodyText = document.body.innerText;
    
    // Çok uzun metni kısalt
    const maxLength = 30000;
    let contentText = bodyText;
    
    if (contentText.length > maxLength) {
      contentText = contentText.substring(0, maxLength) + '...';
    }
    
    extractedText += `İçerik:\n${contentText}`;
    console.log("Basit içerik çıkarma tamamlandı, uzunluk:", extractedText.length);
    
    return extractedText;
  } catch (error) {
    console.error("Basit içerik çıkarma hatası:", error);
    return "Hata: " + error.message;
  }
}

// Ana içeriği bulma fonksiyonu
function findMainContent() {
  console.log("findMainContent başlatıldı");
  
  // Olası içerik elementleri
  const possibleContentElements = [
    document.querySelector('article'),
    document.querySelector('main'),
    document.querySelector('.content'),
    document.querySelector('#content'),
    document.querySelector('.post'),
    document.querySelector('.article'),
    document.querySelector('.entry-content'),
    document.querySelector('.post-content')
  ].filter(el => el);
  
  console.log("Bulunan olası içerik elementleri:", possibleContentElements.length);
  
  // En büyük içerik alanını bul
  if (possibleContentElements.length > 0) {
    const largestElement = possibleContentElements.reduce((largest, current) => {
      return (current.textContent.length > largest.textContent.length) ? current : largest;
    });
    console.log("En büyük içerik elementi bulundu, uzunluk:", largestElement.textContent.length);
    return largestElement;
  }
  
  // Eğer belirlenmiş elementler bulunamadıysa, en fazla paragraf içeren div'i bul
  const divs = Array.from(document.querySelectorAll('div'));
  console.log("Toplam div sayısı:", divs.length);
  
  const contentDivs = divs.filter(div => {
    const paragraphs = div.querySelectorAll('p');
    return paragraphs.length >= 3;
  });
  
  console.log("En az 3 paragraf içeren div sayısı:", contentDivs.length);
  
  if (contentDivs.length > 0) {
    const largestContentDiv = contentDivs.reduce((largest, current) => {
      return (current.textContent.length > largest.textContent.length) ? current : largest;
    });
    console.log("En büyük içerik div'i bulundu, uzunluk:", largestContentDiv.textContent.length);
    return largestContentDiv;
  }
  
  // Hiçbir şey bulunamazsa body döndür
  console.log("Özel içerik elementi bulunamadı, body kullanılıyor");
  return document.body;
}

// İçerik temizleme ve formatlama fonksiyonu
function cleanAndFormat(element) {
  // Element yoksa boş string döndür
  if (!element) {
    console.log("Element bulunamadı, boş string döndürülüyor");
    return '';
  }
  
  // Element bir node değilse metni döndür
  if (element.nodeType === Node.TEXT_NODE) {
    return element.textContent.trim();
  }
  
  try {
    // Görünmeyen elementleri atla
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return '';
    }
  } catch (error) {
    console.log("getComputedStyle hatası:", error.message);
  }
  
  // Gereksiz elementleri atla
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  if (['nav', 'footer', 'header', 'aside', 'style', 'script', 'noscript', 'iframe', 'svg', 'button', 'form'].includes(tagName)) {
    return '';
  }
  
  // Banner, reklam, yorum vb. sınıfları atla
  const classId = (element.className || '') + ' ' + (element.id || '');
  const skipPatterns = ['banner', 'ad', 'ads', 'sidebar', 'comment', 'promo', 'related', 'share', 'social', 'widget', 'cookie', 'popup', 'newsletter'];
  if (skipPatterns.some(pattern => classId.toLowerCase().includes(pattern))) {
    return '';
  }
  
  // Alt elementlerden metin topla
  let text = '';
  for (const child of element.childNodes) {
    text += cleanAndFormat(child) + ' ';
  }
  
  // Fazla boşlukları temizle
  return text.replace(/\s+/g, ' ').trim();
} 