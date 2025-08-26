import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_N5ZDfnT6jdKC@ep-curly-bird-a2izqlcu-pooler.eu-central-1.aws.neon.tech/neondb');

// Test getPages function
async function getPages() {
  return await sql`SELECT * FROM pages ORDER BY created_at DESC`;
}

console.log('Testing getPages function directly...');
try {
  const pages = await getPages();
  console.log('✅ getPages result:', JSON.stringify(pages, null, 2));
} catch (error) {
  console.error('❌ getPages error:', error);
}
