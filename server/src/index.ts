import express from 'express';
import cors from 'cors';
import path from 'path';
import albumsRouter from './routes/albums';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 直接提供albums目录下的图片
app.use('/static/albums', express.static(path.join(process.cwd(), '..', 'albums')));

// API路由
app.use('/api/albums', albumsRouter);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'rotary-gallery-server'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: 'Rotary Gallery Server',
    version: '1.0.0',
    endpoints: {
      albums: '/api/albums',
      health: '/health',
      static: '/static/albums'
    }
  });
});

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Albums directory: ${path.join(process.cwd(), '..', 'albums')}`);
  console.log(`🔗 API endpoints:`);
  console.log(`   - GET /api/albums - List all albums`);
  console.log(`   - GET /api/albums/:id - Get specific album`);
  console.log(`   - GET /api/albums/:id/images/:name - Get image file`);
  console.log(`   - GET /static/albums/:album/:image - Direct image access`);
});
