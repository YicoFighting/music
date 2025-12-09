import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 标准化响应格式
export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  artwork?: string
  duration?: number
  url?: string
  source?: string
  [key: string]: unknown
}

export interface SearchData {
  list: Song[]
  page: number
  hasMore: boolean
}

export interface MediaSource {
  url: string
  headers?: Record<string, string>
}

export interface SourceInfo {
  name: string
  url: string
  version: string
}

// 获取音源列表
export const getSources = async (): Promise<ApiResponse<SourceInfo[]>> => {
  const response = await api.get<ApiResponse<SourceInfo[]>>('/sources')
  return response.data
}

// 搜索歌曲
export const searchSongs = async (query: string, source: string, page = 1): Promise<ApiResponse<SearchData>> => {
  const response = await api.post<ApiResponse<SearchData>>('/search', { query, page, source })
  return response.data
}

// 获取播放源
export const getPlayUrl = async (song: Song, source: string): Promise<ApiResponse<MediaSource>> => {
  const response = await api.post<ApiResponse<MediaSource>>('/play', { ...song, source })
  return response.data
}

// 获取歌词
export const getLyrics = async (song: Song, source: string): Promise<ApiResponse<{ rawLrc?: string }>> => {
  const response = await api.post<ApiResponse<{ rawLrc?: string }>>('/lyric', { ...song, source })
  return response.data
}

export default api
