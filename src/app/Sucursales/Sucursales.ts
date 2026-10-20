import { Component } from '@angular/core';
import { HasRoleDirective } from '../shared/has-role.directive';

@Component({
    selector: 'app-sucursales',
    standalone: true,
    imports: [HasRoleDirective],
    templateUrl: './sucursales.html'
})
export class Sucursales { }