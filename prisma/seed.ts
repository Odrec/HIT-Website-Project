import { PrismaClient, Institution, EventType, LocationType, UserRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...')
  await prisma.scheduleItem.deleteMany()
  await prisma.userSchedule.deleteMany()
  await prisma.eventInformationMarket.deleteMany()
  await prisma.eventStudyProgram.deleteMany()
  await prisma.eventOrganizer.deleteMany()
  await prisma.lecturer.deleteMany()
  await prisma.event.deleteMany()
  await prisma.studyProgram.deleteMany()
  await prisma.studyProgramCluster.deleteMany()
  await prisma.informationMarket.deleteMany()
  await prisma.location.deleteMany()
  await prisma.user.deleteMany()

  // ==========================================================================
  // Create Study Program Clusters
  // ==========================================================================
  console.log('📚 Creating study program clusters...')

  const clusters = await Promise.all([
    prisma.studyProgramCluster.create({
      data: {
        name: 'Ingenieurwissenschaften',
        description: 'Engineering and technical sciences',
      },
    }),
    prisma.studyProgramCluster.create({
      data: {
        name: 'Wirtschaftswissenschaften',
        description: 'Business and economics',
      },
    }),
    prisma.studyProgramCluster.create({
      data: {
        name: 'Naturwissenschaften',
        description: 'Natural sciences',
      },
    }),
    prisma.studyProgramCluster.create({
      data: {
        name: 'Sozialwissenschaften',
        description: 'Social sciences',
      },
    }),
    prisma.studyProgramCluster.create({
      data: {
        name: 'Lehramt',
        description: 'Teacher education programs',
      },
    }),
    prisma.studyProgramCluster.create({
      data: {
        name: 'Informatik & Medien',
        description: 'Computer science and media',
      },
    }),
  ])

  // ==========================================================================
  // Create Study Programs
  // ==========================================================================
  console.log('🎓 Creating study programs...')

  const studyPrograms = await Promise.all([
    // Uni programs
    prisma.studyProgram.create({
      data: {
        name: 'Informatik (B.Sc.)',
        institution: Institution.UNI,
        clusterId: clusters[5].id,
      },
    }),
    prisma.studyProgram.create({
      data: {
        name: 'Mathematik (B.Sc.)',
        institution: Institution.UNI,
        clusterId: clusters[2].id,
      },
    }),
    prisma.studyProgram.create({
      data: {
        name: 'Psychologie (B.Sc.)',
        institution: Institution.UNI,
        clusterId: clusters[3].id,
      },
    }),
    prisma.studyProgram.create({
      data: {
        name: 'Betriebswirtschaftslehre (B.Sc.)',
        institution: Institution.UNI,
        clusterId: clusters[1].id,
      },
    }),
    prisma.studyProgram.create({
      data: {
        name: 'Lehramt Grundschule',
        institution: Institution.UNI,
        clusterId: clusters[4].id,
      },
    }),
    // Hochschule programs
    prisma.studyProgram.create({
      data: {
        name: 'Elektrotechnik (B.Eng.)',
        institution: Institution.HOCHSCHULE,
        clusterId: clusters[0].id,
      },
    }),
    prisma.studyProgram.create({
      data: {
        name: 'Maschinenbau (B.Eng.)',
        institution: Institution.HOCHSCHULE,
        clusterId: clusters[0].id,
      },
    }),
    prisma.studyProgram.create({
      data: {
        name: 'Wirtschaftsingenieurwesen (B.Eng.)',
        institution: Institution.HOCHSCHULE,
        clusterId: clusters[1].id,
      },
    }),
    prisma.studyProgram.create({
      data: {
        name: 'Medieninformatik (B.Sc.)',
        institution: Institution.HOCHSCHULE,
        clusterId: clusters[5].id,
      },
    }),
    prisma.studyProgram.create({
      data: {
        name: 'Soziale Arbeit (B.A.)',
        institution: Institution.HOCHSCHULE,
        clusterId: clusters[3].id,
      },
    }),
  ])

  // ==========================================================================
  // Create Locations
  // ==========================================================================
  console.log('📍 Creating locations...')

  const locations = await Promise.all([
    prisma.location.create({
      data: {
        buildingName: 'Schloss',
        roomNumber: 'Aula',
        address: 'Neuer Graben 29, 49074 Osnabrück',
        latitude: 52.2719,
        longitude: 8.0489,
      },
    }),
    prisma.location.create({
      data: {
        buildingName: 'Gebäude 15',
        roomNumber: '15/E01',
        address: 'Westerberg Campus, 49076 Osnabrück',
        latitude: 52.2825,
        longitude: 8.0231,
      },
    }),
    prisma.location.create({
      data: {
        buildingName: 'Caprivi Campus',
        roomNumber: 'CN 001',
        address: 'Caprivistraße 30A, 49076 Osnabrück',
        latitude: 52.2873,
        longitude: 8.0192,
      },
    }),
    prisma.location.create({
      data: {
        buildingName: 'Gebäude 66',
        roomNumber: '66/E01',
        address: 'Barbarastraße 7, 49076 Osnabrück',
        latitude: 52.2831,
        longitude: 8.0198,
      },
    }),
  ])

  // ==========================================================================
  // Create Information Markets
  // ==========================================================================
  console.log('🏪 Creating information markets...')

  const infoMarkets = await Promise.all([
    prisma.informationMarket.create({
      data: {
        name: 'Infomarkt Schloss',
        location: 'Schloss Innenhof',
      },
    }),
    prisma.informationMarket.create({
      data: {
        name: 'Infomarkt Caprivi',
        location: 'Caprivi Campus Foyer',
      },
    }),
  ])

  // ==========================================================================
  // Create Sample Events
  // ==========================================================================
  console.log('📅 Creating sample events...')

  // Event: Informatik Vortrag
  const event1 = await prisma.event.create({
    data: {
      title: 'Einführung in die Informatik',
      description:
        'Erfahren Sie alles über das Informatik-Studium an der Universität Osnabrück. Wir zeigen Ihnen, was Sie erwartet und welche Karrieremöglichkeiten sich bieten.',
      eventType: EventType.VORTRAG,
      timeStart: new Date('2026-11-19T10:00:00'),
      timeEnd: new Date('2026-11-19T11:00:00'),
      locationType: LocationType.OTHER,
      institution: Institution.UNI,
      locationId: locations[0].id,
      meetingPoint: 'Haupteingang Schloss',
    },
  })

  // Event: Maschinenbau Laborführung
  const event2 = await prisma.event.create({
    data: {
      title: 'Laborführung Maschinenbau',
      description:
        'Besichtigen Sie unsere modernen Maschinenbau-Labore und sehen Sie aktuelle Forschungsprojekte.',
      eventType: EventType.LABORFUEHRUNG,
      timeStart: new Date('2026-11-19T11:30:00'),
      timeEnd: new Date('2026-11-19T12:30:00'),
      locationType: LocationType.OTHER,
      institution: Institution.HOCHSCHULE,
      locationId: locations[2].id,
      meetingPoint: 'Caprivi Campus Eingang',
    },
  })

  // Event: Psychologie Workshop
  const event3 = await prisma.event.create({
    data: {
      title: 'Workshop: Psychologie im Alltag',
      description:
        'Interaktiver Workshop zu psychologischen Phänomenen im Alltag. Für alle Interessierten geeignet.',
      eventType: EventType.WORKSHOP,
      timeStart: new Date('2026-11-19T14:00:00'),
      timeEnd: new Date('2026-11-19T15:30:00'),
      locationType: LocationType.OTHER,
      institution: Institution.UNI,
      locationId: locations[1].id,
    },
  })

  // Event: Infostand Wirtschaftsingenieurwesen
  const event4 = await prisma.event.create({
    data: {
      title: 'Infostand Wirtschaftsingenieurwesen',
      description: 'Besuchen Sie unseren Infostand und erfahren Sie mehr über das Studium.',
      eventType: EventType.INFOSTAND,
      timeStart: new Date('2026-11-19T09:00:00'),
      timeEnd: new Date('2026-11-19T16:00:00'),
      locationType: LocationType.INFOMARKT_CN,
      locationDetails: { standNumber: 'A12', hasPoster: true, needsPower: true },
      institution: Institution.HOCHSCHULE,
    },
  })

  // Event: Campus Rundgang
  const event5 = await prisma.event.create({
    data: {
      title: 'Campus-Rundgang für Studieninteressierte',
      description:
        'Lernen Sie den Campus kennen! Wir zeigen Ihnen wichtige Gebäude, die Bibliothek und die Mensa.',
      eventType: EventType.RUNDGANG,
      timeStart: new Date('2026-11-19T13:00:00'),
      timeEnd: new Date('2026-11-19T14:00:00'),
      locationType: LocationType.OTHER,
      institution: Institution.BOTH,
      meetingPoint: 'Vor der Mensa Westerberg',
    },
  })

  // ==========================================================================
  // Link Events to Study Programs
  // ==========================================================================
  console.log('🔗 Linking events to study programs...')

  await Promise.all([
    prisma.eventStudyProgram.create({
      data: { eventId: event1.id, studyProgramId: studyPrograms[0].id },
    }),
    prisma.eventStudyProgram.create({
      data: { eventId: event2.id, studyProgramId: studyPrograms[6].id },
    }),
    prisma.eventStudyProgram.create({
      data: { eventId: event3.id, studyProgramId: studyPrograms[2].id },
    }),
    prisma.eventStudyProgram.create({
      data: { eventId: event4.id, studyProgramId: studyPrograms[7].id },
    }),
  ])

  // ==========================================================================
  // Link Events to Information Markets
  // ==========================================================================
  console.log('🔗 Linking events to information markets...')

  await prisma.eventInformationMarket.create({
    data: { eventId: event4.id, marketId: infoMarkets[1].id },
  })

  // ==========================================================================
  // Create Lecturers
  // ==========================================================================
  console.log('👨‍🏫 Creating lecturers...')

  await Promise.all([
    prisma.lecturer.create({
      data: {
        eventId: event1.id,
        firstName: 'Thomas',
        lastName: 'Müller',
        title: 'Prof. Dr.',
        email: 'thomas.mueller@uni-osnabrueck.de',
        building: 'Gebäude 93',
        roomNumber: '93/E02',
      },
    }),
    prisma.lecturer.create({
      data: {
        eventId: event2.id,
        firstName: 'Anna',
        lastName: 'Schmidt',
        title: 'Prof. Dr.-Ing.',
        email: 'anna.schmidt@hs-osnabrueck.de',
        building: 'Caprivi',
        roomNumber: 'CN 123',
      },
    }),
    prisma.lecturer.create({
      data: {
        eventId: event3.id,
        firstName: 'Michael',
        lastName: 'Weber',
        title: 'Dr.',
        email: 'michael.weber@uni-osnabrueck.de',
      },
    }),
  ])

  // ==========================================================================
  // Create Event Organizers
  // ==========================================================================
  console.log('📧 Creating event organizers...')

  await Promise.all([
    prisma.eventOrganizer.create({
      data: {
        eventId: event1.id,
        email: 'zsb@uni-osnabrueck.de',
        phone: '+49 541 969-4999',
        internalOnly: true,
      },
    }),
    prisma.eventOrganizer.create({
      data: {
        eventId: event5.id,
        email: 'studienberatung@hs-osnabrueck.de',
        phone: '+49 541 969-2930',
        internalOnly: true,
      },
    }),
  ])

  // ==========================================================================
  // Create Admin User
  // ==========================================================================
  console.log('👤 Creating admin user...')

  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      email: 'admin@zsb-os.de',
      passwordHash: hashedPassword,
      name: 'HIT Administrator',
      role: UserRole.ADMIN,
    },
  })

  console.log('✅ Database seeding completed successfully!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   - ${clusters.length} study program clusters`)
  console.log(`   - ${studyPrograms.length} study programs`)
  console.log(`   - ${locations.length} locations`)
  console.log(`   - ${infoMarkets.length} information markets`)
  console.log('   - 5 sample events')
  console.log('   - 1 admin user (admin@zsb-os.de / admin123)')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
