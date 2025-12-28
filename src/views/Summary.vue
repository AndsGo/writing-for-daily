<template>
  <div class="summary">
    <el-card class="date-card">
      <div class="date-selector">
        <el-button @click="changeDate(-1)">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        
        <el-date-picker
          v-model="selectedDate"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="loadSummary"
        />
        
        <el-button @click="changeDate(1)" :disabled="isToday">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </el-card>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="!currentSummary" class="empty-state">
      <el-empty description="当天没有学习记录" />
    </div>

    <template v-else>
      <el-card class="data-card">
        <template #header>
          <div class="card-header">
            <span>📊 今日学习数据</span>
          </div>
        </template>
        
        <div class="data-grid">
          <div class="data-item">
            <div class="data-icon">📝</div>
            <div class="data-value">{{ currentSummary.translationCount }}</div>
            <div class="data-label">输入条数</div>
          </div>
          
          <div class="data-item">
            <div class="data-icon">📚</div>
            <div class="data-value">{{ currentSummary.newWords }}</div>
            <div class="data-label">新学词汇</div>
          </div>
          
          <div class="data-item">
            <div class="data-icon">🔊</div>
            <div class="data-value">{{ currentSummary.playCount }}</div>
            <div class="data-label">播放次数</div>
          </div>
          
          <div class="data-item">
            <div class="data-icon">⏱️</div>
            <div class="data-value">{{ currentSummary.studyTime }}</div>
            <div class="data-label">学习时长（分钟）</div>
          </div>
        </div>
      </el-card>

      <el-card class="highlight-card">
        <template #header>
          <div class="card-header">
            <span>🎯 今日重点</span>
          </div>
        </template>
        
        <div class="highlight-content">
          <div v-if="currentSummary.topExpression" class="highlight-item">
            <div class="highlight-label">📌 最常用表达：</div>
            <div class="highlight-value">
              "{{ currentSummary.topExpression }}" (使用{{ currentSummary.topExpressionCount }}次)
            </div>
          </div>
          
          <div v-if="currentSummary.newScenarios.length > 0" class="highlight-item">
            <div class="highlight-label">🆕 新学场景：</div>
            <div class="highlight-value">
              <el-tag v-for="scenario in currentSummary.newScenarios" :key="scenario" style="margin-right: 8px;">
                {{ scenario }}
              </el-tag>
            </div>
          </div>
          
          <div class="highlight-item">
            <div class="highlight-label">⭐ 进步指数：</div>
            <div class="highlight-value">
              <el-rate v-model="progressIndex" disabled show-score />
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="suggestions-card">
        <template #header>
          <div class="card-header">
            <span>💡 学习建议</span>
          </div>
        </template>
        
        <div class="suggestions-list">
          <div v-for="(suggestion, index) in currentSummary.suggestions" :key="index" class="suggestion-item">
            <span class="suggestion-number">{{ index + 1 }}.</span>
            {{ suggestion }}
          </div>
        </div>
      </el-card>

      <el-card class="records-card">
        <template #header>
          <div class="card-header">
            <span>📝 今日记录</span>
            <el-link type="primary" @click="$router.push('/history')">查看全部</el-link>
          </div>
        </template>
        
        <div v-if="todayTranslations.length === 0" class="empty-state">
          <el-empty description="当天没有学习记录" />
        </div>
        
        <div v-else class="records-list">
          <div
            v-for="item in todayTranslations"
            :key="item.id"
            class="record-item"
          >
            <div class="record-chinese">{{ item.chineseText }}</div>
            <div class="record-english">
              <span
                v-for="(word, index) in item.words"
                :key="index"
                :class="['word-item', { 'word-highlight': item.currentWordIndex === index }]"
                @click="handleWordClick(word)"
              >
                {{ word }}
              </span>
            </div>
            <el-button size="small" circle @click="handlePlay(item)">
              <el-icon><VideoPlay /></el-icon>
            </el-button>
          </div>
        </div>
      </el-card>

      <div class="actions">
        <el-button @click="handleShare">
          <el-icon><Share /></el-icon>
          分享总结
        </el-button>
        <el-button @click="loadSummary">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, VideoPlay, Share, Refresh } from '@element-plus/icons-vue'
import { useSummaryStore } from '@/stores/summary'
import { useVoiceStore } from '@/stores/voice'
import { db } from '@/services/db'
import { speechService } from '@/services/speech'

const summaryStore = useSummaryStore()
const voiceStore = useVoiceStore()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const todayTranslations = ref<any[]>([])

const { currentSummary, loading, generateSummary } = summaryStore

const isToday = computed(() => {
  return selectedDate.value === new Date().toISOString().split('T')[0]
})

const progressIndex = computed(() => {
  const summary = currentSummary.value
  if (!summary) return 0
  return summary.progressIndex
})

async function loadSummary() {
  await generateSummary(selectedDate.value)
  await loadTodayTranslations()
}

async function loadTodayTranslations() {
  const startOfDay = new Date(selectedDate.value + 'T00:00:00')
  const endOfDay = new Date(selectedDate.value + 'T23:59:59')

  const translations = await db.translations
    .where('createdAt')
    .between(startOfDay, endOfDay)
    .reverse()
    .limit(5)
    .toArray()

  todayTranslations.value = translations.map(t => ({
    ...t,
    words: t.englishText.split(/\s+/),
    currentWordIndex: -1
  }))
}

function changeDate(delta: number) {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() + delta)
  selectedDate.value = date.toISOString().split('T')[0]
  loadSummary()
}

function handlePlay(item: any) {
  if (!voiceStore.settings.selectedVoice) return
  
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

function handleWordClick(word: string) {
  if (!voiceStore.settings.selectedVoice) return
  
  speechService.speak(word, {
    voiceName: voiceStore.settings.selectedVoice,
    rate: voiceStore.settings.rate,
    pitch: voiceStore.settings.pitch
  })
}

function handleShare() {
  const summary = currentSummary.value
  if (!summary) return

  const text = `
📅 ${selectedDate.value} 学习总结

📊 学习数据
- 输入条数：${summary.translationCount}条
- 新学词汇：${summary.newWords}个
- 播放次数：${summary.playCount}次
- 学习时长：${summary.studyTime}分钟

🎯 今日重点
- 最常用表达：${summary.topExpression || '无'}
- 新学场景：${summary.newScenarios.join(', ') || '无'}
- 进步指数：${'⭐'.repeat(summary.progressIndex + 1)}

💡 学习建议
${summary.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}
  `.trim()

  navigator.clipboard.writeText(text)
  ElMessage.success('已复制到剪贴板，可以分享给朋友了！')
}

onMounted(async () => {
  await loadSummary()
})
</script>

<style scoped>
.summary {
  max-width: 800px;
  margin: 0 auto;
}

.date-card,
.data-card,
.highlight-card,
.suggestions-card,
.records-card {
  margin-bottom: 20px;
}

.date-selector {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  padding: 60px 0;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.data-item {
  text-align: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.data-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.data-value {
  font-size: 28px;
  font-weight: bold;
  color: #4a90e2;
  margin-bottom: 4px;
}

.data-label {
  color: #8c8c8c;
  font-size: 14px;
}

.highlight-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.highlight-item {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.highlight-label {
  font-weight: bold;
  color: #262626;
  margin-bottom: 8px;
}

.highlight-value {
  color: #4a90e2;
  font-size: 16px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.suggestion-number {
  font-weight: bold;
  color: #4a90e2;
  min-width: 24px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-chinese {
  color: #262626;
  font-size: 14px;
}

.record-english {
  color: #4a90e2;
  font-size: 14px;
  line-height: 1.8;
  padding: 8px;
  background: #f9fafb;
  border-radius: 4px;
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

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 768px) {
  .summary {
    max-width: 100%;
    padding-bottom: 20px;
  }

  .date-selector {
    flex-direction: column;
    gap: 12px;
  }

  .date-selector .el-button {
    width: 100%;
    height: 48px;
  }

  .date-selector .el-date-picker {
    width: 100%;
  }

  .data-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .data-item {
    padding: 20px;
  }

  .data-icon {
    font-size: 32px;
  }

  .data-value {
    font-size: 28px;
  }

  .data-label {
    font-size: 14px;
  }

  .highlight-content {
    gap: 16px;
  }

  .highlight-item {
    padding: 16px;
  }

  .highlight-label {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .highlight-value {
    font-size: 15px;
  }

  .suggestions-list {
    gap: 12px;
  }

  .suggestion-item {
    padding: 16px;
    flex-direction: column;
    gap: 8px;
  }

  .suggestion-number {
    min-width: 24px;
    font-size: 16px;
  }

  .records-list {
    gap: 12px;
  }

  .record-item {
    padding: 16px;
  }

  .record-chinese {
    font-size: 15px;
    line-height: 1.6;
  }

  .record-english {
    font-size: 15px;
    line-height: 1.6;
  }

  .record-item .el-button {
    width: 48px;
    height: 48px;
  }

  .actions {
    flex-direction: column;
    gap: 12px;
  }

  .actions .el-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .summary {
    max-width: 90%;
  }

  .data-grid {
    gap: 16px;
  }

  .data-item {
    padding: 18px;
  }
}
</style>
