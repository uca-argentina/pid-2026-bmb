import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '@env/environment';
import { CambiosPerfil, Credenciales, RegistroUsuario, RolUsuario, SesionAuth, Usuario } from '@app/models';
import { SesionDto, UsuarioDto } from './api/api.dto';
import { aPayloadRegistro, aSesion, aUsuario } from './api/api.mapeo';
import { USUARIOS_MOCK } from './mocks/datos-mock';
import { clonar, simular, simularError } from './mocks/mock.util';

const CLAVE_SESION = 'parkit.sesion';

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

    return this.http.post<SesionDto>(`${this.ruta}/login`, credenciales).pipe(
      map(aSesion),
      tap((sesion) => this.guardarSesion(sesion)),
    );
  }

  /** `POST /api/auth/register` */
  registro(datos: RegistroUsuario): Observable<SesionAuth> {
    if (environment.usarMocks) {
      const usuario: Usuario = {
        id: `usr-${crypto.randomUUID()}`,
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        telefono: datos.telefono ?? null,
        rol: datos.rol,
        roles: [datos.rol],
        fechaAlta: new Date().toISOString(),
        activo: true,
      };
      return simular<SesionAuth>({ token: `mock-token-${usuario.id}`, usuario }).pipe(
        tap((sesion) => this.guardarSesion(sesion)),
      );
    }

    return this.http.post<SesionDto>(`${this.ruta}/register`, aPayloadRegistro(datos)).pipe(
      map(aSesion),
      tap((sesion) => this.guardarSesion(sesion)),
    );
  }

  /** `GET /api/auth/me` */
  perfil(): Observable<Usuario> {
    if (environment.usarMocks) {
      const usuario = this.usuario();
      return usuario ? simular(clonar(usuario)) : simularError<Usuario>('No hay sesion activa');
    }

    return this.http
      .get<{ usuario: UsuarioDto }>(`${this.ruta}/me`)
      .pipe(map((respuesta) => aUsuario(respuesta.usuario)));
  }

  /** `POST /api/auth/rol`: cambia el perfil activo y reemplaza el token. */
  cambiarRol(rol: RolUsuario): Observable<SesionAuth> {
    if (environment.usarMocks) {
      const sesion = this.sesion();
      if (!sesion || !sesion.usuario.roles.includes(rol)) {
        return simularError<SesionAuth>(`El usuario no tiene habilitado el perfil ${rol}`);
      }
      return simular<SesionAuth>({ ...sesion, usuario: { ...clonar(sesion.usuario), rol } }).pipe(
        tap((nueva) => this.guardarSesion(nueva)),
      );
    }

    return this.http.post<SesionDto>(`${this.ruta}/rol`, { rol }).pipe(
      map(aSesion),
      tap((sesion) => this.guardarSesion(sesion)),
    );
  }

  /** `PATCH /api/auth/me`: guarda los cambios y actualiza la sesion. */
  actualizarPerfil(cambios: CambiosPerfil): Observable<SesionAuth> {
    if (environment.usarMocks) {
      const sesion = this.sesion();
      if (!sesion) return simularError<SesionAuth>('No hay sesion activa');

      const { password, passwordActual, ...datos } = cambios;
      const usuario = { ...clonar(sesion.usuario), ...datos };
      usuario.rol = usuario.roles.includes(usuario.rol) ? usuario.rol : usuario.roles[0];

      return simular<SesionAuth>({ ...sesion, usuario }).pipe(
        tap((nueva) => this.guardarSesion(nueva)),
      );
    }

    return this.http.patch<SesionDto>(`${this.ruta}/me`, cambios).pipe(
      map(aSesion),
      tap((sesion) => this.guardarSesion(sesion)),
    );
  }

  /** `DELETE /api/auth/me`: baja de la cuenta y cierre de sesion. */
  eliminarCuenta(): Observable<void> {
    if (environment.usarMocks) {
      return simular<void>(undefined).pipe(tap(() => this.logout()));
    }

    return this.http
      .delete<void>(`${this.ruta}/me`)
      .pipe(tap(() => this.logout()));
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
      if (!crudo) return null;
      const sesion = JSON.parse(crudo) as SesionAuth;
      // Sesiones guardadas antes de que existiera `roles`.
      sesion.usuario.roles ??= [sesion.usuario.rol];
      return sesion;
    } catch {
      return null;
    }
  }
}
