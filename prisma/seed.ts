// Default (demo) data for the dashboard. Run: npx prisma db seed
// Safe to run again: every table is cleared before it is filled.
import { existsSync } from 'node:fs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/db/generated/prisma/client.js'

if (existsSync('.env')) process.loadEnvFile('.env')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('Missing env variable: DATABASE_URL')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })

async function seedStats() {
  await prisma.dashboardStat.deleteMany()
  await prisma.dashboardStat.createMany({
    data: [
      { id: 'time-on-website', label: 'Time on website', value: '14.7', deltaPercent: 2, order: 1 },
      { id: 'visitors', label: 'Visitors', value: '620', deltaPercent: 10, order: 2 },
      { id: 'categories', label: 'Categories', value: '400', order: 3 },
      { id: 'comments', label: 'Comments', value: '12.1', deltaPercent: 8, order: 4 },
      { id: 'covers', label: 'Covers', value: '340', deltaPercent: 20, order: 5 },
      { id: 'articles', label: 'Articles', value: '120', order: 6 },
    ],
  })
}

async function seedActivity() {
  const visitorsByMonth = [31000, 19000, 9000, 5000, 6000, 14000, 35000, 27000, 25000]

  await prisma.monthlyActivity.deleteMany()
  await prisma.monthlyActivity.createMany({
    // Index 0 → 2026-01-01, index 8 → 2026-09-01 (UTC).
    data: visitorsByMonth.map((visitors, i) => ({
      month: new Date(Date.UTC(2026, i, 1)),
      visitors,
    })),
  })
}

async function seedNewsAndReviews() {
  // Reviews are removed together with their news (onDelete: Cascade).
  await prisma.news.deleteMany()

  await prisma.news.create({
    data: {
      title: 'New brake pads in stock',
      publishedAt: new Date('2026-02-12T10:00:00Z'),
      reviews: {
        create: [
          {
            author: 'Mark Lewis',
            text: 'Installed them last week, braking is much smoother now.',
            createdAt: new Date('2026-02-14T09:30:00Z'),
          },
        ],
      },
    },
  })

  // The latest news and the latest review — shown on the dashboard.
  await prisma.news.create({
    data: {
      title: 'Season sale beginning!',
      publishedAt: new Date('2026-03-05T17:00:00Z'),
      reviews: {
        create: [
          {
            author: 'Ketty Richardson',
            text:
              'Rev up your savings with our season sale on car parts! Upgrade your ' +
              "ride without breaking the bank. Don't miss out on these hot deals to " +
              'keep your vehicle running smoothly and stylishly all year round!',
            createdAt: new Date('2026-03-06T12:00:00Z'),
          },
        ],
      },
    },
  })
}

async function seedPages() {
  await prisma.page.deleteMany()
  await prisma.page.createMany({
    data: [{ title: 'Home' }, { title: 'About us' }, { title: 'Contacts' }],
  })
}

async function seedRequests() {
  await prisma.request.deleteMany()
  await prisma.request.createMany({
    data: [{ status: 'approved' }],
  })
}

await seedStats()
await seedActivity()
await seedNewsAndReviews()
await seedPages()
await seedRequests()
console.log('Seeded dashboard data')

await prisma.$disconnect()
