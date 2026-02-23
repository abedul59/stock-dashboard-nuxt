import mongoose from 'mongoose';
import dns from 'node:dns';

// 強制使用 IPv4 避開 Vercel DNS Bug
dns.setDefaultResultOrder('ipv4first');

// 宣告一個全域變數來暫存連線狀態
let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return; // 如果已經連線，就直接跳過，節省資源
  }

  const config = useRuntimeConfig();
  try {
    const db = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB 連線成功 (Serverless Mode)');
  } catch (error) {
    console.error('❌ MongoDB 連線失敗', error);
    throw error;
  }
};
