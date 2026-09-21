# India Lens — India as a Stock

A research product for understanding India from the national economy down to sectors, industries and companies.

## Product idea
Instead of starting with a stock ticker, start with India: macro drivers → sectors → industries → companies → evidence. Current events are translated into economic mechanisms and attached to the parts of the economy they affect.

## V0
- India Thesis dashboard
- Sector map: Financials, Infrastructure, Energy, Technology, Manufacturing, Defence, Healthcare, Agriculture
- Driver / constraint / external-risk / structural-theme framework
- Beginner and analyst research modes
- Responsive mobile-first interface

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Research principles
Evidence first; timestamp claims; prefer primary sources; expose counter-evidence; distinguish facts from interpretation; no investment recommendations.

## Roadmap
V0.2 adds individual sector routes, structured indicators and source cards. V0.3 adds the research ingestion/API layer, watchlists and timeline. V1 adds AI-assisted research synthesis with citations.

## Production deployment

India Lens is deployed as a standard Next.js web service. Production uses Render for the app, Neon for PostgreSQL, and xAI/Grok for research synthesis.
