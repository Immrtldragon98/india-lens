# India Lens architecture

## Product graph
India → macro indicators → sectors → industries → companies. Events, sources and theses attach to this graph.

## Runtime
Next.js UI → /api/research → deterministic India Lens tools → Grok synthesis. PostgreSQL/Neon becomes the source of structured observations and evidence. RAG and pgvector are added after ingestion is reliable.

## AI rule
The LLM interprets; application code retrieves and calculates. No model-generated metric is treated as source data.

## Market Lens integration
India Lens owns country/sector intelligence. Market Lens owns company-level investment research. Market Memory owns the user's observations/journal. Integration should happen through a stable India Lens tool contract (later exposed as MCP), not direct cross-database reads.

## MCP plan
V0 uses local function calling because it is simpler to test. V1 exposes the same functions over a Streamable HTTP MCP server: india_get_indicator, india_get_sector, india_get_industry, india_get_company, india_compare_sectors, india_search_documents, india_get_events, india_get_sources, india_build_timeline. Grok can then consume the remote MCP and Market Lens can use the same interface.

## Security
XAI_API_KEY is server-only. Never expose it through NEXT_PUBLIC_* or commit it. Research endpoints need rate limiting before public production.
