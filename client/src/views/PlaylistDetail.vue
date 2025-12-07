<template>
  <div class="playlist-detail-page">
    <header class="header">
      <el-button class="back-btn" @click="goBack" circle>
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h1 class="title">歌单详情</h1>
    </header>

    <main class="main" v-if="playlist">
      <div class="playlist-info">
        <div class="cover-wrapper">
          <img v-if="playlist.cover" :src="playlist.cover" class="cover" />
          <div v-else class="cover-placeholder">🎵</div>
        </div>
        
        <div class="info-content">
          <div class="playlist-name-row">
            <h2 v-if="!isEditing" class="playlist-name">{{ playlist.name }}</h2>
            <el-input
              v-else
              v-model="editingName"
              class="name-input"
              ref="nameInputRef"
              @blur="saveName"
              @keyup.enter="saveName"
            />
            <el-button link @click="startEdit" v-if="!isEditing">
              <el-icon><Edit /></el-icon>
            </el-button>
          </div>
          <div class="playlist-meta">
            <span>{{ playlist.songs.length }} 首歌曲</span>
            <span class="create-time">创建于 {{ formatDate(playlist.createdAt) }}</span>
          </div>
          
          <div class="actions">
            <el-button type="primary" round @click="playAll">
              <el-icon><VideoPlay /></el-icon> 播放全部
            </el-button>
          </div>
        </div>
      </div>

      <div class="song-list" :class="{ 'has-player': hasCurrentSong }">
        <div v-if="playlist.songs.length === 0" class="empty-state">
           <div class="empty-icon">🎵</div>
           <p>歌单还是空的，快去添加歌曲吧</p>
        </div>
        
        <div 
          v-else 
          class="song-list-content"
        >
          <div
            v-for="(song, index) in playlist.songs" 
            :key="song.id"
            class="song-item"
            @dblclick="playSong(song)"
          >
            <div class="song-index">{{ index + 1 }}</div>
            <div class="song-info">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-artist">{{ song.artist }}</div>
            </div>
            <div class="song-actions">
              <el-button link class="action-btn-play" @click.stop="playSong(song)">
                <el-icon><VideoPlay /></el-icon>
              </el-button>
              <el-button link class="action-btn-delete" @click.stop="removeSong(song)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <div v-else class="not-found">
      <p>歌单不存在</p>
      <el-button @click="goBack">返回</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Edit, VideoPlay, Delete } from '@element-plus/icons-vue'
import { useMyPlaylistStore } from '@/stores/myPlaylist'
import { usePlayerStore } from '@/stores/player'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import type { Song } from '@/api/music'

const route = useRoute()
const router = useRouter()
const myPlaylistStore = useMyPlaylistStore()
const playerStore = usePlayerStore()
const { hasCurrentSong } = storeToRefs(playerStore)

const playlistId = route.params.id as string
const playlist = computed(() => myPlaylistStore.playlists.find(p => p.id === playlistId))

const isEditing = ref(false)
const editingName = ref('')
const nameInputRef = ref<any>(null)

const goBack = () => {
  router.back()
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString()
}

const startEdit = () => {
  if (!playlist.value) return
  editingName.value = playlist.value.name
  isEditing.value = true
  nextTick(() => {
    nameInputRef.value?.focus()
  })
}

const saveName = () => {
  if (!playlist.value) return
  if (editingName.value.trim()) {
    myPlaylistStore.renamePlaylist(playlist.value.id, editingName.value.trim())
  }
  isEditing.value = false
}

const playAll = () => {
  if (!playlist.value || playlist.value.songs.length === 0) return
  playerStore.setPlaylist(playlist.value.songs)
  playerStore.playSong(playlist.value.songs[0])
}

const playSong = (song: Song) => {
  // 播放单曲，这里可以优化为：将歌单设为当前播放列表，并从点击的歌开始
  if (!playlist.value) return
  playerStore.setPlaylist(playlist.value.songs)
  playerStore.playSong(song)
}

const removeSong = (song: Song) => {
  if (!playlist.value) return
  ElMessageBox.confirm('确定要从歌单移除这首歌吗？', '提示', {
    confirmButtonText: '移除',
    cancelButtonText: '取消',
    type: 'warning',
    customClass: 'dark-message-box'
  }).then(() => {
    myPlaylistStore.removeSongFromPlaylist(playlistId, song.id)
    ElMessage.success('已移除')
  })
}

onMounted(() => {
  if (!playlist.value) {
    ElMessage.error('歌单不存在')
    // router.replace('/') // Optional redirects
  }
})
</script>

<style scoped>
.playlist-detail-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: radial-gradient(circle at center, #1a2a3a 0%, #000 100%);
  color: #fff;
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

.title {
  font-size: 18px;
  font-weight: 600;
  margin-left: 16px;
}

.main {
  flex: 1;
  overflow: hidden;
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.playlist-info {
  display: flex;
  gap: 32px;
  margin-bottom: 40px;
  flex-shrink: 0;
}

.cover-wrapper {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
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
  font-size: 64px;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.playlist-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  height: 40px;
}

.playlist-name {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
}

.name-input {
  max-width: 400px;
  font-size: 32px;
  font-weight: 700;
}

.name-input :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none;
  border-bottom: 2px solid var(--primary-color);
  border-radius: 0;
  padding: 0;
}

.name-input :deep(.el-input__inner) {
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  height: 40px;
  line-height: 40px;
}

.playlist-meta {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
  font-size: 14px;
}

.create-time {
  margin-left: 16px;
}

.song-list {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  overflow-y: auto;
  flex: 1;
}

.song-list.has-player {
  padding-bottom: 80px;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
}

.song-item:last-child {
  border-bottom: none;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.song-index {
  width: 40px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.song-info {
  flex: 1;
}

.song-title {
  font-size: 16px;
  color: #fff;
  margin-bottom: 4px;
}

.song-artist {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.song-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.song-item:hover .song-actions {
  opacity: 1;
}

.action-btn-play {
  font-size: 20px;
  color: #fff;
}

.action-btn-play:hover {
  color: var(--primary-color);
}

.action-btn-delete {
  font-size: 18px;
  color: #fff;
}

.action-btn-delete:hover {
  color: var(--primary-color);
}

.empty-state, .not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px;
  color: rgba(255, 255, 255, 0.5);
  gap: 16px;
}

.empty-icon {
  font-size: 48px;
}
</style>
