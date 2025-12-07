import { Router, Request, Response } from 'express';
import { SearchRequest, PlayRequest, LyricRequest, Song } from '../types';
import pluginManager from '../services/PluginManager';

const router: Router = Router();

// 标准化响应格式
interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

// 成功响应
function success<T>(res: Response, data: T, msg: string = 'success'): void {
  res.json({ code: 0, msg, data } as ApiResponse<T>);
}

// 错误响应
function error(res: Response, code: number, msg: string, statusCode: number = 200): void {
  res.status(statusCode).json({ code, msg, data: null } as ApiResponse<null>);
}

// 获取所有音源列表
router.get('/sources', async (_req: Request, res: Response) => {
  try {
    const sources = pluginManager.getPluginList();
    success(res,  sources );
  } catch (err) {
    console.error('Get sources error:', err);
    error(res, 500, 'Failed to get sources', 500);
  }
});

// 搜索歌曲
router.post('/search', async (req: Request<unknown, unknown, SearchRequest>, res: Response) => {
  const { query, page = 1, type = 'music', source } = req.body;
  
  if (!query) {
    error(res, 400, 'Query is required', 400);
    return;
  }

  if (!source) {
    error(res, 400, 'Source is required', 400);
    return;
  }

  const musicModule = pluginManager.getPlugin(source);
  
  if (!musicModule) {
    error(res, 404, `Source "${source}" not found`, 404);
    return;
  }

  try {
    const result = await musicModule.search(query, page, type);
    
    // 防御性检查：确保结果有效
    if (!result || !result.data || !Array.isArray(result.data)) {
      success(res, { list: [], page, hasMore: false });
      return;
    }
    
    // 如果没有封面图，尝试获取
    if (result.data.length > 0 && !result.data[0].artwork && musicModule.getMusicInfo) {
      const dataWithArtwork = await Promise.all(
        result.data.map(async (item: Song) => {
          try {
            const info = await musicModule.getMusicInfo!(item);
            return {
              ...item,
              artwork: info.artwork,
            };
          } catch {
            return item;
          }
        })
      );
      success(res, { list: dataWithArtwork, page, hasMore: !result.isEnd });
    } else {
      success(res, { list: result.data, page, hasMore: !result.isEnd });
    }
  } catch (err) {
    console.error('Search error:', err);
    error(res, 500, 'Search failed', 500);
  }
});

// 获取播放源
router.post('/play', async (req: Request<unknown, unknown, PlayRequest>, res: Response) => {
  const song = req.body;
  const quality = song.quality || 'high';
  const { source } = song;
  
  if (!song.id) {
    error(res, 400, 'Song data is required', 400);
    return;
  }

  if (!source) {
    error(res, 400, 'Source is required', 400);
    return;
  }

  const musicModule = pluginManager.getPlugin(source);
  
  if (!musicModule) {
    error(res, 404, `Source "${source}" not found`, 404);
    return;
  }

  try {
    console.log('Getting media source for:', song.title, 'quality:', quality, 'source:', source);
    
    const mediaSource = await musicModule.getMediaSource(song, quality);
    console.log('Media source result:', mediaSource);
    
    if (!mediaSource || !mediaSource.url) {
      error(res, 500, 'No valid media URL returned from source', 500);
      return;
    }
    
    success(res, { url: mediaSource.url, headers: mediaSource.headers });
  } catch (err) {
    console.error('Get media source error:', err);
    error(res, 500, 'Failed to get media source', 500);
  }
});

// 获取歌词
router.post('/lyric', async (req: Request<unknown, unknown, LyricRequest>, res: Response) => {
  const song = req.body;
  const { source } = song;
  
  if (!song.id) {
    error(res, 400, 'Song data is required', 400);
    return;
  }

  if (!source) {
    error(res, 400, 'Source is required', 400);
    return;
  }

  const musicModule = pluginManager.getPlugin(source);
  
  if (!musicModule) {
    error(res, 404, `Source "${source}" not found`, 404);
    return;
  }

  if (!musicModule.getLyric) {
    error(res, 503, `Lyric feature not available for source "${source}"`, 503);
    return;
  }

  try {
    const lyricResult = await musicModule.getLyric(song);
    success(res, { rawLrc: lyricResult.rawLrc || lyricResult.lrc });
  } catch (err) {
    console.error('Get lyric error:', err);
    error(res, 500, 'Failed to get lyric', 500);
  }
});

export default router;
