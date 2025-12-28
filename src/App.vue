<template>
  <div id="app">
    <el-container class="app-container">
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo">
            <el-icon><Star /></el-icon>
            <span>英语学习助手</span>
          </div>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
      <el-footer class="app-footer">
        <div class="footer-content">
          <span>今日学习：{{ todayCount }}条</span>
          <span>连续：{{ consecutiveDays }}天</span>
          <span>成就：{{ achievementsCount }}个</span>
        </div>
      </el-footer>
    </el-container>
    
    <div class="bottom-nav" v-if="isMobile">
      <div 
        v-for="item in navItems" 
        :key="item.path"
        class="nav-item"
        :class="{ active: activeMenu === item.path }"
        @click="handleNavClick(item.path)"
      >
        <el-icon :size="20">
          <component :is="item.icon" />
        </el-icon>
        <span class="nav-label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import { Star, Document, TrendCharts, DataAnalysis, Setting } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const progressStore = useProgressStore()

const activeMenu = ref(route.path)
const isMobile = computed(() => window.innerWidth <= 768)

const navItems = [
  { path: '/', label: '翻译', icon: Document },
  { path: '/history', label: '历史', icon: Star },
  { path: '/progress', label: '进度', icon: TrendCharts },
  { path: '/summary', label: '总结', icon: DataAnalysis },
  { path: '/settings', label: '设置', icon: Setting }
]

const todayCount = computed(() => progressStore.todayCount)
const consecutiveDays = computed(() => progressStore.consecutiveDays)
const achievementsCount = computed(() => progressStore.achievements.length)

const handleNavClick = (path: string) => {
  router.push(path)
  activeMenu.value = path
}

onMounted(async () => {
  await progressStore.loadProgress()
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: #f5f5f5;
}

.app-container {
  min-height: 100vh;
}

.app-header {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 56px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #4a90e2;
}

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 80px;
}

.app-footer {
  background: #ffffff;
  border-top: 1px solid #e8e8e8;
  padding: 0;
  height: 40px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 8px 20px;
  color: #8c8c8c;
  font-size: 12px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #ffffff;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  height: 100%;
  cursor: pointer;
  transition: all 0.3s;
  color: #8c8c8c;
}

.nav-item:active {
  background: #f5f5f5;
}

.nav-item.active {
  color: #4a90e2;
}

.nav-label {
  font-size: 11px;
}

@media (min-width: 769px) {
  .bottom-nav {
    display: none;
  }

  .app-main {
    padding-bottom: 20px;
  }

  .app-header {
    height: 64px;
  }

  .header-content {
    justify-content: space-between;
  }

  .logo {
    font-size: 20px;
  }

  .app-main {
    padding: 20px;
  }

  .app-footer {
    height: 50px;
  }

  .footer-content {
    font-size: 14px;
    padding: 12px 20px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .logo {
    font-size: 16px;
  }

  .app-main {
    padding: 16px;
    padding-bottom: 80px;
  }

  .footer-content {
    flex-direction: row;
    gap: 16px;
    padding: 8px 16px;
    font-size: 10px;
  }
}
</style>
