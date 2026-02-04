#!/usr/bin/env npx ts-node

/**
 * Load Testing Script for HIT Website
 * 
 * This script simulates concurrent users accessing the application
 * to verify performance under load.
 * 
 * Usage:
 *   npx ts-node scripts/load-test.ts
 * 
 * Configuration via environment:
 *   LOAD_TEST_URL=http://localhost:3000
 *   LOAD_TEST_CONCURRENT=100
 *   LOAD_TEST_DURATION=60
 * 
 * @module load-test
 */

interface LoadTestConfig {
  /** Base URL of the application */
  baseUrl: string
  /** Number of concurrent users to simulate */
  concurrentUsers: number
  /** Duration of test in seconds */
  durationSeconds: number
  /** Delay between requests per user (ms) */
  requestDelayMs: number
}

interface RequestResult {
  endpoint: string
  status: number
  duration: number
  success: boolean
  timestamp: number
}

interface LoadTestResults {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  durationSeconds: number
  endpointStats: Record<string, {
    count: number
    avgTime: number
    successRate: number
  }>
}

// Default configuration
const config: LoadTestConfig = {
  baseUrl: process.env.LOAD_TEST_URL || 'http://localhost:3000',
  concurrentUsers: parseInt(process.env.LOAD_TEST_CONCURRENT || '50', 10),
  durationSeconds: parseInt(process.env.LOAD_TEST_DURATION || '30', 10),
  requestDelayMs: parseInt(process.env.LOAD_TEST_DELAY || '500', 10),
}

// Endpoints to test (weighted by expected traffic)
const endpoints = [
  { path: '/api/events/public?page=1&pageSize=12', weight: 30 },
  { path: '/api/events/public?page=1&pageSize=4&sortBy=timeStart&sortOrder=asc', weight: 20 },
  { path: '/api/study-programs', weight: 15 },
  { path: '/api/study-programs?grouped=true', weight: 10 },
  { path: '/api/locations', weight: 10 },
  { path: '/api/routes/buildings?withEvents=false', weight: 10 },
  { path: '/api/events/public?search=workshop', weight: 5 },
]

// Calculate weighted endpoint selection
function selectEndpoint(): string {
  const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const endpoint of endpoints) {
    random -= endpoint.weight
    if (random <= 0) {
      return endpoint.path
    }
  }
  
  return endpoints[0].path
}

// Make a single request
async function makeRequest(baseUrl: string, path: string): Promise<RequestResult> {
  const start = performance.now()
  let status = 0
  let success = false
  
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HIT-LoadTest/1.0',
      },
    })
    status = response.status
    success = response.ok
    
    // Consume the response body
    await response.json()
  } catch (error) {
    status = 0
    success = false
  }
  
  const duration = performance.now() - start
  
  return {
    endpoint: path,
    status,
    duration,
    success,
    timestamp: Date.now(),
  }
}

// Simulate a single user
async function simulateUser(
  config: LoadTestConfig,
  endTime: number,
  results: RequestResult[]
): Promise<void> {
  while (Date.now() < endTime) {
    const endpoint = selectEndpoint()
    const result = await makeRequest(config.baseUrl, endpoint)
    results.push(result)
    
    // Add some randomness to delay
    const delay = config.requestDelayMs * (0.5 + Math.random())
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

// Calculate percentile
function percentile(sorted: number[], p: number): number {
  const index = Math.floor(sorted.length * p)
  return sorted[Math.min(index, sorted.length - 1)]
}

// Analyze results
function analyzeResults(
  results: RequestResult[],
  durationSeconds: number
): LoadTestResults {
  const durations = results.map(r => r.duration).sort((a, b) => a - b)
  const successfulCount = results.filter(r => r.success).length
  
  // Group by endpoint
  const endpointGroups: Record<string, RequestResult[]> = {}
  for (const result of results) {
    if (!endpointGroups[result.endpoint]) {
      endpointGroups[result.endpoint] = []
    }
    endpointGroups[result.endpoint].push(result)
  }
  
  const endpointStats: Record<string, { count: number; avgTime: number; successRate: number }> = {}
  for (const [endpoint, group] of Object.entries(endpointGroups)) {
    const avgTime = group.reduce((sum, r) => sum + r.duration, 0) / group.length
    const successRate = group.filter(r => r.success).length / group.length
    endpointStats[endpoint] = {
      count: group.length,
      avgTime,
      successRate,
    }
  }
  
  return {
    totalRequests: results.length,
    successfulRequests: successfulCount,
    failedRequests: results.length - successfulCount,
    avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
    minResponseTime: durations[0],
    maxResponseTime: durations[durations.length - 1],
    p50ResponseTime: percentile(durations, 0.5),
    p95ResponseTime: percentile(durations, 0.95),
    p99ResponseTime: percentile(durations, 0.99),
    requestsPerSecond: results.length / durationSeconds,
    durationSeconds,
    endpointStats,
  }
}

// Format duration
function formatDuration(ms: number): string {
  return `${ms.toFixed(2)}ms`
}

// Print results
function printResults(results: LoadTestResults): void {
  console.log('\n' + '='.repeat(60))
  console.log('LOAD TEST RESULTS')
  console.log('='.repeat(60))
  
  console.log('\nOverall Statistics:')
  console.log(`  Total Requests:      ${results.totalRequests}`)
  console.log(`  Successful:          ${results.successfulRequests} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%)`)
  console.log(`  Failed:              ${results.failedRequests}`)
  console.log(`  Duration:            ${results.durationSeconds}s`)
  console.log(`  Requests/sec:        ${results.requestsPerSecond.toFixed(2)}`)
  
  console.log('\nResponse Time Statistics:')
  console.log(`  Average:             ${formatDuration(results.avgResponseTime)}`)
  console.log(`  Minimum:             ${formatDuration(results.minResponseTime)}`)
  console.log(`  Maximum:             ${formatDuration(results.maxResponseTime)}`)
  console.log(`  Median (p50):        ${formatDuration(results.p50ResponseTime)}`)
  console.log(`  95th Percentile:     ${formatDuration(results.p95ResponseTime)}`)
  console.log(`  99th Percentile:     ${formatDuration(results.p99ResponseTime)}`)
  
  console.log('\nEndpoint Statistics:')
  for (const [endpoint, stats] of Object.entries(results.endpointStats)) {
    console.log(`  ${endpoint}`)
    console.log(`    Count: ${stats.count}, Avg: ${formatDuration(stats.avgTime)}, Success: ${(stats.successRate * 100).toFixed(1)}%`)
  }
  
  console.log('\n' + '='.repeat(60))
  
  // Performance assessment
  console.log('\nPerformance Assessment:')
  
  if (results.avgResponseTime < 500) {
    console.log('  ✅ Average response time is EXCELLENT (<500ms)')
  } else if (results.avgResponseTime < 1000) {
    console.log('  ⚠️  Average response time is GOOD (<1000ms)')
  } else {
    console.log('  ❌ Average response time is SLOW (>1000ms)')
  }
  
  if (results.p95ResponseTime < 1000) {
    console.log('  ✅ 95th percentile is EXCELLENT (<1000ms)')
  } else if (results.p95ResponseTime < 2000) {
    console.log('  ⚠️  95th percentile is ACCEPTABLE (<2000ms)')
  } else {
    console.log('  ❌ 95th percentile is SLOW (>2000ms)')
  }
  
  const successRate = results.successfulRequests / results.totalRequests
  if (successRate > 0.99) {
    console.log('  ✅ Success rate is EXCELLENT (>99%)')
  } else if (successRate > 0.95) {
    console.log('  ⚠️  Success rate is ACCEPTABLE (>95%)')
  } else {
    console.log('  ❌ Success rate is POOR (<95%)')
  }
  
  console.log('\n')
}

// Main function
async function main(): Promise<void> {
  console.log('HIT Website Load Test')
  console.log('='.repeat(60))
  console.log(`Configuration:`)
  console.log(`  Base URL:            ${config.baseUrl}`)
  console.log(`  Concurrent Users:    ${config.concurrentUsers}`)
  console.log(`  Duration:            ${config.durationSeconds}s`)
  console.log(`  Request Delay:       ${config.requestDelayMs}ms`)
  console.log('='.repeat(60))
  
  // Verify server is running
  console.log('\nVerifying server is accessible...')
  try {
    const response = await fetch(`${config.baseUrl}/api/events/public?page=1&pageSize=1`)
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }
    console.log('✅ Server is accessible\n')
  } catch (error) {
    console.error('❌ Cannot connect to server. Make sure the application is running.')
    console.error(`   Tried to connect to: ${config.baseUrl}`)
    process.exit(1)
  }
  
  console.log('Starting load test...')
  console.log(`Simulating ${config.concurrentUsers} concurrent users for ${config.durationSeconds} seconds\n`)
  
  const results: RequestResult[] = []
  const endTime = Date.now() + (config.durationSeconds * 1000)
  
  // Progress indicator
  const progressInterval = setInterval(() => {
    const elapsed = config.durationSeconds - Math.floor((endTime - Date.now()) / 1000)
    const progress = Math.min(elapsed / config.durationSeconds, 1)
    const bar = '█'.repeat(Math.floor(progress * 30)) + '░'.repeat(30 - Math.floor(progress * 30))
    process.stdout.write(`\r  [${bar}] ${Math.floor(progress * 100)}% - ${results.length} requests`)
  }, 500)
  
  // Start all concurrent users
  const userPromises: Promise<void>[] = []
  for (let i = 0; i < config.concurrentUsers; i++) {
    // Stagger user starts slightly
    await new Promise(resolve => setTimeout(resolve, 10))
    userPromises.push(simulateUser(config, endTime, results))
  }
  
  // Wait for all users to complete
  await Promise.all(userPromises)
  
  clearInterval(progressInterval)
  console.log('\n\nLoad test completed!')
  
  // Analyze and print results
  const analysis = analyzeResults(results, config.durationSeconds)
  printResults(analysis)
}

// Run the test
main().catch(console.error)
