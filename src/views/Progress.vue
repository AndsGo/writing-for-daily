<template>
  <div class="progress">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="stats-card">
          <template #header>
            <div class="card-header">
              <span>📈 学习统计</span>
            </div>
          </template>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">📅</div>
              <div class="stat-value">{{ progress?.totalDays || 0 }}</div>
              <div class="stat-label">学习天数</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">📝</div>
              <div class="stat-value">{{ progress?.totalTranslations || 0 }}</div>
              <div class="stat-label">累计输入</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">📚</div>
              <div class="stat-value">{{ progress?.totalWords || 0 }}</div>
              <div class="stat-label">累计词汇</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">🔊</div>
              <div class="stat-value">{{ progress?.totalPlays || 0 }}</div>
              <div class="stat-label">播放次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="streak-card">
          <template #header>
            <div class="card-header">
              <span>🔥 连续学习</span>
            </div>
          </template>
          
          <div class="streak-content">
            <el-progress 
              :percentage="streakPercentage" 
              :stroke-width="20"
              :text-inside="true"
            >
              <span class="progress-text">{{ progress?.consecutiveDays || 0 }}/30天</span>
            </el-progress>
            
            <div class="streak-message">
              {{ streakMessage }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="achievements-card">
      <template #header>
        <div class="card-header">
          <span>🏆 成就系统</span>
          <span class="achievement-summary">
            {{ unlockedCount }} / {{ allAchievements.length }}
          </span>
        </div>
      </template>
      
      <div class="achievements-grid">
        <div
          v-for="achievement in allAchievements"
          :key="achievement.id"
          class="achievement-item"
          :class="{ 
            unlocked: achievement.unlocked,
            ['achievement-' + achievement.id]: true
          }"
        >
          <div class="achievement-badge">
            <span class="badge-icon">{{ getAchievementIcon(achievement.id) }}</span>
            <span v-if="achievement.unlocked" class="badge-check">✓</span>
          </div>
          <div class="achievement-info">
            <div class="achievement-header">
              <div class="achievement-name">{{ achievement.name }}</div>
              <el-tag 
                v-if="achievement.unlocked" 
                type="success" 
                size="small"
                effect="dark"
              >
                已解锁
              </el-tag>
              <el-tag 
                v-else 
                type="info" 
                size="small"
                effect="plain"
              >
                锁定中
              </el-tag>
            </div>
            <div class="achievement-desc">{{ achievement.description }}</div>
            <div v-if="!achievement.unlocked" class="achievement-progress">
              <el-progress 
                :percentage="getAchievementProgress(achievement.id)" 
                :stroke-width="8"
                :show-text="false"
                color="#4a90e2"
              />
              <span class="progress-hint">{{ getAchievementHint(achievement.id) }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="calendar-card">
      <template #header>
        <div class="card-header">
          <span>📅 学习日历</span>
        </div>
      </template>
      
      <el-calendar v-model="calendarDate">
        <template #date-cell="{ data }">
          <div 
            class="calendar-cell" 
            :class="{ 'calendar-cell-clickable': hasStudiedOnDate(data.day) }"
            @click="handleDateClick(data.day)"
          >
            <div class="calendar-date">{{ data.day.split('-').slice(2).join('-') }}</div>
            <div v-if="hasStudiedOnDate(data.day)" class="calendar-dot"></div>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <el-dialog
      v-model="dateDetailVisible"
      :title="`${selectedDate} 学习详情`"
      width="90%"
      :style="{ maxWidth: '800px' }"
    >
      <div v-if="loadingDateDetail" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="dateTranslations.length === 0" class="empty-state">
        <el-empty description="该日期没有学习记录" />
      </div>
      
      <div v-else class="date-detail-content">
        <div class="detail-stats">
          <div class="detail-stat-item">
            <span class="stat-label">📝 输入条数</span>
            <span class="stat-value">{{ dateTranslations.length }}</span>
          </div>
          <div class="detail-stat-item">
            <span class="stat-label">📚 新学词汇</span>
            <span class="stat-value">{{ dateNewWords }}</span>
          </div>
          <div class="detail-stat-item">
            <span class="stat-label">🔊 播放次数</span>
            <span class="stat-value">{{ datePlayCount }}</span>
          </div>
        </div>
        
        <div class="detail-records">
          <h4>学习记录</h4>
          <div
            v-for="item in dateTranslations"
            :key="item.id"
            class="detail-record-item"
          >
            <div class="record-header">
              <el-tag size="small">{{ item.category }}</el-tag>
              <span class="record-time">{{ formatTime(item.createdAt) }}</span>
            </div>
            <div class="record-content">
              <div class="record-chinese">{{ item.chineseText }}</div>
              <div class="record-english">{{ item.englishText }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { db } from '@/services/db'

const progressStore = useProgressStore()

const calendarDate = ref(new Date())
const studiedDates = ref<Set<string>>(new Set())

const dateDetailVisible = ref(false)
const selectedDate = ref('')
const loadingDateDetail = ref(false)
const dateTranslations = ref<any[]>([])

const allAchievements = computed(() => progressStore.getAllAchievements())

const unlockedCount = computed(() => {
  return allAchievements.value.filter(a => a.unlocked).length
})

const progress = computed(() => progressStore.progress)

const dateNewWords = computed(() => {
  const allWords = dateTranslations.value.flatMap(t => t.keywords.split(','))
  return new Set(allWords).size
})

const datePlayCount = computed(() => {
  return dateTranslations.value.reduce((sum, t) => sum + t.playCount, 0)
})

function getAchievementIcon(id: string): string {
  const icons: Record<string, string> = {
    'first_translation': '🌱',
    'ten_translations': '📝',
    'hundred_words': '📚',
    'hundred_plays': '🔊',
    'seven_days': '🔥',
    'thirty_days': '👑'
  }
  return icons[id] || '🏅'
}

function getAchievementProgress(id: string): number {
  const p = progress.value
  if (!p) return 0
  
  switch (id) {
    case 'first_translation':
      return Math.min((p.totalTranslations / 1) * 100, 100)
    case 'ten_translations':
      return Math.min((p.totalTranslations / 10) * 100, 100)
    case 'hundred_words':
      return Math.min((p.totalWords / 100) * 100, 100)
    case 'hundred_plays':
      return Math.min((p.totalPlays / 100) * 100, 100)
    case 'seven_days':
      return Math.min((p.consecutiveDays / 7) * 100, 100)
    case 'thirty_days':
      return Math.min((p.consecutiveDays / 30) * 100, 100)
    default:
      return 0
  }
}

function getAchievementHint(id: string): string {
  const p = progress.value
  if (!p) return '加载中...'
  
  switch (id) {
    case 'first_translation':
      const firstLeft = Math.max(0, 1 - p.totalTranslations)
      return firstLeft <= 0 ? '即将解锁' : `还需${firstLeft}条翻译`
    case 'ten_translations':
      const tenLeft = Math.max(0, 10 - p.totalTranslations)
      return tenLeft <= 0 ? '即将解锁' : `还需${tenLeft}条翻译`
    case 'hundred_words':
      const wordLeft = Math.max(0, 100 - p.totalWords)
      return wordLeft <= 0 ? '即将解锁' : `还需${wordLeft}个词汇`
    case 'hundred_plays':
      const playLeft = Math.max(0, 100 - p.totalPlays)
      return playLeft <= 0 ? '即将解锁' : `还需${playLeft}次播放`
    case 'seven_days':
      const sevenLeft = Math.max(0, 7 - p.consecutiveDays)
      return sevenLeft <= 0 ? '即将解锁' : `还需${sevenLeft}天`
    case 'thirty_days':
      const thirtyLeft = Math.max(0, 30 - p.consecutiveDays)
      return thirtyLeft <= 0 ? '即将解锁' : `还需${thirtyLeft}天`
    default:
      return ''
  }
}

const streakPercentage = computed(() => {
  if (!progress.value) return 0
  return Math.min((progress.value.consecutiveDays / 30) * 100, 100)
})

const streakMessage = computed(() => {
  if (!progress.value) return '加载中...'
  const remaining = 30 - progress.value.consecutiveDays
  if (remaining <= 0) {
    return '太棒了！你已经连续学习30天了！'
  } else if (remaining <= 7) {
    return `再坚持${remaining}天，获得"学习大师"成就！`
  } else {
    return `继续加油！坚持就是胜利！`
  }
})

async function loadStudiedDates() {
  const year = calendarDate.value.getFullYear()
  const month = calendarDate.value.getMonth()
  
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)
  
  console.log('查询日期范围(本地时间):', {
    start: startOfMonth.toLocaleString(),
    end: endOfMonth.toLocaleString()
  })
  
  const translations = await db.translations
    .where('createdAt')
    .between(startOfMonth.toISOString(), endOfMonth.toISOString())
    .toArray()
  
  console.log('查询到的记录数:', translations.length)
  
  const dates = new Set<string>()
  translations.forEach(t => {
    const date = new Date(t.createdAt)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    dates.add(dateStr)
    console.log('学习日期:', dateStr, '原始UTC时间:', t.createdAt, '本地时间:', date.toLocaleString())
  })
  
  studiedDates.value = dates
  console.log('所有学习日期:', Array.from(dates))
}

function hasStudiedOnDate(dateStr: string): boolean {
  const hasDate = studiedDates.value.has(dateStr)
  console.log(`检查日期 ${dateStr}: ${hasDate}`)
  return hasDate
}

async function handleDateClick(dateStr: string) {
  if (!hasStudiedOnDate(dateStr)) return
  
  selectedDate.value = dateStr
  dateDetailVisible.value = true
  loadingDateDetail.value = true
  dateTranslations.value = []
  
  try {
    const startDate = new Date(dateStr + 'T00:00:00')
    const endDate = new Date(dateStr + 'T23:59:59')
    
    const translations = await db.translations
      .where('createdAt')
      .between(startDate.toISOString(), endDate.toISOString())
      .toArray()
    
    dateTranslations.value = translations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (error) {
    console.error('加载日期详情失败:', error)
  } finally {
    loadingDateDetail.value = false
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

watch(calendarDate, async () => {
  await loadStudiedDates()
})

onMounted(async () => {
  await progressStore.loadProgress()
  await loadStudiedDates()
})
</script>

<style scoped>
.progress {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-card,
.streak-card,
.achievements-card,
.calendar-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.achievement-summary {
  background: linear-gradient(135deg, #4a90e2, #7c3aed);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #4a90e2;
  margin-bottom: 4px;
}

.stat-label {
  color: #8c8c8c;
  font-size: 14px;
}

.streak-content {
  padding: 20px 0;
}

.progress-text {
  font-weight: bold;
}

.streak-message {
  margin-top: 20px;
  text-align: center;
  color: #52c41a;
  font-size: 16px;
  font-weight: bold;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.achievement-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.achievement-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #e2e8f0;
  transition: all 0.3s ease;
}

.achievement-item.unlocked {
  background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
  border-color: #93c5fd;
}

.achievement-item.unlocked::before {
  background: linear-gradient(90deg, #3b82f6, #22c55e);
}

.achievement-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.achievement-badge {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 12px;
  flex-shrink: 0;
}

.achievement-item.unlocked .achievement-badge {
  background: linear-gradient(135deg, #dbeafe, #dcfce7);
}

.badge-icon {
  font-size: 28px;
}

.badge-check {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: #22c55e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid white;
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.achievement-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.achievement-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 12px;
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.achievement-progress .el-progress {
  flex: 1;
}

.progress-hint {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.achievement-item.unlocked .achievement-progress {
  display: none;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.calendar-cell-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-cell-clickable:hover {
  background: #e6f7ff;
  border-radius: 8px;
}

.calendar-date {
  font-size: 14px;
}

.calendar-dot {
  width: 8px;
  height: 8px;
  background: #52c41a;
  border-radius: 50%;
  margin-top: 4px;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  padding: 60px 0;
}

.date-detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.detail-stat-item {
  text-align: center;
}

.detail-stat-item .stat-label {
  display: block;
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.detail-stat-item .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #4a90e2;
}

.detail-records h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #262626;
}

.detail-record-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.record-time {
  font-size: 12px;
  color: #8c8c8c;
}

.record-content {
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
  line-height: 1.6;
}

@media (max-width: 768px) {
  .progress {
    max-width: 100%;
    padding-bottom: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-item {
    padding: 20px;
  }

  .stat-icon {
    font-size: 32px;
  }

  .stat-value {
    font-size: 28px;
  }

  .stat-label {
    font-size: 14px;
  }

  .streak-message {
    font-size: 14px;
    padding: 0 16px;
    line-height: 1.6;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .achievement-item {
    padding: 16px;
  }

  .achievement-icon {
    font-size: 24px;
  }

  .achievement-name {
    font-size: 15px;
  }

  .achievement-desc {
    font-size: 13px;
    line-height: 1.5;
  }

  .calendar-cell {
    min-height: 48px;
  }

  .calendar-date {
    font-size: 13px;
  }

  .calendar-dot {
    width: 8px;
    height: 8px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .progress {
    max-width: 90%;
  }

  .stats-grid {
    gap: 16px;
  }

  .stat-item {
    padding: 18px;
  }

  .stat-icon {
    font-size: 30px;
  }

  .stat-value {
    font-size: 26px;
  }

  .achievements-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 14px;
  }
}
</style>
