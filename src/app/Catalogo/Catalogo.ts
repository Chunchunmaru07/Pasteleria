import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importa la directiva reutilizable desde shared
import { HasRoleDirective } from '../shared/has-role.directive';

// Importa los componentes de las subcarpetas del catálogo
import { Admins } from './admin/admin';
import { Clientes } from './clientes/clientes';
import { Trabajadores } from './trabajadores/trabajadores';

@Component({
    selector: 'app-catalogo',
    standalone: true,
    // Declara la directiva y los componentes para poder usarlos en el HTML
    imports: [CommonModule, HasRoleDirective, Admins, Clientes, Trabajadores],
    templateUrl: './Catalogo.html',
    styleUrl: './Catalogo.css'
})
export class Catalogo { }