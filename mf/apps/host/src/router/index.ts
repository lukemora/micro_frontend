import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
  },
  {
    path: '/remote1/page-a',
    name: 'remote1-page-a',
    component: () => import('remote1/PageA'),
  },
  {
    path: '/remote1/page-b',
    name: 'remote1-page-b',
    component: () => import('remote1/PageB'),
  },
  {
    path: '/remote2/dashboard',
    name: 'remote2-dashboard',
    component: () => import('remote2/Dashboard'),
  },
  {
    path: '/remote3/:pathMatch(.*)*',
    name: 'remote3',
    component: () => import('../views/Remote3App.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes,
})

export default router
