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

    <el-card class="settings-card data-management-card">
      <template #header>
        <div class="card-header">
          <span>💾 数据管理</span>
          <el-button size="small" @click="loadDataStats" :loading="statsLoading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div class="settings-content">
        <div class="data-stats">
          <div class="stat-card">
            <div class="stat-value">{{ dataStats.totalTranslations }}</div>
            <div class="stat-label">学习记录</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ dataStats.totalWords }}</div>
            <div class="stat-label">累计词汇</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ dataStats.totalDays }}</div>
            <div class="stat-label">学习天数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ dataStats.achievements }}</div>
            <div class="stat-label">已获成就</div>
          </div>
        </div>

        <div class="export-section">
          <h3>导出数据</h3>
          <p class="export-desc">将您的学习数据导出备份，防止数据丢失</p>
          <div class="export-buttons">
            <el-button type="primary" @click="handleExport('json')" :loading="exporting">
              <el-icon><Download /></el-icon>
              导出 JSON
            </el-button>
            <el-button @click="handleExport('csv')" :loading="exporting">
              <el-icon><Download /></el-icon>
              导出 CSV
            </el-button>
          </div>
        </div>

        <div class="import-section">
          <h3>导入数据</h3>
          <p class="import-desc">从备份文件恢复学习数据</p>
          <el-upload
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".json"
            :show-file-list="false"
          >
            <el-button>
              <el-icon><Upload /></el-icon>
              选择备份文件
            </el-button>
          </el-upload>
        </div>

        <el-divider />

        <div class="danger-zone">
          <h3>⚠️ 危险操作</h3>
          <p class="danger-desc">以下操作将永久删除您的数据，请谨慎操作</p>
          <el-button type="danger" @click="handleClearData">
            <el-icon><Delete /></el-icon>
            清除所有数据
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, RefreshLeft, Refresh, Download, Upload, Delete } from '@element-plus/icons-vue'
import { useVoiceStore } from '@/stores/voice'
import { exportService } from '@/services/export'

const voiceStore = useVoiceStore()
const loading = ref(false)
const statsLoading = ref(false)
const exporting = ref(false)

interface DataStats {
  totalTranslations: number
  totalWords: number
  totalFavorites: number
  totalDays: number
  consecutiveDays: number
  achievements: number
}

const dataStats = ref<DataStats>({
  totalTranslations: 0,
  totalWords: 0,
  totalFavorites: 0,
  totalDays: 0,
  consecutiveDays: 0,
  achievements: 0
})

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

onMounted(async () => {
  await loadDataStats()
})

async function loadDataStats() {
  statsLoading.value = true
  try {
    dataStats.value = await exportService.getDataStats()
  } catch (error) {
    console.error('Failed to load data stats:', error)
  } finally {
    statsLoading.value = false
  }
}

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

async function handleExport(format: 'json' | 'csv') {
  exporting.value = true
  try {
    const blob = await exportService.exportAllData(format)
    const filename = exportService.getExportFilename(format)
    exportService.downloadFile(blob, filename)
    ElMessage.success(`已导出 ${filename}`)
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

async function handleFileChange(event: any) {
  const file = event.raw
  if (!file) return

  try {
    const text = await file.text()
    const result = await exportService.importData(text)
    
    if (result.success) {
      ElMessage.success(`成功导入 ${result.count} 条记录`)
      await loadDataStats()
    } else {
      ElMessage.error(result.error || '导入失败')
    }
  } catch (error) {
    console.error('Import failed:', error)
    ElMessage.error('导入失败，请检查文件格式')
  }
}

async function handleClearData() {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有学习数据吗？此操作不可恢复！',
      '危险操作确认',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const { db } = await import('@/services/db')
    await db.translations.clear()
    await db.progress.clear()
    
    ElMessage.success('已清除所有数据')
    await loadDataStats()
  } catch {
    ElMessage.info('已取消')
  }
}
</script>

<style scoped>
.settings {
  max-width: 800px;
  margin: 0 auto;
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

@media (max-width: 768px) {
  .settings {
    max-width: 100%;
    padding-bottom: 20px;
  }

  .settings-card {
    margin-bottom: 16px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .loading-text,
  .empty-text {
    padding: 16px;
    font-size: 14px;
    line-height: 1.6;
  }

  .empty-text :deep(.el-alert__description) {
    font-size: 14px;
  }

  .empty-text :deep(ul) {
    padding-left: 16px;
  }

  .empty-text :deep(li) {
    margin: 6px 0;
    line-height: 1.6;
  }

  .empty-text :deep(p) {
    margin: 10px 0;
  }

  .settings-content {
    padding: 16px 0;
  }

  .setting-section {
    margin-bottom: 24px;
    padding: 20px;
  }

  .setting-section h3 {
    font-size: 17px;
    margin-bottom: 20px;
  }

  .slider-value {
    font-size: 14px;
    margin-top: 12px;
  }

  .voice-info {
    padding: 16px;
  }

  .setting-actions {
    flex-direction: column;
    gap: 12px;
  }

  .setting-actions .el-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .settings {
    max-width: 90%;
  }

  .setting-section {
    margin-bottom: 32px;
    padding: 18px;
  }

  .setting-section h3 {
    font-size: 17px;
  }
}

.data-management-card {
  border: 2px solid #e8f4fd;
}

.data-management-card .card-header {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  padding: 16px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.export-section,
.import-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.export-section h3,
.import-section h3,
.danger-zone h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #1e293b;
  font-weight: 600;
}

.export-desc,
.import-desc {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 16px;
}

.export-buttons {
  display: flex;
  gap: 12px;
}

.export-buttons .el-button {
  flex: 1;
}

.danger-zone {
  padding: 20px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.danger-zone h3 {
  color: #991b1b;
}

.danger-desc {
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 16px;
}

.danger-zone .el-button {
  width: 100%;
}

@media (max-width: 768px) {
  .data-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 12px 8px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-label {
    font-size: 11px;
  }

  .export-buttons {
    flex-direction: column;
    gap: 10px;
  }

  .export-buttons .el-button {
    width: 100%;
    height: 48px;
  }
}
</style>
