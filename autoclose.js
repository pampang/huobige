chrome.storage.local.get(['ongoing'], (result) => {
  if (result.ongoing) {
    window.close();
  }
});