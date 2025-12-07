<template>
  <div class="detail-page">
    <header class="header">
      <el-button class="back-btn" @click="goBack" circle>
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h1 class="title">歌曲详情</h1>
    </header>

    <main class="main" v-if="song">
      <!-- 左侧：歌曲信息 -->
      <div class="left-panel">
        <div class="cover-wrapper" :class="{ rotating: isCurrentPlaying }">
          <img v-if="song.artwork" :src="song.artwork" :alt="song.title" class="cover" />
          <div v-else class="cover-placeholder">🎵</div>
        </div>
        
        <div class="song-meta">
          <h2 class="song-title">{{ song.title }}</h2>
          <p class="song-artist">{{ song.artist }}</p>
          <p class="song-album" v-if="song.album">{{ song.album }}</p>
        </div>
        
        <div class="actions">
          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            @click="handlePlay"
            class="play-btn"
          >
            <el-icon v-if="!isLoading" :size="20">
              <VideoPause v-if="isCurrentPlaying" />
              <VideoPlay v-else />
            </el-icon>
            <span>{{ isCurrentPlaying ? '暂停' : '播放' }}</span>
          </el-button>
          

        </div>
      </div>

      <!-- 右侧：歌词 -->
      <div class="right-panel">
        <div v-if="lyricsLoading" class="lyrics-loading">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          <span>加载歌词中...</span>
        </div>
        
        <div v-else-if="lyricsError" class="lyrics-error">
          <p>{{ lyricsError }}</p>
          <el-button type="primary" link @click="loadLyrics">重试</el-button>
        </div>
        
        <div v-else-if="parsedLyrics.length > 0" class="lyrics-container" ref="lyricsContainerRef">
          <div class="lyrics-scroll">
            <div
              v-for="(line, index) in parsedLyrics"
              :key="index"
              :ref="el => setLyricRef(el, index)"
              class="lyrics-line"
              :class="{ active: currentLyricIndex === index }"
            >
              {{ line.text || '♪' }}
            </div>
          </div>
        </div>
        
        <div v-else class="lyrics-empty">
          <p>暂无歌词</p>
          <el-button v-if="!lyrics" type="primary" link @click="loadLyrics">加载歌词</el-button>
        </div>
      </div>
    </main>

    <div v-else class="empty-state">
      <p>歌曲信息不存在</p>
      <el-button type="primary" @click="goBack">返回</el-button>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, VideoPlay, VideoPause, Loading } from '@element-plus/icons-vue'
import { getLyrics, type Song } from '@/api/music'
import { usePlayerStore } from '@/stores/player'
import { useSourceStore } from '@/stores/source'
import { storeToRefs } from 'pinia'

interface LyricLine {
  time: number
  text: string
}

const router = useRouter()
const playerStore = usePlayerStore()
const sourceStore = useSourceStore()
const { currentSong, isPlaying, isLoading } = storeToRefs(playerStore)

const song = ref<Song | null>(null)
const lyrics = ref('')
const lyricsLoading = ref(false)
const lyricsError = ref('')
const currentTime = ref(0)
const lyricsContainerRef = ref<HTMLElement | null>(null)
const lyricRefs = ref<(HTMLElement | null)[]>([])



// 设置歌词行引用
const setLyricRef = (el: any, index: number) => {
  if (el) {
    lyricRefs.value[index] = el as HTMLElement
  }
}

// 解析歌词
const parsedLyrics = computed<LyricLine[]>(() => {
  if (!lyrics.value) return []
  
  const lines: LyricLine[] = []
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g
  let match
  
  while ((match = regex.exec(lyrics.value)) !== null) {
    const minutes = parseInt(match[1])
    const seconds = parseInt(match[2])
    const ms = parseInt(match[3])
    const time = minutes * 60 + seconds + ms / (match[3].length === 2 ? 100 : 1000)
    const text = match[4].trim()
    lines.push({ time, text })
  }
  
  return lines.sort((a, b) => a.time - b.time)
})

// 当前歌词索引
const currentLyricIndex = computed(() => {
  if (parsedLyrics.value.length === 0) return -1
  
  for (let i = parsedLyrics.value.length - 1; i >= 0; i--) {
    if (currentTime.value >= parsedLyrics.value[i].time) {
      return i
    }
  }
  return -1
})

// 是否是当前播放的歌曲
const isCurrentPlaying = computed(() => {
  return currentSong.value?.id === song.value?.id && isPlaying.value
})

// 歌词滚动到中间
const scrollLyricToCenter = (index: number) => {
  const container = lyricsContainerRef.value
  const lyricEl = lyricRefs.value[index]
  
  if (!container || !lyricEl) return
  
  const containerHeight = container.clientHeight
  const lyricTop = lyricEl.offsetTop
  const lyricHeight = lyricEl.clientHeight
  
  const scrollTop = lyricTop - containerHeight / 2 + lyricHeight / 2
  
  container.scrollTo({
    top: Math.max(0, scrollTop),
    behavior: 'smooth'
  })
}

// 监听歌词索引变化，滚动到中间
watch(currentLyricIndex, (index) => {
  if (index >= 0) {
    nextTick(() => {
      scrollLyricToCenter(index)
    })
  }
})

const goBack = () => {
  router.back()
}

const handlePlay = () => {
  if (!song.value) return
  
  if (isCurrentPlaying.value) {
    playerStore.pause()
  } else {
    playerStore.playSong(song.value)
  }
}



const loadLyrics = async () => {
  if (!song.value) return
  
  const source = sourceStore.currentSourceName
  if (!source) {
    lyricsError.value = '请先选择音源'
    return
  }
  
  try {
    lyricsLoading.value = true
    lyricsError.value = ''
    
    const result = await getLyrics(song.value, source)
    
    if (result.code === 0 && result.data?.rawLrc) {
      lyrics.value = result.data.rawLrc
    } else {
      lyricsError.value = result.msg || '暂无歌词'
    }
  } catch (error) {
    console.error('Load lyrics failed:', error)
    lyricsError.value = '加载歌词失败'
  } finally {
    lyricsLoading.value = false
  }
}

// 时间更新监听
let audioElement: HTMLAudioElement | null = null

const updateTime = () => {
  if (audioElement) {
    currentTime.value = audioElement.currentTime
  }
}

onMounted(() => {
  const storedSong = sessionStorage.getItem('currentDetailSong')
  if (storedSong) {
    song.value = JSON.parse(storedSong)
    loadLyrics()
  }
  
  audioElement = document.querySelector('audio')
  if (audioElement) {
    audioElement.addEventListener('timeupdate', updateTime)
  }
})

watch(() => document.querySelector('audio'), (newAudio) => {
  if (audioElement) {
    audioElement.removeEventListener('timeupdate', updateTime)
  }
  audioElement = newAudio
  if (audioElement) {
    audioElement.addEventListener('timeupdate', updateTime)
  }
})

onUnmounted(() => {
  if (audioElement) {
    audioElement.removeEventListener('timeupdate', updateTime)
  }
})
</script>

<style scoped>
.detail-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: radial-gradient(circle at center, #1a2a3a 0%, #000 100%);
}

.header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  z-index: 10;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-left: 16px;
}

.main {
  flex: 1;
  display: flex;
  padding: 32px;
  gap: 48px;
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* 左侧面板 */
.left-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.cover-wrapper {
  width: 280px;
  height: 280px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  margin-bottom: 24px;
  position: relative;
  z-index: 2;
}

.cover-wrapper.rotating {
  animation: rotate 20s linear infinite;
  border-radius: 50%;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  font-size: 80px;
}

.song-meta {
  margin-bottom: 24px;
}

.song-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
  line-height: 1.3;
}

.song-artist {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.song-album {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.play-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-color);
  border: none;
  border-radius: 24px;
  padding: 0 32px;
  height: 48px;
}

.play-btn:hover {
  background: var(--primary-light);
}



/* 右侧面板 - 歌词 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.lyrics-loading,
.lyrics-error,
.lyrics-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  gap: 12px;
}

.lyrics-loading {
  flex-direction: row;
}

.lyrics-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
}

/* 隐藏滚动条 */
.lyrics-container::-webkit-scrollbar {
  display: none;
}

.lyrics-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.lyrics-scroll {
  padding: 40% 0;
}

.lyrics-line {
  padding: 12px 24px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
  text-align: center;
}

.lyrics-line.active {
  color: #fff;
  font-size: 22px;
  font-weight: 500;
  transform: scale(1.02);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  gap: 16px;
}

/* 对话框样式 */
.empty-playlist-tip {
  text-align: center;
  padding: 20px;
  color: rgba(0, 0, 0, 0.5);
}

.playlist-select-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.playlist-select-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.playlist-select-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.playlist-select-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.playlist-select-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder-small {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.playlist-select-info {
  flex: 1;
  min-width: 0;
}

.playlist-select-info .name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-select-info .count {
  font-size: 12px;
  color: #909399;
}

/* 响应式 */
@media (max-width: 768px) {
  .main {
    flex-direction: column;
    padding: 24px;
    gap: 24px;
    overflow-y: auto;
  }
  
  .left-panel {
    width: 100%;
  }
  
  .cover-wrapper {
    width: 200px;
    height: 200px;
  }
  
  .right-panel {
    height: 300px;
    flex: none;
  }
}
</style>
