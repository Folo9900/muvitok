import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { commentRoutes } from './routes/comments';
import { userRoutes } from './routes/users';
import { paymentRoutes } from './routes/payments';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB подключение
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Роуты
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Обработка ошибок
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Что-то пошло не так!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
