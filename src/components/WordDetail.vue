<template>
  <div class="word-detail">
    <div class="word-header">
      <h2 class="word-text">{{ word }}</h2>
      <div v-if="detail.phonetic" class="word-phonetic">{{ detail.phonetic }}</div>
    </div>

    <div class="difficulty-badge" :class="detail.difficulty">
      {{ getDifficultyLabel(detail.difficulty) }}
    </div>

    <el-divider />

    <div class="meanings-section">
      <h3 class="section-title">📖 释义</h3>
      <div v-for="(meaning, idx) in detail.meanings" :key="idx" class="meaning-item">
        <div class="part-of-speech">{{ meaning.partOfSpeech }}</div>
        <ul class="definitions-list">
          <li v-for="(def, defIdx) in meaning.definitions" :key="defIdx">
            {{ def }}
          </li>
        </ul>
      </div>
    </div>

    <div v-if="detail.examples.length > 0" class="examples-section">
      <h3 class="section-title">💡 例句</h3>
      <div 
        v-for="(example, idx) in detail.examples" 
        :key="idx" 
        class="example-item"
        @click="playExample(example)"
      >
        <el-icon class="play-icon"><VideoPlay /></el-icon>
        <span>{{ example }}</span>
      </div>
    </div>

    <div v-if="detail.synonyms.length > 0" class="synonyms-section">
      <h3 class="section-title">🔗 同义词</h3>
      <div class="synonyms-list">
        <el-tag
          v-for="synonym in detail.synonyms"
          :key="synonym"
          class="synonym-tag"
          @click="searchSynonym(synonym)"
        >
          {{ synonym }}
        </el-tag>
      </div>
    </div>

    <el-divider />

    <div class="mastery-section">
      <h3 class="section-title">📊 掌握程度</h3>
      <div class="mastery-buttons">
        <el-button
          size="large"
          :type="mastery === 'new' ? 'primary' : 'default'"
          @click="setMastery('new')"
        >
          <span class="mastery-emoji">😓</span>
          陌生
        </el-button>
        <el-button
          size="large"
          :type="mastery === 'learning' ? 'warning' : 'default'"
          @click="setMastery('learning')"
        >
          <span class="mastery-emoji">😐</span>
          一般
        </el-button>
        <el-button
          size="large"
          :type="mastery === 'familiar' ? 'success' : 'default'"
          @click="setMastery('familiar')"
        >
          <span class="mastery-emoji">😊</span>
          熟悉
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { WordDetail } from '@/types'
import { dictionaryService } from '@/services/dictionary'
import { speechService } from '@/services/speech'
import { useVoiceStore } from '@/stores/voice'

const props = defineProps<{
  word: string
}>()

const voiceStore = useVoiceStore()

const detail = ref<WordDetail>({
  word: props.word,
  phonetic: '',
  meanings: [],
  examples: [],
  synonyms: [],
  difficulty: 'medium'
})

const mastery = ref<'new' | 'learning' | 'familiar' | 'mastered'>('new')

const getDifficultyLabel = (difficulty: string) => {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return labels[difficulty] || difficulty
}

async function loadWordDetail() {
  try {
    detail.value = await dictionaryService.getWordDetail(props.word)
  } catch (error) {
    console.error('Failed to load word detail:', error)
  }
}

function playExample(example: string) {
  speechService.speak(example, {
    voiceName: voiceStore.settings.selectedVoice,
    rate: voiceStore.settings.rate,
    pitch: voiceStore.settings.pitch
  })
}

function searchSynonym(synonym: string) {
  ElMessage.info(`查看同义词: ${synonym}`)
}

function setMastery(level: 'new' | 'learning' | 'familiar' | 'mastered') {
  mastery.value = level
  saveMastery(level)
  ElMessage.success(`已标记为：${getMasteryLabel(level)}`)
}

function getMasteryLabel(level: string) {
  const labels: Record<string, string> = {
    new: '陌生',
    learning: '学习中',
    familiar: '熟悉',
    mastered: '掌握'
  }
  return labels[level] || level
}

function saveMastery(level: string) {
  const masteryRecord = {
    word: props.word,
    familiarity: level,
    reviewCount: 1,
    lastReviewTime: new Date().toISOString()
  }
  localStorage.setItem(`word_mastery_${props.word}`, JSON.stringify(masteryRecord))
}

function loadMastery() {
  const saved = localStorage.getItem(`word_mastery_${props.word}`)
  if (saved) {
    try {
      const record = JSON.parse(saved)
      mastery.value = record.familiarity || 'new'
    } catch {
      mastery.value = 'new'
    }
  }
}

watch(() => props.word, () => {
  loadWordDetail()
  loadMastery()
}, { immediate: true })
</script>

<style scoped>
.word-detail {
  padding: 8px 0;
}

.word-header {
  margin-bottom: 12px;
}

.word-text {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.word-phonetic {
  font-size: 16px;
  color: #64748b;
  font-family: 'Lucida Sans Unicode', 'Arial Unicode MS', sans-serif;
}

.difficulty-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 16px;
}

.difficulty-badge.easy {
  background: #dcfce7;
  color: #166534;
}

.difficulty-badge.medium {
  background: #fef9c3;
  color: #854d0e;
}

.difficulty-badge.hard {
  background: #fee2e2;
  color: #991b1b;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.meaning-item {
  margin-bottom: 12px;
}

.part-of-speech {
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 4px;
}

.definitions-list {
  margin: 0;
  padding-left: 20px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
}

.definitions-list li {
  margin-bottom: 4px;
}

.examples-section {
  margin-top: 16px;
}

.example-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.example-item:hover {
  background: #eff6ff;
}

.play-icon {
  color: #3b82f6;
  margin-top: 2px;
  flex-shrink: 0;
}

.example-item span {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
}

.synonyms-section {
  margin-top: 16px;
}

.synonyms-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.synonym-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.synonym-tag:hover {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #3b82f6;
}

.mastery-section {
  margin-top: 16px;
}

.mastery-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.mastery-buttons .el-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
}

.mastery-emoji {
  font-size: 24px;
}

@media (max-width: 480px) {
  .mastery-buttons {
    flex-wrap: wrap;
  }

  .mastery-buttons .el-button {
    flex: 0 0 calc(33.33% - 8px);
    font-size: 12px;
    padding: 12px 4px;
  }
}
</style>
