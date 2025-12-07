<template>
  <div class="list-page">
    <header class="header">
      <el-button class="back-btn" @click="goBack" circle>
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h1 class="title">歌曲列表</h1>
      <div class="header-right">
        <SourceSelector />
      </div>
    </header>

    <main class="main">
      <div v-if="songs.length === 0" class="empty-state">
        <div class="empty-icon">🎵</div>
        <p>暂无歌曲，请先搜索</p>
        <el-button type="primary" @click="goBack">去搜索</el-button>
      </div>

      <TransitionGroup v-else name="list" tag="div" class="songs">
        <div
          v-for="(song, index) in songs"
          :key="song.id"
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

          <div class="song-album" v-if="song.album">{{ song.album }}</div>

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
      </TransitionGroup>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, VideoPlay, VideoPause } from '@element-plus/icons-vue'
import SourceSelector from '@/components/SourceSelector.vue'
import { usePlayerStore } from '@/stores/player'
import { storeToRefs } from 'pinia'
import type { Song } from '@/api/music'

const router = useRouter()
const playerStore = usePlayerStore()
const { currentSong, isPlaying, isLoading, playlist: songs } = storeToRefs(playerStore)

const goBack = () => {
  router.push('/')
}

const handlePlay = (song: Song) => {
  if (currentSong.value?.id === song.id && isPlaying.value) {
    playerStore.pause()
  } else {
    playerStore.playSong(song)
  }
}

const goToDetail = (song: Song) => {
  sessionStorage.setItem('currentDetailSong', JSON.stringify(song))
  router.push(`/detail/${song.id}`)
}
</script>

<style scoped>
.list-page {
  min-height: 100vh;
  padding-bottom: 100px;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin-left: 16px;
}

.header-right {
  margin-left: auto;
}

.main {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.songs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.song-item.active {
  background: rgba(64, 158, 255, 0.15);
  border-color: rgba(64, 158, 255, 0.3);
}

.song-index {
  width: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
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
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
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
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-album {
  width: 150px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.play-btn {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  width: 40px;
  height: 40px;
}

.play-btn:hover {
  background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
