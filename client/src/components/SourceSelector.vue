<template>
  <div class="source-selector">
    <el-dropdown trigger="click" @command="handleSwitch">
      <div class="selector-trigger">
        <el-icon><Headset /></el-icon>
        <span class="current-source">{{ sourceStore.currentSourceName || '加载中...' }}</span>
        <el-icon class="arrow"><ArrowDown /></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item 
            v-for="source in sourceStore.sources" 
            :key="source.name"
            :command="source.name"
            :class="{ active: source.name === sourceStore.currentSourceName }"
          >
            <div class="source-item">
              <span class="source-name">{{ source.name }}</span>
              <span class="source-version">v{{ source.version }}</span>
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Headset, ArrowDown } from '@element-plus/icons-vue'
import { useSourceStore } from '@/stores/source'

const sourceStore = useSourceStore()

onMounted(async () => {
  try {
    await sourceStore.initialize()
  } catch (error) {
    console.error('Failed to initialize sources:', error)
    ElMessage.error('加载音源列表失败')
  }
})

const handleSwitch = (name: string) => {
  if (name === sourceStore.currentSourceName) return

  const success = sourceStore.setSource(name)
  if (success) {
    ElMessage.success(`已切换到 ${name}`)
  } else {
    ElMessage.error('切换音源失败')
  }
}
</script>

<style scoped>
.source-selector {
  display: inline-flex;
}

.selector-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
  font-size: 14px;
}

.selector-trigger:hover {
  background: rgba(255, 255, 255, 0.2);
}

.current-source {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  font-size: 12px;
  transition: transform 0.3s;
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 150px;
}

.source-name {
  font-weight: 500;
}

.source-version {
  font-size: 12px;
  color: #909399;
}

:deep(.el-dropdown-menu__item.active) {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

:deep(.el-dropdown-menu__item.active .source-version) {
  color: #409eff;
}
</style>
