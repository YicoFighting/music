import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useSourceStore } from '@/stores/source'
import type { Song } from '@/api/music'

export interface Playlist {
  id: string
  name: string
  songs: Song[]
  createdAt: number
  cover?: string
}

const STORAGE_KEY = 'my_playlists'

export const useMyPlaylistStore = defineStore('myPlaylist', () => {
  const playlists = ref<Playlist[]>([])
  const sourceStore = useSourceStore()

  // 初始化：从 localStorage 读取
  const init = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        playlists.value = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse playlists:', e)
        playlists.value = []
      }
    }
  }

  // 保存到 localStorage
  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists.value))
  }

  // 监听变化自动保存
  watch(playlists, () => {
    save()
  }, { deep: true })

  // 创建新歌单
  const createPlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      songs: [],
      createdAt: Date.now()
    }
    playlists.value.unshift(newPlaylist)
    return newPlaylist
  }

  // 删除歌单
  const deletePlaylist = (id: string) => {
    const index = playlists.value.findIndex(p => p.id === id)
    if (index !== -1) {
      playlists.value.splice(index, 1)
    }
  }

  // 重命名歌单
  const renamePlaylist = (id: string, newName: string) => {
    const playlist = playlists.value.find(p => p.id === id)
    if (playlist) {
      playlist.name = newName
    }
  }

  // 添加歌曲到歌单
  const addSongToPlaylist = (playlistId: string, song: Song) => {
    const playlist = playlists.value.find(p => p.id === playlistId)
    if (playlist) {
      // 检查是否已存在
      if (!playlist.songs.some(s => s.id === song.id)) {
        const sourceName = song.source as string | undefined ?? sourceStore.currentSourceName
        const songWithSource: Song = sourceName ? { ...song, source: sourceName } : { ...song } 
        console.log('添加歌曲', songWithSource);       
        playlist.songs.unshift(songWithSource)
        // 更新封面 (因为添加在最前面，所以封面总是最新的歌曲封面)
        playlist.cover = songWithSource.artwork
        return true
      }
    }
    return false
  }

  // 从歌单删除歌曲
  const removeSongFromPlaylist = (playlistId: string, songId: string | number) => {
    const playlist = playlists.value.find(p => p.id === playlistId)
    if (playlist) {
      const index = playlist.songs.findIndex(s => s.id === songId)
      if (index !== -1) {
        playlist.songs.splice(index, 1)
        // 更新封面
        if (playlist.songs.length > 0) {
          playlist.cover = playlist.songs[0].artwork
        } else {
          playlist.cover = undefined
        }
      }
    }
  }

  // 初始化
  init()

  return {
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist
  }
})
