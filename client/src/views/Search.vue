<template>
  <div class="search-page">
    <header class="header">
      <div class="header-top">
        <SourceSelector />
      </div>
      <h1 class="title">
        <span class="icon">🎵</span>
        音乐播放器
      </h1>
      <p class="subtitle">搜索和播放你喜欢的音乐</p>
    </header>

    <main class="main">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索歌曲、歌手..."
          size="large"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          class="search-input"
        />
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          @click="handleSearch"
          class="search-btn"
        >
          搜索
        </el-button>
      </div>

      <div v-if="hasSearched" class="search-tip">
        <span v-if="songs.length > 0">找到 {{ songs.length }} 首歌曲</span>
        <span v-else>未找到相关歌曲</span>
        <el-button v-if="songs.length > 0" type="primary" link @click="goToList">
          查看全部 →
        </el-button>
      </div>

      <!-- 快速预览前几首 -->
      <div v-if="songs.length > 0" class="quick-preview">
        <div
          v-for="song in songs.slice(0, 5)"
          :key="song.id"
          class="song-card"
          @click="goToDetail(song)"
        >
          <div class="card-cover">
            <img v-if="song.artwork" :src="song.artwork" :alt="song.title" />
            <div v-else class="cover-placeholder">🎵</div>
            <div class="play-btn" @click.stop="handlePlay(song)">
              <el-icon :size="20">
                <VideoPause v-if="isPlaying && currentSong?.id === song.id" />
                <VideoPlay v-else />
              </el-icon>
            </div>
          </div>
          <div class="card-info">
            <div class="card-title">{{ song.title }}</div>
            <div class="card-artist">{{ song.artist }}</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, VideoPlay, VideoPause } from '@element-plus/icons-vue'
import SourceSelector from '@/components/SourceSelector.vue'
import { searchSongs, type Song } from '@/api/music'
import { usePlayerStore } from '@/stores/player'
import { useSourceStore } from '@/stores/source'
import { storeToRefs } from 'pinia'

const router = useRouter()
const playerStore = usePlayerStore()
const sourceStore = useSourceStore()
const { currentSong, isPlaying } = storeToRefs(playerStore)

const searchQuery = ref('')
const songs = ref<Song[]>([])
const loading = ref(false)
const hasSearched = ref(false)

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  const source = sourceStore.currentSourceName
  
  if (!source) {
    ElMessage.warning('请先选择音源')
    return
  }

  try {
    loading.value = true
    hasSearched.value = true
    const result = await searchSongs(searchQuery.value.trim(), source)
    
    if (result.code === 0) {
      songs.value = result.data.list || []
      playerStore.setPlaylist(songs.value)
      
      if (songs.value.length === 0) {
        ElMessage.info('未找到相关歌曲')
      }
    } else {
      ElMessage.error(result.msg || '搜索失败')
      songs.value = []
    }
  } catch (error) {
    console.error('Search failed:', error)
    ElMessage.error('搜索失败，请稍后重试')
    songs.value = []
  } finally {
    loading.value = false
  }
}

const handlePlay = (song: Song) => {
  if (currentSong.value?.id === song.id && isPlaying.value) {
    playerStore.pause()
  } else {
    playerStore.playSong(song)
  }
}

const goToList = () => {
  router.push('/list')
}

const goToDetail = (song: Song) => {
  // 将歌曲信息存储到 sessionStorage 以便详情页使用
  sessionStorage.setItem('currentDetailSong', JSON.stringify(song))
  router.push(`/detail/${song.id}`)
}
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  padding-bottom: 100px;
}

.header {
  text-align: center;
  padding: 24px 24px 32px;
}

.header-top {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
}

.title {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.icon {
  font-size: 40px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.main {
  padding: 0 24px;
  max-width: 800px;
  margin: 0 auto;
}

.search-bar {
  display: flex;
  gap: 12px;
  width: 100%;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: none;
  border-radius: 12px;
}

.search-input :deep(.el-input__inner) {
  color: #fff;
}

.search-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

.search-input :deep(.el-input__prefix) {
  color: rgba(255, 255, 255, 0.5);
}

.search-btn {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  border-radius: 12px;
  padding: 0 24px;
}

.search-btn:hover {
  background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
}

.search-tip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
}

.quick-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.song-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.song-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-4px);
}

.card-cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.card-cover img {
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
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  font-size: 48px;
}

.play-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.song-card:hover .play-btn {
  opacity: 1;
  transform: translateY(0);
}

.play-btn:hover {
  transform: scale(1.1);
}

.card-info {
  padding: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.card-artist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
