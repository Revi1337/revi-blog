import readingTime from "reading-time"

export function computeReadingTimeMinutes(plainText: string): number {
  return Math.max(1, Math.ceil(readingTime(plainText).minutes))
}
