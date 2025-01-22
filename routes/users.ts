import express from 'express';
import { User } from '../models/User';

const router = express.Router();

// Получить профиль пользователя
router.get('/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении профиля' });
  }
});

// Добавить/удалить фильм из избранного
router.post('/favorites', async (req, res) => {
  try {
    const { userId, movieId, action } = req.body;
    const user = await User.findOne({ telegramId: userId });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (action === 'add') {
      if (!user.favorites.includes(movieId)) {
        user.favorites.push(movieId);
      }
    } else if (action === 'remove') {
      user.favorites = user.favorites.filter(id => id !== movieId);
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении избранного' });
  }
});

// Обновить статус премиум подписки
router.post('/premium', async (req, res) => {
  try {
    const { userId, isPremium, expiresAt } = req.body;
    const user = await User.findOneAndUpdate(
      { telegramId: userId },
      { isPremium, premiumExpiresAt: expiresAt },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении статуса премиум' });
  }
});

export const userRoutes = router;
