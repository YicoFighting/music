<template>
  <router-view />
  <AudioPlayer />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { useSourceStore } from '@/stores/source'

const sourceStore = useSourceStore()

onMounted(() => {
  sourceStore.initialize()
})
</script>

<style>
:root {
  --primary-color: #409eff;
  --primary-light: #66b1ff;
  --primary-dark: #3a8ee6;
  --bg-dark: #0f1419;
  --bg-card: rgba(255, 255, 255, 0.05);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  min-height: 100vh;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg-dark);
  background-image: 
    radial-gradient(ellipse at top left, rgba(64, 158, 255, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(64, 158, 255, 0.1) 0%, transparent 50%);
  background-attachment: fixed;
  min-height: 100vh;
  color: #fff;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Element Plus 主题覆盖 */
.el-button--primary {
  --el-button-bg-color: var(--primary-color);
  --el-button-border-color: var(--primary-color);
  --el-button-hover-bg-color: var(--primary-light);
  --el-button-hover-border-color: var(--primary-light);
  --el-button-active-bg-color: var(--primary-dark);
  --el-button-active-border-color: var(--primary-dark);
}

.el-slider {
  --el-slider-main-bg-color: var(--primary-color);
}

/* 全局深色弹框样式 */
.dark-message-box,
.dark-dialog {
  background: rgba(30, 30, 35, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

.dark-message-box .el-message-box__title,
.dark-message-box .el-message-box__content,
.dark-dialog .el-dialog__title,
.dark-dialog .el-dialog__body {
  color: #fff !important;
}

.dark-dialog .el-dialog__title {
  font-size: 16px !important;
}

.dark-message-box .el-message-box__close,
.dark-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #fff !important;
}

.dark-message-box .el-message-box__btns .el-button {
  border-radius: 8px;
  padding: 8px 20px;
}

.dark-message-box .el-message-box__btns .el-button--primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: #fff;
}

.dark-message-box .el-message-box__btns .el-button--primary:hover {
  background: var(--primary-light);
  border-color: var(--primary-light);
}

.dark-message-box .el-message-box__btns .el-button:not(.el-button--primary) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.dark-message-box .el-message-box__btns .el-button:not(.el-button--primary):hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  color: #fff;
}
</style>
