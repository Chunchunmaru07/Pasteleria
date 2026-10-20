import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoService } from './catalogo.service'; // Ajusta la ruta a tu servicio
import { HasRoleDirective } from '../shared/has-role.directive';
@Component({
    selector: 'app-catalogo',
    standalone: true,
    imports: [CommonModule, HasRoleDirective],
    templateUrl: './catalogo.html',
    styleUrl: './Catalogo.css'
})
export class CatalogoComponent implements OnInit {
    protected readonly catalogoService = inject(CatalogoService);

    ngOnInit(): void {
        // Forzamos la llamada a MySQL Aiven al cargar el componente
        this.catalogoService.cargarProductos();
    }
}
