import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/api/register', upload.single('image'), (req, res) => {
  console.log('Mock /api/register called');
  res.json({ uuid: uuidv4() });
});

app.post('/api/oracle', upload.single('image'), (req, res) => {
  console.log('Mock /api/oracle called');
  console.log('Body:', req.body);
  setTimeout(() => {
    res.json({
      message: 'これはモックサーバーからの神託です。あなたの部屋は…まあ、もう少し綺麗にできるでしょう。',
      point: 75,
    });
  }, 2000); // 2秒の遅延をシミュレート
});

app.listen(port, () => {
  console.log(`Mock server listening at http://localhost:${port}`);
});
