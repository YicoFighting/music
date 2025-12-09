import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import type { Song } from '@/api/music'
import { getPlayUrl } from '@/api/music'
import { getAudioSource } from '@/utils/audioCache'
import { useSourceStore } from './source'

// 播放模式
export type PlayMode = 'sequence' | 'loop' | 'repeat' | 'shuffle'

const PLAY_MODE_KEY = 'music_play_mode'
const noop = () => {}

export const usePlayerStore = defineStore('player', () => {
  // 状态
  const currentSong = ref<Song | null>(null)
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const currentUrl = ref('')
  const playlist = ref<Song[]>([])
  const currentIndex = ref(-1)
  const playMode = ref<PlayMode>((localStorage.getItem(PLAY_MODE_KEY) as PlayMode) || 'sequence')
  const showPlaylist = ref(false)
  const currentSourceCached = ref(false)
  const cachedSongMap = ref<Record<string, boolean>>({})
  const sourceStore = useSourceStore()
  let revokeCurrentAudio: () => void = noop

  // 计算属性
  const hasCurrentSong = computed(() => currentSong.value !== null)

  const normalizeSongId = (songId: string | number): string => String(songId)

  const setSongCached = (songId: string | number, cached: boolean) => {
    const key = normalizeSongId(songId)
    if (cached) {
      cachedSongMap.value = { ...cachedSongMap.value, [key]: true }
    } else if (cachedSongMap.value[key]) {
      const { [key]: _ignored, ...rest } = cachedSongMap.value
      cachedSongMap.value = rest
    }
  }

  const isSongCached = (songId: string | number): boolean => {
    const key = normalizeSongId(songId)
    return cachedSongMap.value[key] === true
  }

  const releaseCurrentAudio = () => {
    if (revokeCurrentAudio !== noop) {
      revokeCurrentAudio()
      revokeCurrentAudio = noop
    }
    currentSourceCached.value = false
  }

  // 播放歌曲
  const playSong = async (song: Song) => {
    if (isLoading.value) return

    if (!sourceStore.currentSourceName) {
      await sourceStore.initialize()
    }

    const resolvedSource = (song.source as string | undefined) ?? sourceStore.currentSourceName

    if (!resolvedSource) {
      console.error('No source available for song:', song.title)
      return
    }

    const songWithSource: Song = song.source ? song : { ...song, source: resolvedSource }

    // 更新当前索引
    const index = playlist.value.findIndex(s => s.id === song.id)
    if (index !== -1) {
      currentIndex.value = index
      if (playlist.value[index] !== songWithSource) {
        playlist.value.splice(index, 1, songWithSource)
      }
    }

    try {
      isLoading.value = true
      currentSong.value = songWithSource

      console.log('Fetching play URL for:', songWithSource.title, 'source:', resolvedSource)
      const response = await getPlayUrl(songWithSource, resolvedSource)
      console.log('Play URL response:', response)
      
      if (response.code === 0 && response.data?.url) {
        const audioSource = await getAudioSource(response.data.url, {
          headers: response.data.headers
        })

        releaseCurrentAudio()

        if (currentUrl.value) {
          currentUrl.value = ''
          await nextTick()
        }

        currentUrl.value = audioSource.src
        revokeCurrentAudio = audioSource.revoke
        const isCached = audioSource.fromCache || audioSource.cached
        currentSourceCached.value = isCached
        setSongCached(songWithSource.id, isCached)
        isPlaying.value = true
      } else {
        console.error('Failed to get play url:', response.msg)
        isPlaying.value = false
        currentSourceCached.value = false
        setSongCached(songWithSource.id, false)
      }
    } catch (error) {
      console.error('Failed to get play url:', error)
      isPlaying.value = false
      currentSourceCached.value = false
      setSongCached(songWithSource.id, false)
    } finally {
      isLoading.value = false
    }
  }

  // 暂停
  const pause = () => {
    isPlaying.value = false
  }

  // 继续播放
  const resume = () => {
    if (currentUrl.value) {
      isPlaying.value = true
    }
  }

  // 切换播放状态
  const togglePlay = () => {
    if (isPlaying.value) {
      pause()
    } else {
      resume()
    }
  }

  // 设置播放列表
  const setPlaylist = (songs: Song[]) => {
    const defaultSource = sourceStore.currentSourceName
    playlist.value = songs.map(song => {
      if (song.source || !defaultSource) {
        return song
      }
      return { ...song, source: defaultSource }
    })
  }

  // 切换播放模式
  const togglePlayMode = () => {
    const modes: PlayMode[] = ['sequence', 'loop', 'repeat', 'shuffle']
    const currentModeIndex = modes.indexOf(playMode.value)
    playMode.value = modes[(currentModeIndex + 1) % modes.length]
    localStorage.setItem(PLAY_MODE_KEY, playMode.value)
  }

  // 设置播放模式
  const setPlayMode = (mode: PlayMode) => {
    playMode.value = mode
    localStorage.setItem(PLAY_MODE_KEY, mode)
  }

  // 获取下一首歌曲索引
  const getNextIndex = (): number => {
    if (playlist.value.length === 0) return -1
    
    switch (playMode.value) {
      case 'repeat':
        // 单曲循环，返回当前索引
        return currentIndex.value
      case 'shuffle':
        // 随机播放
        let randomIndex = Math.floor(Math.random() * playlist.value.length)
        // 避免随机到同一首
        if (playlist.value.length > 1 && randomIndex === currentIndex.value) {
          randomIndex = (randomIndex + 1) % playlist.value.length
        }
        return randomIndex
      case 'loop':
      case 'sequence':
      default:
        // 列表循环或顺序播放
        return (currentIndex.value + 1) % playlist.value.length
    }
  }

  // 获取上一首歌曲索引
  const getPrevIndex = (): number => {
    if (playlist.value.length === 0) return -1
    
    switch (playMode.value) {
      case 'repeat':
        return currentIndex.value
      case 'shuffle':
        let randomIndex = Math.floor(Math.random() * playlist.value.length)
        if (playlist.value.length > 1 && randomIndex === currentIndex.value) {
          randomIndex = (randomIndex + 1) % playlist.value.length
        }
        return randomIndex
      case 'loop':
      case 'sequence':
      default:
        return (currentIndex.value - 1 + playlist.value.length) % playlist.value.length
    }
  }

  // 播放下一首
  const playNext = () => {
    if (playlist.value.length === 0) return
    
    // 单曲循环模式：重新播放当前歌曲
    if (playMode.value === 'repeat') {
      if (currentSong.value) {
        playSong(currentSong.value)
      }
      return
    }
    
    // 顺序播放模式：到达末尾时停止
    if (playMode.value === 'sequence' && currentIndex.value >= playlist.value.length - 1) {
      pause()
      return
    }
    
    const nextIndex = getNextIndex()
    if (nextIndex === -1) return
    
    currentIndex.value = nextIndex
    playSong(playlist.value[currentIndex.value])
  }

  // 播放上一首
  const playPrev = () => {
    if (playlist.value.length === 0) return
    
    const prevIndex = getPrevIndex()
    if (prevIndex === -1) return
    
    currentIndex.value = prevIndex
    playSong(playlist.value[currentIndex.value])
  }

  // 切换播放列表显示
  const togglePlaylist = () => {
    showPlaylist.value = !showPlaylist.value
  }

  // 从播放列表移除歌曲
  const removeFromPlaylist = (index: number) => {
    if (index < 0 || index >= playlist.value.length) return

    playlist.value.splice(index, 1)

    // 如果移除的是当前播放的歌曲
    if (index === currentIndex.value) {
      if (playlist.value.length === 0) {
        currentSong.value = null
        currentUrl.value = ''
        isPlaying.value = false
        currentIndex.value = -1
        releaseCurrentAudio()
        currentSourceCached.value = false
      } else {
        currentIndex.value = Math.min(index, playlist.value.length - 1)
        playSong(playlist.value[currentIndex.value])
      }
    } else if (index < currentIndex.value) {
      currentIndex.value--
    }
  }

  // 清空播放列表
  const clearPlaylist = () => {
    playlist.value = []
    currentSong.value = null
    currentUrl.value = ''
    isPlaying.value = false
    currentIndex.value = -1
    releaseCurrentAudio()
    currentSourceCached.value = false
  }

  return {
    // 状态
    currentSong,
    isPlaying,
    isLoading,
    currentUrl,
    playlist,
    currentIndex,
    playMode,
    showPlaylist,
    currentSourceCached,
    // 计算属性
    hasCurrentSong,
    // 方法
    playSong,
    pause,
    resume,
    togglePlay,
    setPlaylist,
    playNext,
    playPrev,
    togglePlayMode,
    setPlayMode,
    togglePlaylist,
    removeFromPlaylist,
    clearPlaylist,
    isSongCached,
  }
})
