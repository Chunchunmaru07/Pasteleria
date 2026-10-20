import { Component } from '@angular/core';
import { HasRoleDirective } from '../shared/has-role.directive'; // Ruta hacia shared

@Component({
    selector: 'app-pedidos',
    standalone: true,
    imports: [HasRoleDirective], // <-- Se importa aquí
    templateUrl: './pedidos.html'
})
export class Pedidos { }