import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSources, type SourceInfo } from '@/api/music'

const STORAGE_KEY = 'music_source'

export const useSourceStore = defineStore('source', () => {
  // 状态
  const sources = ref<SourceInfo[]>([])
  const currentSourceName = ref<string>('')
  const loading = ref(false)
  const initialized = ref(false)

  // 计算属性：当前音源对象
  const currentSource = computed(() => {
    return sources.value.find(s => s.name === currentSourceName.value) || null
  })

  // 初始化：加载音源列表
  const initialize = async () => {
    if (initialized.value) return

    try {
      loading.value = true
      const result = await getSources()
      sources.value = result.data

      // 从 localStorage 读取保存的音源
      const savedSource = localStorage.getItem(STORAGE_KEY)
      
      if (savedSource && sources.value.some(s => s.name === savedSource)) {
        // 如果保存的音源存在，使用它
        currentSourceName.value = savedSource
      } else if (sources.value.length > 0) {
        // 否则使用第一个音源
        currentSourceName.value = sources.value[0].name
        localStorage.setItem(STORAGE_KEY, currentSourceName.value)
      }

      initialized.value = true
    } catch (error) {
      console.error('Failed to load sources:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 切换音源
  const setSource = (name: string) => {
    if (!sources.value.some(s => s.name === name)) {
      console.error(`Source "${name}" not found`)
      return false
    }

    currentSourceName.value = name
    localStorage.setItem(STORAGE_KEY, name)
    return true
  }

  // 刷新音源列表
  const refresh = async () => {
    initialized.value = false
    await initialize()
  }

  return {
    // 状态
    sources,
    currentSourceName,
    loading,
    initialized,
    // 计算属性
    currentSource,
    // 方法
    initialize,
    setSource,
    refresh,
  }
})
