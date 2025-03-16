let shadowContainer = null;

// CSS stillerini yükle
function loadStyles() {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles.css');
    link.onload = () => resolve(link.sheet);
    document.head.appendChild(link);
  });
}

// Container oluştur
function createShadowContainer() {
  if (shadowContainer) return shadowContainer;

  // Shadow container oluştur
  const hostElement = document.createElement('div');
  hostElement.id = 'ozet-gec-p-container';
  hostElement.style.all = 'initial'; // Tüm stilleri sıfırla
  document.body.appendChild(hostElement);

  // Shadow DOM oluştur
  const shadow = hostElement.attachShadow({ mode: 'closed' });
  
  // Root container
  const container = document.createElement('div');
  container.className = 'ozet-gec-p-root';
  shadow.appendChild(container);
  
  // Stil ekle
  const style = document.createElement('style');
  style.textContent = `
    .ozet-gec-p-root * {
      all: initial;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    }
    
    .ozet-gec-p-summary {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%,-50%);
      width: 800px;
      height: auto;
      max-height: 80vh;
      background-color: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      z-index: 9999;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .ozet-gec-p-header {
      background-color: #1a73e8;
      color: white;
      padding: 10px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
    }
    
    .ozet-gec-p-header button {
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      padding: 0 5px;
      font-family: Arial, sans-serif;
    }
    
          .ozet-gec-p-content {
      padding: 15px;
      overflow-y: auto;
      flex-grow: 1;
      line-height: 1.5;
      color: #333;
      font-size: 14px;
      font-family: Arial, sans-serif;
    }
    
    .ozet-gec-p-content h1, .ozet-gec-p-content h2, .ozet-gec-p-content h3, 
    .ozet-gec-p-content h4, .ozet-gec-p-content h5, .ozet-gec-p-content h6 {
      margin-top: 12px;
      margin-bottom: 8px;
      font-weight: bold;
      color: #1a73e8;
    }
    
    .ozet-gec-p-content h3 {
      font-size: 16px;
    }
    
    .ozet-gec-p-content p {
      margin: 8px 0;
    }
    
    .ozet-gec-p-content ul, .ozet-gec-p-content ol {
      margin: 8px 0;
      padding-left: 20px;
      display: block;
      padding-block: 5px;
    }
    
    .ozet-gec-p-content li {
      margin: 4px 0;
      display: block;
      padding-block: 5px;
    }
    
    .ozet-gec-p-content b, .ozet-gec-p-content strong {
      font-weight: bold;
    }
    
    .ozet-gec-p-content i, .ozet-gec-p-content em {
      font-style: italic;
    }
    
    .ozet-gec-p-footer {
      padding: 8px;
      text-align: center;
      font-size: 11px;
      color: #666;
      border-top: 1px solid #eee;
      font-family: Arial, sans-serif;
    }
    
    .ozet-gec-p-loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(255, 255, 255, 0.9);
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1a73e8;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .ozet-gec-p-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #323232;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 9999;
      max-width: 350px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      font-family: Arial, sans-serif;
    }
  `;
  shadow.appendChild(style);
  
  shadowContainer = { shadow, container };
  return shadowContainer;
}

// Background script'ten gelen mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "summarizeText") {
    summarizeWithGemini(message.text, message.apiKey);
  } else if (message.action === "showNotification") {
    showNotification(message.message);
  }
  return true;
});

  const sanitizeHTML = (html) => {
    // Markdown etiketlerini temizle
    let cleanedHTML = html;
    
    // ```html ve ``` etiketlerini temizle
    cleanedHTML = cleanedHTML.replace(/```html/g, '').replace(/```/g, '');
    
    // Basic HTML sanitization - sadece izin verilen etiketleri kullan
    const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'b', 'strong', 'i', 'em', 'br'];
    
    // Geçici bir div oluştur
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanedHTML;
    
    // Script etiketlerini kaldır
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // İframe etiketlerini kaldır
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
  };


// Metni Gemini API ile özetle
async function summarizeWithGemini(text, apiKey) {
  // Özet başladığında yükleniyor göster
  const loadingElement = showLoading();
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-exp-1206:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Bu metni, uzun yazılardan sıkılanlar için özetle. yanıtını HTML formatında liste şeklinde ver, Markdown KULLANMA, doğrudan HTML etiketleri kullan. Cevabına \`\`\`html veya benzeri markdown etiketleri ekleme, doğrudan <h3>, <p>, <ul>, <li>, <b>, <i> gibi HTML etiketleri ile başla. Özet kısa ama öz olsun. İlginç, komik veya farklı kısımlar varsa onları da ekle, çünkü renkli detaylar sıkıcılığı öldürür.500 karakteri geçmesin. (Türkçe olarak özetle):\n\n${text}`
          }]
        }],
        generationConfig: {
          temperature: 1,
          maxOutputTokens: 8192
        }
      })
    });
  const data = await response.json();
    
    // Yükleniyor ekranını kaldır
    if (loadingElement) {
      loadingElement.remove();
    }
    
    // API yanıtını kontrol et
    if (data.error) {
      showNotification(`Hata: ${data.error.message}`);
      return;
    }
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const summaryText = data.candidates[0].content.parts[0].text;
      // HTML içeriğini güvenli hale getir
      const sanitizedHTML = sanitizeHTML(summaryText);
      showSummary(sanitizedHTML);
    } else {
      showNotification("Özet oluşturulamadı. Lütfen daha sonra tekrar deneyin.");
    }
  } catch (error) {
    // Yükleniyor ekranını kaldır
    if (loadingElement) {
      loadingElement.remove();
    }
    showNotification(`Hata: ${error.message}`);
  }
}

// Özeti göster
function showSummary(summary) {
  const { shadow, container } = createShadowContainer();
  
  // Varsa eski özet kutusunu kaldır
  const existingSummary = container.querySelector('.ozet-gec-p-summary');
  if (existingSummary) {
    existingSummary.remove();
  }
  
  // Yeni özet kutusu oluştur
  const summaryElement = document.createElement('div');
  summaryElement.className = 'ozet-gec-p-summary';
  
  // Başlık ve kapat butonu
  const headerDiv = document.createElement('div');
  headerDiv.className = 'ozet-gec-p-header';
  
  const titleSpan = document.createElement('span');
  titleSpan.textContent = 'Özet Geç P!';
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.addEventListener('click', () => {
    summaryElement.remove();
  });
  
  headerDiv.appendChild(titleSpan);
  headerDiv.appendChild(closeButton);
  
  // Özet içeriği
  const contentDiv = document.createElement('div');
  contentDiv.className = 'ozet-gec-p-content';
  contentDiv.innerHTML = summary; // HTML olarak içeriği ekle
  
  // Alt bilgi
  const footerDiv = document.createElement('div');
  footerDiv.className = 'ozet-gec-p-footer';
  footerDiv.textContent = 'Gemini ile üretilmiştir';
  
  // Elemanlari birleştir
  summaryElement.appendChild(headerDiv);
  summaryElement.appendChild(contentDiv);
  summaryElement.appendChild(footerDiv);
  
  // Shadow DOM'a ekle
  container.appendChild(summaryElement);
  
  // Özet kutusunu sürüklenebilir yap
  makeDraggable(summaryElement, headerDiv);
}

// Yükleniyor göster
function showLoading() {
  const { shadow, container } = createShadowContainer();
  
  const loadingElement = document.createElement('div');
  loadingElement.className = 'ozet-gec-p-loading';
  
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  
  const loadingText = document.createElement('p');
  loadingText.textContent = 'Özetleniyor...';
  
  loadingElement.appendChild(spinner);
  loadingElement.appendChild(loadingText);
  
  container.appendChild(loadingElement);
  
  return loadingElement;
}

// Bildirim göster
function showNotification(message) {
  const { shadow, container } = createShadowContainer();
  
  const notificationElement = document.createElement('div');
  notificationElement.className = 'ozet-gec-p-notification';
  notificationElement.textContent = message;
  
  container.appendChild(notificationElement);
  
  // 5 saniye sonra bildirim kaybolsun
  setTimeout(() => {
    if (container.contains(notificationElement)) {
      notificationElement.remove();
    }
  }, 5000);
}

// Özet kutusunu sürüklenebilir yap
function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  handle.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // Mouse tıklama pozisyonunu al
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Mouse hareketi dinle
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // Yeni pozisyonu hesapla
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Elementin yeni pozisyonunu ayarla
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }
  
  function closeDragElement() {
    // Dinlemeyi durdur
    document.onmouseup = null;
    document.onmousemove = null;
  }
}