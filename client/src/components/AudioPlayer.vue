<template>
  <Transition name="slide-up">
    <div v-if="hasCurrentSong" class="audio-player">
      <!-- 进度条 -->
      <div class="progress-bar" @click="handleProgressClick">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
      
      <div class="player-content">
        <!-- 歌曲信息 -->
        <div class="song-info" @click="goToDetail">
          <div class="cover" :class="{ rotating: isPlaying }">
            <img v-if="currentSong?.artwork" :src="currentSong.artwork" :alt="currentSong.title" />
            <div v-else class="cover-placeholder">🎵</div>
          </div>
          <div class="info">
            <div class="title">{{ currentSong?.title }}</div>
            <div class="artist">{{ currentSong?.artist }}</div>
          </div>
        </div>

        <!-- 播放控制 -->
        <div class="controls">
          <el-tooltip :content="playModeText" placement="top">
            <el-button class="control-btn mode-btn" @click="playerStore.togglePlayMode">
              <el-icon :size="18">
                <component :is="playModeIcon" />
              </el-icon>
            </el-button>
          </el-tooltip>

          <el-button class="control-btn" @click="playerStore.playPrev">
            <el-icon :size="20"><DArrowLeft /></el-icon>
          </el-button>

          <el-button
            class="control-btn main-btn"
            :loading="isLoading"
            @click="playerStore.togglePlay"
          >
            <el-icon v-if="!isLoading" :size="28">
              <VideoPlay v-if="!isPlaying" />
              <VideoPause v-else />
            </el-icon>
          </el-button>

          <el-button class="control-btn" @click="playerStore.playNext">
            <el-icon :size="20"><DArrowRight /></el-icon>
          </el-button>

          <el-button class="control-btn" @click="playerStore.togglePlaylist">
            <el-icon :size="18"><List /></el-icon>
          </el-button>
        </div>

        <!-- 时间和音量 -->
        <div class="extra-controls">
          <el-tooltip v-if="currentSourceCached" content="已缓存" placement="top">
            <el-icon class="cache-indicator" :size="18">
              <CircleCheck />
            </el-icon>
          </el-tooltip>
          <span class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          <div class="volume-control">
            <el-icon :size="16" @click="toggleMute"><component :is="volumeIcon" /></el-icon>
            <el-slider v-model="volume" :max="100" size="small" class="volume-slider" />
          </div>
        </div>
      </div>

      <!-- 播放列表遮罩 -->
      <Transition name="fade">
        <div v-if="showPlaylist" class="playlist-overlay" @click="playerStore.togglePlaylist"></div>
      </Transition>

      <!-- 播放列表抽屉 -->
      <Transition name="slide-right">
        <div v-if="showPlaylist" class="playlist-drawer">
          <div class="playlist-header">
            <h3>播放列表 ({{ playlist.length }})</h3>
            <div class="playlist-actions">
              <el-button type="danger" link @click="playerStore.clearPlaylist">清空</el-button>
              <el-button link @click="playerStore.togglePlaylist">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="playlist-content" ref="playlistContentRef">
            <div
              v-for="(song, index) in playlist"
              :key="song.id"
              :ref="el => setPlaylistItemRef(el, index)"
              class="playlist-item"
              :class="{ active: currentSong?.id === song.id }"
              @click="playerStore.playSong(song)"
            >
              <span class="playlist-index">{{ index + 1 }}</span>
              <div class="playlist-info">
                <div class="playlist-title">
                  {{ song.title }}
                  <el-icon
                    v-if="playerStore.isSongCached(song.id)"
                    class="cache-indicator cache-indicator--sm"
                    :size="14"
                  >
                    <CircleCheck />
                  </el-icon>
                </div>
                <div class="playlist-artist">{{ song.artist }}</div>
              </div>
              <el-button
                class="remove-btn"
                link
                @click.stop="playerStore.removeFromPlaylist(index)"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </Transition>

      <audio
        ref="audioRef"
        @ended="handleEnded"
        @error="handleError"
        @canplay="handleCanPlay"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleLoadedMetadata"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { VideoPlay, VideoPause, DArrowLeft, DArrowRight, List, Close, Mute, Microphone, RefreshRight, Sort, Switch, CircleCheck } from '@element-plus/icons-vue'
import { usePlayerStore } from '@/stores/player'
import { useLyricStore } from '@/stores/lyric'
import { storeToRefs } from 'pinia'

const router = useRouter()
const playerStore = usePlayerStore()
const lyricStore = useLyricStore()
const { currentSong, isPlaying, isLoading, currentUrl, hasCurrentSong, playMode, showPlaylist, playlist, currentIndex, currentSourceCached } = storeToRefs(playerStore)

const audioRef = ref<HTMLAudioElement | null>(null)
const volume = ref(80)
const currentTime = ref(0)
const duration = ref(0)
const prevVolume = ref(80)
const playlistContentRef = ref<HTMLElement | null>(null)
const playlistItemRefs = ref<(HTMLElement | null)[]>([])

const setPlaylistItemRef = (el: any, index: number) => {
  if (el) {
    playlistItemRefs.value[index] = el as HTMLElement
  }
}

// 自动滚动到当前播放歌曲
const scrollPlaylistToCurrent = () => {
  if (!playlistContentRef.value || currentIndex.value === -1) return

  const activeItem = playlistItemRefs.value[currentIndex.value]
  if (activeItem) {
    // 简单的 scrollIntoView，居中显示
    activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

// 监听播放列表显示，自动滚动
watch(showPlaylist, (visible) => {
  if (visible) {
    nextTick(() => {
      scrollPlaylistToCurrent()
    })
  }
})

// 监听当前播放索引变化，如果列表打开则滚动
watch(currentIndex, () => {
  if (showPlaylist.value) {
    nextTick(() => {
      scrollPlaylistToCurrent()
    })
  }
})

// 计算属性
const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const playModeIcon = computed(() => {
  switch (playMode.value) {
    case 'repeat': return RefreshRight
    case 'shuffle': return Sort
    case 'loop': return Switch
    default: return Switch
  }
})

const playModeText = computed(() => {
  switch (playMode.value) {
    case 'sequence': return '顺序播放'
    case 'loop': return '列表循环'
    case 'repeat': return '单曲循环'
    case 'shuffle': return '随机播放'
    default: return '顺序播放'
  }
})

const volumeIcon = computed(() => {
  return volume.value === 0 ? Mute : Microphone
})

// 格式化时间
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 播放音频
const playAudio = async () => {
  if (!audioRef.value) return
  
  try {
    await audioRef.value.play()
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Play error:', err)
    }
  }
}

// 监听 URL 变化
// 监听 URL 变化
watch(currentUrl, async (url) => {
  if (url) {
    await nextTick()
    if (audioRef.value) {
      audioRef.value.src = url
      audioRef.value.load()
    }
  }
})

// 初始化音频
onMounted(() => {
  if (currentUrl.value && audioRef.value) {
    audioRef.value.src = currentUrl.value
    audioRef.value.load()
    if (isPlaying.value) playAudio()
  }
})

// 监听播放状态
watch(isPlaying, async (playing) => {
  if (!audioRef.value) return
  
  if (playing) {
    await playAudio()
  } else {
    audioRef.value.pause()
  }
})

// 监听音量
watch(volume, (val) => {
  if (audioRef.value) {
    audioRef.value.volume = val / 100
  }
})

const handleCanPlay = () => {
  if (isPlaying.value) {
    playAudio()
  }
}

const handleEnded = () => {
  playerStore.playNext()
}

const handleError = (e: Event) => {
  const audio = e.target as HTMLAudioElement
  console.error('Audio error:', audio.error)
  playerStore.pause()
}

const handleTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
    lyricStore.updateCurrentTime(audioRef.value.currentTime)
  }
}

const handleLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration
    lyricStore.updateCurrentTime(audioRef.value.currentTime || 0)
  }
}

const handleProgressClick = (e: MouseEvent) => {
  if (!audioRef.value || duration.value === 0) return
  
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  audioRef.value.currentTime = percent * duration.value
  lyricStore.updateCurrentTime(audioRef.value.currentTime)
}

const toggleMute = () => {
  if (volume.value > 0) {
    prevVolume.value = volume.value
    volume.value = 0
  } else {
    volume.value = prevVolume.value || 80
  }
}

const goToDetail = () => {
  if (currentSong.value) {
    sessionStorage.setItem('currentDetailSong', JSON.stringify(currentSong.value))
    router.push(`/detail/${currentSong.value.id}`)
  }
}
</script>

<style scoped>
.audio-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(15, 20, 25, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 1000;
}

.progress-bar {
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 4px;
  cursor: pointer;
}

.progress-track {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.1s linear;
}

.progress-bar:hover .progress-track {
  height: 6px;
  margin-top: -1px;
}

.player-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  padding: 0 20px;
}

.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.cover.rotating {
  animation: rotate 20s linear infinite;
  border-radius: 50%;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cover img {
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
  font-size: 20px;
}

.info {
  min-width: 0;
}

.title {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.artist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.main-btn {
  width: 48px;
  height: 48px;
  background: var(--primary-color);
  color: #fff;
}

.main-btn:hover {
  background: var(--primary-light);
}

.mode-btn.el-button {
  color: var(--primary-color);
}

.extra-controls {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
}

.time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  min-width: 110px;
  text-align: right;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.volume-slider {
  width: 80px;
}

.volume-slider :deep(.el-slider__runway) {
  background: rgba(255, 255, 255, 0.1);
}

.volume-slider :deep(.el-slider__bar) {
  background: var(--primary-color);
}

.volume-slider :deep(.el-slider__button) {
  width: 12px;
  height: 12px;
  border-color: var(--primary-color);
}

/* 播放列表抽屉 */
.playlist-drawer {
  position: absolute;
  bottom: 72px;
  right: 0;
  width: 360px;
  max-height: 400px;
  background: rgba(20, 25, 30, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px 12px 0 0;
  overflow: hidden;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.playlist-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.playlist-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.playlist-content {
  max-height: 340px;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.playlist-item.active {
  background: rgba(64, 158, 255, 0.1);
}

.playlist-item.active .playlist-title {
  color: var(--primary-color);
}

.playlist-index {
  width: 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
}

.playlist-info {
  flex: 1;
  min-width: 0;
}

.playlist-title {
  font-size: 13px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-artist {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  opacity: 0;
  color: rgba(255, 255, 255, 0.4);
  padding: 4px;
}

.playlist-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  color: #f56c6c;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 播放列表遮罩 */
.playlist-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
</style>
