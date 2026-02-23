import StockData from '../models/StockData';
import { connectDB } from '../utils/db';

export default defineEventHandler(async (event) => {
  // 1. 確保資料庫有連線才繼續往下走
  await connectDB(); 

  const body = await readBody(event);
  let count = 0;

  for (const [sid, content] of Object.entries(body)) {
    const meta = content.Meta || {};
    const now = new Date();
    const t_month = parseInt(meta.TargetMonth) || now.getMonth() + 1;
    const t_year = parseInt(meta.QueryDate?.split('-')[0]) || now.getFullYear();

    await StockData.findOneAndUpdate(
      { stock_id: sid, data_year: t_year, data_month: t_month },
      { stock_name: meta.StockName || sid, raw_data: content },
      { 
        upsert: true, 
        returnDocument: 'after' // <--- 解決第一個 Warning 警告
      }
    );
    count++;
  }
  return { success: true, message: `成功匯入 ${count} 筆資料！` };
});
