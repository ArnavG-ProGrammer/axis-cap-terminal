import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfvgretxfdjjtvksqmnq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdmdyZXR4ZmRqanR2a3NxbW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTg3MTYsImV4cCI6MjA5MDk3NDcxNn0.bn3dbFXnCIRINRzmYysX3TB--1PzPJmRhigihSlzteg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  // 1. Sign up a fake user
  const email = `testuser_${Date.now()}@example.com`;
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password: 'password123',
  });

  if (authErr) {
    console.error("Auth Error:", authErr);
    return;
  }
  
  const userId = authData.user.id;
  console.log("Created user:", userId);

  // 2. Try to insert into user_portfolios
  const portfolioBlock = { user_id: userId, symbol: "AAPL", name: "Apple", type: "Equities", qty: 10, price: 150 };
  const { error: pErr } = await supabase.from('user_portfolios').insert([portfolioBlock]);
  
  if (pErr) {
    console.error("user_portfolios INSERT FAILED:", pErr);
  } else {
    console.log("user_portfolios INSERT SUCCESS!");
  }

  // 3. Try to insert into user_transactions
  const transactionBlock = { user_id: userId, symbol: "AAPL", asset_name: "Apple", type: 'SIM_ADD', qty: 10, execution_price: 150, total_value: 1500, status: 'SIMULATED' };
  const { error: tErr } = await supabase.from('user_transactions').insert([transactionBlock]);
  
  if (tErr) {
    console.error("user_transactions INSERT FAILED:", tErr);
  } else {
    console.log("user_transactions INSERT SUCCESS!");
  }
}

testInsert();
