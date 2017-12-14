function notifyMessage(id, info, timeout) {
  let notifyId = id;
  if (navigator.userAgent.indexOf('Mac OS X') > -1) {
    notifyId = null;
  }

  chrome.notifications.create(notifyId, Object.assign({
    type: 'basic',
  }, info));

  if (timeout && notifyId) {
    setTimeout(() => {
      chrome.notifications.clear(notifyId);
    }, timeout);
  }
}

chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'notify_message') {
    const data = request.data;
    const id = request.id;
    const type = data.type;
    const timeout = data.timeout;
    const iconUrl = './images/icon128.png';

    const info = {
      iconUrl: iconUrl,
      title: data.title,
      message: data.message
    };

    notifyMessage(id, info, timeout);
  }
});
