export const APP_ROUTES = {
  login: import.meta.env.VITE_LOGIN_ROUTE ?? "/login",
  publicHome: import.meta.env.VITE_PUBLIC_HOME_ROUTE ?? "/",
} as const;
