import StockData from '../models/StockData';
import { connectDB } from '../utils/db';

export default defineEventHandler(async (event) => {
  // 1. 確保資料庫有連線才繼續往下走
  await connectDB();

  const { id, year, month } = getQuery(event);
  
  let query = id ? { stock_id: id } : {};
  if (year && month && id) {
    query = { stock_id: id, data_year: Number(year), data_month: Number(month) };
  }

  const data = await StockData.findOne(query).sort({ data_year: -1, data_month: -1 });
  
  const list = await StockData.aggregate([
    { $group: { _id: "$stock_id", name: { $first: "$stock_name" } } },
    { $sort: { _id: 1 } }
  ]);

  return { 
    currentData: data, 
    availableStocks: list.map(s => ({ id: s._id, name: s.name })) 
  };
});
