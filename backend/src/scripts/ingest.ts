/**
 * Usage:
 *   npm run ingest -- 2026-10-16            # fetch + persist to DATABASE_URL
 *   npm run ingest -- 2026-10-16 --dry-run  # fetch + derive, print summary, no DB
 */
import dotenv from 'dotenv';
import { ingestDate } from '../ingest/run';
import { prisma } from '../db';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const date = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const dryRun = args.includes('--dry-run');
  if (!date) {
    console.error('Provide a trade date, e.g. 2026-10-16');
    process.exit(1);
  }
  const summary = await ingestDate(date, { dryRun, log: (m) => console.log(`[ingest ${date}] ${m}`) });
  console.log(JSON.stringify(summary, null, 2));
  if (!dryRun) await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
