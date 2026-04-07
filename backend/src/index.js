require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./config/logger');
const { startCronJobs } = require('./jobs/cron');

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await connectDB();
    await connectRedis();
    startCronJobs();

    app.listen(PORT, () => {
      logger.info(`VoltStore API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

bootstrap();
