<template>
  <div class="home-page">
    <header class="header">
      <div class="header-top">
        <SourceSelector />
      </div>
      <p class="eyebrow">
        <span class="icon">🎵</span>
        听见 · MUSIC EXPERIENCE
      </p>
      <div class="vinyl-wrapper">
        <div class="vinyl"></div>
        <div class="vinyl-core"></div>
        <div class="vinyl-light"></div>
      </div>
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

      <div class="hot-keywords">
        <span class="label">热门搜索：</span>
        <el-tag
          v-for="keyword in hotKeywords"
          :key="keyword"
          class="keyword-tag"
          @click="searchKeyword(keyword)"
        >
          {{ keyword }}
        </el-tag>
      </div>

      <!-- 我的歌单 -->
      <div class="my-playlists" v-if="playlists.length > 0">
        <!-- 超过4个显示轮播 -->
        <div v-if="playlists.length > 4" class="playlist-carousel-container">
          <el-carousel
            :interval="0"
            arrow="always"
            height="240px"
            indicator-position="outside"
          >
            <el-carousel-item
              v-for="(chunk, index) in playlistChunks"
              :key="index"
            >
              <div class="playlist-grid carousel-grid">
                <div
                  v-for="playlist in chunk"
                  :key="playlist.id"
                  class="playlist-card"
                  @click="goToDetail(playlist)"
                >
                  <div class="card-cover">
                    <img
                      v-if="playlist.cover"
                      :src="playlist.cover"
                      class="cover-img"
                    />
                    <div v-else class="cover-placeholder">🎵</div>
                    <!-- 悬停显示的播放按钮 -->
                    <div
                      class="play-btn-overlay"
                      @click.stop="playPlaylist(playlist)"
                    >
                      <el-icon><VideoPlay /></el-icon>
                    </div>
                  </div>
                  <div class="card-info">
                    <div class="card-name">{{ playlist.name }}</div>
                    <div class="card-count">
                      {{ playlist.songs.length }} 首歌曲
                    </div>
                  </div>
                </div>
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>

        <!-- 4个及以下平铺显示 -->
        <div v-else class="playlist-grid">
          <div
            v-for="playlist in playlists"
            :key="playlist.id"
            class="playlist-card"
            @click="goToDetail(playlist)"
          >
            <div class="card-cover">
              <img
                v-if="playlist.cover"
                :src="playlist.cover"
                class="cover-img"
              />
              <div v-else class="cover-placeholder">🎵</div>
              <div
                class="play-btn-overlay"
                @click.stop="playPlaylist(playlist)"
              >
                <el-icon><VideoPlay /></el-icon>
              </div>
            </div>
            <div class="card-info">
              <div class="card-name">{{ playlist.name }}</div>
              <div class="card-count">{{ playlist.songs.length }} 首歌曲</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Search, VideoPlay } from "@element-plus/icons-vue";
import SourceSelector from "@/components/SourceSelector.vue";
import { useSourceStore } from "@/stores/source";
import { useMyPlaylistStore, type Playlist } from "@/stores/myPlaylist";
import { usePlayerStore } from "@/stores/player";

const router = useRouter();
const sourceStore = useSourceStore();
const myPlaylistStore = useMyPlaylistStore();
const playerStore = usePlayerStore();

const searchQuery = ref("");
const loading = ref(false);

const hotKeywords = ["周杰伦", "林俊杰", "陈奕迅", "邓紫棋", "薛之谦"];
const playlists = computed(() => myPlaylistStore.playlists);

// 将歌单按4个一组切分
const playlistChunks = computed(() => {
  const result = [];
  for (let i = 0; i < playlists.value.length; i += 4) {
    result.push(playlists.value.slice(i, i + 4));
  }
  return result;
});

const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning("请输入搜索关键词");
    return;
  }

  if (!sourceStore.currentSourceName) {
    ElMessage.warning("请先选择音源");
    return;
  }

  router.push({
    path: "/result",
    query: { q: searchQuery.value.trim() },
  });
};

const searchKeyword = (keyword: string) => {
  searchQuery.value = keyword;
  handleSearch();
};

const playPlaylist = (playlist: Playlist) => {
  if (playlist.songs.length === 0) {
    ElMessage.info("歌单为空，快去添加歌曲吧");
    return;
  }

  playerStore.setPlaylist(playlist.songs);
  playerStore.playSong(playlist.songs[0]);
};

const goToDetail = (playlist: Playlist) => {
  router.push(`/playlist/${playlist.id}`);
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 56px;
  padding: 56px 32px 120px;
}

.header {
  width: min(960px, 100%);
  position: relative;
  display: grid;
  justify-items: center;
  gap: 28px;
  padding-top: 48px;
  text-align: center;
}

.header-top {
  position: absolute;
  top: 0;
  right: 0;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 18px;
  border-radius: 999px;
  color: rgba(194, 214, 255, 0.92);
  font-size: 16px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.icon {
  font-size: 18px;
  animation: bounce 2.4s ease-in-out infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.vinyl-wrapper {
  position: relative;
  width: clamp(220px, 36vw, 360px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(10, 10, 15, 0.88), rgba(6, 6, 10, 0.6));
  box-shadow: 0 30px 80px -40px rgba(10, 20, 45, 0.9), inset 0 0 0 2px rgba(255, 255, 255, 0.05);
  display: grid;
  place-items: center;
}

.vinyl {
  width: 86%;
  height: 86%;
  border-radius: 50%;
  background: conic-gradient(from 90deg, rgba(54, 89, 226, 0.55), rgba(155, 92, 255, 0.65), rgba(64, 158, 255, 0.7), rgba(54, 89, 226, 0.55));
  box-shadow: inset 0 0 22px rgba(0, 0, 0, 0.6);
  animation: spinVinyl 18s linear infinite;
  display: grid;
  place-items: center;
}

.vinyl-core {
  width: clamp(46px, 8vw, 68px);
  height: clamp(46px, 8vw, 68px);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.92), rgba(160, 180, 255, 0.2));
  box-shadow: 0 0 24px rgba(140, 170, 255, 0.45);
}

.vinyl-light {
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.08);
}

@keyframes spinVinyl {
  to { transform: rotate(360deg); }
}

.main {
  width: min(960px, 100%);
  display: grid;
  gap: 40px;
}

.search-bar {
  display: flex;
  gap: 16px;
  width: min(600px, 100%);
  margin: 0 auto;
  align-items: center;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow: none;
  border-radius: 14px;
  height: 52px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.is-focus .el-input__wrapper) {
  border-color: rgba(120, 170, 255, 0.55);
  box-shadow: 0 0 0 4px rgba(110, 170, 255, 0.18);
}

.search-input :deep(.el-input__inner) {
  color: #ffffff;
  font-size: 16px;
}

.search-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.56);
}

.search-btn {
  background: linear-gradient(135deg, #4c9dff 0%, #7a71ff 100%);
  border: none;
  border-radius: 14px;
  padding: 0 36px;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
}

.search-btn:hover {
  background: linear-gradient(135deg, #66b6ff 0%, #8a7dff 100%);
}

.hot-keywords {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
  margin-bottom: 48px;
}

.label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.keyword-tag {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
}

.keyword-tag:hover {
  background: linear-gradient(135deg, rgba(120, 160, 255, 0.36), rgba(120, 200, 255, 0.22));
  color: #fff;
}

/* 我的歌单区域 */
.my-playlists {
  width: 100%;
  margin-bottom: 40px;
}

.section-title {
  font-size: 20px;
  color: #fff;
  margin-bottom: 24px;
  font-weight: 600;
  text-align: center;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 固定4列 */
  gap: 24px;
  padding: 0 4px; /* 防止阴影被切 */
}

.carousel-grid {
  height: 100%;
  padding: 0 80px;
}

.playlist-carousel-container {
  margin: 0 -80px;
}

.playlist-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.playlist-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
}

.playlist-card:hover .play-btn-overlay {
  opacity: 1;
  transform: scale(1);
}

.card-cover {
  width: 100%;
  aspect-ratio: 1;
  position: relative;
  overflow: hidden;
}

.cover-img {
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
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--primary-light) 100%
  );
  font-size: 40px;
}

/* 右下角播放按钮悬停 */
.play-btn-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.play-btn-overlay:hover {
  background: var(--primary-light);
  transform: scale(1.1) !important;
}

.play-btn-overlay .el-icon {
  font-size: 20px;
  color: #fff;
}

.card-info {
  padding: 12px;
}

.card-name {
  font-size: 14px;
  color: #fff;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.card-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* 轮播样式调整 */
:deep(.el-carousel__indicators--outside) {
  margin-top: 10px;
}

:deep(.el-carousel__indicator--horizontal .el-carousel__button) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

:deep(.el-carousel__indicator.is-active .el-carousel__button) {
  background: var(--primary-color);
}
</style>
