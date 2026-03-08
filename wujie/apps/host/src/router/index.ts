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
    component: () => import('../views/Remote1PageA.vue'),
  },
  {
    path: '/remote1/page-b',
    name: 'remote1-page-b',
    component: () => import('../views/Remote1PageB.vue'),
  },
  {
    path: '/remote2/dashboard',
    name: 'remote2-dashboard',
    component: () => import('../views/Remote2Dashboard.vue'),
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
