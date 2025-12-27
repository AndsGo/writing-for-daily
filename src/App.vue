<template>
  <div id="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="logo">
            <el-icon><Star /></el-icon>
            <span>英语学习助手</span>
          </div>
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
          </el-menu>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import { Star } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const progressStore = useProgressStore()

const activeMenu = ref(route.path)

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
</style>
