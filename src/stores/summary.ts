import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/db'
import { summaryService } from '@/services/summary'
import type { DailySummary } from '@/types'

export const useSummaryStore = defineStore('summary', () => {
  const currentSummary = ref<DailySummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function generateSummary(date: string) {
    loading.value = true
    error.value = null

    try {
      const cached = await db.dailySummaries.where('date').equals(date).first()
      
      if (cached) {
        currentSummary.value = cached
        return cached
      }

      const summary = await summaryService.generateDailySummary(date)
      await db.dailySummaries.add(summary)
      currentSummary.value = summary
      return summary
    } catch (err) {
      error.value = err instanceof Error ? err.message : '生成总结失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadSummary(date: string) {
    loading.value = true
    try {
      const summary = await db.dailySummaries.where('date').equals(date).first()
      currentSummary.value = summary || null
    } finally {
      loading.value = false
    }
  }

  return {
    currentSummary,
    loading,
    error,
    generateSummary,
    loadSummary
  }
})
