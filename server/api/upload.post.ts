import { getSupabase } from '../utils/supabase';

export default defineEventHandler(async (event) => {
  const supabase = getSupabase();
  const body = await readBody(event);
  let count = 0;

  for (const [sid, content] of Object.entries(body)) {
    const meta = content.Meta || {};
    const now = new Date();
    const t_month = parseInt(meta.TargetMonth) || now.getMonth() + 1;
    const t_year = parseInt(meta.QueryDate?.split('-')[0]) || now.getFullYear();

    // 使用 Supabase 的 upsert (如果發生衝突則更新)
    const { error } = await supabase
      .from('stock_data')
      .upsert({
        stock_id: sid,
        stock_name: meta.StockName || sid,
        data_year: t_year,
        data_month: t_month,
        raw_data: content,
        update_date: new Date().toISOString()
      }, {
        onConflict: 'stock_id, data_year, data_month' // 根據這個聯合約束來判斷是否重複
      });

    if (error) {
      console.error('上傳失敗:', error);
      throw createError({ statusCode: 500, statusMessage: error.message });
    }
    count++;
  }

  return { success: true, message: `成功匯入 ${count} 筆資料！` };
});
