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

Load tests use [k6](https://k6.io). The full load-test suite, scenarios,
thresholds, and how to run them are documented in
[`loadtest/README.md`](../loadtest/README.md).

Quick smoke test against a running app:

```bash
BASE_URL=http://localhost:3000 npm run loadtest:smoke
```

Other available scenarios: `loadtest:ramp`, `loadtest:spike`, `loadtest:soak`.

### Performance Targets

These are enforced as k6 thresholds in `loadtest/k6.js` — a failing run
exits non-zero.

| Metric | Target |
|---|---|
| Error rate (`http_req_failed`) | < 1% |
| Overall p95 latency (`http_req_duration`) | < 1500 ms |
| `/home` p95 latency | < 2000 ms |
| `/api/events/public` p95 latency | < 1500 ms |
| `/api/buildings` p95 latency | < 800 ms |

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
| `/api/events/[id]` | GET/PUT/DELETE | Admin | Standard | No |
| `/api/study-programs` | GET | No | Standard | Yes (15min) |
| `/api/buildings` | GET | No | Standard | Yes (1hr) |
| `/api/routes` | POST | No | Standard | No |
| `/api/recommendations` | POST | No | Standard | No |
| `/api/schedule/share` | POST | No | Standard | No |
| `/api/schedule/share/[code]` | GET | No | Standard | No |
| `/api/export/excel` | GET | Admin | Standard | No |
| `/api/export/pdf/booklet` | GET | Admin | Standard | No |
| `/api/export/html` | GET | Admin/API key | Standard | No |
| `/api/admin/export-schedule` | GET/POST | Admin | Standard | No |

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
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npx vitest run
      
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
