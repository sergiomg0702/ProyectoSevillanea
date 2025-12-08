import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../../servicios/usuarios.service';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../modelos/usuario';
import { HostListener } from '@angular/core';
import { OfertantesService } from '../../servicios/ofertantes.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink, NgIf, NgFor],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  /** Efecto del navbar */
  @HostListener('window:scroll')
  onWindowScroll() {
    const navbar = document.querySelector('.navbar') as HTMLElement;
    const topBar = document.querySelector('.top-bar-sevillanea') as HTMLElement;

    if (window.scrollY > 80) {
      topBar?.classList.add('hidden');
      navbar?.classList.add('fixed-top');
    } else {
      topBar?.classList.remove('hidden');
      navbar?.classList.remove('fixed-top');
    }
  }

  //sube hacia arriba en la página
  scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Función que alterna el menú
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  // Estado de sesión
  isLoggedIn = false;
  usuarioLogueado = false;
  usuario: any = null;

  usuarioId: number = 0;
  usuarioNombre: string = '';
  usuarioEmail: string = '';
  mensaje: string = '';
  actividades: any[] = [];

  menuAbierto: boolean = false;

  constructor(
    private router: Router,
    private usuariosService: UsuariosService,
    private ofertantesService: OfertantesService
  ) {}

  ngOnInit(): void {
    this.comprobarSesion();
    // Leer usuario del localStorage
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) return;

    const usuario: Usuario = JSON.parse(usuarioData);
    this.usuarioId = usuario.id;

    // Obtener usuario actualizado del servidor
    this.usuariosService.obtenerUsuarioId(this.usuarioId).subscribe({
      next: (usuarioServidor: Usuario) => {
        this.usuarioNombre = usuarioServidor.username;
        this.usuarioEmail = usuarioServidor.email;

        // Actualizar localStorage con info nueva
        localStorage.setItem('usuario', JSON.stringify(usuarioServidor));
        this.verActividades();
      },
      error: () => (this.mensaje = 'Error al cargar datos del usuario'),
    });
  }

  cerrarSesion() {
    localStorage.removeItem('usuario');
    this.router.navigate(['/']);
  }

  verActividades() {
    console.log('Id del user: ' + this.usuarioId);
    if (!this.usuarioId) return;

    this.ofertantesService.actividadesUsuario(this.usuarioId).subscribe({
      next: (res) => {
        this.actividades = res;

        console.log('Actividades usuario:', this.actividades);
      },

      error: () => {
        this.mensaje = 'Error al obtener actividades';
      },
    });
  }

  anularActividad(actividad_id: number) {
    if (!confirm('¿Deseas anular esta actividad?')) return;

    this.ofertantesService
      .anularInscripcion(this.usuarioId, actividad_id)
      .subscribe({
        next: (res) => {
          if (res.result === 'OK') {
            this.actividades = this.actividades.filter(
              (a) => a.id !== actividad_id
            );
          } else {
            this.mensaje = 'No se pudo anular la actividad';
          }
        },
        error: () => (this.mensaje = 'Error al anular la actividad'),
      });
  }

  borrarUsuario() {
    if (!confirm('¿Seguro que deseas eliminar tu cuenta?')) return;

    this.usuariosService.borrarUsuario(this.usuarioId).subscribe({
      next: () => {
        localStorage.removeItem('usuario');
        this.router.navigate(['/']);
      },
      error: () => (this.mensaje = 'Error al eliminar usuario'),
    });
  }

  /** Comprobar si hay usuario logueado */
  comprobarSesion() {
    const data = localStorage.getItem('usuario');

    if (!data) {
      this.isLoggedIn = false;
      this.usuarioLogueado = false;
      return;
    }

    try {
      this.usuario = JSON.parse(data);
      this.isLoggedIn = true;
      this.usuarioLogueado = true;
    } catch {
      this.isLoggedIn = false;
      this.usuarioLogueado = false;
      console.error('Error leyendo usuario del localStorage');
    }
  }
}
