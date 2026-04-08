# HIT Website Testing Guide

This document provides comprehensive guidance for testing the HIT Website application, including load testing, cross-browser testing, and performance verification.

## Table of Contents

1. [Load Testing](#load-testing)
2. [Cross-Browser Testing](#cross-browser-testing)
3. [Performance Testing](#performance-testing)
4. [API Testing](#api-testing)
5. [Accessibility Testing](#accessibility-testing)

---

## Load Testing

### Overview

The application includes a custom load testing script that simulates concurrent users accessing the API endpoints. This helps verify that the system can handle the expected traffic during the HIT event.

### Prerequisites

- Node.js 18+ installed
- Application running locally or accessible at a test URL
- Redis running (for caching tests)
- PostgreSQL database running

### Running Load Tests

#### Basic Load Test

```bash
# Start the application first
npm run dev

# In another terminal, run the load test
npx ts-node scripts/load-test.ts
```

#### Custom Configuration

Configure the load test using environment variables:

```bash
# Simulate 100 concurrent users for 60 seconds
LOAD_TEST_URL=http://localhost:3000 \
LOAD_TEST_CONCURRENT=100 \
LOAD_TEST_DURATION=60 \
LOAD_TEST_DELAY=500 \
npx ts-node scripts/load-test.ts
```

#### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `LOAD_TEST_URL` | `http://localhost:3000` | Base URL of the application |
| `LOAD_TEST_CONCURRENT` | `50` | Number of concurrent users |
| `LOAD_TEST_DURATION` | `30` | Test duration in seconds |
| `LOAD_TEST_DELAY` | `500` | Delay between requests per user (ms) |

### Interpreting Results

The load test outputs:

- **Total Requests**: Number of requests made during the test
- **Success Rate**: Percentage of successful (2xx) responses
- **Response Times**: Average, min, max, and percentiles (p50, p95, p99)
- **Requests/sec**: Throughput achieved
- **Endpoint Statistics**: Per-endpoint breakdown

#### Performance Targets

| Metric | Excellent | Acceptable | Poor |
|--------|-----------|------------|------|
| Average Response Time | < 500ms | < 1000ms | > 1000ms |
| 95th Percentile | < 1000ms | < 2000ms | > 2000ms |
| Success Rate | > 99% | > 95% | < 95% |

### Load Testing for Production

For production-like load testing, consider:

1. **Use external tools**: k6, Artillery, or Apache JMeter for more advanced scenarios
2. **Test against staging**: Never load test production directly
3. **Monitor resources**: Watch CPU, memory, and database connections
4. **Test with realistic data**: Ensure the database has production-scale data

#### Example k6 Script

```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
}

export default function () {
  const res = http.get('http://localhost:3000/api/events/public?page=1&pageSize=12')
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  sleep(1)
}
```

---

## Cross-Browser Testing

### Supported Browsers

The HIT Website supports the following browsers:

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | 90+ | Full |
| Firefox | 90+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |
| Chrome Mobile | Latest | Full |
| Safari iOS | 14+ | Full |
| Samsung Internet | 14+ | Basic |

### Testing Checklist

#### Desktop Browsers

##### Chrome (Primary)
- [ ] Homepage loads correctly
- [ ] Event list displays with pagination
- [ ] Filters work (institution, event type, time)
- [ ] Search functionality
- [ ] Event details page
- [ ] Schedule builder functionality
- [ ] Add/remove events from schedule
- [ ] Schedule persistence (localStorage)
- [ ] Route planner with map
- [ ] Admin panel (if applicable)
- [ ] Navigator chat interface
- [ ] Recommendations display

##### Firefox
- [ ] All items from Chrome checklist
- [ ] CSS Grid layout renders correctly
- [ ] Animations work smoothly
- [ ] Form validation messages

##### Safari
- [ ] All items from Chrome checklist
- [ ] Date pickers work correctly
- [ ] Flexbox layouts render properly
- [ ] WebSocket connections (if used)

##### Edge
- [ ] All items from Chrome checklist
- [ ] PDF export (if applicable)
- [ ] Print styling

#### Mobile Browsers

##### iOS Safari
- [ ] Touch interactions work
- [ ] Viewport scaling
- [ ] Fixed position elements
- [ ] Keyboard doesn't obscure inputs
- [ ] Back/forward gestures

##### Chrome Mobile (Android)
- [ ] Touch scrolling smooth
- [ ] Pull-to-refresh (if implemented)
- [ ] Landscape orientation
- [ ] Keyboard handling

### Responsive Breakpoints

Test at these common breakpoints:

| Device Class | Width | Test Priority |
|--------------|-------|---------------|
| Mobile S | 320px | High |
| Mobile M | 375px | High |
| Mobile L | 425px | High |
| Tablet | 768px | High |
| Laptop | 1024px | High |
| Desktop | 1440px | Medium |
| 4K | 2560px | Low |

### Known Browser Quirks

#### Safari
- `position: sticky` may require `-webkit-sticky` prefix
- Date input format differs from Chrome
- Intersection Observer timing may vary

#### Firefox
- Some CSS animations may render differently
- Print preview may differ from other browsers

#### Mobile Safari
- 100vh includes the browser chrome; use `100dvh` for dynamic viewport
- Hover states may persist after touch

### Browser Testing Tools

1. **BrowserStack**: Cross-browser testing platform
2. **LambdaTest**: Cloud-based browser testing
3. **Chrome DevTools Device Mode**: Mobile simulation
4. **Firefox Responsive Design Mode**: Built-in responsive testing

---

## Performance Testing

### Core Web Vitals Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Time to render largest content |
| FID (First Input Delay) | < 100ms | Time to first interactivity |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability score |
| TTFB (Time to First Byte) | < 600ms | Server response time |

### Testing Tools

1. **Lighthouse**: Built into Chrome DevTools
2. **PageSpeed Insights**: Google's online tool
3. **WebPageTest**: Detailed performance analysis
4. **Chrome DevTools Performance Tab**: Runtime profiling

### Running Lighthouse Tests

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run against local development
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html

# Run with specific device emulation
lighthouse http://localhost:3000 --emulated-form-factor=mobile
```

### Performance Checklist

#### Initial Load
- [ ] TTFB < 600ms
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.9s

#### Runtime Performance
- [ ] 60fps scrolling
- [ ] Smooth animations
- [ ] No layout shifts after load
- [ ] Responsive to user input

#### Resource Optimization
- [ ] Images optimized and lazy-loaded
- [ ] JavaScript bundle size reasonable
- [ ] CSS is not render-blocking
- [ ] Fonts preloaded

---

## API Testing

### Endpoint Test Matrix

| Endpoint | Method | Auth | Rate Limit | Cache |
|----------|--------|------|------------|-------|
| `/api/events/public` | GET | No | Lenient | Yes (5min) |
| `/api/events` | GET/POST | Admin | Standard | No |
| `/api/study-programs` | GET | No | Standard | Yes (15min) |
| `/api/locations` | GET | No | Standard | Yes (1hr) |
| `/api/routes` | POST | No | Standard | No |
| `/api/recommendations` | POST | No | Standard | No |

### Testing with cURL

```bash
# Test events API
curl -X GET "http://localhost:3000/api/events/public?page=1&pageSize=12" \
  -H "Accept: application/json" | jq

# Test cache headers
curl -I "http://localhost:3000/api/events/public?page=1&pageSize=12"

# Test with search
curl "http://localhost:3000/api/events/public?search=workshop" | jq

# Test study programs
curl "http://localhost:3000/api/study-programs?grouped=true" | jq
```

### Verifying Cache Behavior

```bash
# First request (should be MISS)
curl -s -I "http://localhost:3000/api/events/public" | grep X-Cache

# Second request (should be HIT)
curl -s -I "http://localhost:3000/api/events/public" | grep X-Cache
```

---

## Accessibility Testing

### WCAG 2.1 Compliance Targets

- **Level AA**: Minimum target
- Focus on: keyboard navigation, screen reader support, color contrast

### Testing Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Images have alt text
- [ ] Forms have associated labels
- [ ] Error messages are descriptive
- [ ] Skip navigation link available

### Tools

1. **axe DevTools**: Browser extension for accessibility testing
2. **WAVE**: Web accessibility evaluation tool
3. **Screen Readers**: NVDA (Windows), VoiceOver (Mac)

---

## Continuous Integration Testing

### Recommended CI Pipeline

```yaml
# Example GitHub Actions workflow
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: hit_test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run test
      
      - name: Lighthouse
        uses: foo-software/lighthouse-action@v1
        with:
          urls: 'http://localhost:3000'
```

---

## Troubleshooting

### Common Issues

#### Slow Response Times
1. Check Redis connection (`isRedisConnected()`)
2. Verify database indexes are applied
3. Check for N+1 query problems
4. Review network latency

#### High Memory Usage
1. Check for memory leaks in Node.js
2. Review large data caching
3. Monitor garbage collection

#### Failed Requests Under Load
1. Increase database connection pool
2. Check rate limiting thresholds
3. Review server resources

### Getting Help

For issues with testing:
1. Check the logs: `npm run dev` output
2. Review Redis logs: `docker logs redis`
3. Check database queries: Enable Prisma query logging
