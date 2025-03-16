import { sanitizeHTML, summarizeWithGemini, showStatus } from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-api-key');
  const summarizePageButton = document.getElementById('summarize-page');
  const summaryResult = document.getElementById('summary-result');
  const summaryContent = document.getElementById('summary-content');
  const statusDiv = document.getElementById('status');
  const apiKeySection = document.getElementById('api-key-section');
  const toggleApiKey = document.getElementById('toggle-api-key');
  const apiKeyIndicator = document.getElementById('api-key-indicator');
  const summarizeSection = document.getElementById('summarize-section');
  const newSummaryButton = document.getElementById('new-summary');
  const usageSection = document.getElementById('usage-section');
  
  // API anahtarını storage'dan yükle ve UI'ı güncelle
  chrome.storage.sync.get(['geminiApiKey'], function(result) {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
      apiKeyIndicator.textContent = '✓';
      apiKeyIndicator.classList.add('valid');
      apiKeySection.classList.add('collapsed');
      toggleApiKey.classList.remove('rotated');
    }
  });
  
  // API key section toggle
  toggleApiKey.addEventListener('click', function() {
    apiKeySection.classList.toggle('collapsed');
    toggleApiKey.classList.toggle('rotated');
  });
  
  // Yeni özet butonu
  newSummaryButton.addEventListener('click', function() {
    summaryResult.classList.add('hidden');
    summarizeSection.classList.remove('hidden');
    usageSection.classList.remove('hidden');
    summaryContent.innerHTML = '';
  });
  
  // API anahtarını kaydet
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Lütfen bir API anahtarı girin!', 'error', statusDiv);
      return;
    }
    
    chrome.storage.sync.set({ geminiApiKey: apiKey }, function() {
      showStatus('API anahtarı başarıyla kaydedildi!', 'success', statusDiv);
      apiKeyIndicator.textContent = '✓';
      apiKeyIndicator.classList.add('valid');
      apiKeySection.classList.add('collapsed');
      toggleApiKey.classList.remove('rotated');
    });
  });
  
  // Tüm sayfayı özetle
  summarizePageButton.addEventListener('click', async function() {
    chrome.storage.sync.get(['geminiApiKey'], async function(result) {
      if (!result.geminiApiKey) {
        showStatus('Lütfen önce API anahtarınızı kaydedin!', 'error', statusDiv);
        return;
      }
      
      // Aktif sekmeyi al
      chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        const currentTab = tabs[0];
        
        // Loading durumunu göster
        summarizeSection.classList.add('hidden');
        usageSection.classList.add('hidden');
        summaryContent.innerHTML = '<div class="loading-spinner"></div>';
        summaryResult.classList.remove('hidden');
        
        try {
          // İlk olarak gelişmiş içerik çıkarma yöntemini dene
          const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            function: extractPageContent,
            world: "MAIN"
          });
          
          let pageContent;
          
          if (!results || !results[0] || !results[0].result || 
              results[0].result.length < 100 || results[0].result.startsWith("Hata:")) {
            
            console.log("Gelişmiş içerik çıkarma başarısız, basit yöntem deneniyor");
            
            // Gelişmiş yöntem başarısız olursa basit yöntemi dene
            const simpleResults = await chrome.scripting.executeScript({
              target: { tabId: currentTab.id },
              function: extractPageContentSimple,
              world: "MAIN"
            });
            
            if (!simpleResults || !simpleResults[0] || !simpleResults[0].result || 
                simpleResults[0].result.length < 100) {
              throw new Error('Sayfa içeriği alınamadı veya çok kısa!');
            }
            
            pageContent = simpleResults[0].result;
          } else {
            pageContent = results[0].result;
          }
          
          // Gemini API ile özet çıkar
          const summaryText = await summarizeWithGemini(pageContent, result.geminiApiKey);
          const sanitizedHTML = sanitizeHTML(summaryText);
          
          // Özet içeriğini göster
          summaryContent.innerHTML = sanitizedHTML;
          summaryResult.classList.remove('hidden');
          
        } catch (error) {
          showStatus(`Hata: ${error.message}`, 'error', statusDiv);
          summaryResult.classList.add('hidden');
          summarizeSection.classList.remove('hidden');
          usageSection.classList.remove('hidden');
        }
      });
    });
  });
  
  // Gemini API ile özetle
  async function summarizeWithGemini(text, apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-exp-1206:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
              text: `Aşağıdaki web sayfası içeriğini özetleyip HTML formatında dön. Markdown KULLANMA, doğrudan HTML etiketleri kullan. Cevabına \`\`\`html veya benzeri markdown etiketleri ekleme, doğrudan <h3>, <p>, <ul>, <li>, <b>, <i> gibi HTML etiketleri ile başla. Özetin kısa ve anlaşılır olsun:\n\n${text}`
            }]
          }],
          generationConfig: {
            temperature: 1,
            maxOutputTokens: 8192
        }
        })
      });

      const data = await response.json();
      
      // API yanıtını kontrol et
      if (data.error) {
        showStatus(`Hata: ${data.error.message}`, 'error');
        return '';
      }
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const summaryText = data.candidates[0].content.parts[0].text;
        // HTML içeriğini güvenli hale getir
        const sanitizedHTML = sanitizeHTML(summaryText);
        
        return sanitizedHTML;
      } else {
        showStatus("Özet oluşturulamadı. Lütfen daha sonra tekrar deneyin.", 'error');
        return '';
      }
    } catch (error) {
      showStatus(`Hata: ${error.message}`, 'error');
      return '';
    }
  }
  
  // HTML içeriğini güvenli hale getir
  function sanitizeHTML(html) {
    // Markdown etiketlerini temizle
    let cleanedHTML = html;
    
    // ```html ve ``` etiketlerini temizle
    cleanedHTML = cleanedHTML.replace(/```html/g, '').replace(/```/g, '');
    
    // Geçici bir div oluştur
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanedHTML;
    
    // Script ve iframe etiketlerini kaldır
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    const iframes = tempDiv.querySelectorAll('iframe');
    iframes.forEach(iframe => iframe.remove());
    
    // Event handler özelliklerini kaldır
    const allElements = tempDiv.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      const attributesToRemove = [];
      
      for (let j = 0; j < element.attributes.length; j++) {
        const attr = element.attributes[j];
        if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.startsWith('javascript:')) {
          attributesToRemove.push(attr.name);
        }
      }
      
      attributesToRemove.forEach(attr => element.removeAttribute(attr));
    }
    
    return tempDiv.innerHTML;
  }
  
  // Durum mesajı göster
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.classList.remove('hidden');
    
    setTimeout(function() {
      statusDiv.classList.add('hidden');
    }, 3000);
  }
});

// Sayfa içeriğini çıkart
function extractPageContent() {
  // Hata ayıklama için konsola mesaj
  console.log("extractPageContent başlatıldı");
  
  // Ana içeriği bulma stratejileri
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
    ].filter(el => el); // null olanları filtrele
    
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
      return paragraphs.length >= 3; // En az 3 paragraf içeren div'ler
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
  
  // Temizleme ve formatlama
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
      // Hata durumunda elementi yine de işlemeye devam et
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
    
    // Karakter limitini kontrol et (Gemini API için)
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

// Alternatif sayfa içeriği çıkarma fonksiyonu
function extractPageContentSimple() {
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