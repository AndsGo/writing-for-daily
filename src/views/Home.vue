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
      
      <div v-if="interimTranscript" class="interim-result">
        <span class="interim-label">识别中：</span>
        <span class="interim-text">{{ interimTranscript }}</span>
      </div>
      
      <div v-if="isRecording" class="recording-indicator">
        <div class="recording-waveform">
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
        </div>
        <span class="recording-text">正在聆听，请说话...</span>
      </div>
      
      <div class="input-actions">
        <el-popover
          placement="bottom-start"
          :width="340"
          trigger="click"
          :show-arrow="false"
        >
          <template #reference>
            <el-button class="scene-selector-btn">
              <el-icon><Grid /></el-icon>
              {{ selectedCategory }}
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </el-button>
          </template>
          
          <div class="scene-tips-popover">
            <div class="scene-header">
              <span class="scene-title">{{ currentSceneTip.title }}</span>
            </div>
            
            <div v-if="currentSceneTip.examples.length > 0" class="scene-examples">
              <div 
                v-for="(example, idx) in currentSceneTip.examples" 
                :key="idx"
                class="scene-example"
                @click="useExample(example)"
              >
                <span class="example-text">"{{ example }}"</span>
                <el-icon class="use-icon"><Plus /></el-icon>
              </div>
            </div>
            
            <div v-if="currentSceneTip.keywords.length > 0" class="scene-keywords">
              <el-tag
                v-for="keyword in currentSceneTip.keywords"
                :key="keyword"
                size="small"
                type="info"
                effect="plain"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </div>
        </el-popover>
        
        <el-button 
          :type="isRecording ? 'danger' : 'primary'"
          :loading="isRecording"
          @click="handleVoiceInput"
          class="voice-btn"
        >
          <el-icon><Microphone /></el-icon>
          {{ isRecording ? '停止录音' : '语音输入' }}
        </el-button>
        
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

    <div v-if="translationStore.recentTranslations.length > 0" class="translations-section">
      <div class="section-header">
        <span class="section-title">📝 翻译结果</span>
        <span class="section-count">{{ translationStore.recentTranslations.length }} 条</span>
      </div>
      
      <div class="translations-list">
        <el-card
          v-for="(item, index) in translationStore.recentTranslations"
          :key="item.id || `temp-${index}`"
          class="translation-card"
          :class="{ 
            'card-active': translationStore.currentTranslation?.id === item.id || 
                           (!translationStore.currentTranslation?.id && index === 0)
          }"
          shadow="hover"
          @click="handleSelectTranslation(item)"
        >
          <div class="translation-content">
            <div class="translation-header">
              <el-tag size="small" :type="getTagType(item.category)">{{ item.category }}</el-tag>
              <span class="translation-time">{{ formatTime(item.createdAt) }}</span>
            </div>
            
            <div class="translation-chinese">{{ item.chineseText }}</div>
            
            <div class="translation-english">
              <span
                v-for="(word, wordIndex) in item.words"
                :key="wordIndex"
                :class="['word-item', { 'word-highlight': wordIndexMap.get(item.id || `temp-${index}`) === wordIndex }]"
                @click.stop="handleWordClick(word)"
              >
                {{ word }}
              </span>
            </div>
          </div>
          
          <div class="translation-actions">
            <el-button 
              size="small" 
              circle 
              @click.stop="handlePlayTranslation(item, index)"
              :disabled="!voiceStore.settings.selectedVoice"
            >
              <el-icon><VideoPlay /></el-icon>
            </el-button>
            <el-button size="small" circle @click.stop="handleCopyTranslation(item)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
            <el-button 
              size="small" 
              circle 
              :type="item.isFavorite ? 'warning' : 'default'"
              @click.stop="handleFavoriteTranslation(item)"
            >
              <el-icon><Star /></el-icon>
            </el-button>
            <el-button 
              size="small" 
              circle 
              type="danger"
              @click.stop="handleDeleteTranslation(item.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          
          <div v-if="item.id" class="saved-badge">
            <el-icon><CircleCheck /></el-icon>
            已保存
          </div>
        </el-card>
      </div>
    </div>

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
      
      <div v-if="todayRecords.length === 0" class="empty-state">
        <el-empty description="还没有学习记录，开始学习吧！" />
      </div>
      
      <div v-else class="recent-list">
        <div
          v-for="item in todayRecords"
          :key="item.id"
          class="recent-item"
        >
          <div class="recent-chinese">{{ item.chineseText }}</div>
          <div class="recent-english">
            <span
              v-for="(word, index) in item.words"
              :key="index"
              :class="['word-item', { 'word-highlight': wordIndexMap.get(item.id || 0) === index }]"
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
import { 
  VideoPlay, 
  CopyDocument, 
  Star, 
  Microphone,
  Delete,
  CircleCheck,
  Grid,
  ArrowDown,
  Plus
} from '@element-plus/icons-vue'
import { useTranslationStore } from '@/stores/translation'
import { useHistoryStore } from '@/stores/history'
import { useProgressStore } from '@/stores/progress'
import { useVoiceStore } from '@/stores/voice'
import { speechService } from '@/services/speech'
import { speechRecognitionService } from '@/services/speech-recognition'
import { SCENE_TIPS, type SceneTip } from '@/constants/scenes'

const translationStore = useTranslationStore()
const historyStore = useHistoryStore()
const progressStore = useProgressStore()
const voiceStore = useVoiceStore()

const inputText = ref('')
const selectedCategory = ref('日常')
const todayRecords = ref<any[]>([])
const currentWordIndex = ref(-1)
const isRecording = ref(false)
const interimTranscript = ref('')
const wordIndexMap = ref<Map<number | string, number>>(new Map())

const currentSceneTip = computed<SceneTip>(() => {
  return SCENE_TIPS[selectedCategory.value] || {
    title: selectedCategory.value,
    examples: [],
    keywords: []
  }
})

function useExample(example: string) {
  inputText.value = example
}

async function handleTranslate() {
  if (!inputText.value.trim()) return

  try {
    await translationStore.translate(inputText.value, selectedCategory.value)
  } catch (error) {
    console.error('翻译错误:', error)
    ElMessage.error('翻译失败，请重试')
  }
}

function handlePlayTranslation(item: any, index: number) {
  const key = item.id || `temp-${index}`
  wordIndexMap.value.set(key, -1)
  speechService.speak(item.englishText, {
    voiceName: voiceStore.settings.selectedVoice,
    rate: voiceStore.settings.rate,
    pitch: voiceStore.settings.pitch,
    onWordBoundary: (wordIndex: number) => {
      wordIndexMap.value.set(key, wordIndex)
    },
    onEnd: () => {
      wordIndexMap.value.set(key, -1)
    }
  })
}

function handlePlayRecent(item: any) {
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
    }
  })
}

function handleCopyTranslation(item: any) {
  navigator.clipboard.writeText(item.englishText)
  ElMessage.success('已复制到剪贴板')
}

async function handleFavoriteTranslation(item: any) {
  if (item.id) {
    await historyStore.toggleFavorite(item.id)
    item.isFavorite = !item.isFavorite
    ElMessage.success(item.isFavorite ? '已收藏' : '已取消收藏')
  }
}

async function handleDeleteTranslation(id?: number) {
  if (!id) {
    translationStore.removeFromRecent(-1)
    ElMessage.success('已删除')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await translationStore.deleteTranslation(id)
    await loadTodayRecords()
    ElMessage.success('删除成功')
  } catch {
    ElMessage.info('已取消删除')
  }
}

function handleSelectTranslation(item: any) {
  translationStore.setCurrentFromRecent(item.id!)
}

function handleWordClick(word: string) {
  speechService.speak(word, {
    voiceName: voiceStore.settings.selectedVoice,
    rate: voiceStore.settings.rate,
    pitch: voiceStore.settings.pitch
  })
}

async function loadTodayRecords() {
  await historyStore.loadTodayTranslations(5)
  todayRecords.value = historyStore.translations.map(t => ({
    ...t,
    words: t.englishText.split(/\s+/),
    currentWordIndex: -1
  }))
}

function handleVoiceInput() {
  if (!speechRecognitionService.isSupported()) {
    ElMessage.warning('您的浏览器不支持语音识别功能，请使用 Chrome 浏览器')
    return
  }

  if (isRecording.value) {
    speechRecognitionService.stop()
    isRecording.value = false
    interimTranscript.value = ''
  } else {
    isRecording.value = true
    interimTranscript.value = ''
    
    speechRecognitionService.onResult((transcript, isFinal) => {
      if (isFinal) {
        inputText.value = transcript
        interimTranscript.value = ''
        isRecording.value = false
      } else {
        interimTranscript.value = transcript
      }
    })
    
    speechRecognitionService.onError(() => {
      isRecording.value = false
      interimTranscript.value = ''
      ElMessage.error('识别失败，请重试')
    })
    
    speechRecognitionService.onEnd(() => {
      isRecording.value = false
    })
    
    speechRecognitionService.start()
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days === 1) return '昨天'
  return d.toLocaleDateString('zh-CN')
}

function getTagType(category: string) {
  const types: Record<string, string> = {
    '日常': '',
    '工作': 'success',
    '学习': 'warning',
    '购物': 'info',
    '旅游': 'danger'
  }
  return types[category] || ''
}

import { ElMessageBox } from 'element-plus'

onMounted(async () => {
  await loadTodayRecords()
})
</script>

<style scoped>
.home {
  max-width: 900px;
  margin: 0 auto;
}

.input-card,
.words-card,
.recent-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.scene-selector-btn {
  min-width: 100px;
  height: 40px !important;
  line-height: 40px !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  flex-shrink: 0;
}

.scene-selector-btn .dropdown-icon {
  font-size: 12px;
  color: #909399;
}

.interim-result {
  margin-top: 12px;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.interim-label {
  color: #0284c7;
  font-weight: 500;
  font-size: 14px;
}

.interim-text {
  color: #0c4a6e;
  font-size: 14px;
  flex: 1;
}

.recording-indicator {
  margin-top: 12px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.recording-waveform {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 20px;
}

.wave-bar {
  width: 4px;
  background: #ef4444;
  border-radius: 2px;
  animation: wave 1s ease-in-out infinite;
}

.wave-bar:nth-child(1) { height: 8px; animation-delay: 0s; }
.wave-bar:nth-child(2) { height: 16px; animation-delay: 0.1s; }
.wave-bar:nth-child(3) { height: 12px; animation-delay: 0.2s; }
.wave-bar:nth-child(4) { height: 18px; animation-delay: 0.3s; }
.wave-bar:nth-child(5) { height: 10px; animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.5); }
}

.recording-text {
  color: #dc2626;
  font-size: 14px;
  font-weight: 500;
}

.input-textarea {
  font-size: 16px;
}

.category-select {
  width: 120px;
}

::v-deep .voice-btn {
  min-width: 100px;
  height: 40px !important;
  line-height: 40px !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0;
}

::v-deep .voice-btn .el-icon {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  font-size: 14px;
}

::v-deep .voice-btn span {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
}

::v-deep .translate-btn {
  min-width: 100px;
  height: 40px !important;
  line-height: 40px !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0;
}

.scene-tips-popover {
  padding: 4px;
}

.scene-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.scene-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.scene-examples {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.scene-example {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.scene-example:hover {
  background: #eff6ff;
}

.example-text {
  font-size: 13px;
  color: #374151;
  flex: 1;
}

.use-icon {
  color: #3b82f6;
  opacity: 0;
  transition: opacity 0.2s;
}

.scene-example:hover .use-icon {
  opacity: 1;
}

.scene-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.translations-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.section-count {
  font-size: 13px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 10px;
  border-radius: 12px;
}

.translations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.translation-card {
  position: relative;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.translation-card:hover {
  border-color: #93c5fd;
}

.translation-card.card-active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.translation-content {
  padding: 12px;
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.translation-time {
  font-size: 12px;
  color: #9ca3af;
}

.translation-chinese {
  font-size: 15px;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.5;
}

.translation-english {
  font-size: 15px;
  color: #2563eb;
  line-height: 1.8;
  padding: 10px;
  background: #f8fafc;
  border-radius: 6px;
}

.translation-actions {
  display: flex;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  margin-top: 12px;
}

.translation-actions .el-button {
  flex: 1;
}

.saved-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #10b981;
  background: #ecfdf5;
  padding: 2px 8px;
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
  background: #dbeafe;
}

.word-highlight {
  background: #3b82f6;
  color: white;
  font-weight: 600;
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
    padding: 0 12px;
    padding-bottom: 20px;
  }

  .input-card {
    margin-bottom: 16px;
  }

  .input-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .scene-selector-btn {
    width: 100%;
    min-width: auto;
    height: 48px !important;
    line-height: 48px !important;
    padding: 0 12px !important;
    font-size: 16px;
  }

  ::v-deep .voice-btn {
    width: 100%;
    min-width: auto;
    height: 48px !important;
    line-height: 48px !important;
    padding: 0 12px !important;
    font-size: 16px;
  }

  ::v-deep .translate-btn {
    width: 100%;
    min-width: auto;
    height: 48px !important;
    line-height: 48px !important;
    padding: 0 12px !important;
    font-size: 16px;
  }

  ::v-deep .voice-btn .el-icon {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    font-size: 16px;
  }

  ::v-deep .voice-btn span {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    line-height: 1 !important;
  }

  .interim-result {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .recording-indicator {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .translation-card {
    padding: 16px;
  }

  .translation-chinese {
    font-size: 15px;
  }

  .translation-english {
    font-size: 15px;
    padding: 12px;
  }

  .translation-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .translation-actions .el-button {
    flex: 0 0 auto;
    min-width: 44px;
    height: 44px;
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
