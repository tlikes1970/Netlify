// Load TEST_DATABASE_URL and set DATABASE_URL before running migrations
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}




























