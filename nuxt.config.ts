export default defineNuxtConfig({
  css: ['bootstrap/dist/css/bootstrap.min.css'],
  runtimeConfig: {
    // 新增這兩行
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
  },
  nitro: {
    preset: 'vercel'
  }
})
