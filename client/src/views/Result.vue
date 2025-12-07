<template>
  <div class="result-page">
    <header class="header">
      <el-button class="back-btn" @click="goHome" circle>
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索歌曲、歌手..."
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          class="search-input"
        />
        <el-button type="primary" :loading="loading" @click="handleSearch">
          搜索
        </el-button>
      </div>
      
      <div class="header-actions">
        <!-- 我的歌单按钮 -->
        <PlaylistDrawer ref="playlistDrawerRef">
          <template #trigger>
            <el-button circle class="header-btn">
              <el-icon><Collection /></el-icon>
            </el-button>
          </template>
        </PlaylistDrawer>
        <SourceSelector />
      </div>
    </header>

    <main class="main" ref="scrollContainer" @scroll="handleScroll">
      <div v-if="loading && songs.length === 0" class="loading-state">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>搜索中...</p>
      </div>
      
      <div v-else-if="songs.length === 0 && hasSearched" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>未找到 "{{ query }}" 相关的歌曲</p>
      </div>

      <div v-else-if="songs.length > 0" class="results">
        
        <TransitionGroup name="list" tag="div" class="song-list">
          <div
            v-for="(song, index) in songs"
            :key="song.id"
            :ref="el => setSongItemRef(el, song.id)"
            class="song-item"
            :class="{ active: currentSong?.id === song.id }"
          >
            <span class="song-index">{{ index + 1 }}</span>
            
            <div class="song-cover" @click="goToDetail(song)">
              <img v-if="song.artwork" :src="song.artwork" :alt="song.title" />
              <div v-else class="cover-placeholder">🎵</div>
            </div>

            <div class="song-info" @click="goToDetail(song)">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-artist">{{ song.artist }}</div>
            </div>

            <div class="song-actions">
              <el-button
                link
                @click.stop="openAddToPlaylist(song)"
                class="action-btn-add"
              >
                <el-icon><Plus /></el-icon>
              </el-button>
              
              <el-button
                type="primary"
                circle
                :loading="isLoading && currentSong?.id === song.id"
                @click="handlePlay(song)"
                class="play-btn"
              >
                <el-icon v-if="!(isLoading && currentSong?.id === song.id)">
                  <VideoPlay v-if="!(isPlaying && currentSong?.id === song.id)" />
                  <VideoPause v-else />
                </el-icon>
              </el-button>
            </div>
          </div>
        </TransitionGroup>

        <!-- 加载更多指示器 -->
        <div v-if="loadingMore" class="loading-more">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载更多...</span>
        </div>
        <div v-else-if="!hasMore && songs.length > 0" class="no-more">
          已加载全部
        </div>
      </div>
    </main>

    <!-- 滚动到当前播放歌曲按钮 -->
    <!-- <Transition name="fade">
      <el-button
        v-if="showScrollToCurrent"
        class="scroll-to-current-btn"
        type="primary"
        circle
        @click="scrollToCurrentSong"
      >
        <el-icon><Aim /></el-icon>
      </el-button>
    </Transition> -->

    <!-- 添加到歌单对话框 -->
    <el-dialog
      v-model="addToPlaylistVisible"
      title="添加到歌单"
      width="500px"
      append-to-body
      class="dark-dialog"
    >
      <div v-if="playlists.length === 0" class="empty-playlist-tip">
        暂无歌单，请先创建歌单
      </div>
      <div v-else class="playlist-select-list">
        <div
          v-for="playlist in playlists"
          :key="playlist.id"
          class="playlist-select-item"
          @click="addToPlaylist(playlist)"
        >
          <div class="playlist-select-cover">
            <img v-if="playlist.cover" :src="playlist.cover" />
            <div v-else class="cover-placeholder-small">🎵</div>
          </div>
          <div class="playlist-select-info">
            <div class="name">{{ playlist.name }}</div>
            <div class="count">{{ playlist.songs.length }} 首</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Search, VideoPlay, VideoPause, Loading, Collection, Plus } from '@element-plus/icons-vue'
import SourceSelector from '@/components/SourceSelector.vue'
import PlaylistDrawer from '@/components/PlaylistDrawer.vue'
import { searchSongs, type Song } from '@/api/music'
import { usePlayerStore } from '@/stores/player'
import { useSourceStore } from '@/stores/source'
import { useMyPlaylistStore, type Playlist } from '@/stores/myPlaylist'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()
const playerStore = usePlayerStore()
const sourceStore = useSourceStore()
const myPlaylistStore = useMyPlaylistStore()
const { currentSong, isPlaying, isLoading } = storeToRefs(playerStore)

const searchQuery = ref('')
const query = ref('')
const songs = ref<Song[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasSearched = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const scrollContainer = ref<HTMLElement | null>(null)
const songItemRefs = ref<Record<string, HTMLElement>>({})

const addToPlaylistVisible = ref(false)
const songToAdd = ref<Song | null>(null)
const playlists = computed(() => myPlaylistStore.playlists)

const setSongItemRef = (el: any, id: string) => {
  if (el) {
    songItemRefs.value[id] = el as HTMLElement
  }
}

// 是否显示滚动到当前按钮
// const showScrollToCurrent = computed(() => {
//   return currentSong.value && songs.value.some(s => s.id === currentSong.value?.id)
// })

// 滚动到当前播放歌曲
// const scrollToCurrentSong = () => {
//   if (!currentSong.value) return
  
//   const el = songItemRefs.value[currentSong.value.id]
//   if (el) {
//     el.scrollIntoView({ block: 'center', behavior: 'smooth' })
//   } else {
//     ElMessage.warning('当前列表中未找到播放的歌曲')
//   }
// }

// 打开添加到歌单对话框
const openAddToPlaylist = (song: Song) => {
  songToAdd.value = song
  addToPlaylistVisible.value = true
}

// 添加到歌单
const addToPlaylist = (playlist: Playlist) => {
  if (!songToAdd.value) return
  
  const success = myPlaylistStore.addSongToPlaylist(playlist.id, songToAdd.value)
  if (success) {
    addToPlaylistVisible.value = false
  } else {
    ElMessage.warning('歌曲已存在于该歌单')
  }
}

// 从 URL 获取搜索参数
onMounted(async () => {
  const q = route.query.q as string
  if (q) {
    searchQuery.value = q
    query.value = q
    await doSearch(q, 1, true)
  }
})

// 监听路由变化
watch(() => route.query.q, async (newQ) => {
  if (newQ && newQ !== query.value) {
    searchQuery.value = newQ as string
    query.value = newQ as string
    await doSearch(newQ as string, 1, true)
  }
})

const doSearch = async (q: string, page: number = 1, reset: boolean = false) => {
  const source = sourceStore.currentSourceName
  
  if (!source) {
    await sourceStore.initialize()
  }
  
  const currentSource = sourceStore.currentSourceName
  if (!currentSource) {
    ElMessage.warning('请先选择音源')
    return
  }

  try {
    if (reset) {
      loading.value = true
      songs.value = []
      currentPage.value = 1
      hasMore.value = true
      songItemRefs.value = {} // 重置 refs
    } else {
      loadingMore.value = true
    }
    
    hasSearched.value = true
    const result = await searchSongs(q, currentSource, page)
    
    if (result.code === 0) {
      const newSongs = result.data.list || []
      
      if (reset) {
        songs.value = newSongs
      } else {
        songs.value = [...songs.value, ...newSongs]
      }
      
      hasMore.value = result.data.hasMore
      currentPage.value = page
      playerStore.setPlaylist(songs.value)
      
      if (songs.value.length === 0) {
        ElMessage.info('未找到相关歌曲')
      }
    } else {
      ElMessage.error(result.msg || '搜索失败')
      if (reset) {
        songs.value = []
      }
    }
  } catch (error) {
    console.error('Search failed:', error)
    ElMessage.error('搜索失败，请稍后重试')
    if (reset) {
      songs.value = []
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  
  query.value = searchQuery.value.trim()
  router.replace({
    path: '/result',
    query: { q: query.value }
  })
  doSearch(query.value, 1, true)
}

// 滚动加载
const handleScroll = () => {
  if (!scrollContainer.value || loadingMore.value || !hasMore.value || loading.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
  
  // 距离底部 200px 时加载更多
  if (scrollTop + clientHeight >= scrollHeight - 200) {
    doSearch(query.value, currentPage.value + 1, false)
  }
}

const handlePlay = (song: Song) => {
  if (currentSong.value?.id === song.id && isPlaying.value) {
    playerStore.pause()
  } else {
    playerStore.playSong(song)
  }
}

const goHome = () => {
  router.push('/')
}

const goToDetail = (song: Song) => {
  sessionStorage.setItem('currentDetailSong', JSON.stringify(song))
  router.push(`/detail/${song.id}`)
}
</script>

<style scoped>
.result-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  z-index: 100;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.header-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.search-bar {
  flex: 1;
  display: flex;
  gap: 12px;
  max-width: 500px;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: none;
  border-radius: 8px;
}

.search-input :deep(.el-input__inner) {
  color: #fff;
}

.search-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-bottom: 100px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: rgba(255, 255, 255, 0.6);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.results {
  max-width: 900px;
  margin: 0 auto;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.load-hint {
  color: rgba(255, 255, 255, 0.4);
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.song-item.active {
  background: rgba(64, 158, 255, 0.12);
  border-color: rgba(64, 158, 255, 0.2);
}

.song-index {
  width: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.song-cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
}

.song-cover img {
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

.song-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.song-title {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.song-artist {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
}

.action-btn:hover {
  color: var(--primary-color);
}

.play-btn {
  background: var(--primary-color);
  border: none;
  width: 40px;
  height: 40px;
}

.play-btn:hover {
  background: var(--primary-light);
}

.loading-more,
.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.scroll-to-current-btn {
  position: absolute;
  bottom: 120px;
  right: 100px;
  width: 50px;
  height: 50px;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
  gap: 8px;
  max-height: 500px;
  overflow-y: auto;
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
  color: #fff;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-select-info .count {
  font-size: 12px;
  color: #909399;
}

.action-btn-add {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
}

.action-btn-add:hover {
  color: var(--primary-color);
}
</style>


