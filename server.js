import express from 'express';
import apiRoutes from './routes/api.js';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 4000; // 更改為 4000 或其他可用端口

// 使用 CORS 中間件
app.use(cors());

app.get('/', (_req, res) => {
  res.send('Hello from Express!');
});

// API 路由
app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
