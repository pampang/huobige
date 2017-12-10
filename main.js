((Vue, chrome) => {
  const App = new Vue({
    el: '#root',
    data() {
      return {
        ongoing: false,
        btcNumber: '加载中',
        usdtNumber: '加载中',
        btcHigh: null,
        btcLow: null,
        usdtHigh: null,
        usdtLow: null,
        buyMaxLimit: null,
        sellMaxLimit: null,
        blacklist: [],

        modifying: false,
        newBlackItem: null,
      };
    },
    methods: {
      toggleOnGoing() {
        this.ongoing = !this.ongoing;
        chrome.storage.local.set({
          ongoing: this.ongoing,
        });
        if (this.ongoing === true) {
          this.restart();
        }
      },
      restart() {
        this.ongoing = true;
        window.open('https://otc.huobi.pro/trade/list.html?coin=1&type=1');
      },
      toggleModify() {
        this.modifying = !this.modifying;
      },
      submitModify() {
        console.log(this.btcHigh);
        let errorText;
        if (!this.btcHigh) {
          errorText = '请填写：btc最高买入价格！';
        } else if (!this.btcLow) {
          errorText = '请填写：btc最低买入价格！';
        } else if (!this.usdtHigh) {
          errorText = '请填写：usdt最高买入价格！';
        } else if (!this.usdtLow) {
          errorText = '请填写：usdt最低买入价格！';
        } else if (!this.buyMaxLimit) {
          errorText = '请填写：单次最大买入(CNY)！';
        } else if (!this.sellMaxLimit) {
          errorText = '请填写：单次最大卖出(CNY)！';
        }

        if (errorText) {
          alert(errorText);
          return;
        } else {
          chrome.storage.local.set({
            btcHigh: this.btcHigh,
            btcLow: this.btcLow,
            usdtHigh: this.usdtHigh,
            usdtLow: this.usdtLow,
            buyMaxLimit: this.buyMaxLimit,
            sellMaxLimit: this.sellMaxLimit,
          });
          this.modifying = false;
        }
      },
      addBlackItem() {
        this.blacklist.push(this.newBlackItem);
        this.newBlackItem = null;
        chrome.storage.local.set({
          blacklist: this.blacklist,
        });
      },
      deleteBlackItem(index) {
        this.blacklist = this.blacklist.slice(0, index).concat(this.blacklist.slice(index + 1));
        chrome.storage.local.set({
          blacklist: this.blacklist,
        });
      },
    }
  });

  chrome.storage.local.get(['ongoing', 'assertList', 'btcHigh', 'btcLow', 'usdtHigh', 'usdtLow', 'buyMaxLimit', 'sellMaxLimit', 'blacklist'], (result) => {
    // if (result.ongoing === true) {
    //   $('#strat').html('正在运行，点击停止');
    // }
    // 写入当前状态
    App.ongoing = result.ongoing;

    // 写入剩余币数
    App.btcNumber = result.assertList.btc;
    App.usdtNumber = result.assertList.usdt;

    // 写入价格
    App.btcHigh = result.btcHigh;
    App.btcLow = result.btcLow;
    App.usdtHigh = result.usdtHigh;
    App.usdtLow = result.usdtLow;
    App.buyMaxLimit = result.buyMaxLimit;
    App.sellMaxLimit = result.sellMaxLimit;
    App.blacklist = Array.isArray(result.blacklist) ? result.blacklist : [];
  });
})(window.Vue, window.chrome);