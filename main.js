((Vue, chrome) => {
  const App = new Vue({
    el: '#root',
    data() {
      return {
        ongoing: false,
        btcNumber: '打开火币网页面时刷新',
        usdtNumber: '打开火币网页面时刷新',
        refreshTime: null,
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
        window.open('https://otc.huobi.pro/#/trade/list?coin=1&type=1');
        window.open('https://otc.huobi.pro/#/trade/list?coin=2&type=1');
      },
      toggleModify() {
        this.modifying = !this.modifying;
      },
      submitModify() {
        let errorText;
        if (!this.refreshTime) {
          errorText = '请填写：检查刷新间隔(s)！';
        } else if (!this.btcHigh) {
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
            refreshTime: this.refreshTime,
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
        const newItems = this.newBlackItem.split(' ');
        this.blacklist = this.blacklist.concat(newItems);
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

  chrome.storage.local.get(['ongoing', 'assertList', 'btcHigh', 'btcLow', 'usdtHigh', 'usdtLow', 'buyMaxLimit', 'sellMaxLimit', 'blacklist', 'refreshTime'], (result) => {
    // 写入当前状态
    App.ongoing = result.ongoing;

    // 写入剩余币数
    if (result.assertList) {
      App.btcNumber = result.assertList.btc;
      App.usdtNumber = result.assertList.usdt;
    }

    // 写入价格
    App.btcHigh = result.btcHigh;
    App.btcLow = result.btcLow;
    App.usdtHigh = result.usdtHigh;
    App.usdtLow = result.usdtLow;
    App.buyMaxLimit = result.buyMaxLimit;
    App.sellMaxLimit = result.sellMaxLimit;
    App.blacklist = Array.isArray(result.blacklist) ? result.blacklist : [];
    App.refreshTime = result.refreshTime;
  });
})(window.Vue, window.chrome);
