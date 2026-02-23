import { getSupabase } from '../utils/supabase';

export default defineEventHandler(async (event) => {
  const supabase = getSupabase();
  const { id, year, month } = getQuery(event);
  
  // 1. 查詢單筆股票資料
  let query = supabase.from('stock_data').select('*');
  if (id) query = query.eq('stock_id', id);
  if (year && month && id) {
    query = query.eq('data_year', Number(year)).eq('data_month', Number(month));
  }

  // 排序並只抓取最新的一筆
  const { data: currentData } = await query
    .order('data_year', { ascending: false })
    .order('data_month', { ascending: false })
    .limit(1)
    .single();

  // 2. 獲取資料庫中所有不重複的股票代碼與名稱 (供下拉選單使用)
  const { data: listData } = await supabase.from('stock_data').select('stock_id, stock_name');
  
  // 在 Node.js 記憶體中做去重 (取代 MongoDB 的 aggregate group)
  const uniqueStocks = [];
  const map = new Map();
  if (listData) {
    for (const item of listData) {
      if (!map.has(item.stock_id)) {
        map.set(item.stock_id, true);
        uniqueStocks.push({ id: item.stock_id, name: item.stock_name });
      }
    }
  }

  // 將代碼按數字大小排序
  uniqueStocks.sort((a, b) => a.id.localeCompare(b.id));

  return { 
    currentData: currentData || null, 
    availableStocks: uniqueStocks 
  };
});
