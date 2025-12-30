import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import History from '@/views/History.vue'
import Progress from '@/views/Progress.vue'
import Summary from '@/views/Summary.vue'
import Settings from '@/views/Settings.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/history',
      name: 'History',
      component: History
    },
    {
      path: '/progress',
      name: 'Progress',
      component: Progress
    },
    {
      path: '/summary',
      name: 'Summary',
      component: Summary
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings
    }
  ]
})

export default router
