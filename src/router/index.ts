import type { RouteRecordRaw } from 'vue-router'
import { assertRegistry, tools } from '../registry'

assertRegistry()

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/HomePage.vue'),
  },
  ...tools.map((tool) => ({
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
    path: '/licencje',
    name: 'licences',
    component: () => import('../pages/LicencesPage.vue'),
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
