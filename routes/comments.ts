import express from 'express';
import { Comment } from '../models/Comment';

const router = express.Router();

// Получить комментарии для фильма
router.get('/:movieId', async (req, res) => {
  try {
    const comments = await Comment.find({ movieId: req.params.movieId })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении комментариев' });
  }
});

// Добавить новый комментарий
router.post('/', async (req, res) => {
  try {
    const comment = new Comment({
      movieId: req.body.movieId,
      userId: req.body.userId,
      text: req.body.text,
      rating: req.body.rating,
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании комментария' });
  }
});

// Удалить комментарий
router.delete('/:commentId', async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.commentId);
    res.status(200).json({ message: 'Комментарий удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении комментария' });
  }
});

export const commentRoutes = router;
