// Ortak yardımcı fonksiyonlar

// HTML içeriğini güvenli hale getir
export function sanitizeHTML(html) {
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
}

// Gemini API ile özet çıkar
export async function summarizeWithGemini(text, apiKey) {
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
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Özet oluşturulamadı. Lütfen daha sonra tekrar deneyin.");
    }
  } catch (error) {
    throw error;
  }
}

// Durum mesajı göster
export function showStatus(message, type, statusDiv) {
  statusDiv.textContent = message;
  statusDiv.className = type;
  statusDiv.classList.remove('hidden');
  
  setTimeout(function() {
    statusDiv.classList.add('hidden');
  }, 3000);
}

// Element sürüklenebilir yap
export function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
} 