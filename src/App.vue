<template>
  <div id="app">
    <el-container class="app-container">
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo" @click="$router.push('/')">
            <el-icon><Star /></el-icon>
            <span>英语学习助手</span>
          </div>
          <nav class="pc-nav" v-if="!showMobileNav">
            <div 
              v-for="item in navItems" 
              :key="item.path"
              class="pc-nav-item"
              :class="{ active: activeMenu === item.path }"
              @click="handleNavClick(item.path)"
            >
              <el-icon><Document v-if="item.path === '/'" /><Star v-else-if="item.path === '/history'" /><TrendCharts v-else-if="item.path === '/progress'" /><DataAnalysis v-else-if="item.path === '/summary'" /><Setting v-else-if="item.path === '/settings'" /></el-icon>
              <span>{{ item.label }}</span>
            </div>
          </nav>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
      <el-footer class="app-footer">
        <div class="footer-content">
          <span>今日学习：{{ todayCount }}条</span>
          <span>连续：{{ consecutiveDays }}天</span>
          <el-link 
            type="primary" 
            class="achievement-link"
            @click="$router.push('/progress')"
          >
            <el-icon><Trophy /></el-icon>
            成就：{{ achievementsCount }}个
          </el-link>
        </div>
      </el-footer>
    </el-container>
    
    <div class="bottom-nav" v-if="showMobileNav">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import { Star, Document, TrendCharts, DataAnalysis, Setting, Trophy } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const progressStore = useProgressStore()

const activeMenu = ref(route.path)
const showMobileNav = ref(false)

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

const checkIsMobile = () => {
  showMobileNav.value = window.innerWidth <= 768
}

onMounted(async () => {
  await progressStore.loadProgress()
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
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
  cursor: pointer;
}

.pc-nav {
  display: flex;
  gap: 8px;
}

.pc-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #606266;
  font-size: 14px;
}

.pc-nav-item:hover {
  background: #f5f7fa;
  color: #4a90e2;
}

.pc-nav-item.active {
  background: #ecf5ff;
  color: #4a90e2;
  font-weight: 500;
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
  align-items: center;
  gap: 40px;
  padding: 8px 20px;
  color: #8c8c8c;
  font-size: 12px;
}

.achievement-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.achievement-link .el-icon {
  color: #f59e0b;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(60px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
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
  min-height: 44px;
}

.nav-item:active {
  background: #f5f5f5;
}

.nav-item.active {
  color: #4a90e2;
  font-weight: 500;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 8px;
  width: 20px;
  height: 3px;
  background: #4a90e2;
  border-radius: 2px;
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
    padding: 0 40px;
  }

  .logo {
    font-size: 20px;
  }

  .app-main {
    padding: 24px 40px;
  }

  .app-footer {
    height: 50px;
  }

  .footer-content {
    font-size: 14px;
    padding: 12px 40px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
    max-width: 100%;
    margin: 0;
  }

  .logo {
    font-size: 16px;
  }

  .app-main {
    padding: 16px;
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    max-width: 100%;
    margin: 0;
  }

  .footer-content {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    padding: 8px 16px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    font-size: 10px;
    max-width: 100%;
    margin: 0;
  }

  .achievement-link {
    font-size: 10px;
  }

  .nav-item {
    gap: 2px;
  }

  .nav-item:active {
    background: #f0f7ff;
  }

  .nav-label {
    font-size: 10px;
  }
}
</style>
