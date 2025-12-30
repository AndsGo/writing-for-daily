import { defineStore } from 'pinia'
import { ref } from 'vue'
import { speechService } from '@/services/speech'

interface VoiceSettings {
  selectedVoice: string
  rate: number
  pitch: number
}

const DEFAULT_SETTINGS: VoiceSettings = {
  selectedVoice: 'Google US English',
  rate: 0.8,
  pitch: 1
}

export const useVoiceStore = defineStore('voice', () => {
  const settings = ref<VoiceSettings>({ ...DEFAULT_SETTINGS })

  function loadSettings() {
    const saved = localStorage.getItem('voiceSettings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        settings.value = { ...DEFAULT_SETTINGS, ...parsed }
      } catch (e) {
        console.error('Failed to parse voice settings:', e)
      }
    }
    
    const availableVoices = speechService.getRecommendedVoices()
    console.log('Available voices:', availableVoices)
    if (availableVoices.length === 0) {
      console.warn('No voices available')
      settings.value.selectedVoice = ''
    } else if (!availableVoices.find(v => v.name === settings.value.selectedVoice)) {
      console.warn('Current voice not available, switching to first available voice')
      settings.value.selectedVoice = availableVoices[0].name
      saveSettings()
    }
  }

  speechService.onVoicesLoaded(() => {
    console.log('Voices loaded, reloading settings')
    loadSettings()
  })

  loadSettings()

  function saveSettings() {
    localStorage.setItem('voiceSettings', JSON.stringify(settings.value))
  }

  function updateVoice(voiceName: string) {
    settings.value.selectedVoice = voiceName
    saveSettings()
  }

  function updateRate(rate: number) {
    settings.value.rate = Math.max(0.1, Math.min(10, rate))
    saveSettings()
  }

  function updatePitch(pitch: number) {
    settings.value.pitch = Math.max(0, Math.min(2, pitch))
    saveSettings()
  }

  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    saveSettings()
  }

  function getRecommendedVoices() {
    return speechService.getRecommendedVoices()
  }

  function testVoice(text: string = 'Hello, this is a test.') {
    speechService.speak(text, {
      voiceName: settings.value.selectedVoice,
      rate: settings.value.rate,
      pitch: settings.value.pitch
    })
  }

  return {
    settings,
    loadSettings,
    saveSettings,
    updateVoice,
    updateRate,
    updatePitch,
    resetSettings,
    getRecommendedVoices,
    testVoice
  }
})
