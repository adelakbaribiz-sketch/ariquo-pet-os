import { db } from './db'

// Seed data for the Ariquo Pet OS demo.
// Run via: bun run scripts/seed.ts

const SPECIES = {
  dog: 'DOG',
  cat: 'CAT',
} as const

async function main() {
  console.log('🌱 Seeding Ariquo demo data...')

  // ── Owner ─────────────────────────────────────────────
  const owner = await db.owner.upsert({
    where: { email: 'sara.demo@ariquo.io' },
    update: {},
    create: {
      name: 'Sara Ahmadi',
      email: 'sara.demo@ariquo.io',
      phone: '+49 30 12345678',
      city: 'Berlin',
      country: 'Germany',
      avatarUrl: 'https://i.pravatar.cc/150?img=47',
    },
  })

  // ── Pets ──────────────────────────────────────────────
  const milo = await db.pet.create({
    data: {
      ownerId: owner.id,
      name: 'Milo',
      species: SPECIES.dog,
      breed: 'Golden Retriever',
      sex: 'MALE',
      birthDate: new Date('2021-03-15'),
      weightKg: 30.5,
      microchipId: '985112004567890',
      photoUrl:
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop&q=80',
      color: 'Golden',
      neutered: true,
      allergies: 'Chicken protein',
      notes: 'Very active. Loves swimming. Slight limp in left hind leg after long runs.',
      weightLogs: {
        create: [
          { weightKg: 28.2, loggedAt: new Date('2024-01-10') },
          { weightKg: 29.1, loggedAt: new Date('2024-04-12') },
          { weightKg: 30.0, loggedAt: new Date('2024-07-18') },
          { weightKg: 30.5, loggedAt: new Date('2024-10-22') },
        ],
      },
    },
  })

  const luna = await db.pet.create({
    data: {
      ownerId: owner.id,
      name: 'Luna',
      species: SPECIES.cat,
      breed: 'British Shorthair',
      sex: 'FEMALE',
      birthDate: new Date('2022-08-04'),
      weightKg: 4.8,
      microchipId: '985112009876543',
      photoUrl:
        'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&auto=format&fit=crop&q=80',
      color: 'Blue',
      neutered: true,
      allergies: '',
      notes: 'Indoor cat. Slightly overweight. Drinks more water lately.',
      weightLogs: {
        create: [
          { weightKg: 4.2, loggedAt: new Date('2024-02-02') },
          { weightKg: 4.5, loggedAt: new Date('2024-05-09') },
          { weightKg: 4.7, loggedAt: new Date('2024-08-15') },
          { weightKg: 4.8, loggedAt: new Date('2024-11-01') },
        ],
      },
    },
  })

  // ── Milo: vaccines, medications, events, reminders ──
  await db.vaccine.createMany({
    data: [
      {
        petId: milo.id,
        name: 'Rabies',
        date: new Date('2024-03-01'),
        nextDue: new Date('2025-03-01'),
      },
      {
        petId: milo.id,
        name: 'DHPP (Distemper combo)',
        date: new Date('2024-04-10'),
        nextDue: new Date('2025-04-10'),
      },
      {
        petId: milo.id,
        name: 'Bordetella',
        date: new Date('2024-09-05'),
        nextDue: new Date('2025-09-05'),
      },
    ],
  })

  await db.medication.createMany({
    data: [
      {
        petId: milo.id,
        name: 'Glucosamine joint supplement',
        dose: '1 tablet',
        frequency: 'Daily with food',
        startDate: new Date('2024-06-01'),
        active: true,
        notes: 'For joint support',
      },
      {
        petId: milo.id,
        name: 'Bravecto (tick/flea)',
        dose: '1 chew',
        frequency: 'Every 12 weeks',
        startDate: new Date('2024-09-01'),
        active: true,
      },
    ],
  })

  await db.medicalEvent.createMany({
    data: [
      {
        petId: milo.id,
        type: 'VISIT',
        title: 'Annual wellness exam',
        date: new Date('2024-03-12'),
        notes: 'Healthy. Heart and lungs clear. Teeth in good condition.',
        severity: 'ROUTINE',
      },
      {
        petId: milo.id,
        type: 'IMAGING',
        title: 'Hip X-ray',
        date: new Date('2024-07-22'),
        notes: 'Mild hip dysplasia signs. Recommend joint supplement and weight management.',
        severity: 'OBSERVATION',
      },
      {
        petId: milo.id,
        type: 'LAB',
        title: 'Blood panel',
        date: new Date('2024-03-12'),
        notes: 'All values within normal range.',
        severity: 'ROUTINE',
      },
      {
        petId: milo.id,
        type: 'SYMPTOM',
        title: 'Mild limp after long run',
        date: new Date('2024-10-30'),
        notes: 'Limping on left hind leg after 8km run. Resolved after 24h rest.',
        severity: 'OBSERVATION',
      },
    ],
  })

  await db.reminder.createMany({
    data: [
      {
        petId: milo.id,
        title: 'Rabies booster',
        type: 'VACCINE',
        dueAt: new Date('2025-03-01'),
      },
      {
        petId: milo.id,
        title: 'Annual wellness check',
        type: 'VET_APPOINTMENT',
        dueAt: new Date('2025-03-12'),
      },
      {
        petId: milo.id,
        title: 'Bravecto (tick/flea)',
        type: 'MEDICATION',
        dueAt: new Date('2024-12-01'),
      },
    ],
  })

  // ── Luna: vaccines, medications, events ──
  await db.vaccine.createMany({
    data: [
      {
        petId: luna.id,
        name: 'Rabies',
        date: new Date('2024-08-15'),
        nextDue: new Date('2025-08-15'),
      },
      {
        petId: luna.id,
        name: 'FVRCP (Feline combo)',
        date: new Date('2024-09-01'),
        nextDue: new Date('2025-09-01'),
      },
    ],
  })

  await db.medication.createMany({
    data: [
      {
        petId: luna.id,
        name: 'Frontline (flea)',
        dose: '1 pipette',
        frequency: 'Monthly',
        startDate: new Date('2024-09-01'),
        active: true,
      },
    ],
  })

  await db.medicalEvent.createMany({
    data: [
      {
        petId: luna.id,
        type: 'VISIT',
        title: 'Dental cleaning',
        date: new Date('2024-05-20'),
        notes: 'Mild tartar. Scaled and polished.',
        severity: 'ROUTINE',
      },
      {
        petId: luna.id,
        type: 'SYMPTOM',
        title: 'Increased water intake',
        date: new Date('2024-10-15'),
        notes: 'Owner reports Luna drinks more water than usual. Monitoring recommended.',
        severity: 'OBSERVATION',
      },
    ],
  })

  await db.reminder.createMany({
    data: [
      {
        petId: luna.id,
        title: 'Weight check',
        type: 'VET_APPOINTMENT',
        dueAt: new Date('2024-12-15'),
      },
      {
        petId: luna.id,
        title: 'FVRCP booster',
        type: 'VACCINE',
        dueAt: new Date('2025-09-01'),
      },
    ],
  })

  // ── Sample AI assessment (history) ───────────────────
  await db.aIAssessment.create({
    data: {
      petId: milo.id,
      module: 'SYMPTOM',
      inputText: 'Limping on left hind leg after a long run.',
      observations:
        'Mild lameness in left hind limb. Resolved within 24h of rest. Possible soft-tissue strain or early hip dysplasia sign given breed.',
      riskLevel: 'MONITOR',
      confidence: 0.62,
      recommendations:
        'Rest for 48h, ice pack, monitor. If limp persists or recurs, schedule veterinary orthopedic exam. Continue joint supplement.',
      escalation: 'See veterinarian soon if recurrent',
    },
  })

  await db.aIAssessment.create({
    data: {
      petId: luna.id,
      module: 'SYMPTOM',
      inputText: 'Drinking more water than usual over the past 2 weeks.',
      observations:
        'Polyuria/polydipsia pattern. For a senior-aged British Shorthair, differential considerations include kidney disease, diabetes, or hyperthyroidism.',
      riskLevel: 'VET_SOON',
      confidence: 0.71,
      recommendations:
        'Recommend veterinary visit within 2 weeks for blood panel (kidney, glucose, T4) and urinalysis.',
      escalation: 'See veterinarian soon',
    },
  })

  // ── Providers / Marketplace ──────────────────────────
  const providers = [
    {
      name: 'Dr. Anna Müller',
      type: 'VETERINARIAN',
      specialty: 'General & Internal Medicine',
      clinic: 'Tiergarten Tierarztpraxis',
      city: 'Berlin',
      country: 'Germany',
      rating: 4.9,
      reviewCount: 218,
      verified: true,
      bio: '15 years experience in companion-animal medicine. Special interest in senior-care and chronic disease management.',
    },
    {
      name: 'Dr. Hassan Rezaei',
      type: 'VETERINARIAN',
      specialty: 'Surgery & Orthopedics',
      clinic: 'EuroVet Surgical Center',
      city: 'Berlin',
      country: 'Germany',
      rating: 4.8,
      reviewCount: 156,
      verified: true,
      bio: 'Board-certified small-animal surgeon. Soft-tissue and orthopedic procedures.',
    },
    {
      name: 'Paws & Polish Grooming',
      type: 'GROOMING',
      city: 'Berlin',
      country: 'Germany',
      rating: 4.7,
      reviewCount: 89,
      verified: true,
      bio: 'Professional grooming salon. Breed-specific cuts, hand stripping, nail care, spa treatments.',
    },
    {
      name: 'Hundezauber Boarding',
      type: 'BOARDING',
      city: 'Potsdam',
      country: 'Germany',
      rating: 4.8,
      reviewCount: 134,
      verified: true,
      bio: 'Countryside boarding with large fenced play yards. Daily photos and updates.',
    },
    {
      name: 'Walkies Berlin',
      type: 'WALKER',
      city: 'Berlin',
      country: 'Germany',
      rating: 4.6,
      reviewCount: 67,
      verified: false,
      bio: 'Group and solo dog walks. GPS-tracked routes.',
    },
    {
      name: 'Positive Paws Training',
      type: 'TRAINER',
      specialty: 'Positive reinforcement',
      city: 'Berlin',
      country: 'Germany',
      rating: 4.9,
      reviewCount: 112,
      verified: true,
      bio: 'Force-free training. Puppy classes, behavior consultations, agility.',
    },
    {
      name: 'Katzen-Haus Sitting',
      type: 'SITTER',
      city: 'Berlin',
      country: 'Germany',
      rating: 4.7,
      reviewCount: 51,
      verified: true,
      bio: 'In-home cat sitting. Specialized in senior and special-needs cats.',
    },
    {
      name: 'PetMover Transport',
      type: 'TRANSPORT',
      city: 'Berlin',
      country: 'Germany',
      rating: 4.5,
      reviewCount: 38,
      verified: true,
      bio: 'Local pet taxi, airport transfers, and international pet relocation advisory.',
    },
  ] as const

  const createdProviders = await Promise.all(
    providers.map((p) =>
      db.provider.create({
        data: {
          ...p,
          avatarUrl: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(p.name)}`,
        },
      }),
    ),
  )

  // Services
  const services = [
    {
      providerIdx: 0,
      name: 'General consultation',
      description: '20-minute wellness or sickness consultation with diagnostics discussion.',
      durationMins: 20,
      priceFrom: 55,
      category: 'CONSULTATION',
    },
    {
      providerIdx: 0,
      name: 'Senior wellness checkup',
      description: 'Comprehensive senior pet exam with blood panel and urinalysis.',
      durationMins: 45,
      priceFrom: 180,
      category: 'CONSULTATION',
    },
    {
      providerIdx: 1,
      name: 'Orthopedic consult',
      description: 'Surgical and orthopedic specialist consultation. Pre-op and post-op plans.',
      durationMins: 30,
      priceFrom: 120,
      category: 'CONSULTATION',
    },
    {
      providerIdx: 2,
      name: 'Full grooming package',
      description: 'Bath, brush, breed cut, nails, ears, and anal glands.',
      durationMins: 120,
      priceFrom: 75,
      category: 'GROOMING',
    },
    {
      providerIdx: 2,
      name: 'Quick tidy',
      description: 'Bath, brush, nails, and ears.',
      durationMins: 60,
      priceFrom: 40,
      category: 'GROOMING',
    },
    {
      providerIdx: 3,
      name: 'Day boarding',
      description: 'Day care with supervised play, lunch, and evening pick-up.',
      durationMins: 480,
      priceFrom: 35,
      category: 'BOARDING',
    },
    {
      providerIdx: 3,
      name: 'Overnight boarding',
      description: '24h boarding with private kennel, walks, and meals.',
      durationMins: 1440,
      priceFrom: 45,
      category: 'BOARDING',
    },
    {
      providerIdx: 4,
      name: 'Group walk (60 min)',
      description: 'Small group walk with socialization. GPS-tracked.',
      durationMins: 60,
      priceFrom: 18,
      category: 'WALKING',
    },
    {
      providerIdx: 4,
      name: 'Solo walk (45 min)',
      description: 'One-on-one walk tailored to your dog’s pace.',
      durationMins: 45,
      priceFrom: 22,
      category: 'WALKING',
    },
    {
      providerIdx: 5,
      name: 'Puppy fundamentals (6 weeks)',
      description: '6 weekly group classes. Sit, stay, recall, loose-leash walking.',
      durationMins: 360,
      priceFrom: 220,
      category: 'TRAINING',
    },
    {
      providerIdx: 5,
      name: 'Behavior consultation',
      description: '1-on-1 home visit for behavior concerns.',
      durationMins: 90,
      priceFrom: 130,
      category: 'TRAINING',
    },
    {
      providerIdx: 6,
      name: 'In-home cat visit (30 min)',
      description: 'Feeding, litter, play, and cuddle time in your home.',
      durationMins: 30,
      priceFrom: 18,
      category: 'BOARDING',
    },
    {
      providerIdx: 7,
      name: 'Airport pet transfer',
      description: 'Door-to-airport and airport-to-door pet transport.',
      durationMins: 120,
      priceFrom: 90,
      category: 'TRANSPORT',
    },
  ]

  for (const s of services) {
    await db.service.create({
      data: {
        providerId: createdProviders[s.providerIdx].id,
        name: s.name,
        description: s.description,
        durationMins: s.durationMins,
        priceFrom: s.priceFrom,
        category: s.category,
      },
    })
  }

  // ── A couple of past bookings ────────────────────────
  await db.booking.create({
    data: {
      ownerId: owner.id,
      providerId: createdProviders[0].id,
      petId: milo.id,
      scheduledAt: new Date('2024-03-12T10:00:00'),
      status: 'COMPLETED',
      notes: 'Annual wellness exam',
      price: 55,
    },
  })

  await db.booking.create({
    data: {
      ownerId: owner.id,
      providerId: createdProviders[2].id,
      petId: luna.id,
      scheduledAt: new Date('2024-05-20T14:00:00'),
      status: 'COMPLETED',
      notes: 'Dental cleaning',
      price: 90,
    },
  })

  console.log(`✅ Seeded owner ${owner.email}`)
  console.log(`✅ Seeded ${2} pets, ${createdProviders.length} providers, ${services.length} services`)
  console.log(`✅ Seeded medical events, vaccines, medications, reminders, AI assessments`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
