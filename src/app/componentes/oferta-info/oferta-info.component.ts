import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HostListener } from '@angular/core';
import { Ofertante } from '../../modelos/ofertante';
import { OfertantesService } from '../../servicios/ofertantes.service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-oferta-info',
  imports: [RouterLink],
  templateUrl: './oferta-info.component.html',
  styleUrl: './oferta-info.component.css',
})
export class OfertaInfoComponent {
  ofertante: Ofertante | null = null;
  usuario: any = null;

  mensajeReserva: string = '';
  mensajeError: string = '';
  errorVisible: boolean = false;
  mostrarDescargar: boolean = false;

  isLoggedIn = false;

  menuAbierto: boolean = false;

  constructor(
    private servicio: OfertantesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  // =====================================================
  // INIT
  // =====================================================
  ngOnInit(): void {
    this.obtenerOfertantePorId();
    this.comprobarSesion();
  }

  // =====================================================
  // EFECTO NAVBAR
  // =====================================================
  @HostListener('window:scroll', [])
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

  scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Función que alterna el menú
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  volver() {
    this.router.navigate(['/ofertantes']);
  }

  // =====================================================
  // OBTENER OFERTANTE
  // =====================================================
  obtenerOfertantePorId() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.servicio.selectOfertante(id).subscribe({
      next: (res) => (this.ofertante = res),
      error: () => this.mostrarError('No se encontró la actividad.'),
    });
  }

  // =====================================================
  // SESIÓN
  // =====================================================
  comprobarSesion() {
    const data = localStorage.getItem('usuario');

    if (!data) {
      this.isLoggedIn = false;
      return;
    }

    try {
      this.usuario = JSON.parse(data);
      this.isLoggedIn = true;
    } catch {
      console.error('Error leyendo usuario del localStorage');
      this.isLoggedIn = false;
    }
  }

  // =====================================================
  // RESERVAR ACTIVIDAD  (capturando ID correctamente)
  // =====================================================
  reservar(idActividad: number) {
    if (!this.usuario) {
      this.mostrarError('Debes iniciar sesión para reservar.');
      return;
    }

    console.log('Actividad ID: ' + idActividad);
    console.log('USUARIO ID: ' + this.usuario.id);
    this.servicio.inscribirActividad(this.usuario.id, idActividad).subscribe({
      next: (res) => {
        this.mensajeReserva = '¡Muchas gracias por reservar!';
        this.mostrarDescargar = true;

        setTimeout(() => (this.mensajeReserva = ''), 3000);
      },
      error: () => {
        this.mostrarError('No se pudo completar la reserva.');
      },
    });
  }

  // =====================================================
  // DESCARGAR PDF
  // =====================================================
  apuntarse(oferta: Ofertante) {
    if (!this.usuario) {
      this.mostrarError('Debes iniciar sesión para apuntarte.');
      return;
    }

    const datosPDF = {
      usuario: {
        username: this.usuario.username,
        email: this.usuario.email,
      },
      actividad: {
        nombre: oferta.actividad,
        nombreOfertante: oferta.nombre,
        apellidosOfertante: oferta.apellidos,
        telefono: oferta.telefono,
        descripcion: oferta.descripcion,
        tarifa: oferta.tarifa,
        duracion: oferta.duracion_minutos,
        ubicacion: oferta.ubicacion,
      },
    };

    this.generarPDF(datosPDF);
  }

  async generarPDF(datos: any) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const naranjaAlbero = { r: 227, g: 150, b: 62 };
    const textoOscuro = { r: 40, g: 40, b: 40 };

    doc.setFillColor(naranjaAlbero.r, naranjaAlbero.g, naranjaAlbero.b);
    doc.rect(0, 0, 210, 297, 'F');

    const logo = await this.cargarImagenBase64(
      'assets/imagenes/sevillanea.png'
    );
    if (logo) doc.addImage(logo, 'PNG', 75, 20, 60, 35);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text(datos.actividad.nombre.toUpperCase(), 105, 70, {
      align: 'center',
    });

    doc.setFontSize(16);
    doc.text('Reserva confirmada', 105, 82, { align: 'center' });

    doc.save(`Entrada_${datos.actividad.nombre}.pdf`);
  }

  cargarImagenBase64(url: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
    });
  }

  // =====================================================
  // EDITAR ACTIVIDAD
  // =====================================================
  editar() {
    if (this.ofertante?.id) {
      this.router.navigate(['/oferta', this.ofertante.id]);
    }
  }

  // =====================================================
  // ERROR
  // =====================================================
  mostrarError(msg: string) {
    this.mensajeError = msg;
    this.errorVisible = true;
    setTimeout(() => (this.errorVisible = false), 3000);
  }
}
