<template>
  <div class="history">
    <el-card class="search-card">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索中文或英语..."
          clearable
          @input="handleSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="selectedCategory" @change="handleFilter" class="category-select">
          <el-option label="全部" value="全部" />
          <el-option label="日常" value="日常" />
          <el-option label="工作" value="工作" />
          <el-option label="学习" value="学习" />
          <el-option label="购物" value="购物" />
          <el-option label="旅游" value="旅游" />
        </el-select>

        <el-select v-model="selectedTimeRange" @change="handleTimeFilter" class="time-select">
          <el-option label="全部时间" value="all" />
          <el-option label="今天" value="today" />
          <el-option label="最近7天" value="week" />
          <el-option label="最近30天" value="month" />
        </el-select>
      </div>
    </el-card>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="translations.length === 0" class="empty-state">
      <el-empty description="还没有学习记录" />
    </div>

    <div v-else class="history-list">
      <el-card
        v-for="item in translations"
        :key="item.id"
        class="history-card"
      >
        <div class="history-content">
          <div class="history-chinese">{{ item.chineseText }}</div>
          <div class="history-english">
            <span
              v-for="(word, index) in item.words"
              :key="index"
              :class="['word-item', { 'word-highlight': wordIndexMap.get(item.id || 0) === index }]"
              @click="handleWordClick(word)"
            >
              {{ word }}
            </span>
          </div>
          <div class="history-meta">
            <el-tag size="small">{{ item.category }}</el-tag>
            <span class="history-time">{{ formatTime(item.createdAt as string) }}</span>
          </div>
        </div>
        
        <div class="history-actions">
          <el-button 
            size="small" 
            circle 
            :type="isPlaying === item.id ? 'primary' : 'default'"
            @click="handlePlayPause(item)"
          >
            <el-icon v-if="isPlaying === item.id"><VideoPause /></el-icon>
            <el-icon v-else><VideoPlay /></el-icon>
          </el-button>
          <el-button 
            size="small" 
            circle 
            :type="item.isFavorite ? 'warning' : 'default'"
            @click="handleToggleFavorite(item.id!)"
          >
            <el-icon><Star /></el-icon>
          </el-button>
          <el-button size="small" circle type="danger" @click="handleDelete(item.id!)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, VideoPlay, VideoPause, Star, Delete } from '@element-plus/icons-vue'
import { useHistoryStore } from '@/stores/history'
import { useVoiceStore } from '@/stores/voice'
import { speechService } from '@/services/speech'
import { db } from '@/services/db'

interface TranslationWithWords {
  id?: number
  chineseText: string
  englishText: string
  keywords: string
  category: string
  playCount: number
  isFavorite: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  words: string[]
  currentWordIndex: number
}

const historyStore = useHistoryStore()
const voiceStore = useVoiceStore()

const searchQuery = ref('')
const selectedCategory = ref('全部')
const selectedTimeRange = ref('all')
const wordIndexMap = ref<Map<number, number>>(new Map())
const translations = ref<TranslationWithWords[]>([])
const loading = ref(false)
const isPlaying = ref<number | null>(null)

async function loadData() {
  loading.value = true
  try {
    let result: any[] = []
    
    if (searchQuery.value.trim()) {
      const all = await db.translations.toArray()
      result = all.filter(t => 
        t.chineseText.includes(searchQuery.value) || 
        t.englishText.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    } else if (selectedCategory.value !== '全部') {
      result = await db.translations
        .where('category')
        .equals(selectedCategory.value)
        .reverse()
        .toArray()
    } else {
      result = await db.translations
        .orderBy('createdAt')
        .reverse()
        .toArray()
    }

    if (selectedTimeRange.value !== 'all') {
      const now = new Date()
      let startDate: Date
      
      switch (selectedTimeRange.value) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }
      
      result = result.filter(t => new Date(t.createdAt) >= startDate)
    }

    translations.value = result.map(t => ({
      ...t,
      words: t.englishText.split(/\s+/),
      currentWordIndex: -1
    })) as TranslationWithWords[]
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  await loadData()
}

async function handleFilter() {
  searchQuery.value = ''
  await loadData()
}

async function handleTimeFilter() {
  await loadData()
}

function handlePlayPause(item: any) {
  if (isPlaying.value === item.id) {
    speechService.pause()
    isPlaying.value = null
  } else {
    speechService.stop()
    isPlaying.value = item.id
    wordIndexMap.value.set(item.id || 0, -1)
    speechService.speak(item.englishText, {
      voiceName: voiceStore.settings.selectedVoice,
      rate: voiceStore.settings.rate,
      pitch: voiceStore.settings.pitch,
      onWordBoundary: (wordIndex: number) => {
        wordIndexMap.value.set(item.id || 0, wordIndex)
      },
      onEnd: () => {
        wordIndexMap.value.set(item.id || 0, -1)
        isPlaying.value = null
      }
    })
  }
}

function handleWordClick(word: string) {
  speechService.stop()
  isPlaying.value = null
  speechService.speak(word, {
    voiceName: voiceStore.settings.selectedVoice,
    rate: voiceStore.settings.rate,
    pitch: voiceStore.settings.pitch
  })
}

async function handleToggleFavorite(id: number) {
  await historyStore.toggleFavorite(id)
  ElMessage.success('收藏状态已更新')
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    if (isPlaying.value === id) {
      speechService.stop()
      isPlaying.value = null
    }
    
    await historyStore.deleteTranslation(id)
    ElMessage.success('删除成功')
  } catch {
    ElMessage.info('已取消删除')
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return d.toLocaleDateString('zh-CN')
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.history {
  max-width: 800px;
  margin: 0 auto;
}

.search-card {
  margin-bottom: 20px;
}

.search-card :deep(.el-card__body) {
  padding: 20px;
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.search-input :deep(.el-input__wrapper) {
  height: 40px;
}

.category-select {
  width: 120px;
  flex-shrink: 0;
}

.category-select :deep(.el-select__wrapper) {
  height: 40px;
}

.time-select {
  width: 140px;
  flex-shrink: 0;
}

.time-select :deep(.el-select__wrapper) {
  height: 40px;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  padding: 60px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.history-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.history-card:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-chinese {
  color: #262626;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.history-english {
  color: #4a90e2;
  font-size: 16px;
  line-height: 1.8;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #4a90e2;
}

.word-item {
  display: inline-block;
  padding: 2px 4px;
  margin: 2px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.word-item:hover {
  background: #e0f2fe;
}

.word-highlight {
  background: #bae6fd;
  color: #0c4a6e;
  font-weight: 600;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-time {
  color: #8c8c8c;
  font-size: 12px;
}

.history-actions {
  display: flex;
  gap: 8px;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.history-card:hover .history-actions {
  opacity: 1;
}

.history-actions .el-button {
  width: 44px;
  height: 44px;
  transition: all 0.3s ease;
}

.history-actions .el-button:hover {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .history {
    max-width: 100%;
    padding: 0 12px;
    padding-bottom: 20px;
  }

  .search-card {
    margin-bottom: 16px;
  }

  .search-card :deep(.el-card__body) {
    padding: 16px;
  }

  .search-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
    min-width: auto;
  }

  .search-input :deep(.el-input__wrapper) {
    height: 44px;
  }

  .category-select {
    width: 100%;
  }

  .category-select :deep(.el-select__wrapper) {
    height: 44px;
  }

  .time-select {
    width: 100%;
  }

  .time-select :deep(.el-select__wrapper) {
    height: 44px;
  }

  .history-card {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }

  .history-content {
    width: 100%;
  }

  .history-chinese,
  .history-english {
    font-size: 15px;
    line-height: 1.6;
  }

  .history-meta {
    flex-wrap: wrap;
    gap: 8px;
  }

  .history-time {
    font-size: 12px;
  }

  .history-actions {
    justify-content: flex-end;
    margin-top: 12px;
    gap: 8px;
  }

  .history-actions .el-button {
    width: 48px;
    height: 48px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .history {
    max-width: 90%;
  }

  .category-select {
    width: 140px;
  }
}
</style>
