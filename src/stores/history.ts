import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/db'
import type { Translation } from '@/types'

export const useHistoryStore = defineStore('history', () => {
  const translations = ref<Translation[]>([])
  const loading = ref(false)

  async function loadTranslations(limit: number = 50) {
    loading.value = true
    try {
      translations.value = await db.translations
        .orderBy('createdAt')
        .reverse()
        .limit(limit)
        .toArray()
    } finally {
      loading.value = false
    }
  }

  async function searchTranslations(query: string) {
    loading.value = true
    try {
      const all = await db.translations.toArray()
      translations.value = all.filter(t => 
        t.chineseText.includes(query) || 
        t.englishText.toLowerCase().includes(query.toLowerCase())
      )
    } finally {
      loading.value = false
    }
  }

  async function filterByCategory(category: string) {
    loading.value = true
    try {
      if (category === '全部') {
        await loadTranslations()
      } else {
        translations.value = await db.translations
          .where('category')
          .equals(category)
          .reverse()
          .toArray()
      }
    } finally {
      loading.value = false
    }
  }

  async function deleteTranslation(id: number) {
    await db.translations.delete(id)
    translations.value = translations.value.filter(t => t.id !== id)
  }

  async function toggleFavorite(id: number) {
    const translation = translations.value.find(t => t.id === id)
    if (translation) {
      translation.isFavorite = !translation.isFavorite
      await db.translations.update(id, { isFavorite: translation.isFavorite })
    }
  }

  return {
    translations,
    loading,
    loadTranslations,
    searchTranslations,
    filterByCategory,
    deleteTranslation,
    toggleFavorite
  }
})
