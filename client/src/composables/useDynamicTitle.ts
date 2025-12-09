import { computed, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '@/stores/player'
import { useLyricStore } from '@/stores/lyric'

const BRAND_NAME = '听见'
const SCROLL_THRESHOLD = 12
const SCROLL_INTERVAL = 320

const setDocumentTitle = (value: string) => {
  if (typeof document !== 'undefined') {
    document.title = value
  }
}

export const useDynamicTitle = () => {
  const route = useRoute()
  const playerStore = usePlayerStore()
  const lyricStore = useLyricStore()

  const { currentSong, isPlaying } = storeToRefs(playerStore)
  const { currentLyricText } = storeToRefs(lyricStore)

  const baseTitle = computed(() => {
    const metaTitle = route.meta?.title as string | undefined
    if (metaTitle) {
      return `${BRAND_NAME} · ${metaTitle}`
    }
    return BRAND_NAME
  })

  const desiredTitle = computed(() => {
    if (currentSong.value && isPlaying.value) {
      const lyric = (currentLyricText.value || '').trim()
      if (lyric) {
        return { text: lyric, scroll: lyric.length > SCROLL_THRESHOLD }
      }

      const songTitle = (currentSong.value.title || '').trim()
      if (songTitle) {
        return { text: songTitle, scroll: songTitle.length > SCROLL_THRESHOLD }
      }
    }

    return { text: baseTitle.value, scroll: false }
  })

  let scrollTimer: number | null = null
  let scrollLoop = ''
  let scrollCursor = 0

  const stopScroll = () => {
    if (scrollTimer !== null) {
      window.clearInterval(scrollTimer)
      scrollTimer = null
    }
  }

  const startScroll = (text: string) => {
    stopScroll()
    scrollLoop = `${text} · `
    scrollCursor = 0
    setDocumentTitle(text)
    scrollTimer = window.setInterval(() => {
      const frame = scrollLoop.slice(scrollCursor) + scrollLoop.slice(0, scrollCursor)
      setDocumentTitle(frame)
      scrollCursor = (scrollCursor + 1) % scrollLoop.length
    }, SCROLL_INTERVAL)
  }

  watch(
    desiredTitle,
    ({ text, scroll }) => {
      if (!text) {
        stopScroll()
        setDocumentTitle(BRAND_NAME)
        return
      }

      if (scroll) {
        startScroll(text)
      } else {
        stopScroll()
        setDocumentTitle(text)
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    stopScroll()
  })
}
