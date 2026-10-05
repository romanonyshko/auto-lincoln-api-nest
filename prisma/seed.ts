// Default (demo) data: users, dashboard, catalogue. Run: npx prisma db seed
// Safe to run again: users are created once and never overwritten,
// every other table is cleared before it is filled.
import { existsSync } from 'node:fs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, type Currency, type UserRole } from '../src/db/generated/prisma/client.js'
import { hashPassword } from '../src/modules/auth/lib/password.js'

if (existsSync('.env')) process.loadEnvFile('.env')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('Missing env variable: DATABASE_URL')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })

// Local test accounts, the same as in README.
const USERS: { email: string; password: string; displayName: string; role: UserRole }[] = [
  { email: 'admin@autolincoln.local', password: 'admin12345', displayName: 'Admin', role: 'admin' },
  { email: 'test@autolincoln.local', password: 'test12345', displayName: 'Test Manager', role: 'manager' },
  { email: 'client@autolincoln.local', password: 'client12345', displayName: 'Test Client', role: 'client' },
]

async function seedUsers() {
  for (const { password, ...user } of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash: await hashPassword(password) },
    })
  }
}

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

// Carmaker → model → engines. Model names are unique across carmakers,
// so parts below can refer to them by name.
const CARMAKERS: Record<string, Record<string, string[]>> = {
  Audi: {
    A4: ['2.0 TDI', '2.0 TFSI', '3.0 TDI'],
    A6: ['2.0 TDI', '3.0 TDI'],
    Q5: ['2.0 TFSI', '3.0 TDI'],
  },
  BMW: {
    '3 Series': ['320d', '330i'],
    '5 Series': ['520d', '530i', '540i'],
    X5: ['xDrive30d', 'xDrive40i'],
  },
  Volkswagen: {
    Golf: ['1.4 TSI', '1.6 TDI', '2.0 TDI'],
    Passat: ['1.8 TSI', '2.0 TDI'],
    Tiguan: ['2.0 TSI', '2.0 TDI'],
  },
  Toyota: {
    Corolla: ['1.6 VVT-i', '1.8 Hybrid'],
    Camry: ['2.5', '2.5 Hybrid'],
    RAV4: ['2.0 VVT-i', '2.5 Hybrid'],
  },
}

// title, brand, price in EUR, fits. `fits` items: 'ALL', a model ('A4' → all its
// engines) or a single engine ('A4 2.0 TDI').
type PartRow = [title: string, brand: string, priceEur: number, fits: string[]]

const TDI = ['A4 2.0 TDI', 'A6 2.0 TDI', 'Golf 2.0 TDI', 'Passat 2.0 TDI', 'Tiguan 2.0 TDI']
const VAG = ['A4', 'A6', 'Q5', 'Golf', 'Passat', 'Tiguan']

// Order = `order` of the category; slug = image file in the web app (public/categories/).
const CATEGORIES: { title: string; slug: string; code: string; parts: PartRow[] }[] = [
  {
    title: 'Brake system', slug: 'brake-system', code: 'BRK',
    parts: [
      ['Front brake pads set', 'Brembo', 54.9, ['A4', 'A6']],
      ['Rear brake pads set', 'ATE', 38.5, ['Golf', 'Passat']],
      ['Front brake disc', 'Brembo', 72, ['3 Series']],
      ['Rear brake disc', 'Zimmermann', 48.3, ['5 Series', 'X5']],
      ['Brake caliper, front left', 'TRW', 129, ['Corolla']],
      ['Brake fluid DOT 4, 1 L', 'ATE', 12.4, ['ALL']],
      ['Brake pad wear sensor', 'Bosch', 9.8, ['3 Series', '5 Series']],
    ],
  },
  {
    title: 'Filters', slug: 'filters', code: 'FLT',
    parts: [
      ['Oil filter', 'Mann-Filter', 11.2, TDI],
      ['Air filter', 'Mann-Filter', 18.9, ['Golf', 'Passat', 'Tiguan']],
      ['Cabin filter, activated carbon', 'Bosch', 21.5, ['A4', 'A6', 'Q5']],
      ['Fuel filter', 'Mahle', 29.7, ['3 Series 320d', '5 Series 520d', 'X5 xDrive30d']],
      ['Oil filter', 'Mahle', 10.6, ['Corolla', 'Camry', 'RAV4']],
      ['Air filter', 'Bosch', 17.4, ['3 Series', '5 Series']],
      ['Cabin filter', 'Mann-Filter', 19.9, ['Corolla', 'RAV4']],
    ],
  },
  {
    title: 'Engine', slug: 'engine', code: 'ENG',
    parts: [
      ['Spark plug, iridium', 'NGK', 14.6, ['A4 2.0 TFSI', 'Q5 2.0 TFSI', 'Golf 1.4 TSI', 'Passat 1.8 TSI', 'Tiguan 2.0 TSI']],
      ['Glow plug', 'Bosch', 16.8, [...TDI, 'Golf 1.6 TDI', 'A4 3.0 TDI', 'A6 3.0 TDI', 'Q5 3.0 TDI']],
      ['Ignition coil', 'Bosch', 42, ['3 Series 330i', '5 Series 530i', '5 Series 540i', 'X5 xDrive40i']],
      ['Engine mount', 'Lemförder', 64.5, ['A4', 'A6']],
      ['Valve cover gasket', 'Elring', 23.9, ['Corolla', 'Camry']],
      ['Engine oil 5W-30, 5 L', 'Castrol', 46, ['ALL']],
      ['Turbocharger', 'Garrett', 689, ['A6 3.0 TDI', 'Q5 3.0 TDI']],
    ],
  },
  {
    title: 'Forks', slug: 'forks', code: 'FRK',
    parts: [
      ['Front lower control arm, left', 'Lemförder', 89, ['3 Series']],
      ['Front lower control arm, right', 'Lemförder', 89, ['3 Series']],
      ['Wishbone, front axle', 'TRW', 74.2, ['Golf', 'Passat']],
      ['Rear trailing arm', 'Febi Bilstein', 58.6, ['Tiguan']],
      ['Control arm kit, front axle', 'Meyle', 249, ['A4', 'A6']],
      ['Wishbone, front left', 'Moog', 66.4, ['Camry', 'RAV4']],
    ],
  },
  {
    title: 'Suspension', slug: 'suspension', code: 'SUS',
    parts: [
      ['Coil spring, front', 'Eibach', 52.3, ['Golf']],
      ['Coil spring, rear', 'Lesjöfors', 47.8, ['Corolla']],
      ['Stabilizer link, front', 'Lemförder', 18.7, ['A4', 'A6', 'Q5']],
      ['Ball joint', 'TRW', 27.4, ['Passat', 'Tiguan']],
      ['Top strut mount', 'SKF', 33.1, ['3 Series', '5 Series']],
      ['Suspension bush kit', 'Febi Bilstein', 41, ['X5']],
      ['Wheel bearing kit, front', 'SKF', 61.9, ['Corolla', 'Camry', 'RAV4']],
    ],
  },
  {
    title: 'Damping', slug: 'damping', code: 'DMP',
    parts: [
      ['Shock absorber, front', 'Bilstein', 118, ['3 Series']],
      ['Shock absorber, rear', 'Sachs', 74.5, ['Golf', 'Passat']],
      ['Shock absorber, front', 'KYB', 82.3, ['Corolla', 'Camry']],
      ['Strut, front left', 'Monroe', 96.7, ['A4']],
      ['Shock absorber, rear', 'Bilstein', 104, ['X5']],
      ['Dust cover kit, shock absorber', 'Sachs', 24.6, ['A4', 'A6', 'Golf', 'Passat', 'Tiguan']],
    ],
  },
  {
    title: 'Belt / chain drive', slug: 'belt-chain-drive', code: 'BLT',
    parts: [
      ['Timing belt kit with water pump', 'INA', 189, ['Golf 1.6 TDI', ...TDI.slice(2)]],
      ['Timing chain kit', 'Febi Bilstein', 214, ['3 Series 320d', '5 Series 520d']],
      ['V-ribbed belt', 'Contitech', 21.3, ['Corolla', 'Camry', 'RAV4']],
      ['Belt tensioner', 'INA', 46.8, ['A4', 'A6', 'Q5']],
      ['Idler pulley', 'SKF', 27.9, ['3 Series', '5 Series', 'X5']],
      ['Timing belt', 'Gates', 38.4, ['Golf 1.4 TSI']],
    ],
  },
  {
    title: 'Chassis', slug: 'chassis', code: 'CHS',
    parts: [
      ['Engine undertray', 'Van Wezel', 64, ['Golf', 'Passat']],
      ['Front subframe bush', 'Lemförder', 36.2, ['3 Series', '5 Series']],
      ['Rear axle beam bush', 'Febi Bilstein', 29.5, ['Golf']],
      ['Front wheel arch liner, left', 'Van Wezel', 31.8, ['A4']],
      ['Tow bar, detachable', 'Brink', 289, ['Tiguan', 'Q5']],
      ['Rear subframe mount', 'Meyle', 33.7, ['Camry']],
    ],
  },
  {
    title: 'Engine cooling system', slug: 'engine-cooling-system', code: 'CLG',
    parts: [
      ['Radiator', 'Nissens', 156, ['A4', 'A6']],
      ['Water pump', 'Hepu', 58.9, ['Corolla', 'RAV4']],
      ['Thermostat with housing', 'Mahle', 47.3, ['3 Series', '5 Series']],
      ['Coolant expansion tank', 'Febi Bilstein', 26.4, ['Golf', 'Passat', 'Tiguan']],
      ['Radiator fan', 'Valeo', 172, ['Camry']],
      ['Antifreeze G12++, 1.5 L', 'Motul', 15.2, ['ALL']],
    ],
  },
  {
    title: 'Hydraulic', slug: 'hydraulic', code: 'HYD',
    parts: [
      ['Power steering pump', 'TRW', 268, ['Golf', 'Passat']],
      ['Clutch master cylinder', 'Sachs', 62.7, ['3 Series']],
      ['Clutch slave cylinder', 'LuK', 44.9, ['Golf', 'Passat']],
      ['Brake master cylinder', 'ATE', 118.5, ['Corolla']],
      ['Power steering fluid, 1 L', 'Febi Bilstein', 13.8, ['ALL']],
      ['Brake hose, front', 'TRW', 15.6, ['A4', 'A6', 'Q5']],
    ],
  },
  {
    title: 'Steering', slug: 'steering', code: 'STR',
    parts: [
      ['Tie rod end, outer', 'Lemförder', 24.3, ['A4', 'A6']],
      ['Tie rod, inner', 'TRW', 31.5, ['Golf', 'Passat', 'Tiguan']],
      ['Steering rack boot kit', 'Febi Bilstein', 17.9, ['3 Series', '5 Series']],
      ['Steering rack', 'TRW', 449, ['Corolla']],
      ['Steering column joint', 'Meyle', 54.2, ['X5']],
      ['Tie rod end, outer', 'Moog', 22.8, ['Camry', 'RAV4']],
    ],
  },
  {
    title: 'Tires and wheels', slug: 'tires-and-wheels', code: 'TYR',
    parts: [
      ['Summer tyre 225/45 R17 94Y', 'Michelin', 132, ['Golf', '3 Series', 'A4']],
      ['Winter tyre 205/55 R16 91H', 'Continental', 98, ['Corolla', 'Golf']],
      ['All-season tyre 235/55 R18 104V', 'Goodyear', 141, ['Tiguan', 'RAV4', 'Q5']],
      ['Run-flat tyre 245/45 R18 100Y', 'Bridgestone', 176, ['5 Series']],
      ['Wheel bolt set, 20 pcs', 'Febi Bilstein', 27.5, VAG],
      ['TPMS sensor', 'Schrader', 39.9, ['3 Series', '5 Series', 'X5']],
    ],
  },
]

const STOCK = [0, 3, 12, 25, 7, 40, 1, 18]

// Most parts are in EUR; some in USD and UAH so every currency is present.
function priceIn(i: number, priceEur: number): { price: number; currency: Currency } {
  if (i % 7 === 5) return { price: Math.round(priceEur * 48), currency: 'UAH' }
  if (i % 5 === 3) return { price: Math.round(priceEur * 110) / 100, currency: 'USD' }
  return { price: priceEur, currency: 'EUR' }
}

async function seedCatalogue() {
  // Join rows part ↔ engine go with the parts; models and engines go with the carmakers.
  await prisma.part.deleteMany()
  await prisma.category.deleteMany()
  await prisma.carmaker.deleteMany()

  // 'A4' → ids of all A4 engines, 'A4 2.0 TDI' → [that engine id].
  const enginesByKey = new Map<string, string[]>()
  for (const [name, models] of Object.entries(CARMAKERS)) {
    const carmaker = await prisma.carmaker.create({
      data: {
        name,
        models: {
          create: Object.entries(models).map(([model, engines]) => ({
            name: model,
            engines: { create: engines.map((engine) => ({ name: engine })) },
          })),
        },
      },
      include: { models: { include: { engines: true } } },
    })
    for (const model of carmaker.models) {
      enginesByKey.set(model.name, model.engines.map((e) => e.id))
      for (const engine of model.engines) enginesByKey.set(`${model.name} ${engine.name}`, [engine.id])
    }
  }
  const allEngineIds = [...new Set([...enginesByKey.values()].flat())]

  function engineIds(fits: string[]): string[] {
    if (fits.includes('ALL')) return allEngineIds
    return [...new Set(fits.flatMap((key) => {
      const ids = enginesByKey.get(key)
      if (!ids) throw new Error(`Unknown model or engine in seed: ${key}`)
      return ids
    }))]
  }

  let i = 0
  for (const [order, { title, slug, code, parts }] of CATEGORIES.entries()) {
    const category = await prisma.category.create({
      data: { title, image: `/categories/${slug}.jpg`, order },
    })
    for (const [n, [partTitle, brand, priceEur, fits]] of parts.entries()) {
      await prisma.part.create({
        data: {
          categoryId: category.id,
          title: partTitle,
          articleNumber: `AL-${code}-${String(n + 1).padStart(3, '0')}`,
          brand,
          ...priceIn(i, priceEur),
          inStock: STOCK[i % STOCK.length],
          image: null,
          // One hour apart, so the order by createdAt is stable for pagination.
          createdAt: new Date(Date.UTC(2026, 8, 1) + i * 3_600_000),
          compatibleEngines: { connect: engineIds(fits).map((id) => ({ id })) },
        },
      })
      i++
    }
  }
}

await seedUsers()
await seedStats()
await seedActivity()
await seedNewsAndReviews()
await seedPages()
await seedRequests()
await seedCatalogue()
console.log('Seeded users, dashboard and catalogue data')

await prisma.$disconnect()
