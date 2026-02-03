/**
 * Centralized cache key management
 *
 * All cache keys should be defined here to prevent conflicts
 * and ensure consistent key naming across the application.
 */

const CACHE_PREFIX = 'hit:'

/**
 * Cache key generators for different data types
 */
export const CacheKeys = {
  // Event-related keys
  events: {
    all: () => `${CACHE_PREFIX}events:all`,
    byId: (id: string) => `${CACHE_PREFIX}events:${id}`,
    byType: (type: string) => `${CACHE_PREFIX}events:type:${type}`,
    byInstitution: (institution: string) => `${CACHE_PREFIX}events:institution:${institution}`,
    byStudyProgram: (programId: string) => `${CACHE_PREFIX}events:program:${programId}`,
    search: (query: string) => `${CACHE_PREFIX}events:search:${query}`,
    count: () => `${CACHE_PREFIX}events:count`,
  },

  // Study program keys
  studyPrograms: {
    all: () => `${CACHE_PREFIX}programs:all`,
    byId: (id: string) => `${CACHE_PREFIX}programs:${id}`,
    byInstitution: (institution: string) => `${CACHE_PREFIX}programs:institution:${institution}`,
    byCluster: (clusterId: string) => `${CACHE_PREFIX}programs:cluster:${clusterId}`,
  },

  // Study program cluster keys
  clusters: {
    all: () => `${CACHE_PREFIX}clusters:all`,
    byId: (id: string) => `${CACHE_PREFIX}clusters:${id}`,
  },

  // Location keys
  locations: {
    all: () => `${CACHE_PREFIX}locations:all`,
    byId: (id: string) => `${CACHE_PREFIX}locations:${id}`,
    byBuilding: (building: string) => `${CACHE_PREFIX}locations:building:${building}`,
  },

  // Information market keys
  infoMarkets: {
    all: () => `${CACHE_PREFIX}infomarkets:all`,
    byId: (id: string) => `${CACHE_PREFIX}infomarkets:${id}`,
  },

  // User schedule keys (session-based for anonymous users)
  schedules: {
    bySession: (sessionId: string) => `${CACHE_PREFIX}schedules:session:${sessionId}`,
    byUser: (userId: string) => `${CACHE_PREFIX}schedules:user:${userId}`,
  },
} as const

/**
 * Cache TTL (Time To Live) values in seconds
 */
export const CacheTTL = {
  // Short-lived (1 minute)
  SHORT: 60,

  // Medium (5 minutes)
  MEDIUM: 300,

  // Long (15 minutes)
  LONG: 900,

  // Extended (1 hour)
  EXTENDED: 3600,

  // Day (24 hours) - for relatively static data
  DAY: 86400,

  // Default TTL for events and programs
  EVENTS: 300, // 5 minutes
  PROGRAMS: 900, // 15 minutes
  LOCATIONS: 3600, // 1 hour (rarely changes)
  CLUSTERS: 3600, // 1 hour
} as const

/**
 * Pattern for invalidating multiple keys
 */
export const CachePatterns = {
  allEvents: () => `${CACHE_PREFIX}events:*`,
  allPrograms: () => `${CACHE_PREFIX}programs:*`,
  allClusters: () => `${CACHE_PREFIX}clusters:*`,
  allLocations: () => `${CACHE_PREFIX}locations:*`,
  allInfoMarkets: () => `${CACHE_PREFIX}infomarkets:*`,
  allSchedules: () => `${CACHE_PREFIX}schedules:*`,
} as const
