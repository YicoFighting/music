import express from 'express';
import cors from 'cors';
import musicRoutes from './routes/music';
import pluginManager from './services/PluginManager';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api', musicRoutes);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    pluginsLoaded: pluginManager.isInitialized(),
    pluginsCount: pluginManager.getPluginList().length,
  });
});

// 初始化插件并启动服务器
async function startServer() {
  try {
    console.log('🚀 Starting Music Server...');
    
    // 初始化插件管理器
    await pluginManager.initialize();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🎵 Music server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
