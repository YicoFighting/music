<template>
  <div class="playlist-drawer-container">
    <!-- 触发器插槽 -->
    <div @click.stop="toggleVisible">
      <slot name="trigger"></slot>
    </div>

    <!-- 透明遮罩层，用于点击外部关闭 -->
    <div v-if="visible" class="click-outside-overlay" @click="visible = false"></div>

    <Transition name="slide-down">
      <div v-if="visible" class="custom-drawer" @click.stop>
        <!-- <div class="drawer-header">
          <h3>我的歌单</h3>
          <div class="header-actions">
          </div>
        </div> -->
        
        <div class="drawer-content">
          <!-- 创建新歌单 -->
          <div class="create-section">
            <el-input
              v-model="newPlaylistName"
              placeholder="新建歌单名称"
              class="create-input"
              @keyup.enter="handleCreate"
            >
              <template #append>
                <el-button @click="handleCreate" :disabled="!newPlaylistName.trim()">
                  <el-icon><Plus /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>

          <!-- 歌单列表 -->
          <div class="playlist-list">
            <div v-if="playlists.length === 0" class="empty-tip">
              暂无歌单，快去创建吧~
            </div>

              <div
                v-for="playlist in playlists"
                :key="playlist.id"
                class="playlist-item"
                @click="goToDetail(playlist)"
              >
                <div class="cover-wrapper" @click.stop="handlePlayClick(playlist)">
                  <img v-if="playlist.cover" :src="playlist.cover" class="cover" />
                  <div v-else class="cover-placeholder">🎵</div>
                  <div class="play-overlay">
                    <el-icon><VideoPlay /></el-icon>
                  </div>
                </div>

              <div class="info">
                <div class="name-row">
                  <span v-if="editingId !== playlist.id" class="name">{{ playlist.name }}</span>
                  <el-input
                    v-else
                    v-model="editingName"
                    size="small"
                    ref="editInputRef"
                    @blur="saveEdit(playlist)"
                    @keyup.enter="saveEdit(playlist)"
                    @click.stop
                  />
                </div>
                <div class="count">{{ playlist.songs.length }} 首歌曲</div>
              </div>

              <div class="actions">
                <el-button
                  v-if="editingId !== playlist.id"
                  link
                  size="small"
                  @click.stop="startEdit(playlist)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  link
                  class="action-btn-delete"
                  size="small"
                  @click.stop="myPlaylistStore.deletePlaylist(playlist.id)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Plus, Edit, Delete, VideoPlay } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useMyPlaylistStore, type Playlist } from '@/stores/myPlaylist'
import { ElMessage } from 'element-plus'
import { usePlayerStore } from '@/stores/player'

const router = useRouter()

const visible = ref(false)
const newPlaylistName = ref('')
const editingId = ref('')
const editingName = ref('')
const editInputRef = ref<any>(null)

const myPlaylistStore = useMyPlaylistStore()
const playerStore = usePlayerStore()

const playlists = computed(() => myPlaylistStore.playlists)

const toggleVisible = () => {
  visible.value = !visible.value
}

const handleCreate = () => {
  if (!newPlaylistName.value.trim()) return
  myPlaylistStore.createPlaylist(newPlaylistName.value.trim())
  newPlaylistName.value = ''
  ElMessage.success('创建成功')
}

const startEdit = (playlist: Playlist) => {
  editingId.value = playlist.id
  editingName.value = playlist.name
  nextTick(() => {
    editInputRef.value?.[0]?.focus()
  })
}

const saveEdit = (playlist: Playlist) => {
  if (editingId.value !== playlist.id) return
  if (editingName.value.trim()) {
    myPlaylistStore.renamePlaylist(playlist.id, editingName.value.trim())
  }
  editingId.value = ''
}

const handlePlayClick = (playlist: Playlist) => {
  if (playlist.songs.length > 0) {
    playerStore.setPlaylist(playlist.songs)
    // 播放第一首
    playerStore.playSong(playlist.songs[0])
    visible.value = false // 选择后关闭
  } else {
    ElMessage.info('歌单为空')
  }
}

const goToDetail = (playlist: Playlist) => {
  router.push(`/playlist/${playlist.id}`)
  visible.value = false
}
</script>

<style scoped>
.playlist-drawer-container {
  position: relative;
}

/* 遮罩层 - 全屏固定，用于点击关闭 */
.click-outside-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  cursor: default;
}

/* 自定义下拉抽屉 - 绝对定位 */
.custom-drawer {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 12px;
  width: 320px;
  max-height: 480px;
  background: rgba(20, 25, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  z-index: 2001; /* 比遮罩层高 */
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  transform-origin: top left;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.drawer-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.drawer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 400px; /* 固定高度确保滚动 */
}

.create-section {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.create-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px 0 0 4px;
}

.create-input :deep(.el-input-group__append) {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0 4px 4px 0;
  color: #fff;
  box-shadow: none;
  padding: 0 12px;
}

.playlist-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.playlist-list::-webkit-scrollbar {
  width: 4px;
}

.playlist-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.empty-tip {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 40px;
  font-size: 13px;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.cover-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.2s;
}

.cover-wrapper:hover .play-overlay {
  opacity: 1;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  height: 22px;
  margin-bottom: 2px;
}

.name {
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.actions {
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  gap: 4px;
}

.playlist-item:hover .actions {
  opacity: 1;
}

/* 覆盖输入框样式以适应暗色主题 */
:deep(.el-input__inner) {
  color: #fff;
  height: 28px;
}

/* 下拉动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.action-btn-delete {
  color: rgba(255, 255, 255, 0.4);
}
</style>
