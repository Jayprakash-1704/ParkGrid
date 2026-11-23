import mongoose from 'mongoose';

let connectionMode = 'disconnected';

export function getDbConnectionMode() {
    return connectionMode;
}

export async function connectDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            throw new Error('MONGODB_URI is missing in environment variables');
        }

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 8000,
        });

        connectionMode = 'external';

        console.log('[DB] Connected to MongoDB successfully');

        return { mode: connectionMode };

    } catch (error) {
        connectionMode = 'disconnected';

        console.error('[DB] MongoDB connection failed:', error.message);

        throw error;
    }
}

export async function disconnectDatabase() {
    await mongoose.disconnect();

    connectionMode = 'disconnected';

    console.log('[DB] MongoDB disconnected');
}