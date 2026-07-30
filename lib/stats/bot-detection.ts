const BOT_USER_AGENT_PATTERN =
  /bot|crawl|spider|slurp|googlebot|bingbot|yeti|facebookexternalhit|kakaotalk-scrap/i

export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true
  return BOT_USER_AGENT_PATTERN.test(userAgent)
}
