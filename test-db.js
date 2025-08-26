import { neon } from '@neondatabase/serverless';

console.log('Testing database connection...');

const connectionString = 'postgresql://neondb_owner:npg_N5ZDfnT6jdKC@ep-curly-bird-a2izqlcu-pooler.eu-central-1.aws.neon.tech/neondb';
console.log('Using connection string:', connectionString.replace(/\/\/.*@/, '//***@'));

const sql = neon(connectionString);

try {
  console.log('Attempting to connect to database...');
  const result = await sql`SELECT NOW() as current_time`;
  console.log('✅ Database connection successful:', result[0]);

  console.log('Testing pages table...');
  const pages = await sql`SELECT * FROM pages ORDER BY created_at DESC LIMIT 5`;
  console.log('✅ Pages found:', pages.length);

} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  console.error('Full error:', error);
}
