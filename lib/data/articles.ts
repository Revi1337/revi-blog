import type { Article, BlogCardData } from "./types"

const richBodyHtml = `
<h2 id="the-problem-of-scale">01. The Problem of Scale</h2>
<p>When dealing with systems that exceed 100k requests per second, the standard monolithic approach collapses. Bottlenecks shift from raw CPU cycles to I/O wait times and network latency. In this post, we explore how to decompose critical paths into non-blocking, event-driven units.</p>
__CODE_BLOCK__
<h2 id="consistency-vs-availability">02. Consistency vs. Availability</h2>
<p>The CAP theorem isn't just a theoretical constraint; it's a daily trade-off. We implemented a hybrid consistency model where high-traffic metadata utilizes eventual consistency via CRDTs, while transactional data remains strictly consistent through Raft consensus.</p>
<h3>Hierarchical Sharding</h3>
<p>To reduce cross-regional latency, we implemented a three-tier sharding strategy that balances data proximity with global synchronization overhead:</p>
<ul>
<li>Global Registry for routing and discovery across continents.</li>
<li>Regional Clusters for localized, high-throughput write operations.</li>
<li>Edge Nodes for aggressive read-caching and local request validation.</li>
</ul>
<h2 id="performance-metrics">03. Performance Metrics</h2>
__METRICS__
<h2 id="final-conclusion">04. Final Conclusion</h2>
<p>Scaling a distributed system is never a single decision — it's a series of trade-offs made explicit and revisited as load grows. The patterns above bought us headroom; the next bottleneck is already forming somewhere else in the graph.</p>
`.trim()

export const articles: Article[] = [
  {
    slug: "architecting-high-concurrency-distributed-systems",
    category: "SYSTEM_ARCHITECTURE",
    title: "Architecting High-Concurrency Distributed Systems: Lessons from the Edge",
    publishedAt: "2024-10-12",
    updatedAt: "2024-11-05",
    readingTimeMinutes: 12,
    tags: ["GO_1.21", "REDIS", "K8S", "GRPC", "PROMETHEUS"],
    bodyHtml: richBodyHtml,
    toc: [
      { id: "the-problem-of-scale", label: "The Problem of Scale", order: 1 },
      { id: "consistency-vs-availability", label: "Consistency vs. Availability", order: 2 },
      { id: "performance-metrics", label: "Performance Metrics", order: 3 },
      { id: "final-conclusion", label: "Final Conclusion", order: 4 },
    ],
    metrics: [
      { label: "P99_LATENCY", value: "120ms" },
      { label: "THROUGHPUT", value: "2.4M" },
      { label: "ERROR_RATE", value: "0.004%" },
    ],
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAG9bNsWCgzKur0D_aDDQtqk06smBtxAmDMPukiOLORVxTQ7lDPyVbtGvkTjV3KgGBZnOPXYUw0fWV_dRcEQK_v78wOaAKWr9UaTPRYMjtSpwYU3vDDkLfhky3M6uagJLzh60qYfn0N2LdxnuS2Inz30L-E_xkqRlLCGgjbHDVlNt39k4sZZqyeIR2MQgId-NRkluW394ltiXEGguMeXRMBk1BLrDna0oFGjv_guyHq7Ru_v6OiGUAp",
    // 이 글은 core/article-detail-dark.html 전용 목업 콘텐츠라 원본 홈 화면 카드 그리드엔 없었음
    // — 홈 카드 6개는 아래 실제 core/home-dark.html 목록을 그대로 따르고, 이 글은 상세 페이지
    // 데모용으로만 남겨둔다 (prev/next도 존재하지 않는 slug를 가리키던 걸 제거).
  },
  {
    slug: "optimizing-postgresql-indexing-high-write-loads",
    category: "BACKEND",
    title: "Optimizing PostgreSQL Indexing for High-Write Loads",
    publishedAt: "2024-03-15",
    readingTimeMinutes: 8,
    tags: ["POSTGRESQL", "INDEXING"],
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA4grybCOZJ8iDvAq1Io97iQ0fvkNsLKzLL7JVplr_eNnd7Q1xjPKM3l5k7QZ56xcUNn4-lrkH3f5DP_fTkNl1hD_2AiNNcH-UOPuJMHCaXfyoTjgIQTIQ2tjRuDC2e5gdswFaG8kbpaHlobZeovPROItTv5oezjZ_DqNFIQH2nw9GdgzSu_c3Nk1FWESB-kipXQhCOsGt7eAR9IVqN8cBMlMhq-xB65e9z5dRAhcfOim4rp-axyS0s",
    bodyHtml: "<h2 id=\"overview\">Overview</h2><p>High-write workloads punish naive indexing strategies. This post walks through partial indexes, fill-factor tuning, and write-amplification tradeoffs we hit in production.</p>",
    toc: [{ id: "overview", label: "Overview", order: 1 }],
    metrics: [],
    next: { slug: "kafka-streams-vs-spark", title: "Kafka Streams vs Spark: Choosing the Right Engine" },
  },
  {
    slug: "kafka-streams-vs-spark",
    category: "DATA_ENGINEERING",
    title: "Kafka Streams vs Spark: Choosing the Right Engine",
    publishedAt: "2024-02-28",
    readingTimeMinutes: 10,
    tags: ["KAFKA", "SPARK"],
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgal58utRDKZNZZmiDvPsqFEhrtQL7qCufmUOSQu3oiLS6j4-BEGf8Fxiqs1JsZUtKR10PE4sywNYRiSh0NJsaLB4fHt7cZ9DEfYN5IYFW1UUlIP600Dn5HxArc7C8LUzLQKoGS3IdzwNtN-3K19V5d4Y2d5gFqhhs6rZ4-xJG_ZBuSfaPnx35Mex8tJiX0i3ENdeU4fhq6B8gIoPJPRbReq2zW-CkPTC4Lm8MzVM25i5b0tZ4StwX",
    bodyHtml: "<h2 id=\"overview\">Overview</h2><p>Two stream processing engines, two very different operational models. Here's how we picked between them for a latency-sensitive pipeline.</p>",
    toc: [{ id: "overview", label: "Overview", order: 1 }],
    metrics: [],
    prev: { slug: "optimizing-postgresql-indexing-high-write-loads", title: "Optimizing PostgreSQL Indexing for High-Write Loads" },
    next: { slug: "oauth2-from-scratch-security-audit", title: "Implementing OAuth2 from Scratch: A Security Audit" },
  },
  {
    slug: "oauth2-from-scratch-security-audit",
    category: "SECURITY",
    title: "Implementing OAuth2 from Scratch: A Security Audit",
    publishedAt: "2024-02-10",
    readingTimeMinutes: 15,
    tags: ["OAUTH2", "SECURITY"],
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDBxpHVjULHPGba_D3Zm44udzzMisBU1tgygH8VL8vapQleHh4PxCmGntAIgEyEdPpdqVw8E54gR75P_LUkLnLgjB5m8hFpFtqQYUtedth2fiCWGZCvzO50qBw5bZLexnHHw35UtpclOcT6sCAazUVv0FfIUpWCi8X3KCxF1zSqlBsgUAAyzMrSF-uuu8VwDrDKpWMGpjzO3Sd_7KzjYdNm9ghmujt08UZrk8PHRpGp3DwUYRAzvFkI",
    bodyHtml: "<h2 id=\"overview\">Overview</h2><p>Rolling your own OAuth2 flow is a minefield. We document every footgun we found during an internal security audit.</p>",
    toc: [{ id: "overview", label: "Overview", order: 1 }],
    metrics: [],
    prev: { slug: "kafka-streams-vs-spark", title: "Kafka Streams vs Spark: Choosing the Right Engine" },
    next: { slug: "serverless-break-the-monolith", title: "Serverless Functions: When to Break the Monolith" },
  },
  {
    slug: "serverless-break-the-monolith",
    category: "ARCHITECTURE",
    title: "Serverless Functions: When to Break the Monolith",
    publishedAt: "2024-01-22",
    readingTimeMinutes: 9,
    tags: ["SERVERLESS"],
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAjdMQGCHI7wKL7Hfu-d5gvlQBhxxQDDMEl7-c3omY3pzro9kQu540GeLJUdK7XWj_g029opz6MJwSok7hkAtk5egnNZFasb0CuzLNvLDCyoliKbF95G3JGYhLTMR0b9HNt0xjYteRRpgGCorYHQdURNNZY7th5pp1PfRr_W7kd3TG6LnTEdYodpTnr-_r-onD-80ZhAIsflTGG6xFewkaNBYxNhNPlq1JuC8Saw3yhEh1KfAUqXy4q",
    bodyHtml: "<h2 id=\"overview\">Overview</h2><p>Not every endpoint needs a monolith. A practical checklist for deciding when a function is the right unit of deployment.</p>",
    toc: [{ id: "overview", label: "Overview", order: 1 }],
    metrics: [],
    prev: { slug: "oauth2-from-scratch-security-audit", title: "Implementing OAuth2 from Scratch: A Security Audit" },
    next: { slug: "gc-tuning-jvm-applications", title: "Garbage Collection Tuning for JVM Applications" },
  },
  {
    slug: "gc-tuning-jvm-applications",
    category: "PERFORMANCE",
    title: "Garbage Collection Tuning for JVM Applications",
    publishedAt: "2024-01-05",
    readingTimeMinutes: 11,
    tags: ["JVM", "GC"],
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHwjL1n44WLtNQuVhKTR1CiBX7Gd7T7TzH1EAju9eQ-m-VWjIH_ZJFIVJSSgCeEl_M8gp-w5nmknu5CNi1LGX8KqAeHIZe6mOP-FCt8mCLnvC0qhr_ibkva83kF4cg2XgKqTq9QJ3tvRFq830kWPnb7M2CblgjG6k4cH84viZZi_uYqdJWrJMiq8mZEl2nKWCdZ6qgyi4dTwRRYhlpWwDTePYIx6HgvrAvC6uf7cTYTr4gzw9VTGkD",
    bodyHtml: "<h2 id=\"overview\">Overview</h2><p>G1 vs ZGC vs Shenandoah — pause-time tradeoffs we measured under real production load.</p>",
    toc: [{ id: "overview", label: "Overview", order: 1 }],
    metrics: [],
    prev: { slug: "serverless-break-the-monolith", title: "Serverless Functions: When to Break the Monolith" },
    next: { slug: "grpc-in-browser-based-applications", title: "The Future of gRPC in Browser-Based Applications" },
  },
  {
    slug: "grpc-in-browser-based-applications",
    category: "WEB",
    title: "The Future of gRPC in Browser-Based Applications",
    publishedAt: "2023-12-18",
    readingTimeMinutes: 7,
    tags: ["GRPC", "WEB"],
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDw_ETEfDvSZ2m-VdtuU5xgnJeVr6m4GuoRnvK54KDHy8lmBuEFGLgx0iiTFSEeeV5XKHV6THVmhSxhF6nfYWeO9YNjqclYCYdistJ_Y7j1TyjvlcaAw39Ai0gFYHr6A3n9CeG4MrzAArmotnRlSSD4YoJKSur1OShlvY9ye8m-5wnnyNQUu9JOyFBbNs0AEUZklb4G50vREwPhrAkmrx1yRNkvOwiQiQYGLDGTHPL08cO2KLRuer4b",
    bodyHtml: "<h2 id=\"overview\">Overview</h2><p>gRPC-Web has quietly closed the gap with REST for browser clients. Here's what changed and where it still falls short.</p>",
    toc: [{ id: "overview", label: "Overview", order: 1 }],
    metrics: [],
    prev: { slug: "gc-tuning-jvm-applications", title: "Garbage Collection Tuning for JVM Applications" },
  },
]

// core/home-dark.html의 카드 그리드는 정확히 이 6개 글(작성 순서)만 보여준다 —
// "Architecting High-Concurrency..."는 article-detail 목업 전용이라 홈 그리드에서 제외.
const HOME_CARD_SLUGS = [
  "optimizing-postgresql-indexing-high-write-loads",
  "kafka-streams-vs-spark",
  "oauth2-from-scratch-security-audit",
  "serverless-break-the-monolith",
  "gc-tuning-jvm-applications",
  "grpc-in-browser-based-applications",
]

export const blogCards: BlogCardData[] = HOME_CARD_SLUGS.map((slug) => {
  const article = articles.find((a) => a.slug === slug)!
  return { slug: article.slug, title: article.title, thumbnail: article.thumbnail, publishedAt: article.publishedAt }
})

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}

export const CODE_BLOCK_PLACEHOLDER = "__CODE_BLOCK__"
export const METRICS_PLACEHOLDER = "__METRICS__"
export const CODE_BLOCK_SOURCE = {
  filename: "stream_processor.go",
  language: "go",
  code: `// Example: Non-blocking Worker Implementation
func processStream(events <-chan Event) {
    for e := range events {
        go func(val Event) {
            result := compute(val)
            metrics.Push(result)
        }(e)
    }
}`,
}
