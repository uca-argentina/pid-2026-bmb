import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Credenciales, RegistroUsuario, RolUsuario, SesionAuth, Usuario } from '../models';
import { USUARIOS_MOCK } from './mocks/datos-mock';
import { clonar, simular, simularError } from './mocks/mock.util';

const CLAVE_SESION = 'ucaio.sesion';

/**
 * Sesion del usuario y llamadas a `/api/auth`.
 * El estado vive en signals para que guards, layout y paginas lo lean sin
 * suscripciones manuales.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly ruta = '/auth';

  private readonly sesion = signal<SesionAuth | null>(this.leerSesionGuardada());

  readonly usuario = computed<Usuario | null>(() => this.sesion()?.usuario ?? null);
  readonly rol = computed<RolUsuario | null>(() => this.usuario()?.rol ?? null);
  readonly estaAutenticado = computed(() => this.sesion() !== null);
  readonly esConductor = computed(() => this.rol() === 'CONDUCTOR');
  readonly esPropietario = computed(() => this.rol() === 'PROPIETARIO');

  /** Token para el interceptor de autorizacion. */
  token(): string | null {
    return this.sesion()?.token ?? null;
  }

  /** `POST /api/auth/login` */
  login(credenciales: Credenciales): Observable<SesionAuth> {
    if (environment.usarMocks) {
      const usuario = USUARIOS_MOCK.find((u) => u.email === credenciales.email);
      if (!usuario) {
        return simularError<SesionAuth>('Email o contrasena incorrectos');
      }
      return simular<SesionAuth>({ token: `mock-token-${usuario.id}`, usuario: clonar(usuario) }).pipe(
        tap((sesion) => this.guardarSesion(sesion)),
      );
    }

    return this.http
      .post<SesionAuth>(`${this.ruta}/login`, credenciales)
      .pipe(tap((sesion) => this.guardarSesion(sesion)));
  }

  /** `POST /api/auth/registro` */
  registro(datos: RegistroUsuario): Observable<SesionAuth> {
    if (environment.usarMocks) {
      const usuario: Usuario = {
        id: `usr-${crypto.randomUUID()}`,
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        telefono: datos.telefono,
        rol: datos.rol,
        fechaAlta: new Date().toISOString(),
        activo: true,
      };
      return simular<SesionAuth>({ token: `mock-token-${usuario.id}`, usuario }).pipe(
        tap((sesion) => this.guardarSesion(sesion)),
      );
    }

    return this.http
      .post<SesionAuth>(`${this.ruta}/registro`, datos)
      .pipe(tap((sesion) => this.guardarSesion(sesion)));
  }

  /** `GET /api/auth/perfil` */
  perfil(): Observable<Usuario> {
    if (environment.usarMocks) {
      const usuario = this.usuario();
      return usuario ? simular(clonar(usuario)) : simularError<Usuario>('No hay sesion activa');
    }

    return this.http.get<Usuario>(`${this.ruta}/perfil`);
  }

  logout(): void {
    this.sesion.set(null);
    localStorage.removeItem(CLAVE_SESION);
  }

  private guardarSesion(sesion: SesionAuth): void {
    this.sesion.set(sesion);
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  }

  private leerSesionGuardada(): SesionAuth | null {
    try {
      const crudo = localStorage.getItem(CLAVE_SESION);
      return crudo ? (JSON.parse(crudo) as SesionAuth) : null;
    } catch {
      return null;
    }
  }
}
