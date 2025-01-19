import { Telegram } from 'telegraf';
import { User } from '../models/User';

class TelegramPaymentService {
  private telegram: Telegram;
  private provider_token: string;

  constructor() {
    this.telegram = new Telegram(process.env.BOT_TOKEN as string);
    this.provider_token = process.env.PROVIDER_TOKEN as string;
  }

  async createInvoice(userId: string, productName: string = 'Премиум подписка') {
    const prices = [{
      label: 'Премиум на 1 месяц',
      amount: 29900 // в копейках (299 рублей)
    }];

    try {
      const invoice = {
        chat_id: userId,
        provider_token: this.provider_token,
        start_parameter: 'premium_subscription',
        title: productName,
        description: 'Доступ к премиум функциям: отключение рекламы, улучшенные рекомендации и эксклюзивный контент',
        currency: 'RUB',
        prices: prices,
        payload: JSON.stringify({
          userId,
          productType: 'premium_subscription'
        })
      };

      return await this.telegram.sendInvoice(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async processSuccessfulPayment(userId: string) {
    try {
      // Обновляем статус пользователя в базе данных
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);

      await User.findOneAndUpdate(
        { telegramId: userId },
        {
          isPremium: true,
          premiumExpiresAt: expirationDate
        }
      );

      // Отправляем подтверждение пользователю
      await this.telegram.sendMessage(userId, 
        'Спасибо за покупку! Ваша премиум подписка активирована. ' +
        'Наслаждайтесь просмотром без рекламы и дополнительными возможностями!'
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
}

export const telegramPaymentService = new TelegramPaymentService();
