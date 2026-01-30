import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DashboardView from '../views/DashboardView.vue';
import LogsView from '../views/LogsView.vue';
import DataView from '../views/DataView.vue';

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
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach((to, from, next) => {
  const userId = localStorage.getItem('userId');
  if (to.meta.requiresAuth && !userId) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router;
