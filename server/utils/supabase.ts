import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客戶端
// 這裡沒有複雜的連線超時機制，因為它是走標準 HTTPS 請求，非常適合 Vercel Serverless！
let supabaseInstance: any = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    const config = useRuntimeConfig();
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey);
  }
  return supabaseInstance;
};
