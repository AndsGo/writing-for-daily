import Dexie, { Table } from 'dexie'
import type { Translation, Progress, DailySummary } from '@/types'

export class EnglishLearningDB extends Dexie {
  translations!: Table<Translation & { id: number }>
  progress!: Table<Progress>
  dailySummaries!: Table<DailySummary & { id: number }>

  constructor() {
    super('EnglishLearningDB')
    this.version(1).stores({
      translations: '++id,createdAt,category,isFavorite',
      progress: 'id',
      dailySummaries: '++id,date'
    })
  }
}

export const db = new EnglishLearningDB()
