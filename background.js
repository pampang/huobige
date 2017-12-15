function notifyMessage(id, info) {
  let notifyId = id;
  if (navigator.userAgent.indexOf('Mac OS X') > -1) {
    notifyId = null;
  }

  chrome.notifications.create(notifyId, Object.assign({
    type: 'basic',
    requireInteraction: true,
  }, info));

  const timer = setInterval(() => {
    // 显示通知，播放声音
    var audio = new Audio('http://boscdn.bpc.baidu.com/v1/developer/3f51911c-7fce-4f97-a54f-17b03d54f244.mp3');
    audio.play();
  }, 3000);

  chrome.notifications.onClicked.addListener((params) => {
    clearInterval(timer);
  });

  chrome.notifications.onButtonClicked.addListener((params) => {
    clearInterval(timer);
  });

  chrome.notifications.onClosed.addListener((params) => {
    clearInterval(timer);
  });
}

chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'notify_message') {
    const data = request.data;
    const id = request.id;
    const type = data.type;
    const iconUrl = './images/icon128.png';

    const info = {
      iconUrl: iconUrl,
      title: data.title,
      message: data.message,
    };

    notifyMessage(id, info);
  }
});
