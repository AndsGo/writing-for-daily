export class SpeechService {
  private synth = window.speechSynthesis
  private voices: SpeechSynthesisVoice[] = []

  constructor() {
    this.loadVoices()
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices()
    }
  }

  private loadVoices() {
    this.voices = this.synth.getVoices().filter(
      voice => voice.lang.startsWith('en')
    )
  }

  speak(text: string, options: {
    rate?: number
    pitch?: number
    voiceIndex?: number
  } = {}) {
    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)
    
    utterance.rate = options.rate || 0.8
    utterance.pitch = options.pitch || 1
    
    if (this.voices.length > 0) {
      utterance.voice = this.voices[options.voiceIndex || 0]
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
}

export const speechService = new SpeechService()
