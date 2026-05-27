import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfvgretxfdjjtvksqmnq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdmdyZXR4ZmRqanR2a3NxbW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTg3MTYsImV4cCI6MjA5MDk3NDcxNn0.bn3dbFXnCIRINRzmYysX3TB--1PzPJmRhigihSlzteg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching user_transactions schema info (1 row)");
  const { data, error } = await supabase.from('user_transactions').select('*').limit(1);
  if (error) console.error("Transactions Error:", error);
  else console.log("Transactions Row:", data[0]);

  console.log("Fetching user_portfolios schema info (1 row)");
  const { data: pData, error: pError } = await supabase.from('user_portfolios').select('*').limit(1);
  if (pError) console.error("Portfolios Error:", pError);
  else console.log("Portfolios Row:", pData[0]);
}

test();
