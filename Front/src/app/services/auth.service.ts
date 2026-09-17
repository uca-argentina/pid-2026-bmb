import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { CambiosPerfil, Credenciales, RegistroUsuario, RolUsuario, SesionAuth, Usuario } from '@app/models';
import { SesionDto, UsuarioDto } from './api/api.dto';
import { aPayloadRegistro, aSesion, aUsuario } from './api/api.mapeo';

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
    return this.http.post<SesionDto>(`${this.ruta}/login`, credenciales).pipe(
      map(aSesion),
      tap((sesion) => this.guardarSesion(sesion)),
    );
  }

  /** `POST /api/auth/register` */
  registro(datos: RegistroUsuario): Observable<SesionAuth> {
    return this.http.post<SesionDto>(`${this.ruta}/register`, aPayloadRegistro(datos)).pipe(
      map(aSesion),
      tap((sesion) => this.guardarSesion(sesion)),
    );
  }

  /** `GET /api/auth/me` */
  perfil(): Observable<Usuario> {
    return this.http
      .get<{ usuario: UsuarioDto }>(`${this.ruta}/me`)
      .pipe(map((respuesta) => aUsuario(respuesta.usuario)));
  }

  /** `POST /api/auth/rol`: cambia el perfil activo y reemplaza el token. */
  cambiarRol(rol: RolUsuario): Observable<SesionAuth> {
    return this.http.post<SesionDto>(`${this.ruta}/rol`, { rol }).pipe(
      map(aSesion),
      tap((sesion) => this.guardarSesion(sesion)),
    );
  }

  /** `PATCH /api/auth/me`: guarda los cambios y actualiza la sesion. */
  actualizarPerfil(cambios: CambiosPerfil): Observable<SesionAuth> {
    return this.http.patch<SesionDto>(`${this.ruta}/me`, cambios).pipe(
      map(aSesion),
      tap((sesion) => this.guardarSesion(sesion)),
    );
  }

  /** `DELETE /api/auth/me`: baja de la cuenta y cierre de sesion. */
  eliminarCuenta(): Observable<void> {
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
