/// <reference types="node" />
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client/client'
import * as $Enums from '../src/generated/prisma/client/enums'
import * as bcrypt from 'bcryptjs'

const { Institution, EventType, LocationType, UserRole, Affiliation } = $Enums

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...')
  await prisma.scheduleItem.deleteMany()
  await prisma.userSchedule.deleteMany()
  await prisma.sharedSchedule.deleteMany()
  await prisma.eventInformationMarket.deleteMany()
  await prisma.eventStudyProgram.deleteMany()
  await prisma.eventOrganizer.deleteMany()
  await prisma.lecturer.deleteMany()
  await prisma.event.deleteMany()
  await prisma.studyProgram.deleteMany()
  await prisma.studyProgramCluster.deleteMany()
  await prisma.informationMarket.deleteMany()
  await prisma.cachedRoute.deleteMany()
  await prisma.room.deleteMany()
  await prisma.building.deleteMany()
  await prisma.melder.deleteMany()
  await prisma.user.deleteMany()

  // ==========================================================================
  // Seed Site Settings
  // ==========================================================================
  console.log('⚙️ Seeding site settings...')

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      hitDate: new Date('2026-11-19T00:00:00Z'),
      submissionDeadline: new Date('2026-10-15T00:00:00Z'),
      deadlineEnabled: true,
    },
  })

  // ==========================================================================
  // Create Buildings (all 13 campus buildings)
  // ==========================================================================
  console.log('🏢 Creating buildings...')

  const buildingData = [
    // Schloss Campus
    { slug: 'schloss', name: 'Schloss Osnabrück', shortName: 'Schloss', address: 'Neuer Graben 29, 49074 Osnabrück', campus: 'schloss', institution: Institution.UNI, latitude: 52.27148, longitude: 8.04424, hasAccessibility: true },
    { slug: 'uos-aula', name: 'Aula der Universität', shortName: 'Aula', address: 'Neuer Graben 29, 49074 Osnabrück', campus: 'schloss', institution: Institution.UNI, latitude: 52.27148, longitude: 8.04424, hasAccessibility: true },
    { slug: 'seminarstrasse', name: 'Seminarstraße Gebäude', shortName: 'Seminar', address: 'Seminarstraße 20, 49074 Osnabrück', campus: 'schloss', institution: Institution.UNI, latitude: 52.27130, longitude: 8.04585, hasAccessibility: false, accessibilityNotes: 'Historisches Gebäude, eingeschränkter Zugang' },
    // Westerberg Campus
    { slug: 'avz', name: 'AVZ (Allgemeines Verfügungszentrum)', shortName: 'AVZ', address: 'Albrechtstraße 28, 49076 Osnabrück', campus: 'westerberg', institution: Institution.UNI, latitude: 52.28386, longitude: 8.02513, hasAccessibility: true },
    { slug: 'biologie', name: 'Biologiegebäude', shortName: 'Bio', address: 'Barbarastraße 11, 49076 Osnabrück', campus: 'westerberg', institution: Institution.UNI, latitude: 52.28272, longitude: 8.02173, hasAccessibility: true },
    { slug: 'physik', name: 'Physikgebäude', shortName: 'Physik', address: 'Barbarastraße 7, 49076 Osnabrück', campus: 'westerberg', institution: Institution.UNI, latitude: 52.28482, longitude: 8.02508, hasAccessibility: true },
    { slug: 'chemie', name: 'Chemiegebäude', shortName: 'Chemie', address: 'Barbarastraße 7, 49076 Osnabrück', campus: 'westerberg', institution: Institution.UNI, latitude: 52.28476, longitude: 8.02431, hasAccessibility: true },
    { slug: 'mathematik', name: 'Mathematik/Informatik', shortName: 'Mathe/Info', address: 'Albrechtstraße 28a, 49076 Osnabrück', campus: 'westerberg', institution: Institution.UNI, latitude: 52.28439, longitude: 8.02605, hasAccessibility: true },
    { slug: 'eihu', name: 'EIHU (Erweiterungsbau Informatik)', shortName: 'EIHU', address: 'Wachsbleiche 27, 49076 Osnabrück', campus: 'westerberg', institution: Institution.UNI, latitude: 52.28371, longitude: 8.02531, hasAccessibility: true },
    // Caprivi Campus (Hochschule)
    { slug: 'caprivi-a', name: 'Caprivistraße Gebäude A', shortName: 'CN-A', address: 'Caprivistraße 30a, 49076 Osnabrück', campus: 'caprivi', institution: Institution.HOCHSCHULE, latitude: 52.2756, longitude: 8.0148, hasAccessibility: true },
    { slug: 'caprivi-b', name: 'Caprivistraße Gebäude B', shortName: 'CN-B', address: 'Caprivistraße 30b, 49076 Osnabrück', campus: 'caprivi', institution: Institution.HOCHSCHULE, latitude: 52.2761, longitude: 8.0155, hasAccessibility: true },
    { slug: 'caprivi-c', name: 'Caprivistraße Gebäude C', shortName: 'CN-C', address: 'Caprivistraße 30c, 49076 Osnabrück', campus: 'caprivi', institution: Institution.HOCHSCHULE, latitude: 52.2766, longitude: 8.0162, hasAccessibility: true },
    { slug: 'caprivi-mensa', name: 'Mensa Caprivi', shortName: 'Mensa CN', address: 'Caprivistraße 30, 49076 Osnabrück', campus: 'caprivi', institution: Institution.HOCHSCHULE, latitude: 52.2751, longitude: 8.0141, hasAccessibility: true },
  ]

  const buildings: Record<string, { id: string }> = {}
  for (const b of buildingData) {
    const created = await prisma.building.create({ data: b })
    buildings[b.slug] = created
  }

  // ==========================================================================
  // Create Rooms
  // ==========================================================================
  console.log('🚪 Creating rooms...')

  const roomData = [
    // Schloss
    { name: 'Aula', floor: 'EG', buildingSlug: 'schloss' },
    { name: '101', floor: '1. OG', buildingSlug: 'schloss' },
    { name: '212', floor: '2. OG', buildingSlug: 'schloss' },
    { name: '313', floor: '3. OG', buildingSlug: 'schloss' },
    // Aula
    { name: 'Großer Saal', floor: 'EG', buildingSlug: 'uos-aula' },
    { name: 'Foyer', floor: 'EG', buildingSlug: 'uos-aula' },
    // Seminarstraße
    { name: '01/E01', floor: 'EG', buildingSlug: 'seminarstrasse' },
    { name: '01/114', floor: '1. OG', buildingSlug: 'seminarstrasse' },
    // AVZ
    { name: 'Hörsaal 1 (AVZ)', floor: 'EG', buildingSlug: 'avz' },
    { name: 'Hörsaal 2 (AVZ)', floor: 'EG', buildingSlug: 'avz' },
    { name: '01/E04', floor: 'EG', buildingSlug: 'avz' },
    { name: '02/105', floor: '1. OG', buildingSlug: 'avz' },
    // Biologie
    { name: '35/E01', floor: 'EG', buildingSlug: 'biologie' },
    { name: '35/E25 (Labor)', floor: 'EG', buildingSlug: 'biologie' },
    // Physik
    { name: '32/102', floor: '1. OG', buildingSlug: 'physik' },
    { name: '32/E04 (Physik-Labor)', floor: 'EG', buildingSlug: 'physik' },
    // Chemie
    { name: '31/449 (Hörsaal Chemie)', floor: 'EG', buildingSlug: 'chemie' },
    { name: '31/E05 (Chemie-Labor)', floor: 'EG', buildingSlug: 'chemie' },
    // Mathe/Info
    { name: '69/125', floor: '1. OG', buildingSlug: 'mathematik' },
    { name: '69/E15 (CIP-Pool)', floor: 'EG', buildingSlug: 'mathematik' },
    { name: '69/117 (Seminarraum)', floor: '1. OG', buildingSlug: 'mathematik' },
    // EIHU
    { name: 'EIHU/E01', floor: 'EG', buildingSlug: 'eihu' },
    { name: 'EIHU/111 (KI-Labor)', floor: '1. OG', buildingSlug: 'eihu' },
    // Caprivi A
    { name: 'CN-A E01', floor: 'EG', buildingSlug: 'caprivi-a' },
    { name: 'CN-A 110', floor: '1. OG', buildingSlug: 'caprivi-a' },
    { name: 'CN-A 215 (Labor)', floor: '2. OG', buildingSlug: 'caprivi-a' },
    // Caprivi B
    { name: 'CN-B E01', floor: 'EG', buildingSlug: 'caprivi-b' },
    { name: 'CN-B 105 (Werkstatt)', floor: '1. OG', buildingSlug: 'caprivi-b' },
    // Caprivi C
    { name: 'CN-C E01', floor: 'EG', buildingSlug: 'caprivi-c' },
    { name: 'CN-C 201 (Medien-Labor)', floor: '2. OG', buildingSlug: 'caprivi-c' },
  ]

  const rooms: Record<string, { id: string }> = {}
  for (const r of roomData) {
    const created = await prisma.room.create({
      data: { name: r.name, floor: r.floor, buildingId: buildings[r.buildingSlug].id },
    })
    rooms[r.name] = created
  }

  // ==========================================================================
  // Create Study Program Clusters
  // ==========================================================================
  console.log('📚 Creating study program clusters...')

  const clusters = await Promise.all([
    prisma.studyProgramCluster.create({ data: { name: 'Geistes- und Sozialwissenschaften, Sport', description: 'Humanities, social sciences, and sports', icon: 'geistes-sozial-sport.svg' } }),
    prisma.studyProgramCluster.create({ data: { name: 'Mathematik, Informatik, Naturwissenschaften', description: 'Mathematics, computer science, and natural sciences', icon: 'mathe-info-natur.svg' } }),
    prisma.studyProgramCluster.create({ data: { name: 'Rechts- und Wirtschaftswissenschaften', description: 'Law and economics', icon: 'rechts-wirtschaft.svg' } }),
    prisma.studyProgramCluster.create({ data: { name: 'Sprach-, Literatur- und Kulturwissenschaften', description: 'Languages, literature, and cultural studies', icon: 'sprach-literatur-kultur.svg' } }),
    prisma.studyProgramCluster.create({ data: { name: 'Theologie, Kunst, Musik, Textil', description: 'Theology, art, music, and textile', icon: 'theologie-kunst-musik.svg' } }),
    prisma.studyProgramCluster.create({ data: { name: 'Lehramt', description: 'Teacher education programs', icon: 'lehramt.svg' } }),
  ])

  // ==========================================================================
  // Create Study Programs
  // ==========================================================================
  console.log('🎓 Creating study programs...')

  const studyPrograms = await Promise.all([
    // Geistes- und Sozialwissenschaften, Sport
    prisma.studyProgram.create({ data: { name: 'Psychologie (B.Sc.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[0].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Soziologie (B.A.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[0].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Sportwissenschaft (B.A.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[0].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Soziale Arbeit (B.A.)', institution: Institution.HOCHSCHULE, clusters: { connect: [{ id: clusters[0].id }] } } }),
    // Mathematik, Informatik, Naturwissenschaften
    prisma.studyProgram.create({ data: { name: 'Informatik (B.Sc.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[1].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Mathematik (B.Sc.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[1].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Biologie (B.Sc.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[1].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Physik (B.Sc.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[1].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Chemie (B.Sc.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[1].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Elektrotechnik (B.Eng.)', institution: Institution.HOCHSCHULE, clusters: { connect: [{ id: clusters[1].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Maschinenbau (B.Eng.)', institution: Institution.HOCHSCHULE, clusters: { connect: [{ id: clusters[1].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Medieninformatik (B.Sc.)', institution: Institution.HOCHSCHULE, clusters: { connect: [{ id: clusters[1].id }] } } }),
    // Rechts- und Wirtschaftswissenschaften
    prisma.studyProgram.create({ data: { name: 'Betriebswirtschaftslehre (B.Sc.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[2].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Rechtswissenschaft (Staatsexamen)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[2].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Wirtschaftsingenieurwesen (B.Eng.)', institution: Institution.HOCHSCHULE, clusters: { connect: [{ id: clusters[2].id }] } } }),
    // Sprach-, Literatur- und Kulturwissenschaften
    prisma.studyProgram.create({ data: { name: 'Germanistik/Deutsch (B.A.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[3].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Anglistik/Englisch (B.A.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[3].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Romanistik/Französisch (B.A.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[3].id }] } } }),
    // Theologie, Kunst, Musik, Textil
    prisma.studyProgram.create({ data: { name: 'Evangelische Theologie/Religion (B.A.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[4].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Musik/Musikwissenschaft (B.A.)', institution: Institution.UNI, clusters: { connect: [{ id: clusters[4].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Textiles Gestalten (B.A.)', institution: Institution.HOCHSCHULE, clusters: { connect: [{ id: clusters[4].id }] } } }),
    // Lehramt
    prisma.studyProgram.create({ data: { name: 'Lehramt Grundschule', institution: Institution.UNI, clusters: { connect: [{ id: clusters[5].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Lehramt Haupt-/Realschule', institution: Institution.UNI, clusters: { connect: [{ id: clusters[5].id }] } } }),
    prisma.studyProgram.create({ data: { name: 'Lehramt Gymnasium', institution: Institution.UNI, clusters: { connect: [{ id: clusters[5].id }] } } }),
  ])

  // ==========================================================================
  // Create Information Markets
  // ==========================================================================
  console.log('🏪 Creating information markets...')

  const infoMarkets = await Promise.all([
    prisma.informationMarket.create({ data: { name: 'Infomarkt Schloss', location: 'Schloss Innenhof' } }),
    prisma.informationMarket.create({ data: { name: 'Infomarkt SL', location: 'Westerberg (SL)' } }),
    prisma.informationMarket.create({ data: { name: 'Infomarkt Caprivi', location: 'Caprivi Campus Foyer' } }),
  ])

  // ==========================================================================
  // Create Admin & Organizer Users
  // ==========================================================================
  console.log('👤 Creating users...')

  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: { email: 'admin@zsb-os.de', passwordHash: hashedPassword, name: 'HIT Administrator', role: UserRole.ADMIN },
  })

  const orgPassword = await bcrypt.hash('org123', 10)
  const orgUser = await prisma.user.create({
    data: { email: 'melder@uni-osnabrueck.de', passwordHash: orgPassword, name: 'Prof. Dr. Thomas Müller', role: UserRole.ORGANIZER },
  })

  // Create Melder profile for the organizer
  const melder = await prisma.melder.create({
    data: {
      userId: orgUser.id,
      firstName: 'Thomas',
      lastName: 'Müller',
      title: 'Prof. Dr.',
      email: 'thomas.mueller@uni-osnabrueck.de',
      phone: '+49 541 969-2480',
      affiliation: Affiliation.UNI,
      fakultaet: 'Mathematik/Informatik',
      fachbereich: 'Institut für Informatik',
      room: '69/325',
    },
  })

  // ==========================================================================
  // Create Events (diverse types, buildings, campuses, times)
  // ==========================================================================
  console.log('📅 Creating events...')

  // HIT date: 2026-11-19
  const D = '2026-11-19'

  const events = await Promise.all([
    // --- Schloss Campus events ---
    prisma.event.create({
      data: {
        title: 'Einführung in die Informatik',
        description: 'Erfahren Sie alles über das Informatik-Studium an der Universität Osnabrück. Wir zeigen Ihnen, was Sie erwartet und welche Karrieremöglichkeiten sich bieten.',
        eventType: EventType.VORTRAG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T09:00:00`), timeEnd: new Date(`${D}T09:45:00`),
        buildingId: buildings['schloss'].id, roomId: rooms['Aula'].id,
        melderId: melder.id,
        meetingPoint: 'Haupteingang Schloss',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Studium der Rechtswissenschaft',
        description: 'Informationsveranstaltung über das Jura-Studium mit Einblicken in die Studieninhalte, Praxisbezug und berufliche Perspektiven.',
        eventType: EventType.VORTRAG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T10:00:00`), timeEnd: new Date(`${D}T10:45:00`),
        buildingId: buildings['schloss'].id, roomId: rooms['101'].id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'BWL — Studium und Berufsperspektiven',
        description: 'Vorstellung des BWL-Studiengangs mit Schwerpunkten, Auslandssemester und Karrieremöglichkeiten.',
        eventType: EventType.VORTRAG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T11:00:00`), timeEnd: new Date(`${D}T11:45:00`),
        buildingId: buildings['schloss'].id, roomId: rooms['212'].id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Campusführung Schloss und Innenstadt',
        description: 'Rundgang über den Schloss-Campus und die umliegenden Uni-Gebäude in der Innenstadt.',
        eventType: EventType.RUNDGANG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T13:00:00`), timeEnd: new Date(`${D}T14:00:00`),
        buildingId: buildings['schloss'].id,
        meetingPoint: 'Vor dem Schloss-Haupteingang',
      },
    }),

    // --- Seminarstraße events ---
    prisma.event.create({
      data: {
        title: 'Germanistik — Sprache, Literatur, Medien',
        description: 'Was erwartet Sie im Germanistik-Studium? Lehrende stellen den Studiengang vor.',
        eventType: EventType.VORTRAG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T10:00:00`), timeEnd: new Date(`${D}T10:45:00`),
        buildingId: buildings['seminarstrasse'].id, roomId: rooms['01/E01'].id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Fremdsprachen studieren: Anglistik & Romanistik',
        description: 'Informationen zu den Studiengängen Anglistik und Romanistik.',
        eventType: EventType.VORTRAG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T11:00:00`), timeEnd: new Date(`${D}T11:45:00`),
        buildingId: buildings['seminarstrasse'].id, roomId: rooms['01/114'].id,
      },
    }),

    // --- AVZ events ---
    prisma.event.create({
      data: {
        title: 'Workshop: Psychologie im Alltag',
        description: 'Interaktiver Workshop zu psychologischen Phänomenen im Alltag. Für alle Interessierten geeignet.',
        eventType: EventType.WORKSHOP, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T14:00:00`), timeEnd: new Date(`${D}T15:30:00`),
        buildingId: buildings['avz'].id, roomId: rooms['Hörsaal 1 (AVZ)'].id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Soziologie — Gesellschaft verstehen',
        description: 'Einblick in das Soziologie-Studium und aktuelle Forschungsthemen.',
        eventType: EventType.VORTRAG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T10:00:00`), timeEnd: new Date(`${D}T10:45:00`),
        buildingId: buildings['avz'].id, roomId: rooms['Hörsaal 2 (AVZ)'].id,
      },
    }),

    // --- Biologie events ---
    prisma.event.create({
      data: {
        title: 'Laborführung Biologie',
        description: 'Besichtigung der biologischen Forschungslabore mit Live-Demonstrationen.',
        eventType: EventType.LABORFUEHRUNG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T11:00:00`), timeEnd: new Date(`${D}T12:00:00`),
        buildingId: buildings['biologie'].id, roomId: rooms['35/E25 (Labor)'].id,
        meetingPoint: 'Foyer Biologiegebäude',
      },
    }),

    // --- Physik events ---
    prisma.event.create({
      data: {
        title: 'Physik zum Anfassen',
        description: 'Spannende Physik-Experimente live erleben! Professoren zeigen faszinierende Phänomene.',
        eventType: EventType.LABORFUEHRUNG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T13:00:00`), timeEnd: new Date(`${D}T14:00:00`),
        buildingId: buildings['physik'].id, roomId: rooms['32/E04 (Physik-Labor)'].id,
      },
    }),

    // --- Chemie events ---
    prisma.event.create({
      data: {
        title: 'Chemie-Show: Feuer, Farben, Faszination',
        description: 'Spektakuläre Chemie-Vorführung mit Experimenten zum Staunen.',
        eventType: EventType.LABORFUEHRUNG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T15:00:00`), timeEnd: new Date(`${D}T16:00:00`),
        buildingId: buildings['chemie'].id, roomId: rooms['31/449 (Hörsaal Chemie)'].id,
      },
    }),

    // --- Mathe/Info events ---
    prisma.event.create({
      data: {
        title: 'Mathematik — Mehr als Rechnen',
        description: 'Warum Mathematik studieren? Einblicke in Studienalltag und Berufschancen.',
        eventType: EventType.VORTRAG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T09:00:00`), timeEnd: new Date(`${D}T09:45:00`),
        buildingId: buildings['mathematik'].id, roomId: rooms['69/125'].id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Workshop: Programmieren für Anfänger',
        description: 'Erste Schritte in Python — ein Hands-on-Workshop für alle ohne Vorkenntnisse.',
        eventType: EventType.WORKSHOP, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T11:00:00`), timeEnd: new Date(`${D}T12:30:00`),
        buildingId: buildings['mathematik'].id, roomId: rooms['69/E15 (CIP-Pool)'].id,
        melderId: melder.id,
      },
    }),

    // --- EIHU events ---
    prisma.event.create({
      data: {
        title: 'KI und Machine Learning — Forschung live',
        description: 'Vorführung aktueller KI-Forschungsprojekte im KI-Labor der Uni.',
        eventType: EventType.LABORFUEHRUNG, locationType: LocationType.OTHER, institution: Institution.UNI,
        timeStart: new Date(`${D}T14:00:00`), timeEnd: new Date(`${D}T15:00:00`),
        buildingId: buildings['eihu'].id, roomId: rooms['EIHU/111 (KI-Labor)'].id,
      },
    }),

    // --- Caprivi A events (Hochschule) ---
    prisma.event.create({
      data: {
        title: 'Laborführung Maschinenbau',
        description: 'Besichtigen Sie unsere modernen Maschinenbau-Labore und sehen Sie aktuelle Forschungsprojekte.',
        eventType: EventType.LABORFUEHRUNG, locationType: LocationType.OTHER, institution: Institution.HOCHSCHULE,
        timeStart: new Date(`${D}T10:00:00`), timeEnd: new Date(`${D}T11:00:00`),
        buildingId: buildings['caprivi-a'].id, roomId: rooms['CN-A 215 (Labor)'].id,
        meetingPoint: 'Caprivi Campus Eingang',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Elektrotechnik — Technik der Zukunft',
        description: 'Vorstellung des Studiengangs Elektrotechnik mit Laborbesichtigung.',
        eventType: EventType.VORTRAG, locationType: LocationType.OTHER, institution: Institution.HOCHSCHULE,
        timeStart: new Date(`${D}T11:30:00`), timeEnd: new Date(`${D}T12:15:00`),
        buildingId: buildings['caprivi-a'].id, roomId: rooms['CN-A 110'].id,
      },
    }),

    // --- Caprivi B events ---
    prisma.event.create({
      data: {
        title: 'Werkstattführung: Prototypenbau',
        description: 'Sehen Sie, wie Studierende eigene Prototypen in der Werkstatt bauen.',
        eventType: EventType.LABORFUEHRUNG, locationType: LocationType.OTHER, institution: Institution.HOCHSCHULE,
        timeStart: new Date(`${D}T13:00:00`), timeEnd: new Date(`${D}T14:00:00`),
        buildingId: buildings['caprivi-b'].id, roomId: rooms['CN-B 105 (Werkstatt)'].id,
      },
    }),

    // --- Caprivi C events ---
    prisma.event.create({
      data: {
        title: 'Medieninformatik — Kreativität trifft Technik',
        description: 'Vorstellung des Studiengangs mit Demos aus dem Medien-Labor.',
        eventType: EventType.WORKSHOP, locationType: LocationType.OTHER, institution: Institution.HOCHSCHULE,
        timeStart: new Date(`${D}T14:00:00`), timeEnd: new Date(`${D}T15:30:00`),
        buildingId: buildings['caprivi-c'].id, roomId: rooms['CN-C 201 (Medien-Labor)'].id,
      },
    }),

    // --- Infostand events (no building) ---
    prisma.event.create({
      data: {
        title: 'Infostand Wirtschaftsingenieurwesen',
        description: 'Besuchen Sie unseren Infostand und erfahren Sie mehr über das Studium.',
        eventType: EventType.INFOSTAND, locationType: LocationType.INFOMARKT_CN,
        locationDetails: { standNumber: 'A12', hasPoster: true, needsPower: true },
        institution: Institution.HOCHSCHULE,
        timeStart: new Date(`${D}T09:00:00`), timeEnd: new Date(`${D}T16:00:00`),
      },
    }),
    prisma.event.create({
      data: {
        title: 'Infostand Lehramt',
        description: 'Alle Informationen zu den Lehramtsstudiengängen an einem Ort.',
        eventType: EventType.INFOSTAND, locationType: LocationType.INFOMARKT_SCHLOSS,
        locationDetails: { standNumber: 'B03', hasPoster: true },
        institution: Institution.UNI,
        timeStart: new Date(`${D}T09:00:00`), timeEnd: new Date(`${D}T16:00:00`),
      },
    }),
    prisma.event.create({
      data: {
        title: 'Infostand Soziale Arbeit',
        description: 'Infos zum Studiengang Soziale Arbeit der Hochschule.',
        eventType: EventType.INFOSTAND, locationType: LocationType.INFOMARKT_CN,
        institution: Institution.HOCHSCHULE,
        timeStart: new Date(`${D}T09:00:00`), timeEnd: new Date(`${D}T16:00:00`),
      },
    }),

    // --- Campusführungen (both) ---
    prisma.event.create({
      data: {
        title: 'Campusführung Westerberg',
        description: 'Rundgang über den Westerberg-Campus mit Besuch der wichtigsten Gebäude.',
        eventType: EventType.RUNDGANG, locationType: LocationType.OTHER, institution: Institution.BOTH,
        timeStart: new Date(`${D}T10:00:00`), timeEnd: new Date(`${D}T11:00:00`),
        buildingId: buildings['avz'].id,
        meetingPoint: 'Vor dem AVZ-Haupteingang',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Campusführung Caprivi (Hochschule)',
        description: 'Lernen Sie den Caprivi-Campus der Hochschule kennen.',
        eventType: EventType.RUNDGANG, locationType: LocationType.OTHER, institution: Institution.HOCHSCHULE,
        timeStart: new Date(`${D}T12:00:00`), timeEnd: new Date(`${D}T13:00:00`),
        buildingId: buildings['caprivi-a'].id,
        meetingPoint: 'Vor dem CN-Gebäude A',
      },
    }),
  ])

  // ==========================================================================
  // Link Events to Study Programs
  // ==========================================================================
  console.log('🔗 Linking events to study programs...')

  const links = [
    // Informatik -> Informatik
    { e: 0, p: 4 },
    // Rechtswissenschaft -> Recht
    { e: 1, p: 13 },
    // BWL -> BWL
    { e: 2, p: 12 },
    // Germanistik -> Germanistik
    { e: 4, p: 15 },
    // Anglistik/Romanistik -> both
    { e: 5, p: 16 }, { e: 5, p: 17 },
    // Psychologie Workshop -> Psychologie
    { e: 6, p: 0 },
    // Soziologie -> Soziologie
    { e: 7, p: 1 },
    // Biologie Lab -> Biologie
    { e: 8, p: 6 },
    // Physik -> Physik
    { e: 9, p: 7 },
    // Chemie -> Chemie
    { e: 10, p: 8 },
    // Mathematik -> Mathematik
    { e: 11, p: 5 },
    // Programmieren -> Informatik
    { e: 12, p: 4 },
    // KI Lab -> Informatik
    { e: 13, p: 4 },
    // Maschinenbau Lab -> Maschinenbau
    { e: 14, p: 10 },
    // Elektrotechnik -> Elektrotechnik
    { e: 15, p: 9 },
    // Werkstatt -> Maschinenbau
    { e: 16, p: 10 },
    // Medieninformatik -> Medieninformatik
    { e: 17, p: 11 },
    // Infostand Wirtschaft -> Wirtschaftsingenieurwesen
    { e: 18, p: 14 },
    // Infostand Lehramt -> all Lehramt
    { e: 19, p: 21 }, { e: 19, p: 22 }, { e: 19, p: 23 },
    // Infostand Soziale Arbeit -> Soziale Arbeit
    { e: 20, p: 3 },
  ]

  await Promise.all(
    links.map(({ e, p }) =>
      prisma.eventStudyProgram.create({ data: { eventId: events[e].id, studyProgramId: studyPrograms[p].id } })
    )
  )

  // ==========================================================================
  // Link Infostands to Information Markets
  // ==========================================================================
  console.log('🔗 Linking infostands to markets...')

  await Promise.all([
    prisma.eventInformationMarket.create({ data: { eventId: events[18].id, marketId: infoMarkets[1].id } }),
    prisma.eventInformationMarket.create({ data: { eventId: events[19].id, marketId: infoMarkets[0].id } }),
    prisma.eventInformationMarket.create({ data: { eventId: events[20].id, marketId: infoMarkets[1].id } }),
  ])

  // ==========================================================================
  // Create Lecturers
  // ==========================================================================
  console.log('👨‍🏫 Creating lecturers...')

  await Promise.all([
    prisma.lecturer.create({ data: { eventId: events[0].id, firstName: 'Thomas', lastName: 'Müller', title: 'Prof. Dr.', email: 'thomas.mueller@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[1].id, firstName: 'Claudia', lastName: 'Richter', title: 'Prof. Dr.', email: 'claudia.richter@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[2].id, firstName: 'Hans', lastName: 'Becker', title: 'Prof. Dr.', email: 'hans.becker@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[4].id, firstName: 'Sabine', lastName: 'Fischer', title: 'Dr.', email: 'sabine.fischer@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[6].id, firstName: 'Michael', lastName: 'Weber', title: 'Dr.', email: 'michael.weber@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[8].id, firstName: 'Petra', lastName: 'Hoffmann', title: 'Prof. Dr.', email: 'petra.hoffmann@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[9].id, firstName: 'Klaus', lastName: 'Schneider', title: 'Prof. Dr.', email: 'klaus.schneider@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[10].id, firstName: 'Eva', lastName: 'Braun', title: 'Prof. Dr.', email: 'eva.braun@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[11].id, firstName: 'Jürgen', lastName: 'Wagner', title: 'Prof. Dr.', email: 'juergen.wagner@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[12].id, firstName: 'Thomas', lastName: 'Müller', title: 'Prof. Dr.', email: 'thomas.mueller@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[13].id, firstName: 'Lisa', lastName: 'Krause', title: 'Dr.', email: 'lisa.krause@uni-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[14].id, firstName: 'Anna', lastName: 'Schmidt', title: 'Prof. Dr.-Ing.', email: 'anna.schmidt@hs-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[15].id, firstName: 'Markus', lastName: 'Klein', title: 'Prof. Dr.-Ing.', email: 'markus.klein@hs-osnabrueck.de' } }),
    prisma.lecturer.create({ data: { eventId: events[17].id, firstName: 'Julia', lastName: 'Hartmann', title: 'Prof. Dr.', email: 'julia.hartmann@hs-osnabrueck.de' } }),
  ])

  // ==========================================================================
  // Create Event Organizers
  // ==========================================================================
  console.log('📧 Creating event organizers...')

  await Promise.all([
    prisma.eventOrganizer.create({ data: { eventId: events[0].id, email: 'zsb@uni-osnabrueck.de', phone: '+49 541 969-4999', internalOnly: true } }),
    prisma.eventOrganizer.create({ data: { eventId: events[3].id, email: 'zsb@uni-osnabrueck.de', phone: '+49 541 969-4999', internalOnly: true } }),
    prisma.eventOrganizer.create({ data: { eventId: events[14].id, email: 'studienberatung@hs-osnabrueck.de', phone: '+49 541 969-2930', internalOnly: true } }),
    prisma.eventOrganizer.create({ data: { eventId: events[21].id, email: 'zsb@uni-osnabrueck.de', internalOnly: true } }),
    prisma.eventOrganizer.create({ data: { eventId: events[22].id, email: 'studienberatung@hs-osnabrueck.de', internalOnly: true } }),
  ])

  // ==========================================================================
  // Create a sample user schedule
  // ==========================================================================
  console.log('📋 Creating sample schedule...')

  const schedule = await prisma.userSchedule.create({
    data: {
      userId: adminUser.id,
      name: 'Mein HIT-Plan',
      items: {
        create: [
          { eventId: events[0].id, priority: 1 },  // Informatik 09:00
          { eventId: events[7].id, priority: 2 },   // Soziologie 10:00
          { eventId: events[12].id, priority: 1 },  // Programmieren 11:00
          { eventId: events[3].id, priority: 3 },   // Campusführung 13:00
          { eventId: events[6].id, priority: 2 },   // Psychologie 14:00
        ],
      },
    },
  })

  // ==========================================================================
  // Summary
  // ==========================================================================
  const buildingCount = Object.keys(buildings).length
  const roomCount = Object.keys(rooms).length

  console.log('')
  console.log('✅ Database seeding completed successfully!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   - ${buildingCount} buildings with ${roomCount} rooms`)
  console.log(`   - ${clusters.length} study program clusters`)
  console.log(`   - ${studyPrograms.length} study programs`)
  console.log(`   - ${infoMarkets.length} information markets`)
  console.log(`   - ${events.length} events`)
  console.log(`   - 1 admin user (admin@zsb-os.de / admin123)`)
  console.log(`   - 1 organizer user (melder@uni-osnabrueck.de / org123)`)
  console.log(`   - 1 sample schedule with 5 events`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })