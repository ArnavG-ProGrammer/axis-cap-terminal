import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function run() {
  const chartData = await yahooFinance.chart('AAPL', { interval: '5m', range: '5d' });
  console.log("Keys in chartData:", Object.keys(chartData));
  if (chartData.quotes) {
     console.log("Has quotes, length:", chartData.quotes.length);
  } else {
     console.log(JSON.stringify(chartData).substring(0, 500));
  }
}

run();
