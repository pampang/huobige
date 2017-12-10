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
const getTradeList = () => {
	const tradeList = [];
	const $priceList = $('.list-content table tbody tr');
	const SEARCH_LIMIT = localStorage.searchLimit || 3;
	for (let i = 0, len = SEARCH_LIMIT; i < len; i += 1) {
		const item = $priceList.eq(i);
		// 获取userId(用以匹配黑名单); 获取出卖的价格；获取买入链接
		const userInfoHref = item.find('.user-info a').attr('href');
		const userId = userInfoHref.match(/\?id=(\d*)/)[1];

		// 获取价格
		const tradePriceText = item.find('.price p').text().trim().replace(',', '');
		const tradePrice = tradePriceText.match(/(\d+)/)[1];

		// 获取下单链接
		const tradeHref = location.origin + item.find('.Btn a').attr('href');

		tradeList.push({
			userId,
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

const checkTrade = () => {
	const tradeList = getTradeList();
	const assertList = getCurrentAssertList();

	if (!tradeList || !assertList) {
		setTimeout(() => {
			checkTrade();
		}, 500);
	}
}

checkTrade();
// getCurrentAssertList();
// getTradeList();