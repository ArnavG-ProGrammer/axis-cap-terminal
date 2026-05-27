const url = 'https://kfvgretxfdjjtvksqmnq.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdmdyZXR4ZmRqanR2a3NxbW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTg3MTYsImV4cCI6MjA5MDk3NDcxNn0.bn3dbFXnCIRINRzmYysX3TB--1PzPJmRhigihSlzteg';

async function fetchSchema() {
  const res = await fetch(url);
  const json = await res.json();
  
  console.log("=== user_portfolios columns ===");
  if (json.definitions && json.definitions.user_portfolios) {
    console.log(Object.keys(json.definitions.user_portfolios.properties));
  } else {
    console.log("user_portfolios not found in schema");
  }

  console.log("=== user_transactions columns ===");
  if (json.definitions && json.definitions.user_transactions) {
    console.log(Object.keys(json.definitions.user_transactions.properties));
  } else {
    console.log("user_transactions not found in schema");
  }
}

fetchSchema();
