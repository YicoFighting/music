import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { PluginInfo, MusicPlugin } from '../types';

// 远程插件列表 URL
const PLUGINS_JSON_URL = 'https://fastly.jsdelivr.net/gh/Huibq/keep-alive/Music_Free/myPlugins.json';

// 插件存储目录
const PLUGINS_DIR = path.join(__dirname, '../../plugins');

// 更新间隔（1小时）
const UPDATE_INTERVAL = 60 * 60 * 1000;

interface PluginCache {
  plugin: MusicPlugin;
  info: PluginInfo;
}

class PluginManager {
  private plugins: Map<string, PluginCache> = new Map();
  private updateTimer: NodeJS.Timeout | null = null;
  private initialized: boolean = false;

  /**
   * 初始化插件管理器
   * 下载并加载所有插件
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 确保插件目录存在
    if (!fs.existsSync(PLUGINS_DIR)) {
      fs.mkdirSync(PLUGINS_DIR, { recursive: true });
    }

    // 获取并加载插件
    await this.updatePlugins();

    // 启动定时更新
    this.startAutoUpdate();

    this.initialized = true;
    console.log(`🎵 PluginManager initialized with ${this.plugins.size} plugins`);
  }

  /**
   * 从远程获取插件列表并更新本地缓存
   */
  async updatePlugins(): Promise<void> {
    try {
      console.log('🔄 Fetching plugin list from remote...');
      
      const response = await axios.get<{ plugins: PluginInfo[] }>(PLUGINS_JSON_URL, {
        timeout: 30000,
      });

      const pluginList = response.data.plugins;
      console.log(`📦 Found ${pluginList.length} plugins`);

      // 下载并加载每个插件
      for (const pluginInfo of pluginList) {
        try {
          await this.downloadAndLoadPlugin(pluginInfo);
        } catch (error) {
          console.error(`❌ Failed to load plugin ${pluginInfo.name}:`, error);
        }
      }

      console.log(`✅ Loaded ${this.plugins.size} plugins successfully`);
    } catch (error) {
      console.error('❌ Failed to fetch plugin list:', error);
      // 如果远程获取失败，尝试加载本地缓存的插件
      await this.loadLocalPlugins();
    }
  }

  /**
   * 下载并加载单个插件
   */
  private async downloadAndLoadPlugin(pluginInfo: PluginInfo): Promise<void> {
    const fileName = this.getPluginFileName(pluginInfo);
    const filePath = path.join(PLUGINS_DIR, fileName);

    // 检查是否需要更新
    const existingCache = this.plugins.get(pluginInfo.name);
    if (existingCache && existingCache.info.version === pluginInfo.version && fs.existsSync(filePath)) {
      console.log(`⏭️ Plugin ${pluginInfo.name} is up to date`);
      return;
    }

    // 下载插件文件
    console.log(`⬇️ Downloading plugin: ${pluginInfo.name}`);
    const response = await axios.get(pluginInfo.url, {
      timeout: 30000,
      responseType: 'text',
    });

    // 保存到本地
    fs.writeFileSync(filePath, response.data, 'utf-8');

    // 加载插件
    await this.loadPlugin(pluginInfo, filePath);
  }

  /**
   * 加载单个插件模块
   */
  private async loadPlugin(pluginInfo: PluginInfo, filePath: string): Promise<void> {
    // 清除 require 缓存以支持热更新
    delete require.cache[require.resolve(filePath)];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const plugin: MusicPlugin = require(filePath);

    this.plugins.set(pluginInfo.name, {
      plugin,
      info: pluginInfo,
    });

    console.log(`✅ Loaded plugin: ${pluginInfo.name} v${pluginInfo.version}`);
  }

  /**
   * 加载本地缓存的插件
   */
  private async loadLocalPlugins(): Promise<void> {
    if (!fs.existsSync(PLUGINS_DIR)) {
      return;
    }

    const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      try {
        const filePath = path.join(PLUGINS_DIR, file);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const plugin: MusicPlugin = require(filePath);
        
        const pluginInfo: PluginInfo = {
          name: plugin.platform || file.replace('.js', ''),
          url: plugin.srcUrl || '',
          version: plugin.version || '0.0.0',
        };

        this.plugins.set(pluginInfo.name, {
          plugin,
          info: pluginInfo,
        });

        console.log(`✅ Loaded local plugin: ${pluginInfo.name}`);
      } catch (error) {
        console.error(`❌ Failed to load local plugin ${file}:`, error);
      }
    }
  }

  /**
   * 获取插件文件名
   */
  private getPluginFileName(pluginInfo: PluginInfo): string {
    // 从 URL 提取文件名，或使用插件名称
    const urlFileName = pluginInfo.url.split('/').pop();
    return urlFileName || `${pluginInfo.name}.js`;
  }

  /**
   * 启动自动更新定时器
   */
  startAutoUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      console.log('🔄 Running scheduled plugin update...');
      await this.updatePlugins();
    }, UPDATE_INTERVAL);

    console.log(`⏰ Auto-update scheduled every ${UPDATE_INTERVAL / 1000 / 60} minutes`);
  }

  /**
   * 停止自动更新
   */
  stopAutoUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * 获取所有插件列表
   */
  getPluginList(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(cache => cache.info);
  }

  /**
   * 根据名称获取插件
   */
  getPlugin(name: string): MusicPlugin | null {
    
    
    const cache = this.plugins.get(name);
    console.log('this.plugins',this.plugins,cache);
    return cache?.plugin || null;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// 导出单例实例
export const pluginManager = new PluginManager();
export default pluginManager;
