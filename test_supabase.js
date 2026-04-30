const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n');
const env = {};
for (const line of lines) {
    if (line.includes('=')) {
        const [key, val] = line.split('=');
        env[key.trim()] = val.trim();
    }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOAuth() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
            redirectTo: `http://localhost:3000/auth/callback`,
        },
    });
    console.log("DATA:", data);
    console.log("ERROR:", error);
}

testOAuth();
