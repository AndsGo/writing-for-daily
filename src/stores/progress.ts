import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/db'
import type { Progress, Translation } from '@/types'

const ACHIEVEMENTS = [
  { id: 'first_translation', name: '初出茅庐', description: '完成第1条翻译', condition: (p: Progress) => p.totalTranslations >= 1 },
  { id: 'ten_translations', name: '小有成就', description: '完成10条翻译', condition: (p: Progress) => p.totalTranslations >= 10 },
  { id: 'hundred_words', name: '词汇达人', description: '累计学习100个词汇', condition: (p: Progress) => p.totalWords >= 100 },
  { id: 'hundred_plays', name: '发音练习家', description: '累计播放100次', condition: (p: Progress) => p.totalPlays >= 100 },
  { id: 'seven_days', name: '坚持达人', description: '连续学习7天', condition: (p: Progress) => p.consecutiveDays >= 7 },
  { id: 'thirty_days', name: '学习大师', description: '连续学习30天', condition: (p: Progress) => p.consecutiveDays >= 30 }
]

export const useProgressStore = defineStore('progress', () => {
  const progress = ref<Progress>({
    id: 1,
    totalDays: 0,
    totalTranslations: 0,
    totalWords: 0,
    totalPlays: 0,
    consecutiveDays: 0,
    lastStudyDate: new Date().toISOString(),
    achievements: []
  })

  const todayCount = ref(0)

  async function loadProgress() {
    const saved = await db.progress.get(1)
    if (saved) {
      progress.value = saved
    } else {
      await db.progress.add({
        id: 1,
        totalDays: 0,
        totalTranslations: 0,
        totalWords: 0,
        totalPlays: 0,
        consecutiveDays: 0,
        lastStudyDate: new Date().toISOString(),
        achievements: []
      })
    }
    await updateTodayCount()
  }

  async function updateTodayCount() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayTranslations = await db.translations
      .where('createdAt')
      .between(today, tomorrow)
      .toArray()

    todayCount.value = todayTranslations.length
  }

  async function addTranslation(translation: Translation) {
    progress.value.totalTranslations++
    progress.value.totalWords += translation.keywords.split(',').length
    await updateConsecutiveDays()
    await checkAchievements()
    await saveProgress()
  }

  async function addPlay() {
    progress.value.totalPlays++
    await saveProgress()
  }

  async function updateConsecutiveDays() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const lastStudy = new Date(progress.value.lastStudyDate)
    lastStudy.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return
    } else if (diffDays === 1) {
      progress.value.consecutiveDays++
      progress.value.totalDays++
    } else {
      progress.value.consecutiveDays = 1
      progress.value.totalDays++
    }

    progress.value.lastStudyDate = new Date().toISOString()
  }

  async function checkAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
      if (!progress.value.achievements.includes(achievement.id) && achievement.condition(progress.value)) {
        progress.value.achievements.push(achievement.id)
      }
    })
  }

  async function saveProgress() {
    await db.progress.put({
      id: 1,
      totalDays: progress.value.totalDays,
      totalTranslations: progress.value.totalTranslations,
      totalWords: progress.value.totalWords,
      totalPlays: progress.value.totalPlays,
      consecutiveDays: progress.value.consecutiveDays,
      lastStudyDate: progress.value.lastStudyDate,
      achievements: [...progress.value.achievements]
    })
  }

  function getAchievementInfo(id: string) {
    return ACHIEVEMENTS.find(a => a.id === id)
  }

  function getAllAchievements() {
    if (!progress.value) {
      return ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked: false
      }))
    }
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: (progress.value.achievements || []).includes(a.id)
    }))
  }

  return {
    progress,
    todayCount,
    consecutiveDays: computed(() => progress.value.consecutiveDays),
    achievements: computed(() => progress.value.achievements),
    loadProgress,
    updateTodayCount,
    addTranslation,
    addPlay,
    getAchievementInfo,
    getAllAchievements
  }
})
