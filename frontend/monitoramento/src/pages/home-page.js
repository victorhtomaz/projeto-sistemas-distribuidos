import { createAlertBanner } from '../components/alert-banner.js';
import { createAppHeader } from '../components/app-header.js';
import { createSessionStatusCard } from '../components/session-status-card.js';
import { createUserProfileCard } from '../components/user-profile-card.js';
import { getUserInfo, logout } from '../services/auth-api.js';
import { refreshAccessToken } from '../services/oidc-service.js';
import { getAuthState, subscribeAuth } from '../state/auth-store.js';
import { ApiError } from '../utils/errors.js';

export function renderHomePage(container, { navigate }) {
  document.title = 'Painel — Monitoramento';

  let disposed = false;

  const page = document.createElement('div');
  page.className = 'min-h-dvh bg-canvas dark:bg-canvas-dark';

  const feedbackSlot = document.createElement('div');
  feedbackSlot.className = 'empty:hidden';

  async function handleLogout() {
    header.setLogoutDisabled(true);
    sessionCard.setLogoutDisabled(true);
    await logout();
    if (!disposed) {
      await navigate('/login', { replace: true });
    }
  }

  async function loadUserInfo() {
    profileCard.setLoading();

    try {
      const info = await getUserInfo();
      if (disposed) return;

      header.setUser({ name: info.name, email: info.email });
      profileCard.setClaims(info);
      sessionCard.updateUser(getAuthState());
    } catch (error) {
      if (disposed || !getAuthState()) return;

      profileCard.setEmpty();
      const title = error instanceof ApiError ? error.title : 'Falha ao obter perfil';
      const detail = error instanceof ApiError ? error.detail : 'Não foi possível carregar os dados da sua conta.';
      feedbackSlot.replaceChildren(createAlertBanner({ variant: 'error', title, detail }));
    }
  }

  async function handleRefresh() {
    sessionCard.setRefreshing(true);
    feedbackSlot.replaceChildren();

    try {
      const refreshedUser = await refreshAccessToken({ force: true });
      if (disposed) return;

      sessionCard.updateUser(refreshedUser);
      feedbackSlot.replaceChildren(
        createAlertBanner({
          variant: 'success',
          title: 'Sessão atualizada',
          detail: 'Sua sessão foi renovada com sucesso.',
        })
      );
    } catch (error) {
      if (disposed || !getAuthState()) return;

      const detail = error instanceof ApiError ? error.detail : 'Não foi possível renovar sua sessão.';
      feedbackSlot.replaceChildren(
        createAlertBanner({ variant: 'error', title: 'Falha ao renovar sessão', detail })
      );
    } finally {
      if (!disposed) {
        sessionCard.setRefreshing(false);
      }
    }
  }

  const header = createAppHeader({ onLogout: handleLogout });
  const profileCard = createUserProfileCard({
    onReload: () => {
      feedbackSlot.replaceChildren();
      loadUserInfo();
    },
  });
  const sessionCard = createSessionStatusCard({
    onRefresh: handleRefresh,
    onLogout: handleLogout,
  });

  const main = document.createElement('main');
  main.className = 'mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-10';

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 gap-6 lg:grid-cols-3';
  grid.append(profileCard.element, sessionCard.element);

  main.append(feedbackSlot, grid);
  page.append(header.element, main);
  container.replaceChildren(page);

  sessionCard.updateUser(getAuthState());
  loadUserInfo();

  const timerId = window.setInterval(() => {
    const user = getAuthState();
    if (user) {
      sessionCard.updateCountdown(user);
    }
  }, 1000);

  const unsubscribe = subscribeAuth((user) => {
    if (user) {
      sessionCard.updateUser(user);
    }
  });

  return () => {
    disposed = true;
    window.clearInterval(timerId);
    unsubscribe();
  };
}
