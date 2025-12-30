import type { WordDetail } from '@/types'

const MOCK_DICTIONARY: Record<string, Partial<WordDetail>> = {
  'hello': {
    phonetic: '/həˈloʊ/',
    meanings: [
      { partOfSpeech: 'int.', definitions: ['哈喽，喂（用于问候或引起注意）', '你好'] }
    ],
    examples: [
      'Hello, how are you doing?',
      'She said hello to me with a smile.'
    ],
    synonyms: ['hi', 'hey', 'greetings']
  },
  'thank': {
    phonetic: '/θæŋk/',
    meanings: [
      { partOfSpeech: 'v.', definitions: ['感谢，道谢', '谢谢'] }
    ],
    examples: [
      'Thank you for your help.',
      'I want to thank everyone for coming.'
    ],
    synonyms: ['appreciate', 'grateful']
  },
  'help': {
    phonetic: '/help/',
    meanings: [
      { partOfSpeech: 'v./n.', definitions: ['帮助，援助', '有助于'] }
    ],
    examples: [
      'Can you help me with this?',
      'Thank you for your help.'
    ],
    synonyms: ['assist', 'support', 'aid']
  },
  'please': {
    phonetic: '/pliːz/',
    meanings: [
      { partOfSpeech: 'adv.', definitions: ['请（用于礼貌地请求）', '麻烦你'] }
    ],
    examples: [
      'Please close the door.',
      'Could you please help me?'
    ],
    synonyms: ['kindly', 'pray']
  },
  'goodbye': {
    phonetic: '/ɡʊdˈbaɪ/',
    meanings: [
      { partOfSpeech: 'int./n.', definitions: ['再见', '告别'] }
    ],
    examples: [
      'Goodbye, see you tomorrow!',
      'She said goodbye to her friends.'
    ],
    synonyms: ['farewell', 'bye', 'see you']
  },
  'meeting': {
    phonetic: '/ˈmiːtɪŋ/',
    meanings: [
      { partOfSpeech: 'n.', definitions: ['会议', '会面', '集会'] }
    ],
    examples: [
      'We have a meeting at 3 PM.',
      'The meeting was very productive.'
    ],
    synonyms: ['conference', 'session', 'gathering']
  },
  'report': {
    phonetic: '/rɪˈpɔːrt/',
    meanings: [
      { partOfSpeech: 'n./v.', definitions: ['报告，汇报', '报道', '说明'] }
    ],
    examples: [
      'Please submit your report by Friday.',
      'I need to report this issue.'
    ],
    synonyms: ['document', 'account', 'statement']
  }
}

export class DictionaryService {
  private cache = new Map<string, WordDetail>()
  private loading = new Set<string>()

  async getWordDetail(word: string): Promise<WordDetail> {
    const normalizedWord = word.toLowerCase().trim()
    
    if (this.cache.has(normalizedWord)) {
      return this.cache.get(normalizedWord)!
    }

    if (this.loading.has(normalizedWord)) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return this.getWordDetail(word)
    }

    this.loading.add(normalizedWord)

    try {
      const detail = await this.fetchWordDetail(normalizedWord)
      this.cache.set(normalizedWord, detail)
      return detail
    } finally {
      this.loading.delete(normalizedWord)
    }
  }

  private async fetchWordDetail(word: string): Promise<WordDetail> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const mockData = MOCK_DICTIONARY[word]
    
    if (mockData) {
      return {
        word,
        phonetic: mockData.phonetic || `/${word}/`,
        meanings: mockData.meanings || [
          { partOfSpeech: 'n./v.', definitions: [word] }
        ],
        examples: mockData.examples || [
          `This is an example sentence with ${word}.`,
          `Would you like to use ${word} in this context?`
        ],
        synonyms: mockData.synonyms || [],
        difficulty: this.calculateDifficulty(word)
      }
    }

    return {
      word,
      phonetic: `/${word}/`,
      meanings: [
        { partOfSpeech: 'n./v.', definitions: [word] }
      ],
      examples: [
        `This is an example sentence with ${word}.`,
        `Would you like to use ${word} in this context?`
      ],
      synonyms: [],
      difficulty: this.calculateDifficulty(word)
    }
  }

  private calculateDifficulty(word: string): 'easy' | 'medium' | 'hard' {
    const length = word.length
    if (length <= 4) return 'easy'
    if (length <= 8) return 'medium'
    return 'hard'
  }

  clearCache() {
    this.cache.clear()
  }
}

export const dictionaryService = new DictionaryService()
