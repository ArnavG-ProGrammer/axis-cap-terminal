import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfvgretxfdjjtvksqmnq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdmdyZXR4ZmRqanR2a3NxbW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTg3MTYsImV4cCI6MjA5MDk3NDcxNn0.bn3dbFXnCIRINRzmYysX3TB--1PzPJmRhigihSlzteg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  // We'll use the user we just created (since we know they have AAPL)
  // But wait, we don't have the user token anymore. We'll sign in or just create a new one.
  const email = `testuser_update_${Date.now()}@example.com`;
  const { data: authData } = await supabase.auth.signUp({ email, password: 'password123' });
  const userId = authData.user.id;
  
  // 1. Insert first
  const portfolioBlock = { user_id: userId, symbol: "AAPL", name: "Apple", type: "Equities", qty: 10, price: 150 };
  const { data: inserted, error: pErr } = await supabase.from('user_portfolios').insert([portfolioBlock]).select().single();
  
  console.log("Inserted ID:", inserted?.id);

  // 2. Try to UPDATE it!
  if (inserted) {
    const newTotalQty = 20;
    const newAvgPrice = 160;
    const { error: updateErr } = await supabase
      .from('user_portfolios')
      .update({ qty: newTotalQty, price: newAvgPrice })
      .eq('id', inserted.id);
      
    if (updateErr) {
      console.error("UPDATE FAILED:", updateErr);
    } else {
      console.log("UPDATE SUCCESS!");
    }
  }
}

testUpdate();
