export interface LyricLine {
  time: number
  text: string
}

const TIME_REGEX = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g

export const parseLyrics = (raw: string): LyricLine[] => {
  if (!raw) return []

  const lines: LyricLine[] = []
  let match: RegExpExecArray | null

  while ((match = TIME_REGEX.exec(raw)) !== null) {
    const minutes = Number.parseInt(match[1], 10)
    const seconds = Number.parseInt(match[2], 10)
    const milli = Number.parseInt(match[3], 10)
    const time = minutes * 60 + seconds + milli / (match[3].length === 2 ? 100 : 1000)
    const text = match[4].trim()
    if (text) {
      lines.push({ time, text })
    }
  }

  return lines.sort((a, b) => a.time - b.time)
}
