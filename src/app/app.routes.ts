import { Routes } from '@angular/router';
import { General } from './general/general';
import { Clientes } from './Catalogo/clientes/clientes';
import { Trabajadores } from './Catalogo/trabajadores/trabajadores';
import { Admins } from './Catalogo/admin/admin';
import { Cliente } from './Facturacion/cliente/cliente';
import { Trabajador } from './Facturacion/trabajador/trabajador';
import { Admin } from './Facturacion/admin/admin';
import { DisenaElTuyo } from './disena-el-tuyo/disena-el-tuyo';
import { ClienteSucur } from './Sucursales/ClienteSucur/cliente-sucur';
import { TrabajadorSucur } from './Sucursales/TrabajadorSucur/trabajador-sucur';
import { AdminSucur } from './Sucursales/AdminSucur/admin-sucur';

export const routes: Routes = [
    { path: '', redirectTo: 'general', pathMatch: 'full' },
    { path: 'inicio', redirectTo: 'general', pathMatch: 'full' },
    { path: 'general', component: General },
    { path: 'catalogo', redirectTo: 'catalogo/clientes', pathMatch: 'full' },
    { path: 'catalogo/clientes', component: Clientes },
    { path: 'catalogo/trabajadores', component: Trabajadores },
    { path: 'catalogo/admin', component: Admins },
    { path: 'disena-tuyo', component: DisenaElTuyo },
    { path: 'disena-el-tuyo', redirectTo: 'disena-tuyo', pathMatch: 'full' },
    { path: 'facturacion', redirectTo: 'facturacion/cliente', pathMatch: 'full' },
    { path: 'facturacion/cliente', component: Cliente },
    { path: 'facturacion/trabajador', component: Trabajador },
    { path: 'facturacion/admin', component: Admin },
    { path: 'sucursales', redirectTo: 'sucursales/cliente', pathMatch: 'full' },
    { path: 'sucursales/cliente', component: ClienteSucur },
    { path: 'sucursales/trabajador', component: TrabajadorSucur },
    { path: 'sucursales/admin', component: AdminSucur },
];
