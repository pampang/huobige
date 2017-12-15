/**
 * 获取当前交易金额
 */
const getDealPrice = () => {
  const $dealDetails = $('.deal_details p');
  const priceWraper = $dealDetails.filter((index) => {
    const item = $dealDetails.eq(index);
    return item.find('label').text() === '价格';
  });
  const dealPrice = priceWraper.find('span').text().trim();

  return dealPrice;
}

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
  const dealPrice = getDealPrice();
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

  console.log('finalCount', finalCount);
  if (Number(finalCount) < Number(dealQuota.minQuota)) {
    window.close();
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

  // 确定买入
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      $('#submitOrder').click();
      resolve();
    }, 100);
  });

  // 提交订单按钮
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      // chrome 下点击有 bug。
      // http://blog.51cto.com/polaris/269758
      // http://johnshen0708.iteye.com/blog/1335978

      const alertText = $('.layui-layer-content').text();
      // alert(alertText);
      if (alertText.indexOf('请注意价格浮动产生的影响，是否确认以') > -1) {
        // 到了这一步，停止进行交易了。同时通知人来跟进
        chrome.storage.local.set({
          ongoing: false,
        });

        const message = {
          action: 'notify_message',
          data: {
            id: Math.floor(Date.now() * Math.random()),
            type: 'basic',
            title : alertText.replace('请注意价格浮动产生的影响，是否确认', ''),
            message: '买入价格：' + dealPrice,
          },
        };
        chrome.runtime.sendMessage(message);

        // chrome 下点击有 bug。
        // http://blog.51cto.com/polaris/269758
        // http://johnshen0708.iteye.com/blog/1335978
        const e = document.createEvent('MouseEvent');
        e.initEvent('click', false, false);
        $('.layui-layer-btn0').get(0).dispatchEvent(e);
        resolve();
      } else {
        console.log('will shutdown');
        window.close();
      }
    }, 1000);
  });

  // TODO: 不按确定按钮了。
  // // 创建订单成功的确定按钮
  // await new Promise((resolve, reject) => {
  //   setTimeout(() => {
  //     // chrome 下点击有 bug。
  //     // http://blog.51cto.com/polaris/269758
  //     // http://johnshen0708.iteye.com/blog/1335978
  //     const e = document.createEvent('MouseEvent');
  //     e.initEvent('click', false, false);
  //     $('.layui-layer-btn0').get(0).dispatchEvent(e);
  //     resolve();
  //   }, 500);
  // });
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

start();
