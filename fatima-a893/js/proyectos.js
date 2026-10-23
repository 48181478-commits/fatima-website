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

  var PROYECTOS_ERROR = 'No se pudieron cargar los proyectos. Probá de nuevo en unos minutos.';

  function escapar(texto) {
    var div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  function mostrarVacio(mensaje) {
    grilla.innerHTML = '<p class="estado-vacio">' + escapar(mensaje) + '</p>';
  }

  function render(proyectos) {
    grilla.innerHTML = '';
    if (!proyectos.length) {
      mostrarVacio('Todavía no hay proyectos publicados.');
      return;
    }
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
        terminar();
        if (result.error) { mostrarVacio(PROYECTOS_ERROR); return; }
        render(result.data || []);
      })
      .catch(function () {
        terminar();
        mostrarVacio(PROYECTOS_ERROR);
      });
  } else {
    terminar();
    mostrarVacio(PROYECTOS_ERROR);
  }
})();