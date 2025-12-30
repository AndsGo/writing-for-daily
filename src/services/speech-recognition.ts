export class SpeechRecognitionService {
  private recognition: any = null
  private isRecording = false
  private onResultCallbacks: ((transcript: string, isFinal: boolean) => void)[] = []
  private onErrorCallbacks: ((error: string) => void)[] = []
  private onEndCallbacks: (() => void)[] = []

  constructor() {
    this.initRecognition()
  }

  private initRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition is not supported in this browser')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.lang = 'zh-CN'
    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.maxAlternatives = 1

    this.recognition.onresult = (event: any) => {
      let transcript = ''
      let isFinal = false

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
        if (event.results[i].isFinal) {
          isFinal = true
        }
      }

      this.onResultCallbacks.forEach(callback => callback(transcript, isFinal))
    }

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      
      let errorMessage = '识别失败，请重试'
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = '未检测到语音，请重试'
          break
        case 'audio-capture':
          errorMessage = '无法访问麦克风，请检查麦克风设备'
          break
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝，请点击浏览器地址栏左侧的锁图标允许麦克风访问'
          break
        case 'network':
          errorMessage = '网络错误，请检查网络连接'
          break
        case 'aborted':
          errorMessage = '录音已停止'
          break
        default:
          errorMessage = '识别失败，请重试'
      }

      this.onErrorCallbacks.forEach(callback => callback(errorMessage))
      this.stop()
    }

    this.recognition.onend = () => {
      this.isRecording = false
      this.onEndCallbacks.forEach(callback => callback())
    }

    this.recognition.onstart = () => {
      this.isRecording = true
    }
  }

  isSupported(): boolean {
    return this.recognition !== null
  }

  start() {
    if (!this.recognition) {
      this.onErrorCallbacks.forEach(callback => callback('浏览器不支持语音识别'))
      return
    }

    if (this.isRecording) {
      return
    }

    try {
      this.recognition.start()
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      this.onErrorCallbacks.forEach(callback => callback('启动语音识别失败'))
    }
  }

  stop() {
    if (this.recognition && this.isRecording) {
      try {
        this.recognition.stop()
      } catch (error) {
        console.error('Failed to stop speech recognition:', error)
      }
    }
  }

  onResult(callback: (transcript: string, isFinal: boolean) => void) {
    this.onResultCallbacks.push(callback)
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallbacks.push(callback)
  }

  onEnd(callback: () => void) {
    this.onEndCallbacks.push(callback)
  }

  removeResultCallback(callback: (transcript: string, isFinal: boolean) => void) {
    this.onResultCallbacks = this.onResultCallbacks.filter(cb => cb !== callback)
  }

  removeErrorCallback(callback: (error: string) => void) {
    this.onErrorCallbacks = this.onErrorCallbacks.filter(cb => cb !== callback)
  }

  removeEndCallback(callback: () => void) {
    this.onEndCallbacks = this.onEndCallbacks.filter(cb => cb !== callback)
  }

  getRecordingState(): boolean {
    return this.isRecording
  }
}

export const speechRecognitionService = new SpeechRecognitionService()
