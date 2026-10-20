import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FacturacionService, UsuarioSesion } from '../Facturacion/facturacion.service';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.css',
})
export class InicioSesion {
  private router = inject(Router);
  public facturacionService = inject(FacturacionService);

  // Pestaña actual: 'login' o 'registro'
  readonly modoVista = signal<'login' | 'registro'>('login');

  // Rol seleccionado para inicio rápido / demo
  readonly rolSeleccionado = signal<'cliente' | 'trabajador' | 'admin'>('cliente');

  // Campos de formulario Login
  readonly emailInput = signal('cliente@dulcemomento.com');
  readonly passwordInput = signal('••••••••');
  readonly recordarSesion = signal(true);
  readonly mostrarContrasena = signal(false);

  // Campos de formulario Registro
  readonly regNombre = signal('');
  readonly regEmail = signal('');
  readonly regTelefono = signal('');
  readonly regPassword = signal('');
  readonly regConfirmPassword = signal('');
  readonly regRol = signal<'cliente' | 'trabajador'>('cliente');
  readonly regAceptaTerminos = signal(false);

  // Estados de retroalimentación
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  cambiarModo(modo: 'login' | 'registro'): void {
    this.modoVista.set(modo);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena.update(v => !v);
  }

  /**
   * Carga credenciales predeterminadas según el rol seleccionado
   */
  seleccionarRolDemo(rol: 'cliente' | 'trabajador' | 'admin'): void {
    this.rolSeleccionado.set(rol);
    if (rol === 'admin') {
      this.emailInput.set('admin@olenkayezis.com');
      this.passwordInput.set('Admin1234#');
    } else if (rol === 'trabajador') {
      this.emailInput.set('maria.gonzalez@olenkayezis.com');
      this.passwordInput.set('TurnoMat2026!');
    } else {
      this.emailInput.set('cliente@dulcemomento.com');
      this.passwordInput.set('ClienteDulce2026');
    }
  }

  /**
   * Enviar formulario de login intentando backend con fallback automático a demo
   */
  onLoginSubmit(): void {
    const email = this.emailInput().trim();
    const password = this.passwordInput().trim();

    if (!email || !password) {
      this.errorMessage.set('Por favor ingresa tu correo y contraseña.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Intentar petición real al backend Node/Flask
    this.facturacionService.login(email, password).subscribe({
      next: (usuario) => {
        this.isLoading.set(false);
        this.successMessage.set(`¡Bienvenido de nuevo, ${usuario.nombre}!`);
        this.redirigirPorRol(usuario.rol);
      },
      error: () => {
        // Si el backend no está corriendo localmente en el puerto 3000, 
        // fallback suave permitiendo probar el sistema con el rol seleccionado
        setTimeout(() => {
          this.isLoading.set(false);
          const rol = this.rolSeleccionado();
          const demoUser = this.facturacionService.loginDemo(rol, email);
          this.successMessage.set(`Acceso concedido en modo demostración como ${demoUser.rol.toUpperCase()}. Redirigiendo...`);
          setTimeout(() => {
            this.redirigirPorRol(demoUser.rol);
          }, 700);
        }, 500);
      }
    });
  }

  /**
   * Registrar nueva cuenta
   */
  onRegistroSubmit(): void {
    const nombre = this.regNombre().trim();
    const email = this.regEmail().trim();
    const password = this.regPassword().trim();
    const confirm = this.regConfirmPassword().trim();

    if (!nombre || !email || !password) {
      this.errorMessage.set('Por favor completa todos los campos requeridos (*).');
      return;
    }

    if (password !== confirm) {
      this.errorMessage.set('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (!this.regAceptaTerminos()) {
      this.errorMessage.set('Debes aceptar los términos y el aviso de privacidad.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    setTimeout(() => {
      this.isLoading.set(false);
      const rol = this.regRol();
      const nuevoUsuario = this.facturacionService.loginDemo(rol, email, nombre);
      this.successMessage.set(`¡Cuenta creada con éxito! Bienvenido a la familia Olenka Y Ezis.`);
      setTimeout(() => {
        this.redirigirPorRol(nuevoUsuario.rol);
      }, 900);
    }, 700);
  }

  /**
   * Redirige al usuario al área adecuada según su rol
   */
  private redirigirPorRol(rol: string): void {
    if (rol === 'admin') {
      this.router.navigate(['/facturacion/admin']);
    } else if (rol === 'trabajador') {
      this.router.navigate(['/facturacion/trabajador']);
    } else {
      this.router.navigate(['/catalogo/clientes']);
    }
  }
}
