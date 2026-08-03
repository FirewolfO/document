import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'systems', component: () => import('@/views/SystemsView.vue') },
    { path: '/systems/:systemId', name: 'system-docs', component: () => import('@/views/SystemDocsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  document.title = to.name === 'system-docs' ? '接口文档 - 开发者文档' : '开发者文档'
})

export default router
