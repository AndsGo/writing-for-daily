<template>
  <div id="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="logo">
            <el-icon><Star /></el-icon>
            <span>英语学习助手</span>
          </div>
          
          <div class="desktop-menu">
            <el-menu
              :default-active="activeMenu"
              mode="horizontal"
              :ellipsis="false"
              @select="handleMenuSelect"
            >
              <el-menu-item index="/">翻译</el-menu-item>
              <el-menu-item index="/history">历史</el-menu-item>
              <el-menu-item index="/progress">进度</el-menu-item>
              <el-menu-item index="/summary">总结</el-menu-item>
              <el-menu-item index="/settings">设置</el-menu-item>
            </el-menu>
          </div>
          
          <el-button class="mobile-menu-btn" @click="mobileMenuVisible = true">
            <el-icon><Menu /></el-icon>
          </el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
      <el-footer>
        <div class="footer-content">
          <span>今日学习：{{ todayCount }}条</span>
          <span>连续：{{ consecutiveDays }}天</span>
          <span>成就：{{ achievementsCount }}个</span>
        </div>
      </el-footer>
    </el-container>
    
    <el-drawer
      v-model="mobileMenuVisible"
      direction="rtl"
      size="60%"
      :with-header="false"
    >
      <div class="mobile-menu">
        <el-menu
          :default-active="activeMenu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/" @click="mobileMenuVisible = false">翻译</el-menu-item>
          <el-menu-item index="/history" @click="mobileMenuVisible = false">历史</el-menu-item>
          <el-menu-item index="/progress" @click="mobileMenuVisible = false">进度</el-menu-item>
          <el-menu-item index="/summary" @click="mobileMenuVisible = false">总结</el-menu-item>
          <el-menu-item index="/settings" @click="mobileMenuVisible = false">设置</el-menu-item>
        </el-menu>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import { Star, Menu } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const progressStore = useProgressStore()

const activeMenu = ref(route.path)
const mobileMenuVisible = ref(false)

const todayCount = computed(() => progressStore.todayCount)
const consecutiveDays = computed(() => progressStore.consecutiveDays)
const achievementsCount = computed(() => progressStore.achievements.length)

const handleMenuSelect = (index: string) => {
  router.push(index)
  activeMenu.value = index
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

.el-container {
  min-height: 100vh;
}

.el-header {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: bold;
  color: #4a90e2;
}

.desktop-menu {
  display: block;
}

.mobile-menu-btn {
  display: none;
}

.el-menu {
  border-bottom: none;
}

.el-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.el-footer {
  background: #ffffff;
  border-top: 1px solid #e8e8e8;
  padding: 0;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 16px 20px;
  color: #8c8c8c;
  font-size: 14px;
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .logo {
    font-size: 18px;
  }

  .desktop-menu {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
  }

  .el-main {
    padding: 16px;
  }

  .footer-content {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
    font-size: 12px;
  }

  .mobile-menu {
    padding: 20px;
  }

  .mobile-menu .el-menu-item {
    height: 50px;
    line-height: 50px;
    font-size: 16px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .header-content {
    padding: 0 24px;
  }

  .logo {
    font-size: 19px;
  }

  .el-main {
    padding: 18px;
  }

  .footer-content {
    gap: 32px;
    padding: 14px 24px;
  }
}
</style>
