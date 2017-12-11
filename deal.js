/**
 * 获取交易限额
 */
const getDealQuota = () => {
  const $dealDetails = $('.deal_details p');
  const quotaWraper = $dealDetails.filter((index) => {
    const item = $dealDetails.eq(index);
    return item.find('label').text() === '交易限额';
  });
  const quotaText = quotaWraper.find('span').text().replace(/,/g, '').replace(/CNY/g, '').trim();
  const temp = quotaText.split('-');
  const minQuota = Number(temp[0].trim());
  // 最大值需要减1才可以使用
  const maxQuota = Number(temp[1].trim() - 1);
  // const maxQuota = Number(temp[1].trim());
  console.log(minQuota, maxQuota);

  return {
    minQuota,
    maxQuota,
  };
}

/**
 * 获知当前交易是买入还是卖出
 */
const getTradeType = () => {
  const submitButtonText = $('#submitOrder').text();
  if (submitButtonText.indexOf('买入') > -1) {
    return 'buy';
  } else if (submitButtonText.indexOf('卖出') > -1) {
    return 'sell';
  }
}

/**
 * 计算得出应该付的钱
 */
const makeDeal = async () => {
  const tradeType = getTradeType();
  const dealQuota = getDealQuota();

  // 获取 单次买入最大值 和 单次卖出最大值
	const priceRange = await new Promise((resolve, reject) => {
		chrome.storage.local.get(['buyMaxLimit', 'sellMaxLimit'], (result) => {
			resolve(result);
		});
  });

  let finalCount;
  if (tradeType === 'buy') {
    // 买入价格高于最大额
    finalCount = Math.min(Number(priceRange.buyMaxLimit), Number(dealQuota.maxQuota));
  } else if (tradeType === 'sell') {
    // 买入价格高于最大额
    finalCount = Math.min(Number(priceRange.sellMaxLimit), Number(dealQuota.maxQuota));
  }

  console.log(finalCount);
  if (Number(finalCount) < Number(dealQuota.minQuota)) {
    // alert('不满足交易限额条件，本页面将在3秒后关闭');
    setTimeout(() => {
      window.close();
    }, 1000);
    return;
  }

  $('#money').val(finalCount);
  // 模拟keyup事件。https://testerhome.com/topics/6937
  const Podium = {};
  Podium.keyup = function(k) {
      var oEvent = document.createEvent('KeyboardEvent');

      // Chromium Hack
      Object.defineProperty(oEvent, 'keyCode', {
                  get : function() {
                      return this.keyCodeVal;
                  }
      });
      Object.defineProperty(oEvent, 'which', {
                  get : function() {
                      return this.keyCodeVal;
                  }
      });

      if (oEvent.initKeyboardEvent) {
          oEvent.initKeyboardEvent("keyup", true, true, document.defaultView, false, false, false, false, k, k);
      } else {
          oEvent.initKeyEvent("keyup", true, true, document.defaultView, false, false, false, false, k, 0);
      }

      oEvent.keyCodeVal = k;

      if (oEvent.keyCode !== k) {
          alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
      }

      document.getElementById("money").dispatchEvent(oEvent);
  }
  Podium.keyup(37);
};

const start = async () => {
	const ongoing = await new Promise((resolve, reject) => {
		chrome.storage.local.get('ongoing', (result) => {
			resolve(result.ongoing);
		});
	});

	if (ongoing) {
		makeDeal();
	}
}