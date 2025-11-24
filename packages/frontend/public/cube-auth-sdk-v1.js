window.createCubeAuth = (opts) => {
  const options = {
    basePath: '',
    appId: '',
    ...opts,
  }

  if (!options.appId) {
    throw new Error('appId is required');
  }

  const getToken = () => {
    return localStorage.getItem(`$cube-auth-token-${options.appId}`);
  }

  const setToken = (token) => {
    if (token) {
      localStorage.setItem(`$cube-auth-token-${options.appId}`, token);
    } else {
      localStorage.removeItem(`$cube-auth-token-${options.appId}`);
    }
  }

  const getLoginUrl = () => `${options.basePath}/login/${options.appId}?redirect=${encodeURIComponent(window.location.href)}`;
  const getLogoutUrl = () => `${options.basePath}/logout/${options.appId}?redirect=${encodeURIComponent(window.location.href)}`;
  const getWhoAmIUrl = () => `${options.basePath}/api/user/me`;

  const login = async () => {
    const token = getToken();
    if (!token) {
      window.location.href = getLoginUrl();
    }

    const response = await fetch(getWhoAmIUrl(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.status === 401) {
      setToken(null);
      window.location.href = getLoginUrl();
    }

    return response.json();
  }

  const logout = async () => {
    window.location.href = getLogoutUrl();
  }

  return {
    login,
    logout,
  }
}

