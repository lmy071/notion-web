import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DashboardView from '../views/DashboardView.vue';
import LogsView from '../views/LogsView.vue';
import DataView from '../views/DataView.vue';
import PermissionsView from '../views/PermissionsView.vue';
import ProfileView from '../views/ProfileView.vue';
import PageDetailView from '../views/PageDetailView.vue';
import NotionWorkspace from '../views/NotionWorkspace.vue';
import SharedPageView from '../views/SharedPageView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/share/:token',
      name: 'public-share',
      component: SharedPageView
    },
    {
      path: '/workspace',
      name: 'workspace',
      component: NotionWorkspace,
      meta: { requiresAuth: true }
    },
    {
      path: '/workspace/page/:pageId',
      name: 'workspace-page-detail',
      component: PageDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/logs',
      name: 'logs',
      component: LogsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/data/:databaseId',
      name: 'data-view',
      component: DataView,
      meta: { requiresAuth: true }
    },
    {
      path: '/data/:databaseId/page/:pageId',
      name: 'page-detail',
      component: PageDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/permissions',
      name: 'permissions',
      component: PermissionsView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach((to, from, next) => {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  
  if (to.meta.requiresAuth && !userId) {
    next({ name: 'login' });
  } else if (to.meta.requiresAdmin && role !== 'admin') {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
