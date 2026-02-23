<template>
  <div class="bg-light min-vh-100">
    <nav class="navbar navbar-dark bg-dark mb-4">
      <div class="container">
        <a class="navbar-brand" href="/">📈 台股全方位分析系統 (Nuxt + Vercel版)</a>
      </div>
    </nav>

    <div class="container">
      <div class="row mb-4 g-3">
        <div class="col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-title text-primary fw-bold">🔍 查詢股票</h6>
              <div class="row g-2 align-items-center">
                <div class="col-4">
                  <input v-model="searchQuery.id" type="text" class="form-control form-control-sm" placeholder="代碼">
                </div>
                <div class="col-3">
                  <input v-model="searchQuery.year" type="number" class="form-control form-control-sm" placeholder="年 (選填)">
                </div>
                <div class="col-3">
                  <input v-model="searchQuery.month" type="number" class="form-control form-control-sm" placeholder="月 (選填)">
                </div>
                <div class="col-2">
                  <button @click="fetchStockData" class="btn btn-primary btn-sm w-100">Go</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-title text-success fw-bold">📂 上傳數據 (JSON)</h6>
              <div class="row g-2 align-items-center">
                <div class="col-9">
                  <input type="file" @change="onFileSelected" class="form-control form-control-sm" accept=".json">
                </div>
                <div class="col-3">
                  <button @click="uploadFile" class="btn btn-success btn-sm w-100">上傳</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="stockData" class="card shadow-sm mb-5 animate__animated animate__fadeIn">
        <div class="card-header bg-white py-3">
          <h4 class="mb-0 fw-bold">
            <span class="badge bg-primary me-2">{{ stockData.stock_id }}</span>
            {{ stockData.stock_name }}
          </h4>
          <small class="text-muted mt-2 d-block">資料年月: {{ stockData.data_year }} / {{ stockData.data_month }}</small>
        </div>
        
        <div class="card-body p-4">
          <div class="row g-4">
            <div class="col-lg-5">
               <h5 class="fw-bold text-secondary border-bottom pb-2">📊 原始預估 (JSON)</h5>
               <ul class="list-group list-group-flush mb-3">
                 <li class="list-group-item d-flex justify-content-between px-0">
                   <span>預估 EPS</span><strong>{{ perData.Predict_EPS }}</strong>
                 </li>
                 <li class="list-group-item d-flex justify-content-between px-0">
                   <span>預估營收</span><strong>{{ perData.Predict_Rev }} 億</strong>
                 </li>
                 <li class="list-group-item d-flex justify-content-between px-0">
                   <span>原始營收年增率</span><strong>{{ perData.YoY_Use }}</strong>
                 </li>
                 <li class="list-group-item d-flex justify-content-between px-0">
                   <span>平均淨利率</span><strong>{{ perData.Net_Avg }}</strong>
                 </li>
                 <li class="list-group-item d-flex justify-content-between px-0">
                   <span>股本</span><strong>{{ perData.Capital }} 億</strong>
                 </li>
               </ul>
            </div>

            <div class="col-lg-7">
               <div class="p-3 border rounded bg-light border-primary shadow-sm">
                 <h5 class="fw-bold text-primary mb-3">✏️ 手動調整參數 (即時連動試算)</h5>
                 <div class="row g-3 mb-3">
                    <div class="col-6">
                      <label class="form-label small fw-bold">營收年增率 (%)</label>
                      <input v-model="simInputs.yoy" type="number" step="any" class="form-control">
                    </div>
                    <div class="col-6">
                      <label class="form-label small fw-bold">稅後淨利率 (%)</label>
                      <input v-model="simInputs.net" type="number" step="any" class="form-control">
                    </div>
                 </div>
                 
                 <div class="alert alert-info mt-3 mb-0">
                   <div class="d-flex justify-content-between align-items-center mb-2">
                     <span class="fw-bold text-dark">即時股價 (爬蟲)</span>
                     <span class="h5 mb-0 text-dark">{{ livePrice !== null ? livePrice : '抓取中/失敗' }}</span>
                   </div>
                   <hr class="my-2">
                   <div class="d-flex justify-content-between align-items-center">
                     <span class="fw-bold text-primary">模擬計算 EPS</span>
                     <span class="h3 mb-0 fw-bold text-primary">{{ simulatedEPS }} 元</span>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// === 狀態管理 ===
const searchQuery = ref({ id: '', year: '', month: '' }) // 查詢條件
const stockData = ref(null) // 資料庫抓回來的股票資料
const perData = ref({}) // JSON 內的 PER_Analysis 區塊
const livePrice = ref(null) // 即時股價
const selectedFile = ref(null) // 暫存使用者選取的檔案

// 模擬輸入參數 (與畫面綁定)
const simInputs = ref({ yoy: 0, net: 0 })

// === 模擬試算邏輯 (即時連動) ===
const simulatedEPS = computed(() => {
  if (!stockData.value) return 0
  
  const capital = parseFloat(perData.value.Capital || 1)
  const origRev = parseFloat(perData.value.Predict_Rev || 0)
  const origYoy = parseFloat((perData.value.YoY_Use || '0').replace('%', '')) / 100
  
  // 1. 反推基期營收
  const baseRev = origYoy !== -1 ? origRev / (1 + origYoy) : origRev
  
  // 2. 依照輸入的新 % 數，模擬新營收與淨利
  const simRev = baseRev * (1 + (simInputs.value.yoy / 100))
  const simNetIncome = simRev * (simInputs.value.net / 100)
  
  // 3. 計算並回傳新 EPS
  return ((simNetIncome / capital) * 10).toFixed(2)
})

// === 上傳檔案邏輯 ===
const onFileSelected = (event) => {
  // 將選取的檔案存入變數，等待點擊按鈕
  selectedFile.value = event.target.files[0]
}

const uploadFile = async () => {
  if (!selectedFile.value) {
    alert('請先選擇一個 JSON 檔案！')
    return
  }
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const json = JSON.parse(e.target.result)
      // 發送 POST 請求到我們寫好的 /server/api/upload.post.ts
      const res = await $fetch('/api/upload', { method: 'POST', body: json })
      
      if (res && res.success) {
        alert(res.message) // 顯示成功訊息
        
        // 上傳成功後，自動幫使用者把查詢框填上第一個股票代碼並搜尋
        const firstKey = Object.keys(json)[0]
        if (firstKey) {
          searchQuery.value.id = firstKey
          fetchStockData() 
        }
      }
    } catch (err) {
      console.error(err)
      alert('上傳發生錯誤，請檢查伺服器狀態或檔案格式。')
    }
  }
  reader.readAsText(selectedFile.value)
}

// === 查詢股票資料邏輯 ===
const fetchStockData = async () => {
  if (!searchQuery.value.id) {
    alert('請輸入股票代碼')
    return
  }

  try {
    // 發送 GET 請求到 /server/api/stock.get.ts
    const res = await $fetch('/api/stock', { params: searchQuery.value })
    
    if (res.currentData) {
      stockData.value = res.currentData
      perData.value = res.currentData.raw_data.PER_Analysis || {}
      
      // 將資料庫原本的 % 數預設填入模擬輸入框
      simInputs.value.yoy = parseFloat((perData.value.YoY_Use || '0').replace('%', ''))
      simInputs.value.net = parseFloat((perData.value.Net_Avg || '0').replace('%', ''))
      
      // 同步呼叫爬蟲 API 抓取即時股價
      livePrice.value = null // 先清空，顯示抓取中
      const priceRes = await $fetch('/api/live-price', { params: { id: searchQuery.value.id } })
      livePrice.value = priceRes.price
    } else {
      alert('資料庫中找不到該股票資料，請確認代碼或重新上傳。')
      stockData.value = null
    }
  } catch (err) {
    console.error(err)
    alert('讀取資料失敗')
  }
}
</script>

<style>
/* 引入 Bootstrap CSS 讓畫面排版正常 */
@import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>
