import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
      meta: { title: '音乐搜索' }
    },
    {
      path: '/result',
      name: 'result',
      component: () => import('@/views/Result.vue'),
      meta: { title: '搜索结果' }
    },
    {
      path: '/detail/:id',
      name: 'detail',
      component: () => import('@/views/Detail.vue'),
      meta: { title: '歌曲详情' }
    },
    {
      path: '/playlist/:id',
      name: 'playlist-detail',
      component: () => import('@/views/PlaylistDetail.vue'),
      meta: { title: '歌单详情' }
    },
  ],
})

router.afterEach((to) => {
  if (typeof document !== 'undefined') {
    const metaTitle = (to.meta?.title as string | undefined) ?? '听见'
    document.title = `听见 · ${metaTitle}`
  }
})

export default router
