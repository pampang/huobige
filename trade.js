// const getSearch = (name) => {
//   return location.search.match(new RegExp('(\\\?|&)' + name + '=([^;]*)(&|$)')) == null ? null : decodeURIComponent(RegExp.$2);
// };

function getSearch(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)","i");
	var result = window.location.search.substr(1).match(reg);
	if (result!=null) {
return result[2];
	} else {
return null;
	};
}

/**
 * 获取当前BTC/USDT
 * 元素索引：
 * 	资产表：#assetsDetail
 * 	资产表ul: $('#assetsDetail ul')，遍历
 *
 * 	可用BTC
 * 	可用USDT
 */
const getCurrentAssertList = () => {
	const $assertList = $('#assetsDetail ul');
	const newAssertList = {};
	// 找到btc和usdt
	$assertList.each((index) => {
		const item = $assertList.eq(index);
		const assertName = item.find('li').eq(0).text().toLowerCase();
		const assertAvaliableCount = item.find('li').eq(1).text().toLowerCase();
		if (assertName === 'btc') {
			newAssertList['btc'] = assertAvaliableCount;

			$('#btc').html(assertAvaliableCount);
		} else if (assertName === 'usdt') {
			newAssertList['usdt'] = assertAvaliableCount;

			$('#usdt').html(assertAvaliableCount);
		}
	})

	if (newAssertList && newAssertList.btc && newAssertList.usdt) {
		// localStorage.assertList = newAssertList;
		chrome.storage.local.set({
			assertList: newAssertList,
		});
		console.log('assertList', newAssertList);
		return newAssertList;
	}

	return null;
}


/**
 * 获取当前交易列表
 */
const getTradeList = async () => {
	const tradeList = [];
	const $priceList = $('.list-content table tbody tr');
	const SEARCH_LIMIT = localStorage.searchLimit || 3;
	for (let i = 0, len = SEARCH_LIMIT; i < len; i += 1) {
		const item = $priceList.eq(i);
		// 获取userId(用以匹配黑名单); 获取出卖的价格；获取买入链接
		const userName = item.find('.user-info a').text();
		// const userId = userInfoHref.match(/\?id=(\d*)/)[1];

		// 检查黑名单
		const blacklist = await new Promise((resolve, reject) => {
			chrome.storage.local.get('blacklist', (result) => {
				resolve(result.blacklist);
			});
		});

		if (blacklist.indexOf(userName) > -1) {
			continue;
		}


		// 获取价格
		const tradePriceText = item.find('.price p').text().trim().replace(',', '');
		const tradePrice = tradePriceText.match(/(\d+)/)[1];

		// 获取下单链接
		const tradeHref = location.origin + item.find('.Btn a').attr('href');

		tradeList.push({
			userName,
			tradePrice,
			tradeHref,
		});
	}

	chrome.storage.local.set({
		tradeList,
	});

	console.log('tradeList', tradeList);
	return tradeList;
}

const checkTrade = async () => {
	const tradeList = await getTradeList();
	// const assertList = getCurrentAssertList();

	// if (!tradeList || !assertList) {
	if (!tradeList) {
		this.timer = setTimeout(() => {
			checkTrade();
		}, 500);
		return;
	} else {
		clearTimeout(this.timer);
	}

	// 获取当前价格
	const priceRange = await new Promise((resolve, reject) => {
		chrome.storage.local.get(['btcHigh', 'btcLow', 'usdtHigh', 'usdtLow'], (result) => {
			resolve(result);
		});
	});

	const coinType = getSearch('coin') == '1' ? 'btc' : 'usdt';
	const tradeType = getSearch('type') == '1' ? 'buy' : 'sell';

	// 比较当前配置的价格，如果合适则下单
	if (coinType === 'btc') {
		// 比特币交易
		tradeList.forEach((tradeItem) => {
			if (compareTrade(tradeType, tradeItem.tradePrice, priceRange.btcLow, priceRange.btcHigh)) {
				console.log('shouldGo', tradeItem);
				window.open(tradeItem.tradeHref);
			}
		});
	}

	if (coinType === 'usdt') {
		// usdt交易
		tradeList.forEach((tradeItem) => {
			if (compareTrade(tradeType, tradeItem.tradePrice, priceRange.usdtLow, priceRange.usdtHigh)) {
				console.log('shouldGo', tradeItem);
				window.open(tradeItem.tradeHref);
			}
		});
	}
}

const compareTrade = (tradeType, tradePrice, lowPrice, highPrice) => {
	if (tradeType === 'buy') {
		// 交易价格大于最高买入价格，放弃
		if (Number(tradePrice) > Number(highPrice)) {
			return false;
		} else {
			return true;
		}
	} else if (tradeType === 'sell') {
		// 交易价格小于最低卖出价格，放弃
		if (Number(tradePrice) < Number(lowPrice)) {
			return false;
		} else {
			return true;
		}
	}
}

checkTrade();
// getCurrentAssertList();
// getTradeList();