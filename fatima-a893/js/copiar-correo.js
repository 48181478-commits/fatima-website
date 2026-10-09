// Copiar el correo al hacer clic + aviso centrado con fade
(function () {
  var aviso = null;

  function crearAviso() {
    aviso = document.createElement('div');
    aviso.className = 'aviso-copiado';
    aviso.textContent = '¡Correo copiado!';
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');
    aviso.addEventListener('transitionend', function (evento) {
      if (evento.propertyName === 'opacity' && aviso.classList.contains('visible')) {
        aviso.classList.remove('visible');
      }
    });
    document.body.appendChild(aviso);
  }

  function mostrarAviso() {
    if (!aviso) crearAviso();
    aviso.classList.remove('visible');
    void aviso.offsetWidth;
    aviso.classList.add('visible');
  }

  function copiarRespaldo(texto) {
    var area = document.createElement('textarea');
    area.value = texto;
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); mostrarAviso(); } catch (e) {}
    document.body.removeChild(area);
  }

  document.querySelectorAll('.copiar-correo').forEach(function (enlace) {
    enlace.addEventListener('click', function (evento) {
      evento.preventDefault();
      var correo = enlace.dataset.correo;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(correo).then(mostrarAviso).catch(function () { copiarRespaldo(correo); });
      } else {
        copiarRespaldo(correo);
      }
    });
  });
})();
