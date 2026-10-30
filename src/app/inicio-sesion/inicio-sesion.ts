import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FacturacionService } from '../Facturacion/facturacion.service';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.css'
})
export class InicioSesion {
  private readonly facturacionService = inject(FacturacionService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient); // Añadido para procesar el registro

  private readonly API_URL = 'http://localhost:3000/api';

  // Estados de la vista
  readonly modoVista = signal<'login' | 'registro'>('login');
  readonly mostrarContrasena = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  // Mensajes
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Campos de Login
  readonly emailInput = signal<string>('');
  readonly passwordInput = signal<string>('');
  readonly recordarSesion = signal<boolean>(false);

  // Campos de Registro
  readonly regNombre = signal<string>('');
  readonly regEmail = signal<string>('');
  readonly regTelefono = signal<string>('');
  readonly regRol = signal<'cliente' | 'trabajador'>('cliente');
  readonly regPassword = signal<string>('');
  readonly regConfirmPassword = signal<string>('');
  readonly regAceptaTerminos = signal<boolean>(false);

  cambiarModo(modo: 'login' | 'registro'): void {
    this.modoVista.set(modo);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena.set(!this.mostrarContrasena());
  }

  // =========================================================
  // LOGIN REAL CONTRA BASE DE DATOS
  // =========================================================
  onLoginSubmit(): void {
    if (!this.emailInput() || !this.passwordInput()) {
      this.errorMessage.set('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.facturacionService.login(this.emailInput(), this.passwordInput()).subscribe({
      next: (usuario) => {
        this.isLoading.set(false);
        // El rol viene desde la base de datos, redirigimos al catálogo
        this.router.navigate(['/catalogo']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Detectamos si el backend rechaza el acceso por cuenta pendiente
        if (err.status === 403 || err.error?.error?.includes('pendiente')) {
          this.errorMessage.set('Tu cuenta está en revisión por Administración. Espera el correo de confirmación.');
        } else {
          this.errorMessage.set('Correo o contraseña incorrectos.');
        }
      }
    });
  }

  // =========================================================
  // REGISTRO REAL CONTRA BASE DE DATOS
  // =========================================================
  onRegistroSubmit(): void {
    if (!this.regAceptaTerminos()) {
      this.errorMessage.set('Debes aceptar los términos y condiciones.');
      return;
    }
    if (this.regPassword() !== this.regConfirmPassword()) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const nuevoUsuario = {
      nombre: this.regNombre(),
      correo: this.regEmail(),
      telefono: this.regTelefono(),
      rol: this.regRol(),
      contrasena: this.regPassword()
    };

    this.http.post(`${this.API_URL}/registro`, nuevoUsuario).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);

        // Mensaje dinámico dependiendo del rol
        if (this.regRol() === 'trabajador') {
          this.successMessage.set('Solicitud enviada. Te llegará un correo cuando Dirección apruebe tu acceso.');
        } else {
          this.successMessage.set('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
        }

        this.cambiarModo('login');
        this.emailInput.set(this.regEmail());
        this.passwordInput.set('');

        // Limpiamos formulario de registro
        this.regNombre.set('');
        this.regEmail.set('');
        this.regPassword.set('');
        this.regConfirmPassword.set('');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al crear la cuenta. Es posible que el correo ya exista.');
      }
    });
  }
}