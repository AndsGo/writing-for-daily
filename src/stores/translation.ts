import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/db'
import type { Translation } from '@/types'
import { translationService } from '@/services/translator'
import { speechService } from '@/services/speech'

const MAX_RECENT_COUNT = 10

interface TranslationWithWords extends Translation {
  words: string[]
  currentWordIndex: number
}

export const useTranslationStore = defineStore('translation', () => {
  const currentTranslation = ref<TranslationWithWords | null>(null)
  const recentTranslations = ref<TranslationWithWords[]>([])
  const isTranslating = ref(false)
  const error = ref<string | null>(null)

  async function translate(chineseText: string, category: string = '日常') {
    isTranslating.value = true
    error.value = null

    try {
      const { englishText, keywords } = await translationService.translateWithKeywords(chineseText)
      
      const translation: TranslationWithWords = {
        chineseText,
        englishText,
        keywords,
        category,
        playCount: 0,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        words: englishText.split(/\s+/),
        currentWordIndex: -1
      }

      currentTranslation.value = translation
      addToRecent(translation)
      await saveTranslation(translation)
      return translation
    } catch (err) {
      error.value = err instanceof Error ? err.message : '翻译失败'
      throw err
    } finally {
      isTranslating.value = false
    }
  }

  function addToRecent(translation: TranslationWithWords) {
    const exists = recentTranslations.value.find(
      t => t.chineseText === translation.chineseText && 
          t.englishText === translation.englishText &&
          Math.abs(new Date(t.createdAt).getTime() - new Date(translation.createdAt).getTime()) < 1000
    )
    
    if (!exists) {
      recentTranslations.value.unshift({
        ...translation,
        words: translation.englishText.split(/\s+/),
        currentWordIndex: -1
      })
      
      if (recentTranslations.value.length > MAX_RECENT_COUNT) {
        recentTranslations.value.pop()
      }
    }
  }

  async function removeFromRecent(id: number) {
    recentTranslations.value = recentTranslations.value.filter(t => t.id !== id)
    if (currentTranslation.value?.id === id) {
      currentTranslation.value = recentTranslations.value[0] || null
    }
  }

  async function setCurrentFromRecent(id: number) {
    const translation = recentTranslations.value.find(t => t.id === id)
    if (translation) {
      currentTranslation.value = translation
    }
  }

  async function saveTranslation(translation: TranslationWithWords) {
    const plainTranslation = {
      chineseText: translation.chineseText,
      englishText: translation.englishText,
      keywords: translation.keywords,
      category: translation.category,
      playCount: translation.playCount,
      isFavorite: translation.isFavorite,
      createdAt: translation.createdAt,
      updatedAt: new Date().toISOString()
    }
    const id = await db.translations.add(plainTranslation) as number
    
    translation.id = id
    updateRecentId(translation, id)
    return translation as TranslationWithWords & { id: number }
  }

  function updateRecentId(oldTranslation: TranslationWithWords, newId: number) {
    const index = recentTranslations.value.findIndex(
      t => t.chineseText === oldTranslation.chineseText &&
          t.englishText === oldTranslation.englishText &&
          !t.id
    )
    if (index !== -1) {
      recentTranslations.value[index].id = newId
      if (currentTranslation.value === recentTranslations.value[index]) {
        currentTranslation.value = recentTranslations.value[index]
      }
    }
  }

  async function updatePlayCount(id: number) {
    await db.translations.update(id, { playCount: db.translations.get(id).then(t => (t?.playCount || 0) + 1) })
  }

  async function toggleFavorite(id: number, isFavorite: boolean) {
    await db.translations.update(id, { isFavorite })
    const translation = recentTranslations.value.find(t => t.id === id)
    if (translation) {
      translation.isFavorite = isFavorite
    }
  }

  async function deleteTranslation(id: number) {
    await db.translations.delete(id)
    await removeFromRecent(id)
  }

  function speak(text: string) {
    speechService.speak(text)
  }

  function clearRecent() {
    recentTranslations.value = []
    currentTranslation.value = null
  }

  return {
    currentTranslation,
    recentTranslations,
    isTranslating,
    error,
    translate,
    saveTranslation,
    updatePlayCount,
    toggleFavorite,
    deleteTranslation,
    speak,
    removeFromRecent,
    setCurrentFromRecent,
    clearRecent
  }
})
