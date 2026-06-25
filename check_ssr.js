const http = require('http');

http.get('http://localhost:3001/stock/AAPL', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    if (data.includes('Something went wrong')) {
      console.log('Error found in SSR!');
      // find the error stack in Next.js dev overlay JSON or something
    } else {
      console.log('Page loaded without the React error boundary message.');
    }
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});
