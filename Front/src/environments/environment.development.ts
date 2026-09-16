export const environment = {
  production: false,
  /**
   * Las llamadas a /api las redirige el proxy (proxy.conf.json) hacia el
   * backend Express en http://localhost:3000.
   */
  apiUrl: '/api',
  /**
   * `false`: los servicios le pegan al backend real (correr `npm run db:demo`
   * para tener los usuarios de prueba). `true`: datos mockeados, sin backend.
   */
  usarMocks: true,
  latenciaMockMs: 350,
};
