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
      articulo.style.animationDelay = (i * 60) + 'ms';

      var img = proy.imagen_url
        ? '<img class="tarjeta-proyecto-img" src="' + escapar(proy.imagen_url) + '" alt="' + escapar(proy.nombre) + '" loading="lazy">'
        : '<div class="tarjeta-proyecto-img sin-imagen">Sin imagen</div>';

      var clave = ESTADOS[proy.estado] ? proy.estado : 'activo';

      articulo.innerHTML =
        img +
        '<div class="tarjeta-proyecto-body">' +
          '<span class="estado estado-' + clave + '">' + escapar(ESTADOS[proy.estado] || proy.estado) + '</span>' +
          '<h3>' + escapar(proy.nombre) + '</h3>' +
          (proy.descripcion ? '<p>' + escapar(proy.descripcion) + '</p>' : '') +
        '</div>';

      grilla.appendChild(articulo);
    });
  }

  if (typeof db !== 'undefined') {
    db.from('proyectos')
      .select('*')
      .order('orden', { ascending: true })
      .then(function (result) {
        if (cargando) cargando.hidden = true;
        if (!result.error && result.data && result.data.length > 0) {
          render(result.data);
        }
      })
      .catch(function () {
        if (cargando) cargando.hidden = true;
      });
  } else if (cargando) {
    cargando.hidden = true;
  }
})();
