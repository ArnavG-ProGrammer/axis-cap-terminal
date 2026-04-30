const yahooFinance = require('yahoo-finance2').default;

async function run() {
  const chartData = await yahooFinance.chart('AAPL', { interval: '5m', range: '5d' });
  console.log("CHART DATA KEYS:", Object.keys(chartData));
  if (chartData.quotes) {
     console.log("Has quotes");
  } else {
     console.log("Keys in chartData:", Object.keys(chartData));
     if (chartData.meta) console.log("Meta exists");
     // Usually it's chartData.quotes? No, let's dump it
     console.log(JSON.stringify(chartData).substring(0, 500));
  }
}

run();
