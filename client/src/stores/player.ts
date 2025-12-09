import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import type { Song } from '@/api/music'
import { getPlayUrl } from '@/api/music'
import { useSourceStore } from './source'

// 播放模式
export type PlayMode = 'sequence' | 'loop' | 'repeat' | 'shuffle'

const PLAY_MODE_KEY = 'music_play_mode'

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

  // 计算属性
  const hasCurrentSong = computed(() => currentSong.value !== null)

  // 播放歌曲
  const playSong = async (song: Song) => {
    if (isLoading.value) return

    const sourceStore = useSourceStore()
    const source = sourceStore.currentSourceName

    if (!source) {
      await sourceStore.initialize()
      if (!sourceStore.currentSourceName) {
        console.error('No source selected')
        return
      }
    }

    // 更新当前索引
    const index = playlist.value.findIndex(s => s.id === song.id)
    if (index !== -1) {
      currentIndex.value = index
    }

    try {
      isLoading.value = true
      currentSong.value = song

      console.log('Fetching play URL for:', song.title, 'source:', source)
      const response = await getPlayUrl(song, source)
      console.log('Play URL response:', response)
      
      if (response.code === 0 && response.data?.url) {
        if (currentUrl.value === response.data.url) {
          currentUrl.value = ''
          await nextTick()
        }
        currentUrl.value = response.data.url
        isPlaying.value = true
      } else {
        console.error('Failed to get play url:', response.msg)
        isPlaying.value = false
      }
    } catch (error) {
      console.error('Failed to get play url:', error)
      isPlaying.value = false
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
    playlist.value = [...songs]
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
  }
})
