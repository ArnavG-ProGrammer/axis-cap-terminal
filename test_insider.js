import YahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    const summary = await yahooFinance.quoteSummary('AAPL', {
      modules: ['insiderTransactions', 'insiderHolders', 'netSharePurchaseActivity']
    });
    console.log(JSON.stringify(summary, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
