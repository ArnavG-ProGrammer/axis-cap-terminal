async function run() {
  console.log("Firing 100 concurrent requests to /api/quote?q=AAPL...");
  const start = Date.now();
  
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(
      fetch('http://localhost:3000/api/quote?q=AAPL')
        .then(res => res.json())
        .then(data => data.symbol || data.error || 'unknown')
        .catch(e => e.message)
    );
  }
  
  const results = await Promise.all(promises);
  const end = Date.now();
  
  console.log(`Finished in ${end - start}ms`);
  
  const successCount = results.filter(r => r === 'AAPL').length;
  console.log(`Success count: ${successCount} / 100`);
  
  const uniqueResults = [...new Set(results)];
  console.log("Unique responses:", uniqueResults);
}

run();
