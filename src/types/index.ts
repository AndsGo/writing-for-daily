export interface Translation {
  id?: number
  chineseText: string
  englishText: string
  keywords: string
  category: string
  playCount: number
  isFavorite: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Progress {
  id?: number
  totalDays: number
  totalTranslations: number
  totalWords: number
  totalPlays: number
  consecutiveDays: number
  lastStudyDate: string
  achievements: string[]
}

export interface DailySummary {
  id?: number
  date: string
  translationCount: number
  newWords: number
  playCount: number
  studyTime: number
  topExpression: string
  topExpressionCount: number
  newScenarios: string[]
  progressIndex: number
  suggestions: string[]
  createdAt: string
}
