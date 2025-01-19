import express from 'express';
import { telegramPaymentService } from '../services/telegram-payments';

const router = express.Router();

// Создать инвойс для оплаты
router.post('/create-invoice', async (req, res) => {
  try {
    const { userId } = req.body;
    const invoice = await telegramPaymentService.createInvoice(userId);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании платежа' });
  }
});

// Подтверждение успешной оплаты
router.post('/confirm', async (req, res) => {
  try {
    const { userId } = req.body;
    await telegramPaymentService.processSuccessfulPayment(userId);
    res.json({ message: 'Платеж успешно обработан' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обработке платежа' });
  }
});

export const paymentRoutes = router;
