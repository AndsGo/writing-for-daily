<template>
  <div class="home">
    <el-card class="input-card">
      <template #header>
        <div class="card-header">
          <span>输入你想表达的中文...</span>
        </div>
      </template>
      
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="4"
        placeholder="输入你想表达的中文..."
        maxlength="200"
        show-word-limit
        @keydown.ctrl.enter="handleTranslate"
        class="input-textarea"
      />
      
      <div class="input-actions">
        <el-select v-model="selectedCategory" placeholder="选择场景" class="category-select">
          <el-option label="日常" value="日常" />
          <el-option label="工作" value="工作" />
          <el-option label="学习" value="学习" />
          <el-option label="购物" value="购物" />
          <el-option label="旅游" value="旅游" />
        </el-select>
        
        <el-button 
          type="primary" 
          :loading="translationStore.isTranslating"
          :disabled="!inputText.trim()"
          @click="handleTranslate"
          class="translate-btn"
        >
          翻译 (Ctrl+Enter)
        </el-button>
      </div>
    </el-card>

    <el-card v-if="translationStore.currentTranslation" class="result-card">
      <template #header>
        <div class="card-header">
          <span>English Translation</span>
          <span class="voice-info">🎙️ {{ voiceStore.settings.selectedVoice }}</span>
        </div>
      </template>
      
      <div class="translation-result">
        <span
          v-for="(word, index) in currentWords"
          :key="index"
          :class="['word-item', { 'word-highlight': index === currentWordIndex }]"
          @click="handleWordClick(word)"
        >
          {{ word }}
        </span>
      </div>
      
      <div class="result-actions">
        <el-button @click="handlePlay">
          <el-icon><VideoPlay /></el-icon>
          播放
        </el-button>
        <el-button @click="handleCopy">
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
        <el-button @click="handleFavorite">
          <el-icon><Star /></el-icon>
          {{ translationStore.currentTranslation.isFavorite ? '已收藏' : '收藏' }}
        </el-button>
        <el-button @click="handleSave">
          <el-icon><DocumentAdd /></el-icon>
          保存
        </el-button>
      </div>
    </el-card>

    <el-card v-if="translationStore.currentTranslation" class="words-card">
      <template #header>
        <div class="card-header">
          <span>💡 单词学习</span>
        </div>
      </template>
      
      <div class="words-list">
        <el-tag
          v-for="word in translationStore.currentTranslation.keywords.split(',')"
          :key="word"
          class="word-tag"
          @click="handleWordClick(word)"
        >
          {{ word }}
        </el-tag>
      </div>
    </el-card>

    <el-card class="recent-card">
      <template #header>
        <div class="card-header">
          <span>📚 今日学习记录</span>
          <el-link type="primary" @click="$router.push('/history')">查看全部</el-link>
        </div>
      </template>
      
      <div v-if="recentTranslations.length === 0" class="empty-state">
        <el-empty description="还没有学习记录，开始学习吧！" />
      </div>
      
      <div v-else class="recent-list">
        <div
          v-for="item in recentTranslations"
          :key="item.id"
          class="recent-item"
        >
          <div class="recent-chinese">{{ item.chineseText }}</div>
          <div class="recent-english">
            <span
              v-for="(word, index) in item.words"
              :key="index"
              :class="['word-item', { 'word-highlight': item.currentWordIndex === index }]"
              @click="handleWordClick(word)"
            >
              {{ word }}
            </span>
          </div>
          <div class="recent-actions">
            <el-button size="small" circle @click="handlePlayRecent(item)">
              <el-icon><VideoPlay /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, CopyDocument, Star, DocumentAdd } from '@element-plus/icons-vue'
import { useTranslationStore } from '@/stores/translation'
import { useHistoryStore } from '@/stores/history'
import { useProgressStore } from '@/stores/progress'
import { useVoiceStore } from '@/stores/voice'
import { speechService } from '@/services/speech'

const translationStore = useTranslationStore()
const historyStore = useHistoryStore()
const progressStore = useProgressStore()
const voiceStore = useVoiceStore()

const inputText = ref('')
const selectedCategory = ref('日常')
const recentTranslations = ref<any[]>([])
const currentWordIndex = ref(-1)

const currentWords = computed(() => {
  if (!translationStore.currentTranslation) return []
  return translationStore.currentTranslation.englishText.split(/\s+/)
})

async function handleTranslate() {
  if (!inputText.value.trim()) return

  try {
    console.log('开始翻译:', inputText.value)
    const result = await translationStore.translate(inputText.value, selectedCategory.value)
    console.log('翻译结果:', result)
    console.log('currentTranslation:', translationStore.currentTranslation)
  } catch (error) {
    console.error('翻译错误:', error)
    console.error('错误详情:', JSON.stringify(error))
  }
}

function handlePlay() {
  if (translationStore.currentTranslation) {
    currentWordIndex.value = -1
    speechService.speak(translationStore.currentTranslation.englishText, {
      voiceName: voiceStore.settings.selectedVoice,
      rate: voiceStore.settings.rate,
      pitch: voiceStore.settings.pitch,
      onWordBoundary: (wordIndex: number) => {
        currentWordIndex.value = wordIndex
      },
      onEnd: () => {
        currentWordIndex.value = -1
      }
    })
  }
}

function handlePlayRecent(item: any) {
  item.currentWordIndex = -1
  speechService.speak(item.englishText, {
    voiceName: voiceStore.settings.selectedVoice,
    rate: voiceStore.settings.rate,
    pitch: voiceStore.settings.pitch,
    onWordBoundary: (wordIndex: number) => {
      item.currentWordIndex = wordIndex
    },
    onEnd: () => {
      item.currentWordIndex = -1
    }
  })
}

function handleCopy() {
  if (translationStore.currentTranslation) {
    navigator.clipboard.writeText(translationStore.currentTranslation.englishText)
    ElMessage.success('已复制到剪贴板')
  }
}

function handleFavorite() {
  if (translationStore.currentTranslation && translationStore.currentTranslation.id) {
    historyStore.toggleFavorite(translationStore.currentTranslation.id)
    ElMessage.success(translationStore.currentTranslation.isFavorite ? '已取消收藏' : '已收藏')
  }
}

async function handleSave() {
  if (translationStore.currentTranslation) {
    try {
      const saved = await translationStore.saveTranslation(translationStore.currentTranslation)
      translationStore.currentTranslation.id = saved.id as number
      await progressStore.addTranslation(saved)
      await progressStore.updateTodayCount()
      await loadRecentTranslations()
      ElMessage.success('保存成功！')
    } catch (error) {
      ElMessage.error('保存失败')
    }
  }
}

function handleWordClick(word: string) {
  speechService.speak(word, {
    voiceName: voiceStore.settings.selectedVoice,
    rate: voiceStore.settings.rate,
    pitch: voiceStore.settings.pitch
  })
}

async function loadRecentTranslations() {
  await historyStore.loadTranslations(3)
  recentTranslations.value = historyStore.translations.map(t => ({
    ...t,
    words: t.englishText.split(/\s+/),
    currentWordIndex: -1
  }))
}

onMounted(async () => {
  await loadRecentTranslations()
})
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
}

.input-card,
.result-card,
.words-card,
.recent-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.voice-info {
  font-size: 12px;
  color: #909399;
  background: #f0f9ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.input-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.input-textarea {
  font-size: 16px;
}

.category-select {
  width: 120px;
}

.translate-btn {
  min-width: 100px;
}

.translation-result {
  font-size: 18px;
  line-height: 1.6;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
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

.result-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.words-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.word-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.word-tag:hover {
  transform: scale(1.1);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-chinese {
  color: #262626;
  font-size: 14px;
}

.recent-english {
  color: #4a90e2;
  font-size: 14px;
  line-height: 1.8;
  padding: 8px;
  background: #f9fafb;
  border-radius: 4px;
}

.recent-actions {
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  padding: 40px 0;
}

@media (max-width: 768px) {
  .home {
    max-width: 100%;
    padding-bottom: 20px;
  }

  .input-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .category-select {
    width: 100%;
  }

  .translate-btn {
    width: 100%;
    min-width: auto;
    height: 48px;
    font-size: 16px;
  }

  .translation-result {
    font-size: 16px;
    padding: 16px;
    line-height: 1.8;
  }

  .result-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .result-actions .el-button {
    flex: 1;
    min-width: 0;
    height: 48px;
    font-size: 14px;
  }

  .words-list {
    gap: 8px;
  }

  .word-tag {
    font-size: 14px;
    padding: 8px 12px;
  }

  .recent-item {
    padding: 16px;
  }

  .recent-chinese,
  .recent-english {
    font-size: 14px;
    line-height: 1.6;
  }

  .recent-actions .el-button {
    width: 48px;
    height: 48px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .home {
    max-width: 90%;
  }

  .category-select {
    width: 140px;
  }
}
</style>
