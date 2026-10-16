(function () {
  'use strict';

  var grilla = document.getElementById('proyectosGrilla');
  if (!grilla) return;

  var cargando = document.getElementById('proyectosCargando');

  var ESTADOS = {
    activo: 'Activo',
    en_curso: 'En curso',
    finalizado: 'Finalizado',
    pausado: 'Pausado'
  };

  var PROYECTOS_FALLBACK = [
    {
      nombre: 'FireNova',
      estado: 'en_curso',
      descripcion: 'Sistema de alerta temprana de incendios forestales de bajo costo, con sensores ambientales, comunicación LoRa, detección de humo con inteligencia artificial y un mapa de calor interactivo.',
      imagen_url: 'img/firenova.jpg'
    },
    {
      nombre: 'SensePad',
      estado: 'finalizado',
      descripcion: 'Botonera configurable de cinco botones pensada para personas con discapacidad visual. Fue distinguida como Proyecto Destacado de la Ciudad y representó a CABA en la Feria Nacional.',
      imagen_url: 'img/sensepad.jpg'
    },
    {
      nombre: 'Huerta escolar',
      estado: 'activo',
      descripcion: 'Espacio de aprendizaje interdisciplinario donde los alumnos cultivan, investigan y comparten lo producido con la comunidad.',
      imagen_url: 'img/patio.jpg'
    }
  ];

  function escapar(texto) {
    var div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  function render(proyectos) {
    grilla.innerHTML = '';
    proyectos.forEach(function (proy, i) {
      var articulo = document.createElement('article');
      articulo.className = 'tarjeta-proyecto aparecer';
      articulo.style.animationDelay = Math.min(i * 60, 420) + 'ms';

      var img = proy.imagen_url
        ? '<img class="tarjeta-proyecto-img" src="' + escapar(proy.imagen_url) + '" alt="' + escapar(proy.nombre) + '" loading="lazy">'
        : '<div class="tarjeta-proyecto-img sin-imagen">Sin imagen</div>';

      articulo.innerHTML =
        img +
        '<div class="tarjeta-proyecto-body">' +
          '<span class="estado estado-' + escapar(proy.estado) + '">' + escapar(ESTADOS[proy.estado] || proy.estado) + '</span>' +
          '<h3>' + escapar(proy.nombre) + '</h3>' +
          (proy.descripcion ? '<p>' + escapar(proy.descripcion) + '</p>' : '') +
        '</div>';

      grilla.appendChild(articulo);
    });
  }

  function terminar() { if (cargando) cargando.hidden = true; }

  if (typeof db !== 'undefined') {
    db.from('proyectos')
      .select('*')
      .order('orden', { ascending: true })
      .then(function (result) {
        var proyectos = (!result.error && result.data && result.data.length) ? result.data : PROYECTOS_FALLBACK;
        render(proyectos);
        terminar();
      })
      .catch(function () {
        render(PROYECTOS_FALLBACK);
        terminar();
      });
  } else {
    render(PROYECTOS_FALLBACK);
    terminar();
  }
})();