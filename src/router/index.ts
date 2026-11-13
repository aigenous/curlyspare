import type { RouteRecordRaw } from 'vue-router'
import { assertRegistry } from '../registry'
import { assertPublishedSlugs, publicTools } from '../registry/published'

assertRegistry()
assertPublishedSlugs()

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/HomePage.vue'),
  },
  ...publicTools().map((tool) => ({
    path: `/${tool.slug}`,
    name: tool.slug,
    component: () => import('../pages/ToolPage.vue'),
    meta: { slug: tool.slug },
  })),
  {
    path: '/regulamin',
    name: 'terms',
    component: () => import('../pages/LegalPage.vue'),
    meta: { page: 'terms' },
  },
  {
    path: '/polityka-prywatnosci',
    name: 'privacy',
    component: () => import('../pages/LegalPage.vue'),
    meta: { page: 'privacy' },
  },
  {
    path: '/operator',
    name: 'operator',
    component: () => import('../pages/LegalPage.vue'),
    meta: { page: 'operator' },
  },
  {
    path: '/404',
    name: 'not-found',
    component: () => import('../pages/NotFound.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'catch-all',
    component: () => import('../pages/NotFound.vue'),
  },
]
