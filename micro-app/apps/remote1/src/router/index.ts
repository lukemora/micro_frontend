import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/page-a',
    name: 'page-a',
    component: () => import('../views/PageA.vue'),
  },
  {
    path: '/page-b',
    name: 'page-b',
    component: () => import('../views/PageB.vue'),
  },
  {
    path: '/',
    redirect: '/page-a',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes,
})

export default router
