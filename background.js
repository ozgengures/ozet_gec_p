chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarizeText",
    title: "Özet Geç P!",
    contexts: ["selection"]
  });
});

// Sağ tık menüsüne tıklandığında
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarizeText") {
    // API anahtarını kontrol et
    chrome.storage.sync.get(['geminiApiKey'], function(result) {
      if (!result.geminiApiKey) {
        // API anahtarı yoksa bilgilendirme mesajı gönder
        chrome.tabs.sendMessage(tab.id, {
          action: "showNotification",
          message: "Lütfen önce API anahtarınızı ayarlayın."
        });
        return;
      }
      
      // Seçili metni ve API anahtarını content script'e gönder
      chrome.tabs.sendMessage(tab.id, {
        action: "summarizeText",
        text: info.selectionText,
        apiKey: result.geminiApiKey
      });
    });
  }
});