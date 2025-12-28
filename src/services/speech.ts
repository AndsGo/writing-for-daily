export class SpeechService {
  private synth = window.speechSynthesis
  private voices: SpeechSynthesisVoice[] = []
  private voicesLoaded = false
  private onVoicesLoadedCallbacks: (() => void)[] = []

  constructor() {
    setTimeout(() => {
      this.loadVoices()
      console.log('Initial loadVoices called')
    }, 1000)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.loadVoices()
        console.log('onvoiceschanged event fired')
      }
    }
  }

  private loadVoices() {
    const allVoices = this.synth.getVoices()
    this.voices = allVoices.filter(
      voice => voice.lang.startsWith('en') || voice.lang.startsWith('zh')
    )
    
    console.log('Loaded voices:', this.voices.length)
    console.log('All voices:', allVoices.length)
    
    if (!this.voicesLoaded && this.voices.length > 0) {
      this.voicesLoaded = true
      this.onVoicesLoadedCallbacks.forEach(callback => callback())
      this.onVoicesLoadedCallbacks = []
    }
  }

  onVoicesLoaded(callback: () => void) {
    if (this.voicesLoaded) {
      callback()
    } else {
      this.onVoicesLoadedCallbacks.push(callback)
    }
  }

  speak(text: string, options: {
    rate?: number
    pitch?: number
    voiceName?: string
    onWordBoundary?: (wordIndex: number, word: string) => void
    onEnd?: () => void
  } = {}) {
    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)
    
    utterance.rate = options.rate || 0.8
    utterance.pitch = options.pitch || 1
    
    if (options.voiceName) {
      const voice = this.getVoiceByName(options.voiceName)
      if (voice) {
        utterance.voice = voice
      }
    } else if (this.voices.length > 0) {
      utterance.voice = this.voices[0]
    }

    if (options.onWordBoundary) {
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const words = text.split(/\s+/)
          const charIndex = event.charIndex
          let wordIndex = 0
          let currentIndex = 0

          for (let i = 0; i < words.length; i++) {
            if (currentIndex === charIndex) {
              wordIndex = i
              break
            }
            currentIndex += words[i].length + 1
          }

          options.onWordBoundary(wordIndex, words[wordIndex])
        }
      }
    }

    if (options.onEnd) {
      utterance.onend = () => {
        options.onEnd()
      }
    }

    this.synth.speak(utterance)
  }

  stop() {
    this.synth.cancel()
  }

  pause() {
    this.synth.pause()
  }

  resume() {
    this.synth.resume()
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  getVoicesByLang(lang: string): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang === lang)
  }

  getVoiceByName(name: string): SpeechSynthesisVoice | undefined {
    return this.voices.find(voice => voice.name === name)
  }

  getRecommendedVoices(): { name: string, lang: string, label: string }[] {
    const recommended: { name: string, lang: string, label: string }[] = []
    
    if (this.voices.length === 0) {
      console.warn('No voices available')
      return []
    }
    
    console.log('All voices:', this.voices.length)
    
    const englishVoices = this.voices.filter(v => v.lang.startsWith('en'))
    const chineseVoices = this.voices.filter(v => v.lang.startsWith('zh'))
    const otherVoices = this.voices.filter(v => !v.lang.startsWith('en') && !v.lang.startsWith('zh'))
    
    console.log('English voices:', englishVoices.length)
    console.log('Chinese voices:', chineseVoices.length)
    console.log('Other voices:', otherVoices.length)
    
    const priorityNames = [
      'Google US English',
      'Microsoft David',
      'Microsoft Zira',
      'Microsoft Aria',
      'Microsoft Mark',
      'Google UK English Male',
      'Google UK English Female',
      'Microsoft Hazel',
      'Microsoft George',
      'Microsoft Susan'
    ]

    priorityNames.forEach(name => {
      const voice = this.getVoiceByName(name)
      if (voice) {
        const isUS = voice.lang === 'en-US'
        recommended.push({
          name: voice.name,
          lang: voice.lang,
          label: `${isUS ? '🇺🇸' : '🇬🇧'} ${voice.name}`
        })
      }
    })

    if (englishVoices.length > 0) {
      englishVoices.forEach(voice => {
        if (!recommended.find(r => r.name === voice.name)) {
          const isUS = voice.lang === 'en-US'
          recommended.push({
            name: voice.name,
            lang: voice.lang,
            label: `${isUS ? '🇺🇸' : '🇬🇧'} ${voice.name}`
          })
        }
      })
    }

    if (chineseVoices.length > 0) {
      chineseVoices.forEach(voice => {
        recommended.push({
          name: voice.name,
          lang: voice.lang,
          label: `🇨🇳 ${voice.name}`
        })
      })
    }

    if (otherVoices.length > 0) {
      otherVoices.forEach(voice => {
        recommended.push({
          name: voice.name,
          lang: voice.lang,
          label: `${voice.lang} ${voice.name}`
        })
      })
    }

    console.log('Recommended voices:', recommended)
    return recommended
  }
}

export const speechService = new SpeechService()
