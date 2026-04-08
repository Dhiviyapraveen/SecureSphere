import mongoose from 'mongoose';
import config from './env.js';
import File from '../models/File.js';

const ensureFileIndexes = async () => {
  const indexes = await File.collection.indexes();
  const hashIndex = indexes.find((index) => index.name === 'hash_1');

  if (hashIndex?.unique) {
    await File.collection.dropIndex('hash_1');
    await File.collection.createIndex({ hash: 1 }, { background: true });
    console.log('✓ Updated file hash index to allow duplicate medical file contents');
  }
};

export const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    await ensureFileIndexes();
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
