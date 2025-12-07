<template>
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

const emit = defineEmits<{
  search: [query: string]
}>()

const props = defineProps<{
  loading?: boolean
}>()

const searchQuery = ref('')

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    emit('search', searchQuery.value.trim())
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
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
  background: linear-gradient(135deg, #1db954 0%, #1aa34a 100%);
  border: none;
  border-radius: 12px;
  padding: 0 24px;
}

.search-btn:hover {
  background: linear-gradient(135deg, #1aa34a 0%, #168d3e 100%);
}
</style>
