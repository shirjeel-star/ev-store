const cron = require('node-cron');
const { prisma } = require('../config/database');
const { sendAbandonedCartEmail } = require('../services/emailService');
const logger = require('../config/logger');

function startCronJobs() {
  // Abandoned cart recovery — runs every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running abandoned cart job...');
    try {
      const oneHourAgo   = new Date(Date.now() - 60 * 60 * 1000);
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

      // Find carts updated 1-3 hours ago with items and no recovery email sent
      const abandonedCarts = await prisma.cart.findMany({
        where: {
          recoveryEmailSentAt: null,
          updatedAt: { lte: oneHourAgo, gte: threeHoursAgo },
          items: { some: {} },
          userId: { not: null },
        },
        include: {
          items: { include: { product: true } },
          user: true,
        },
        take: 50,
      });

      for (const cart of abandonedCarts) {
        if (!cart.user?.email) continue;

        const recoveryLink = `${process.env.FRONTEND_URL}/cart?session=${cart.id}`;
        try {
          await sendAbandonedCartEmail(cart.user.email, cart, recoveryLink);
          await prisma.cart.update({
            where: { id: cart.id },
            data: { abandonedAt: new Date(), recoveryEmailSentAt: new Date() },
          });
          logger.info(`Abandoned cart email sent to ${cart.user.email}`);
        } catch (e) {
          logger.error(`Failed to send abandoned cart email to ${cart.user.email}`, e);
        }
      }
    } catch (err) {
      logger.error('Abandoned cart job failed', err);
    }
  });

  // Cleanup expired refresh tokens — runs daily at 2am
  cron.schedule('0 2 * * *', async () => {
    logger.info('Cleaning up expired refresh tokens...');
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      logger.info(`Deleted ${result.count} expired refresh tokens`);
    } catch (err) {
      logger.error('Refresh token cleanup failed', err);
    }
  });

  logger.info('Cron jobs started');
}

module.exports = { startCronJobs };
