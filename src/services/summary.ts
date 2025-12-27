import { db } from './db'
import type { DailySummary, Translation } from '@/types'

export class SummaryService {
  async generateDailySummary(date: string): Promise<DailySummary> {
    const startDate = new Date(date + 'T00:00:00')
    const endDate = new Date(date + 'T23:59:59')

    const translations = await db.translations
      .where('createdAt')
      .between(startDate.toISOString(), endDate.toISOString())
      .toArray()

    const translationCount = translations.length
    const newWords = this.countUniqueWords(translations)
    const playCount = translations.reduce((sum, t) => sum + t.playCount, 0)
    const studyTime = translationCount * 2

    const { topExpression, topExpressionCount } = 
      this.findTopExpression(translations)
    const newScenarios = this.findNewScenarios(translations)
    const progressIndex = this.calculateProgressIndex(translations)
    const suggestions = this.generateSuggestions(translations)

    return {
      date,
      translationCount,
      newWords,
      playCount,
      studyTime,
      topExpression,
      topExpressionCount,
      newScenarios,
      progressIndex,
      suggestions,
      createdAt: new Date().toISOString()
    }
  }

  private countUniqueWords(translations: Translation[]): number {
    const allWords = translations.flatMap(t => t.keywords.split(','))
    return new Set(allWords).size
  }

  private findTopExpression(translations: Translation[]): {
    topExpression: string
    topExpressionCount: number
  } {
    const expressionCount = new Map<string, number>()
    translations.forEach(t => {
      const count = expressionCount.get(t.englishText) || 0
      expressionCount.set(t.englishText, count + 1)
    })

    let topExpression = ''
    let topExpressionCount = 0
    expressionCount.forEach((count, expr) => {
      if (count > topExpressionCount) {
        topExpression = expr
        topExpressionCount = count
      }
    })

    return { topExpression, topExpressionCount }
  }

  private findNewScenarios(translations: Translation[]): string[] {
    const scenarios = [...new Set(translations.map(t => t.category))]
    return scenarios
  }

  private calculateProgressIndex(translations: Translation[]): number {
    if (translations.length === 0) return 0
    if (translations.length < 5) return 1
    if (translations.length < 10) return 2
    if (translations.length < 20) return 3
    return 4
  }

  private generateSuggestions(translations: Translation[]): string[] {
    const suggestions: string[] = []
    
    if (translations.length < 5) {
      suggestions.push('多输入一些内容，积累更多表达')
    }
    
    const scenarios = [...new Set(translations.map(t => t.category))]
    if (scenarios.length < 3) {
      suggestions.push('尝试不同场景的表达，丰富学习内容')
    }
    
    const avgPlayCount = translations.reduce((sum, t) => sum + t.playCount, 0) / translations.length
    if (avgPlayCount < 2) {
      suggestions.push('多听英语朗读，模仿发音')
    }

    return suggestions
  }
}

export const summaryService = new SummaryService()
