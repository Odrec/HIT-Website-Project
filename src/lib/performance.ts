/**
 * Performance Monitoring Utilities
 *
 * Provides utilities for measuring and tracking application performance.
 * Includes timing, metrics collection, and performance logging.
 *
 * @module performance
 */

/**
 * Performance metric entry
 */
export interface PerformanceMetric {
  /** Metric name */
  name: string
  /** Duration in milliseconds */
  duration: number
  /** Timestamp when the metric was recorded */
  timestamp: number
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * API timing result
 */
export interface APITiming {
  /** Total response time in milliseconds */
  total: number
  /** Database query time (if measured) */
  database?: number
  /** Cache lookup time (if measured) */
  cache?: number
  /** Processing time */
  processing?: number
}

/**
 * Performance metrics store (in-memory for dev, would use external service in prod)
 */
class PerformanceStore {
  private metrics: PerformanceMetric[] = []
  private maxSize = 1000 // Keep last 1000 metrics

  add(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize)
    }
  }

  getMetrics(name?: string, since?: number): PerformanceMetric[] {
    let filtered = this.metrics
    if (name) {
      filtered = filtered.filter((m) => m.name === name)
    }
    if (since) {
      filtered = filtered.filter((m) => m.timestamp >= since)
    }
    return filtered
  }

  getStats(name: string): {
    count: number
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } | null {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) return null

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b)
    const sum = durations.reduce((a, b) => a + b, 0)

    return {
      count: durations.length,
      avg: sum / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
    }
  }

  clear(): void {
    this.metrics = []
  }
}

/** Global performance store instance */
export const performanceStore = new PerformanceStore()

/**
 * Timer class for measuring execution time
 */
export class Timer {
  private startTime: number
  private checkpoints: Map<string, number> = new Map()
  private name: string

  constructor(name: string) {
    this.name = name
    this.startTime = performance.now()
  }

  /**
   * Add a checkpoint marker
   */
  checkpoint(label: string): void {
    this.checkpoints.set(label, performance.now() - this.startTime)
  }

  /**
   * Get elapsed time since start
   */
  elapsed(): number {
    return performance.now() - this.startTime
  }

  /**
   * Get time between checkpoints
   */
  getCheckpointDuration(from: string, to: string): number | null {
    const fromTime = this.checkpoints.get(from)
    const toTime = this.checkpoints.get(to)
    if (fromTime === undefined || toTime === undefined) return null
    return toTime - fromTime
  }

  /**
   * End timer and record metric
   */
  end(metadata?: Record<string, unknown>): PerformanceMetric {
    const duration = this.elapsed()
    const metric: PerformanceMetric = {
      name: this.name,
      duration,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        checkpoints: Object.fromEntries(this.checkpoints),
      },
    }

    performanceStore.add(metric)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Perf] ${this.name}: ${duration.toFixed(2)}ms`,
        this.checkpoints.size > 0
          ? `(${Array.from(this.checkpoints.entries())
              .map(([k, v]) => `${k}: ${v.toFixed(2)}ms`)
              .join(', ')})`
          : ''
      )
    }

    return metric
  }
}

/**
 * Create a timer for measuring operation duration
 *
 * @example
 * ```ts
 * const timer = createTimer('api.events.list')
 * timer.checkpoint('cache-check')
 * // ... cache lookup
 * timer.checkpoint('database-query')
 * // ... database query
 * const metric = timer.end({ eventCount: events.length })
 * ```
 */
export function createTimer(name: string): Timer {
  return new Timer(name)
}

/**
 * Measure the duration of an async function
 *
 * @example
 * ```ts
 * const result = await measureAsync('database.query', async () => {
 *   return await prisma.event.findMany()
 * })
 * ```
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const timer = createTimer(name)
  try {
    const result = await fn()
    timer.end({ ...metadata, success: true })
    return result
  } catch (error) {
    timer.end({ ...metadata, success: false, error: String(error) })
    throw error
  }
}

/**
 * Measure the duration of a sync function
 */
export function measureSync<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
  const timer = createTimer(name)
  try {
    const result = fn()
    timer.end({ ...metadata, success: true })
    return result
  } catch (error) {
    timer.end({ ...metadata, success: false, error: String(error) })
    throw error
  }
}

/**
 * Performance monitoring headers for API responses
 */
export function createPerformanceHeaders(timing: APITiming): Record<string, string> {
  const headers: Record<string, string> = {
    'Server-Timing': `total;dur=${timing.total.toFixed(2)}`,
  }

  if (timing.database !== undefined) {
    headers['Server-Timing'] += `, db;dur=${timing.database.toFixed(2)}`
  }

  if (timing.cache !== undefined) {
    headers['Server-Timing'] += `, cache;dur=${timing.cache.toFixed(2)}`
  }

  if (timing.processing !== undefined) {
    headers['Server-Timing'] += `, proc;dur=${timing.processing.toFixed(2)}`
  }

  return headers
}

/**
 * Log slow operations (above threshold)
 */
export function logSlowOperation(
  name: string,
  duration: number,
  thresholdMs: number = 1000,
  metadata?: Record<string, unknown>
): void {
  if (duration > thresholdMs) {
    console.warn(
      `[Slow Operation] ${name}: ${duration.toFixed(2)}ms (threshold: ${thresholdMs}ms)`,
      metadata || ''
    )
  }
}

/**
 * Get performance summary for all tracked metrics
 */
export function getPerformanceSummary(): Record<
  string,
  {
    count: number
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } | null
> {
  const metrics = performanceStore.getMetrics()
  const names = Array.from(new Set(metrics.map((m) => m.name)))

  const summary: Record<string, ReturnType<typeof performanceStore.getStats>> = {}
  for (const name of names) {
    summary[name] = performanceStore.getStats(name)
  }

  return summary
}

/**
 * Performance decorator for class methods
 * (For use in environments that support decorators)
 */
export function timed(metricName?: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const name = metricName || `${(target as object).constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: unknown[]) {
      return measureAsync(name, () => originalMethod.apply(this, args))
    }

    return descriptor
  }
}

/**
 * Utility to check if performance monitoring is enabled
 */
export function isPerformanceMonitoringEnabled(): boolean {
  return (
    process.env.ENABLE_PERFORMANCE_MONITORING === 'true' || process.env.NODE_ENV === 'development'
  )
}
