export const environment = {
  production: true,
  /** Prefijo de la API de Express (Back/src/config/env.js -> apiPrefix). */
  apiUrl: '/api',
  /** En produccion siempre se pega contra los endpoints reales. */
  usarMocks: false,
  /** Latencia simulada de los mocks, en ms. */
  latenciaMockMs: 0,
};
