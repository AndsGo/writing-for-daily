import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import History from '@/views/History.vue'
import Progress from '@/views/Progress.vue'
import Summary from '@/views/Summary.vue'

const router = createRouter({
  history: createWebHistory(),
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
    }
  ]
})

export default router
