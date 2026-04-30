# Load Testing — HIT Website

Tooling: [k6](https://k6.io). Scenarios target the public anonymous flow,
which is what the *Hochschulinformationstag* traffic looks like (~10 000
concurrent visitors, all anonymous; the ~10 admin/operator users are not
load-relevant).

## Install k6

```sh
# macOS
brew install k6

# Linux
sudo apt-get install gnupg ca-certificates
curl -s https://dl.k6.io/key.gpg | sudo apt-key add -
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Run

Always run **against the testing host**, never production. The scenarios
generate enough load to take the box down.

```sh
# Smoke test — 1 VU for 1 minute. Run this first.
BASE_URL=https://hit-website-virtuos-openstack.uni-osnabrueck.de \
  npm run loadtest:smoke

# Ramp test — find the knee. 0 -> 500 VUs over 9 min, hold 5 min, ramp down.
npm run loadtest:ramp

# Spike test — model "everyone lands at 9:00 sharp". 0 -> 1000 VUs in 10s.
npm run loadtest:spike

# Soak test — 200 VUs for 30 min. Catches leaks and slow-burn issues.
npm run loadtest:soak
```

`BASE_URL` defaults to `http://localhost:3000` if unset.

## What "VU" means here

A k6 VU is *not* a 1:1 model of a concurrent user. Each VU loops through the
journey (land → hydrate → think → paginate → maybe-detail), so 500 VUs with
~15s of think time per iteration produces roughly the same request rate as
~5000 real visitors browsing once every ~30s. Adjust expectations
accordingly when comparing to the "10 000 concurrent users" headline number.

If you want to model a true 10 000 simultaneous in-flight requests (e.g.,
the moment a redirect from a campaign email hits everyone at once), use
`spike` with `--vus 10000`.

## Thresholds (defined in `k6.js`)

| Threshold | Target | Rationale |
|---|---|---|
| `http_req_failed` | < 1% | Any sustained error rate is a failure |
| `http_req_duration p95` | < 1500 ms | Page-level user-perceived latency |
| `hit_events_api_latency p95` | < 1500 ms | Hottest API path |
| `hit_buildings_api_latency p95` | < 800 ms | Should be cached and cheap |
| `hit_home_latency p95` | < 2000 ms | SSR HTML, including TTFB |

A scenario with any failed threshold exits non-zero, so this works in CI.

## Server-side monitoring during a test

Run on the server while a scenario fires from outside. Watchpoints and
thresholds are documented in the
[hit-website-setup](https://gitlab.uni-osnabrueck.de/virtuos/digitale-dienste/hit-2026-website/-/blob/main/loadtest/README.md)
repo.

## Reading the output

After each run k6 prints a summary table. Things to look at, in order:

1. **`http_req_failed`** — should be near 0. Anything >0.5% means errors;
   investigate before trusting any latency numbers.
2. **`hit_events_api_latency p95`** — this is the path the cache will most
   help. Expect significant improvement once API caching is enabled.
3. **The custom metrics** (`hit_*_latency`) — per-endpoint p95 tells you
   *which* endpoint is the bottleneck, not just that there is one.
4. **Look at the graphs**, not just the summary, if you exported with
   `--out json=results.json` and replayed in Grafana / k6 Cloud.
