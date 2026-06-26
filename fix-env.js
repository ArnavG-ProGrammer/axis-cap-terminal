const { execSync } = require('child_process');

try {
  console.log("Removing URL...");
  execSync('npx vercel env rm UPSTASH_REDIS_REST_URL production -y', { stdio: 'inherit' });
} catch (e) {}

try {
  console.log("Adding URL...");
  execSync('npx vercel env add UPSTASH_REDIS_REST_URL production', { input: 'https://liberal-hippo-124274.upstash.io', stdio: ['pipe', 'inherit', 'inherit'] });
} catch (e) {}

try {
  console.log("Removing TOKEN...");
  execSync('npx vercel env rm UPSTASH_REDIS_REST_TOKEN production -y', { stdio: 'inherit' });
} catch (e) {}

try {
  console.log("Adding TOKEN...");
  execSync('npx vercel env add UPSTASH_REDIS_REST_TOKEN production', { input: 'gQAAAAAAAeVyAAIgcDJmODI1MTZmYjI5MWQ0YzRjYTU4NzgwM2NkMjEzZjczOQ', stdio: ['pipe', 'inherit', 'inherit'] });
} catch (e) {}

console.log("Deploying...");
execSync('npx vercel --prod --yes', { stdio: 'inherit' });
