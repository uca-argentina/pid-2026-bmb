import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { invitadoGuard } from './guards/invitado.guard';
import { rolGuard } from './guards/rol.guard';

/**
 * Arbol de rutas dividido por rol: cada rama tiene su layout y sus guards.
 * `authGuard` exige sesion; `rolGuard` verifica que el rol corresponda.
 */
export const routes: Routes = [
  {
    path: 'ingresar',
    title: 'UCAio · Ingresar',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/ingresar/ingresar').then((m) => m.Ingresar),
  },

  /* ------------------------------- CONDUCTOR ------------------------------ */
  {
    path: 'conductor',
    canActivate: [authGuard, rolGuard(['CONDUCTOR'])],
    loadComponent: () => import('./layouts/layout-app/layout-app').then((m) => m.LayoutApp),
    children: [
      {
        path: 'explorar',
        title: 'UCAio · Explorar',
        loadComponent: () =>
          import('./pages/explorar-estacionamientos/explorar-estacionamientos').then(
            (m) => m.ExplorarEstacionamientos,
          ),
      },
      {
        path: 'reservar/:estacionamientoId',
        title: 'UCAio · Reservar',
        loadComponent: () =>
          import('./pages/flujo-reserva/flujo-reserva').then((m) => m.FlujoReserva),
      },
      {
        path: 'mis-reservas',
        title: 'UCAio · Mis reservas',
        loadComponent: () => import('./pages/mis-reservas/mis-reservas').then((m) => m.MisReservas),
      },
      { path: '', pathMatch: 'full', redirectTo: 'explorar' },
    ],
  },

  /* ------------------------------ PROPIETARIO ----------------------------- */
  {
    path: 'propietario',
    canActivate: [authGuard, rolGuard(['PROPIETARIO'])],
    loadComponent: () => import('./layouts/layout-app/layout-app').then((m) => m.LayoutApp),
    children: [
      {
        path: 'tablero',
        title: 'UCAio · Tablero',
        loadComponent: () =>
          import('./pages/dashboard-propietario/dashboard-propietario').then(
            (m) => m.DashboardPropietario,
          ),
      },
      {
        path: 'reservas',
        title: 'UCAio · Reservas recibidas',
        loadComponent: () =>
          import('./pages/reservas-estacionamiento/reservas-estacionamiento').then(
            (m) => m.ReservasEstacionamiento,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'tablero' },
    ],
  },

  { path: '', pathMatch: 'full', redirectTo: 'ingresar' },
  { path: '**', redirectTo: 'ingresar' },
];
