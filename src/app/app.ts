import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HasRoleDirective } from './shared/has-role.directive'; // Ajusta la ruta a tu carpeta shared
import { Encabezado } from './encabezado/encabezado';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, HasRoleDirective, Encabezado], // <-- ¡Muy importante agregar estos 3!
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'Pasteleria';
}