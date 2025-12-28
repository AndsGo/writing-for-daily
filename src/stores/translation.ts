import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/db'
import type { Translation } from '@/types'
import { translationService } from '@/services/translator'
import { speechService } from '@/services/speech'

export const useTranslationStore = defineStore('translation', () => {
  const currentTranslation = ref<Translation | null>(null)
  const isTranslating = ref(false)
  const error = ref<string | null>(null)

  async function translate(chineseText: string, category: string = '日常') {
    isTranslating.value = true
    error.value = null

    try {
      const { englishText, keywords } = await translationService.translateWithKeywords(chineseText, category)
      
      const translation: Translation = {
        chineseText,
        englishText,
        keywords,
        category,
        playCount: 0,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      currentTranslation.value = translation
      return translation
    } catch (err) {
      error.value = err instanceof Error ? err.message : '翻译失败'
      throw err
    } finally {
      isTranslating.value = false
    }
  }

  async function saveTranslation(translation: Translation) {
    const plainTranslation = {
      chineseText: translation.chineseText,
      englishText: translation.englishText,
      keywords: translation.keywords,
      category: translation.category,
      playCount: translation.playCount,
      isFavorite: translation.isFavorite,
      createdAt: translation.createdAt,
      updatedAt: translation.updatedAt
    }
    const id = await db.translations.add(plainTranslation) as number
    return { ...translation, id }
  }

  async function updatePlayCount(id: number) {
    await db.translations.update(id, { playCount: db.translations.get(id).then(t => (t?.playCount || 0) + 1) })
  }

  async function toggleFavorite(id: number, isFavorite: boolean) {
    await db.translations.update(id, { isFavorite })
  }

  async function deleteTranslation(id: number) {
    await db.translations.delete(id)
  }

  function speak(text: string) {
    speechService.speak(text)
  }

  return {
    currentTranslation,
    isTranslating,
    error,
    translate,
    saveTranslation,
    updatePlayCount,
    toggleFavorite,
    deleteTranslation,
    speak
  }
})
