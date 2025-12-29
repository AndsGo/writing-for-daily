import { db } from './db'

export class ExportService {
  async exportAllData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const translations = await db.translations.toArray()
    const progress = await db.progress.toArray()
    const achievements = progress[0]?.achievements || []

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      translations,
      progress: progress[0] || null,
      stats: {
        totalTranslations: translations.length,
        totalWords: translations.reduce((sum, t) => sum + t.keywords.split(',').length, 0),
        totalFavorites: translations.filter(t => t.isFavorite).length
      }
    }

    if (format === 'json') {
      return new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json;charset=utf-8'
      })
    } else {
      return this.convertToCSV(translations)
    }
  }

  private convertToCSV(translations: any[]): Blob {
    const headers = ['中文', '英文', '分类', '关键词', '收藏', '创建时间']
    const rows = translations.map(t => [
      `"${String(t.chineseText || '').replace(/"/g, '""')}"`,
      `"${String(t.englishText || '').replace(/"/g, '""')}"`,
      t.category || '',
      `"${String(t.keywords || '').replace(/"/g, '""')}"`,
      t.isFavorite ? '是' : '否',
      t.createdAt || ''
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  }

  downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  getExportFilename(format: 'json' | 'csv'): string {
    const date = new Date().toISOString().split('T')[0]
    return `english-learning-${date}.${format}`
  }

  async getDataStats() {
    const translations = await db.translations.toArray()
    const progress = await db.progress.toArray()

    return {
      totalTranslations: translations.length,
      totalWords: translations.reduce((sum, t) => sum + (t.keywords?.split(',').length || 0), 0),
      totalFavorites: translations.filter(t => t.isFavorite).length,
      totalDays: progress[0]?.totalDays || 0,
      consecutiveDays: progress[0]?.consecutiveDays || 0,
      achievements: progress[0]?.achievements?.length || 0
    }
  }

  async importData(data: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed = JSON.parse(data)
      
      if (!parsed.translations || !Array.isArray(parsed.translations)) {
        return { success: false, count: 0, error: '无效的数据格式' }
      }

      for (const t of parsed.translations) {
        await db.translations.add({
          chineseText: t.chineseText,
          englishText: t.englishText,
          keywords: t.keywords,
          category: t.category || '日常',
          playCount: t.playCount || 0,
          isFavorite: t.isFavorite || false,
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString()
        })
      }

      return { success: true, count: parsed.translations.length }
    } catch (error) {
      return { success: false, count: 0, error: error instanceof Error ? error.message : '导入失败' }
    }
  }
}

export const exportService = new ExportService()
