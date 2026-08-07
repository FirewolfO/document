import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'audiences', component: () => import('@/views/AudiencesView.vue') },
    { path: '/:audience(open|inner)', name: 'systems', component: () => import('@/views/SystemsView.vue') },
    { path: '/:audience(open|inner)/systems/:systemId', name: 'system-docs', component: () => import('@/views/SystemDocsView.vue') },
    {
      path: '/systems/:systemId',
      redirect: (to) => ({ name: 'system-docs', params: { audience: 'open', systemId: to.params.systemId }, query: to.query }),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  const audience = to.params.audience === 'inner' ? 'Inner' : 'Open'
  document.title = to.name === 'system-docs' ? `${audience} 接口文档 - 开发者文档` : '开发者文档'
})

export default router
