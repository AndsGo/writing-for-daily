<template>
  <div class="history">
    <el-card class="search-card">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索中文或英语..."
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="selectedCategory" @change="handleFilter">
          <el-option label="全部" value="全部" />
          <el-option label="日常" value="日常" />
          <el-option label="工作" value="工作" />
          <el-option label="学习" value="学习" />
          <el-option label="购物" value="购物" />
          <el-option label="旅游" value="旅游" />
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
          <div class="history-english">{{ item.englishText }}</div>
          <div class="history-meta">
            <el-tag size="small">{{ item.category }}</el-tag>
            <span class="history-time">{{ formatTime(item.createdAt) }}</span>
          </div>
        </div>
        
        <div class="history-actions">
          <el-button size="small" circle @click="handlePlay(item.englishText)">
            <el-icon><VideoPlay /></el-icon>
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
import { Search, VideoPlay, Star, Delete } from '@element-plus/icons-vue'
import { useHistoryStore } from '@/stores/history'
import { useVoiceStore } from '@/stores/voice'
import { speechService } from '@/services/speech'

const historyStore = useHistoryStore()
const voiceStore = useVoiceStore()

const searchQuery = ref('')
const selectedCategory = ref('全部')
const { translations, loading, loadTranslations, searchTranslations, filterByCategory, deleteTranslation, toggleFavorite } = historyStore

async function handleSearch() {
  if (searchQuery.value.trim()) {
    await searchTranslations(searchQuery.value)
  } else {
    await filterByCategory(selectedCategory.value)
  }
}

async function handleFilter() {
  await filterByCategory(selectedCategory.value)
}

function handlePlay(text: string) {
  speechService.speak(text, {
    voiceName: voiceStore.settings.selectedVoice,
    rate: voiceStore.settings.rate,
    pitch: voiceStore.settings.pitch
  })
}

async function handleToggleFavorite(id: number) {
  await toggleFavorite(id)
  ElMessage.success('收藏状态已更新')
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteTranslation(id)
    ElMessage.success('删除成功')
  } catch {
    ElMessage.info('已取消删除')
  }
}

function formatTime(date: Date) {
  const d = new Date(date)
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
  await loadTranslations()
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

.search-bar {
  display: flex;
  gap: 12px;
}

.search-bar .el-input {
  flex: 1;
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
}

.history-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-chinese {
  color: #262626;
  font-size: 16px;
}

.history-english {
  color: #4a90e2;
  font-size: 16px;
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
}
</style>
