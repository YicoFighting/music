import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Song } from '@/api/music'
import { getLyrics } from '@/api/music'
import { parseLyrics, type LyricLine } from '@/utils/lyrics'

const normalizeId = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''
  return String(value)
}

export const useLyricStore = defineStore('lyric', () => {
  const lines = ref<LyricLine[]>([])
  const currentLyricIndex = ref(-1)
  const loading = ref(false)
  const error = ref('')
  const currentSongId = ref<string>('')
  let requestToken = 0

  const hasLyrics = computed(() => lines.value.length > 0)
  const currentLyricText = computed(() => {
    if (currentLyricIndex.value < 0) return ''
    return lines.value[currentLyricIndex.value]?.text ?? ''
  })

  const clear = () => {
    lines.value = []
    currentLyricIndex.value = -1
    loading.value = false
    error.value = ''
    currentSongId.value = ''
  }

  const updateCurrentTime = (time: number) => {
    if (lines.value.length === 0) {
      currentLyricIndex.value = -1
      return
    }

    const currentIndex = currentLyricIndex.value
    if (
      currentIndex >= 0 &&
      currentIndex < lines.value.length &&
      time >= lines.value[currentIndex].time &&
      (currentIndex === lines.value.length - 1 || time < lines.value[currentIndex + 1].time)
    ) {
      return
    }

    let nextIndex = -1
    for (let i = 0; i < lines.value.length; i += 1) {
      if (time >= lines.value[i].time) {
        nextIndex = i
      } else {
        break
      }
    }
    currentLyricIndex.value = nextIndex
  }

  const loadLyrics = async (song: Song, sourceName?: string | null) => {
    const id = normalizeId(song.id)
    if (!id) {
      clear()
      return
    }

    requestToken += 1
    const currentRequest = requestToken
    loading.value = true
    error.value = ''
    currentSongId.value = id

    const resolvedSource = sourceName ?? (song.source as string | undefined)
    if (!resolvedSource) {
      lines.value = []
      currentLyricIndex.value = -1
      error.value = '缺少音源'
      loading.value = false
      return
    }

    const requestSong: Song = song.source ? song : { ...song, source: resolvedSource }

    try {
      const response = await getLyrics(requestSong, resolvedSource)
      if (currentRequest !== requestToken) return

      if (response.code === 0 && response.data?.rawLrc) {
        lines.value = parseLyrics(response.data.rawLrc)
        currentLyricIndex.value = -1
        error.value = ''
      } else {
        lines.value = []
        currentLyricIndex.value = -1
        error.value = response.msg || '暂无歌词'
      }
    } catch (err) {
      if (currentRequest !== requestToken) return
      lines.value = []
      currentLyricIndex.value = -1
      error.value = err instanceof Error ? err.message : '加载歌词失败'
    } finally {
      if (currentRequest === requestToken) {
        loading.value = false
      }
    }
  }

  return {
    lines,
    loading,
    error,
    currentSongId,
    currentLyricIndex,
    hasLyrics,
    currentLyricText,
    loadLyrics,
    updateCurrentTime,
    clear,
  }
})
