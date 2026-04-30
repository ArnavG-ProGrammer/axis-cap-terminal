import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function run() {
  const chartData = await yahooFinance.chart('AXISBANK.NS', { interval: '60m', range: '1mo' });
  console.log("Quotes 1mo 60m:", chartData.quotes.length);
}

run();
