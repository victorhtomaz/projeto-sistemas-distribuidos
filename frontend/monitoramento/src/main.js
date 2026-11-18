import './styles/main.css';
import { initAuthStore } from './state/auth-store.js';
import { initRouter } from './utils/router.js';

async function bootstrap() {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  await initAuthStore();
  await initRouter(appEl);
}

bootstrap();
