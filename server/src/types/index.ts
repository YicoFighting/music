// 歌曲基本信息
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
  url?: string;
  [key: string]: unknown;
}

// 搜索请求
export interface SearchRequest {
  query: string;
  page?: number;
  type?: string;
  source: string; // 音源名称
}

// 搜索结果
export interface SearchResult {
  data: Song[];
  page?: number;
  hasMore?: boolean;
  isEnd?: boolean;
}

// 播放请求
export interface PlayRequest extends Song {
  quality?: 'low' | 'standard' | 'high' | 'super';
  source: string; // 音源名称
}

// 歌词请求
export interface LyricRequest extends Song {
  source: string; // 音源名称
}

// 播放源响应
export interface MediaSource {
  url: string;
  headers?: Record<string, string>;
}

// 插件信息（从远程 JSON 获取）
export interface PluginInfo {
  name: string;
  url: string;
  version: string;
}

// 音乐插件接口（加载后的模块）
export interface MusicPlugin {
  platform: string;
  version: string;
  author?: string;
  srcUrl?: string;
  supportedSearchType?: string[];
  search: (query: string, page: number, type: string) => Promise<SearchResult>;
  getMediaSource: (song: Song, quality: string) => Promise<MediaSource>;
  getLyric?: (song: Song) => Promise<{ rawLrc?: string; lrc?: string }>;
  getMusicInfo?: (song: Song) => Promise<{ artwork?: string; [key: string]: unknown }>;
  getAlbumInfo?: (albumItem: unknown) => Promise<{ musicList: Song[] }>;
  getArtistWorks?: (artistItem: unknown, page: number, type: string) => Promise<{ isEnd: boolean; data: Song[] }>;
}

// 音乐模块接口（兼容旧代码）
export interface MusicModule extends MusicPlugin {}
