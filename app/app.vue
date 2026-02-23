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
              <div class="row g-2">
                <div class="col-4">
                  <input v-model="searchQuery.id" type="text" class="form-control" placeholder="代碼">
                </div>
                <div class="col-4">
                  <button @click="fetchStockData" class="btn btn-primary w-100">Go</button>
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

      <div v-if="stockData" class="card shadow-sm mb-5">
        <div class="card-header bg-white py-3">
          <h4 class="mb-0 fw-bold">
            <span class="badge bg-primary me-2">{{ stockData.stock_id }}</span>
            {{ stockData.stock_name }}
          </h4>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-lg-5">
               <h5 class="fw-bold">📊 原始參數</h5>
               <ul class="list-group">
                 <li class="list-group-item">預估 EPS: {{ perData.Predict_EPS }}</li>
                 <li class="list-group-item">預估營收: {{ perData.Predict_Rev }} 億</li>
               </ul>
            </div>
            <div class="col-lg-7">
               <h5 class="fw-bold">✏️ 手動調整參數 (即時連動)</h5>
               <div class="row g-3">
                  <div class="col-6">
                    <label>營收年增率 (%)</label>
                    <input v-model="simInputs.yoy" type="number" class="form-control">
                  </div>
                  <div class="col-6">
                    <label>稅後淨利率 (%)</label>
                    <input v-model="simInputs.net" type="number" class="form-control">
                  </div>
               </div>
               
               <div class="alert alert-info mt-3">
                 <div class="d-flex justify-content-between">
                   <span>模擬 EPS</span>
                   <span class="h4 fw-bold text-primary">{{ simulatedEPS }} 元</span>
                 </div>
                 <hr>
                 <div class="d-flex justify-content-between">
                   <span>即時股價</span>
                   <span class="h5">{{ livePrice || '載入中...' }}</span>
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

const searchQuery = ref({ id: '', year: '', month: '' })
const stockData = ref(null)
const perData = ref({})
const livePrice = ref(null)

// 模擬輸入參數
const simInputs = ref({ yoy: 0, net: 0, peH: 0, peL: 0 })

// 即時計算模擬 EPS (取代原本 views.py 中的 post calc_simulation 邏輯)
const simulatedEPS = computed(() => {
  if (!stockData.value) return 0
  const capital = parseFloat(perData.value.Capital || 1)
  const origRev = parseFloat(perData.value.Predict_Rev || 0)
  const origYoy = parseFloat((perData.value.YoY_Use || '0').replace('%','')) / 100
  
  // 1. 反推基期
  const baseRev = origYoy !== -1 ? origRev / (1 + origYoy) : origRev
  
  // 2. 模擬新營收與淨利
  const simRev = baseRev * (1 + (simInputs.value.yoy / 100))
  const simNetIncome = simRev * (simInputs.value.net / 100)
  
  // 3. 模擬 EPS
  return ((simNetIncome / capital) * 10).toFixed(2)
})

// 上傳 JSON
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    const json = JSON.parse(e.target.result)
    await $fetch('/api/upload', { method: 'POST', body: json })
    alert('上傳成功！')
  }
  reader.readAsText(file)
}

// 獲取資料
const fetchStockData = async () => {
  const res = await $fetch('/api/stock', { params: searchQuery.value })
  if (res.currentData) {
    stockData.value = res.currentData
    perData.value = res.currentData.raw_data.PER_Analysis || {}
    
    // 初始化模擬參數為預設值
    simInputs.value.yoy = parseFloat((perData.value.YoY_Use || '0').replace('%',''))
    simInputs.value.net = parseFloat((perData.value.Net_Avg || '0').replace('%',''))
    
    // 呼叫爬蟲抓即時股價
    const priceRes = await $fetch('/api/live-price', { params: { id: searchQuery.value.id } })
    livePrice.value = priceRes.price
  } else {
    alert('找不到該股票資料')
  }
}
</script>

<style>
/* 引入 Bootstrap JavaScript (供 Modal 和 Tabs 使用) */
@import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
</style>
