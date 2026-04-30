// HIT Website load-test suite (k6).
//
// All scenarios simulate anonymous visitors only — admin/operator users
// (~10 total) are not load-relevant. The journey mirrors what a real
// browser does on the public side: request the SSR HTML shell, then call
// the public API endpoints the page hydrates from, with realistic think
// time between actions.
//
// Run via the npm scripts:  smoke / ramp / spike / soak (see package.json)
// Direct invocation:        BASE_URL=... k6 run --env SCENARIO=ramp loadtest/k6.js

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Trend, Rate } from 'k6/metrics'
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const SCENARIO = __ENV.SCENARIO || 'smoke'

// Custom metrics so the summary calls out per-endpoint behavior.
const homeLatency = new Trend('hit_home_latency', true)
const eventsApiLatency = new Trend('hit_events_api_latency', true)
const buildingsApiLatency = new Trend('hit_buildings_api_latency', true)
const errorRate = new Rate('hit_error_rate')

// Shared thresholds: applied to every scenario so a failed run is loud.
const THRESHOLDS = {
  http_req_failed: ['rate<0.01'],            // <1% non-2xx/3xx
  http_req_duration: ['p(95)<1500'],         // 95% of all requests < 1.5s
  hit_error_rate: ['rate<0.01'],
  hit_home_latency: ['p(95)<2000'],
  hit_events_api_latency: ['p(95)<1500'],
  hit_buildings_api_latency: ['p(95)<800'],
}

// Scenarios. Pick one with --env SCENARIO=...
//
// smoke  : 1 VU for 1 minute. Sanity check that nothing is broken before
//          committing to a real run.
// ramp   : Step ramp from 0 -> 500 VUs over 9 minutes, hold 5 minutes,
//          ramp down. Identifies the "knee" where latency starts to climb.
// spike  : 0 -> 1000 VUs in 10 seconds, hold 2 minutes, ramp down.
//          Models everyone hitting the page at event start.
// soak   : 200 VUs sustained for 30 minutes. Catches memory leaks,
//          connection pool exhaustion, slow-burn DB issues.
const SCENARIOS = {
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '1m',
  },
  ramp: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 100 },
      { duration: '2m', target: 250 },
      { duration: '2m', target: 500 },
      { duration: '5m', target: 500 },
      { duration: '1m', target: 0 },
    ],
    gracefulRampDown: '30s',
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10s', target: 1000 },
      { duration: '2m', target: 1000 },
      { duration: '30s', target: 0 },
    ],
    gracefulRampDown: '10s',
  },
  soak: {
    executor: 'constant-vus',
    vus: 200,
    duration: '30m',
  },
}

if (!SCENARIOS[SCENARIO]) {
  throw new Error(`Unknown SCENARIO=${SCENARIO}. Use one of: ${Object.keys(SCENARIOS).join(', ')}`)
}

export const options = {
  scenarios: { [SCENARIO]: SCENARIOS[SCENARIO] },
  thresholds: THRESHOLDS,
  // Don't keep cookies between iterations — each iteration is a fresh visitor.
  noConnectionReuse: false,
  userAgent: 'k6-loadtest/HIT-Website',
}

// Pages a public visitor browses. Ordered roughly by frequency.
const PUBLIC_PAGES = ['/home', '/events', '/study-programs', '/navigator', '/route-planner']

// Public API endpoints the pages hydrate from. /api/events/public is the
// hottest path — it's called from /home, /events, and /schedule.
function fetchHydrationData() {
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/events/public?page=1&pageSize=20`, null, { tags: { name: 'api_events_public' } }],
    ['GET', `${BASE_URL}/api/buildings`,                         null, { tags: { name: 'api_buildings' } }],
    ['GET', `${BASE_URL}/api/study-programs`,                    null, { tags: { name: 'api_study_programs' } }],
  ])
  eventsApiLatency.add(responses[0].timings.duration)
  buildingsApiLatency.add(responses[1].timings.duration)
  for (const r of responses) {
    errorRate.add(r.status >= 400)
    check(r, { 'api 2xx': (res) => res.status >= 200 && res.status < 300 })
  }
}

export default function () {
  // 1. Visitor lands on /home (or some other entry page).
  group('landing', () => {
    const path = randomItem(PUBLIC_PAGES)
    const res = http.get(`${BASE_URL}${path}`, { tags: { name: 'page_landing' } })
    if (path === '/home') homeLatency.add(res.timings.duration)
    errorRate.add(res.status >= 400)
    check(res, {
      'landing 2xx/3xx': (r) => r.status >= 200 && r.status < 400,
    })
  })

  // 2. Page hydrates by calling the public APIs in parallel.
  group('hydrate', fetchHydrationData)

  // 3. Visitor reads for 5–15s before clicking through.
  sleep(5 + Math.random() * 10)

  // 4. Pagination: load page 2 of events.
  group('paginate_events', () => {
    const r = http.get(
      `${BASE_URL}/api/events/public?page=2&pageSize=20`,
      { tags: { name: 'api_events_public_p2' } },
    )
    eventsApiLatency.add(r.timings.duration)
    errorRate.add(r.status >= 400)
    check(r, { 'events p2 2xx': (res) => res.status === 200 })
  })

  sleep(3 + Math.random() * 7)

  // 5. ~30% of visitors click into an event detail. We pick the first event
  // from the list response so the path is realistic.
  if (Math.random() < 0.3) {
    group('event_detail', () => {
      const list = http.get(
        `${BASE_URL}/api/events/public?page=1&pageSize=1`,
        { tags: { name: 'api_events_public_pick' } },
      )
      let id = null
      try {
        id = list.json('data.0.id')
      } catch (_) {
        // Body shape may differ across versions; ignore and skip detail.
      }
      if (id) {
        const r = http.get(
          `${BASE_URL}/api/events/public/${id}`,
          { tags: { name: 'api_events_public_detail' } },
        )
        errorRate.add(r.status >= 400)
        check(r, { 'detail 2xx': (res) => res.status === 200 })
      }
    })
    sleep(2 + Math.random() * 5)
  }
}
