import http from 'node:http';
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
    await connectDB();

    const server = http.createServer(app);

    server.listen(env.PORT, () => {
        logger.info(`API listening on http://localhost:${env.PORT}/api/v1`);
    });

    const shutdown = async (signal: string): Promise<void> => {
        logger.info({ signal }, 'Shutting down gracefully…');
        server.close(async (err) => {
            if (err) logger.error({ err }, 'Error while closing HTTP server');
            try {
                await disconnectDB();
            } catch (e) {
                logger.error({ err: e }, 'Error while closing MongoDB');
            } finally {
                process.exit(err ? 1 : 0);
            }
        });

        // Hard stop if something hangs.
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 15_000).unref();
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
        logger.error({ reason }, 'Unhandled promise rejection');
    });
    process.on('uncaughtException', (err) => {
        logger.fatal({ err }, 'Uncaught exception');
        process.exit(1);
    });
}

main().catch((err) => {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
});