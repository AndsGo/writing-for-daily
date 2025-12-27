import Dexie, { Table } from 'dexie'
import type { Translation, Progress, DailySummary } from '@/types'

export class EnglishLearningDB extends Dexie {
  translations!: Table<Translation>
  progress!: Table<Progress>
  dailySummaries!: Table<DailySummary>

  constructor() {
    super('EnglishLearningDB')
    this.version(1).stores({
      translations: '++id, createdAt, category, isFavorite',
      progress: 'id',
      dailySummaries: '++id, date'
    })
  }
}

export const db = new EnglishLearningDB()
