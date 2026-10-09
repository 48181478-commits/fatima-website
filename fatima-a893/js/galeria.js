(function () {
  'use strict';

  var grilla = document.getElementById('galeriaGrilla');
  var visor = document.getElementById('visorGaleria');
  if (!grilla || !visor || typeof bootstrap === 'undefined') return;

  var botones = Array.prototype.slice.call(grilla.querySelectorAll('.foto-galeria'));
  var imagen = document.getElementById('visorImagen');
  var titulo = document.getElementById('visorTitulo');
  var lugar = document.getElementById('visorLugar');
  var contador = document.getElementById('visorContador');
  var modal = bootstrap.Modal.getOrCreateInstance(visor);
  var indice = 0;

  function mostrar(posicion) {
    indice = (posicion + botones.length) % botones.length;
    var boton = botones[indice];
    imagen.src = boton.dataset.src;
    imagen.alt = boton.dataset.alt || '';
    titulo.textContent = boton.dataset.titulo || '';
    lugar.textContent = boton.dataset.lugar || '';
    lugar.hidden = !boton.dataset.lugar;
    contador.textContent = (indice + 1) + ' / ' + botones.length;
    [indice - 1, indice + 1].forEach(function (salto) {
      var previa = new Image();
      previa.src = botones[(indice + salto + botones.length) % botones.length].dataset.src;
    });
  }

  botones.forEach(function (boton, posicion) {
    boton.addEventListener('click', function () {
      mostrar(posicion);
      modal.show();
    });
  });

  document.getElementById('visorAnterior').addEventListener('click', function () { mostrar(indice - 1); });
  document.getElementById('visorSiguiente').addEventListener('click', function () { mostrar(indice + 1); });

  visor.addEventListener('keydown', function (evento) {
    if (evento.key === 'ArrowLeft') { evento.preventDefault(); mostrar(indice - 1); }
    if (evento.key === 'ArrowRight') { evento.preventDefault(); mostrar(indice + 1); }
  });
})();
