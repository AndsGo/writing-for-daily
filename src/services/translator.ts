export class TranslationService {
  private apiUrl = 'https://api.mymemory.translated.net/get'

  async translate(chineseText: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.apiUrl}?q=${encodeURIComponent(chineseText)}&langpair=zh|en`
      )
      const data = await response.json()
      
      if (data.responseStatus === 200) {
        return data.responseData.translatedText
      }
      
      throw new Error(data.responseDetails || 'Translation failed')
    } catch (error) {
      console.error('Translation error:', error)
      throw error
    }
  }

  async translateWithKeywords(chineseText: string): Promise<{
    englishText: string
    keywords: string
  }> {
    const englishText = await this.translate(chineseText)
    const keywords = this.extractKeywords(englishText)
    return { englishText, keywords: keywords.join(',') }
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
    return [...new Set(words)].slice(0, 10)
  }
}

export const translationService = new TranslationService()
