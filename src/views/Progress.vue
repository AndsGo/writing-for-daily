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
              <div class="stat-value">{{ progress.totalDays }}</div>
              <div class="stat-label">学习天数</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">📝</div>
              <div class="stat-value">{{ progress.totalTranslations }}</div>
              <div class="stat-label">累计输入</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">📚</div>
              <div class="stat-value">{{ progress.totalWords }}</div>
              <div class="stat-label">累计词汇</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">🔊</div>
              <div class="stat-value">{{ progress.totalPlays }}</div>
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
              <span class="progress-text">{{ progress.consecutiveDays }}/30天</span>
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
        </div>
      </template>
      
      <div class="achievements-grid">
        <div
          v-for="achievement in allAchievements"
          :key="achievement.id"
          class="achievement-item"
          :class="{ unlocked: achievement.unlocked }"
        >
          <div class="achievement-icon">
            {{ achievement.unlocked ? '✅' : '⏳' }}
          </div>
          <div class="achievement-info">
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-desc">{{ achievement.description }}</div>
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
          <div class="calendar-cell">
            <div class="calendar-date">{{ data.day.split('-').slice(2).join('-') }}</div>
            <div v-if="hasStudiedOnDate(data.day)" class="calendar-dot"></div>
          </div>
        </template>
      </el-calendar>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { useHistoryStore } from '@/stores/history'
import { db } from '@/services/db'

const progressStore = useProgressStore()
const historyStore = useHistoryStore()

const calendarDate = ref(new Date())

const { progress, getAllAchievements } = progressStore

const allAchievements = computed(() => getAllAchievements())

const streakPercentage = computed(() => {
  return Math.min((progress.consecutiveDays / 30) * 100, 100)
})

const streakMessage = computed(() => {
  const remaining = 30 - progress.consecutiveDays
  if (remaining <= 0) {
    return '太棒了！你已经连续学习30天了！'
  } else if (remaining <= 7) {
    return `再坚持${remaining}天，获得"学习大师"成就！`
  } else {
    return `继续加油！坚持就是胜利！`
  }
})

async function hasStudiedOnDate(dateStr: string) {
  const date = new Date(dateStr)
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const count = await db.translations
    .where('createdAt')
    .between(startOfDay, endOfDay)
    .count()

  return count > 0
}

onMounted(async () => {
  await progressStore.loadProgress()
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.achievement-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  transition: all 0.3s;
}

.achievement-item.unlocked {
  background: #e6f7ff;
  border: 2px solid #4a90e2;
}

.achievement-icon {
  font-size: 24px;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-weight: bold;
  color: #262626;
  margin-bottom: 4px;
}

.achievement-desc {
  font-size: 12px;
  color: #8c8c8c;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
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
</style>
