import type { RouteRecordRaw } from 'vue-router'

export const categoryRoutes: RouteRecordRaw[] = [
  {
    path: 'categories',
    name: 'categories',
    component: () => import('./pages/CategoriesListPage.vue'),
    meta: { title: 'Categories', section: 'categories' },
  },
  {
    path: 'categories/new',
    name: 'category-create',
    component: () => import('./pages/CategoryCreatePage.vue'),
    meta: { title: 'New category', section: 'categories' },
  },
  {
    path: 'categories/:id',
    name: 'category-detail',
    component: () => import('./pages/CategoryDetailPage.vue'),
    props: true,
    meta: { title: 'Category', section: 'categories' },
  },
  {
    path: 'categories/:id/edit',
    name: 'category-edit',
    component: () => import('./pages/CategoryEditPage.vue'),
    props: true,
    meta: { title: 'Edit category', section: 'categories' },
  },
]
