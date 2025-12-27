<template>
  <div class="settings">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>🎙️ 发音设置</span>
          <el-button size="small" @click="handleRefreshVoices" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新语音
          </el-button>
        </div>
      </template>

      <div class="settings-content">
        <div class="setting-section">
          <h3>选择语音</h3>
          <div v-if="loading" class="loading-text">
            正在加载语音列表...
          </div>
          <div v-if="recommendedVoices.length === 0" class="empty-text">
            <el-alert
              title="没有找到可用的语音"
              type="warning"
              :closable="false"
              style="margin-bottom: 20px;"
            >
              <template #default>
                <p>当前浏览器环境中没有找到可用的语音。</p>
                <p><strong>解决方案：</strong></p>
                <ul>
                  <li>使用 Chrome 浏览器（推荐）</li>
                  <li>确保系统已安装英语语音包</li>
                  <li>在 Windows 设置中添加英语语音</li>
                  <li>尝试使用其他浏览器（如 Edge）</li>
                </ul>
                <p style="margin-top: 10px;">
                  <el-button type="primary" size="small" @click="handleRefreshVoices">
                    <el-icon><Refresh /></el-icon>
                    重新加载语音
                  </el-button>
                </p>
              </template>
            </el-alert>
          </div>
          <div v-else>
            <el-select 
              v-model="voiceStore.settings.selectedVoice" 
              placeholder="选择语音"
              style="width: 100%; margin-bottom: 20px;"
              @change="voiceStore.updateVoice"
            >
              <el-option
                v-for="voice in recommendedVoices"
                :key="voice.name"
                :label="voice.label"
                :value="voice.name"
              />
            </el-select>

            <el-button type="primary" @click="handleTestVoice" style="width: 100%; margin-bottom: 30px;">
              <el-icon><VideoPlay /></el-icon>
              试听当前语音
            </el-button>
          </div>
        </div>

        <div class="setting-section">
          <h3>语速调节</h3>
          <el-slider
            v-model="voiceStore.settings.rate"
            :min="0.1"
            :max="2"
            :step="0.1"
            :marks="rateMarks"
            @change="voiceStore.updateRate"
          />
          <div class="slider-value">
            当前语速: {{ voiceStore.settings.rate.toFixed(1) }}x
          </div>
        </div>

        <div class="setting-section">
          <h3>音调调节</h3>
          <el-slider
            v-model="voiceStore.settings.pitch"
            :min="0.5"
            :max="2"
            :step="0.1"
            :marks="pitchMarks"
            @change="voiceStore.updatePitch"
          />
          <div class="slider-value">
            当前音调: {{ voiceStore.settings.pitch.toFixed(1) }}
          </div>
        </div>

        <div class="setting-section">
          <h3>语音信息</h3>
          <div class="voice-info">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="当前语音">
                {{ voiceStore.settings.selectedVoice }}
              </el-descriptions-item>
              <el-descriptions-item label="语速">
                {{ voiceStore.settings.rate.toFixed(1) }}x
              </el-descriptions-item>
              <el-descriptions-item label="音调">
                {{ voiceStore.settings.pitch.toFixed(1) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <div class="setting-actions">
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            恢复默认设置
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { VideoPlay, RefreshLeft, Refresh } from '@element-plus/icons-vue'
import { useVoiceStore } from '@/stores/voice'

const voiceStore = useVoiceStore()
const loading = ref(false)

const recommendedVoices = computed(() => voiceStore.getRecommendedVoices())

const rateMarks = {
  0.1: '慢',
  0.8: '正常',
  2: '快'
}

const pitchMarks = {
  0.5: '低',
  1: '正常',
  2: '高'
}

watch(recommendedVoices, (newVoices) => {
  console.log('Recommended voices changed:', newVoices)
  if (newVoices.length > 0 && voiceStore.settings.selectedVoice === '') {
    console.log('Voice list loaded, setting first available voice')
    voiceStore.updateVoice(newVoices[0].name)
  }
}, { immediate: true })

function handleRefreshVoices() {
  loading.value = true
  setTimeout(() => {
    const voices = recommendedVoices.value
    console.log('Refreshed voices:', voices)
    if (voices.length > 0 && voiceStore.settings.selectedVoice === '') {
      voiceStore.updateVoice(voices[0].name)
    }
    loading.value = false
  }, 500)
}

function handleTestVoice() {
  voiceStore.testVoice('Hello, this is a test of voice settings.')
}

function handleReset() {
  voiceStore.resetSettings()
}
</script>

<style scoped>
.settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-text,
.empty-text {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}

.empty-text :deep(.el-alert__description) {
  font-size: 14px;
}

.empty-text :deep(ul) {
  margin: 10px 0;
  padding-left: 20px;
}

.empty-text :deep(li) {
  margin: 5px 0;
  line-height: 1.6;
}

.empty-text :deep(p) {
  margin: 10px 0;
  line-height: 1.6;
}

.settings-content {
  padding: 20px 0;
}

.setting-section {
  margin-bottom: 40px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.setting-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #303133;
  font-weight: 500;
}

.slider-value {
  margin-top: 10px;
  text-align: center;
  color: #606266;
  font-size: 14px;
}

.voice-info {
  background: white;
  padding: 15px;
  border-radius: 8px;
}

.setting-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
</style>
