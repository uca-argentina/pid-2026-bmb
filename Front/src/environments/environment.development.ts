export const environment = {
  production: false,
  /**
   * Las llamadas a /api las redirige el proxy (proxy.conf.json) hacia el
   * backend Express en http://localhost:3000.
   */
  apiUrl: '/api',
  /**
   * Mientras el backend no tenga endpoints, los servicios responden con datos
   * mockeados. Poner en `false` para pegarle a Express sin tocar nada mas.
   */
  usarMocks: false,
  latenciaMockMs: 350,
};
