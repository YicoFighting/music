<template>
  <div class="song-list">
    <div v-if="songs.length === 0" class="empty-state">
      <div class="empty-icon">🎵</div>
      <p>搜索你喜欢的音乐</p>
    </div>

    <TransitionGroup name="list" tag="div" class="songs">
      <div
        v-for="song in songs"
        :key="song.id"
        class="song-item"
        :class="{ active: currentSong?.id === song.id }"
        @click="handlePlay(song)"
      >
        <div class="song-cover">
          <img
            v-if="song.artwork"
            :src="song.artwork"
            :alt="song.title"
            @error="handleImageError"
          />
          <div v-else class="cover-placeholder">🎵</div>
          <div class="play-overlay">
            <el-icon v-if="isPlaying && currentSong?.id === song.id" :size="24">
              <VideoPause />
            </el-icon>
            <el-icon v-else :size="24">
              <VideoPlay />
            </el-icon>
          </div>
        </div>

        <div class="song-info">
          <div class="song-title">{{ song.title }}</div>
          <div class="song-artist">{{ song.artist }}</div>
        </div>

        <el-button
          type="primary"
          circle
          :loading="isLoading && currentSong?.id === song.id"
          @click.stop="handlePlay(song)"
          class="play-btn"
        >
          <el-icon v-if="!(isLoading && currentSong?.id === song.id)">
            <VideoPlay v-if="!(isPlaying && currentSong?.id === song.id)" />
            <VideoPause v-else />
          </el-icon>
        </el-button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'
import { usePlayerStore } from '@/stores/player'
import { storeToRefs } from 'pinia'
import type { Song } from '@/api/music'

defineProps<{
  songs: Song[]
}>()

const playerStore = usePlayerStore()
const { currentSong, isPlaying, isLoading } = storeToRefs(playerStore)

const handlePlay = (song: Song) => {
  if (currentSong.value?.id === song.id && isPlaying.value) {
    playerStore.pause()
  } else {
    playerStore.playSong(song)
  }
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}
</script>

<style scoped>
.song-list {
  width: 100%;
  max-width: 800px;
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
  gap: 12px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
}

.song-item.active {
  background: rgba(29, 185, 84, 0.2);
  border-color: rgba(29, 185, 84, 0.3);
}

.song-cover {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
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
  background: linear-gradient(135deg, #1db954 0%, #1aa34a 100%);
  font-size: 24px;
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: #fff;
}

.song-item:hover .play-overlay {
  opacity: 1;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.song-artist {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.play-btn {
  background: linear-gradient(135deg, #1db954 0%, #1aa34a 100%);
  border: none;
  width: 44px;
  height: 44px;
}

.play-btn:hover {
  background: linear-gradient(135deg, #1aa34a 0%, #168d3e 100%);
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
