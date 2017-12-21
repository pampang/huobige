/**
 * 获取当前交易金额
 */
const getDealPrice = () => {
  const $dealDetails = $('.trade-price p');
  const priceWraper = $dealDetails.filter((index) => {
    const item = $dealDetails.eq(index);
    return item.find('label').text() === '价格';
  });
  const dealPrice = priceWraper.find('span').text().trim().match(/(\d+(.\d+)?)/)[1];

  return dealPrice;
}

/**
 * 获取币剩余数量
 */
const getCoinRemainAmount = () => {
  const $dealDetails = $('.trade-price p');
  const priceWraper = $dealDetails.filter((index) => {
    const item = $dealDetails.eq(index);
    return item.find('label').text() === '数量';
  });
  const dealPrice = priceWraper.find('span').text().trim().match(/(\d+(.\d+)?)/)[1];

  return dealPrice;
}

/**
 * 获取交易限额
 */
const getDealQuota = () => {
  const $dealDetails = $('.trade-price p');
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
  const submitButtonText = $('.btn-trade-in').text();
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
  try {
    const dealPrice = getDealPrice();
    const coinRemainAmount = getCoinRemainAmount();
    const tradeType = getTradeType();
    const dealQuota = getDealQuota();
    const maxCanBuyLimit = Math.floor(dealPrice * coinRemainAmount);

    // 获取 单次买入最大值 和 单次卖出最大值
    const priceRange = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['buyMaxLimit', 'sellMaxLimit'], (result) => {
        resolve(result);
      });
    });

console.log(priceRange.buyMaxLimit, dealQuota.maxQuota, maxCanBuyLimit);

    let finalCount;
    if (tradeType === 'buy') {
      // 比较 最大买入金额，最大限额，最大可买金额，找最小值
      finalCount = Math.min(Number(priceRange.buyMaxLimit), Number(dealQuota.maxQuota), Number(maxCanBuyLimit));
    } else if (tradeType === 'sell') {
      // 比较 最大卖出金额，最大限额，最大可卖金额，找最大值
      finalCount = Math.min(Number(priceRange.sellMaxLimit), Number(dealQuota.maxQuota), Number(maxCanBuyLimit));
    }

    if (Number(finalCount) < Number(dealQuota.minQuota)) {
      window.close();
      return;
    }

    $('.price-input-list input').eq(0).val(finalCount);

    // 模拟 input 事件
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("input", false, true);
    $('.price-input-list input').eq(0)[0].dispatchEvent(evt);

    // 模拟keyup事件。https://testerhome.com/topics/6937
    // Podium.keydown(108);
    // Podium.keypress(108);

    // 确定买入
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        $('.btn-trade-in').click();
        resolve();
      }, 500);
    });

    // 提交订单按钮
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        // chrome 下点击有 bug。
        // http://blog.51cto.com/polaris/269758
        // http://johnshen0708.iteye.com/blog/1335978

        const alertText = $('.ivu-modal-body .content-in').text();
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
          const buttons = $('.ivu-modal .ivu-modal-footer button.ivu-btn-info');
          const confirmButton = buttons.filter((index) => {
            return buttons.eq(index).text().indexOf('确定') > -1;
          });

          confirmButton.click();

          // const e = document.createEvent('MouseEvent');
          // e.initEvent('click', false, false);
          // $('.layui-layer-btn0').get(0).dispatchEvent(e);
          resolve();
        } else {
          console.log('will shutdown');
          window.close();
        }
      }, 2000);
    });

  } catch (error) {
    console.log(error);
    setTimeout(() => {
      makeDeal();
    }, 500);
  }
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

// const Podium = {};
// Podium.keydown = function(k) {
//     var oEvent = document.createEvent('KeyboardEvent');

//     // Chromium Hack
//     Object.defineProperty(oEvent, 'keyCode', {
//                 get : function() {
//                     return this.keyCodeVal;
//                 }
//     });
//     Object.defineProperty(oEvent, 'which', {
//                 get : function() {
//                     return this.keyCodeVal;
//                 }
//     });

//     if (oEvent.initKeyboardEvent) {
//         oEvent.initKeyboardEvent("keydown", true, true, document.defaultView, false, false, false, false, k, k);
//     } else {
//         oEvent.initKeyEvent("keydown", true, true, document.defaultView, false, false, false, false, k, 0);
//     }

//     oEvent.keyCodeVal = k;

//     if (oEvent.keyCode !== k) {
//         alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
//     }

//     $('.price-input-list input').eq(0)[0].dispatchEvent(oEvent);
// }
// Podium.keypress = function(k) {
//   var oEvent = document.createEvent('KeyboardEvent');

//   // Chromium Hack
//   Object.defineProperty(oEvent, 'keyCode', {
//               get : function() {
//                   return this.keyCodeVal;
//               }
//   });
//   Object.defineProperty(oEvent, 'which', {
//               get : function() {
//                   return this.keyCodeVal;
//               }
//   });

//   if (oEvent.initKeyboardEvent) {
//       oEvent.initKeyboardEvent("keypress", true, true, document.defaultView, false, false, false, false, k, k);
//   } else {
//       oEvent.initKeyEvent("keypress", true, true, document.defaultView, false, false, false, false, k, 0);
//   }

//   oEvent.keyCodeVal = k;

//   if (oEvent.keyCode !== k) {
//       alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
//   }

//   $('.price-input-list input').eq(0)[0].dispatchEvent(oEvent);
// }
// Podium.keyup = function(k) {
//   var oEvent = document.createEvent('KeyboardEvent');

//   // Chromium Hack
//   Object.defineProperty(oEvent, 'keyCode', {
//               get : function() {
//                   return this.keyCodeVal;
//               }
//   });
//   Object.defineProperty(oEvent, 'which', {
//               get : function() {
//                   return this.keyCodeVal;
//               }
//   });

//   if (oEvent.initKeyboardEvent) {
//       oEvent.initKeyboardEvent("keyup", true, true, document.defaultView, false, false, false, false, k, k);
//   } else {
//       oEvent.initKeyEvent("keyup", true, true, document.defaultView, false, false, false, false, k, 0);
//   }

//   oEvent.keyCodeVal = k;

//   if (oEvent.keyCode !== k) {
//       alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
//   }

//   $('.price-input-list input').eq(0)[0].dispatchEvent(oEvent);
// }