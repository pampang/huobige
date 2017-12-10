// 通过 chrome.storage.local 来存储数据
chrome.storage.local.get('assertList', (result) => {
  $('#btc').html(result.assertList.btc);
  $('#usdt').html(result.assertList.usdt);
});