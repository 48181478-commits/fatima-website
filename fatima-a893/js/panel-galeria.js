(function () {
  'use strict';

  var listaFotos = document.getElementById('listaFotos');
  if (!listaFotos) return;

  var cargando = document.getElementById('cargando');
  var vacio = document.getElementById('vacio');
  var sinResultados = document.getElementById('sinResultados');
  var btnAgregar = document.getElementById('btnAgregar');
  var btnCargaMasiva = document.getElementById('btnCargaMasiva');

  var modalOverlay = document.getElementById('modalOverlay');
  var modalMasivaOverlay = document.getElementById('modalMasivaOverlay');
  var modalBorrarOverlay = document.getElementById('modalBorrarOverlay');
  var modalBorrarBulkOverlay = document.getElementById('modalBorrarBulkOverlay');

  var fotoForm = document.getElementById('fotoForm');
  var inputArchivo = document.getElementById('inputArchivo');
  var inputTitulo = document.getElementById('inputTitulo');
  var inputCategoria = document.getElementById('inputCategoria');
  var inputAnio = document.getElementById('inputAnio');
  var inputLugar = document.getElementById('inputLugar');
  var inputDescripcion = document.getElementById('inputDescripcion');
  var inputDestacada = document.getElementById('inputDestacada');
  var inputHistorica = document.getElementById('inputHistorica');
  var previewImagen = document.getElementById('previewImagen');
  var uploadPlaceholder = document.getElementById('uploadPlaceholder');
  var zonaUpload = document.getElementById('zonaUpload');
  var modalTitulo = document.getElementById('modalTitulo');
  var modalError = document.getElementById('modalError');
  var btnGuardar = document.getElementById('btnGuardar');

  var filtroTexto = document.getElementById('filtroTexto');
  var filtroCategoria = document.getElementById('filtroCategoria');
  var filtroTipo = document.getElementById('filtroTipo');

  var bulkBar = document.getElementById('bulkBar');
  var bulkCount = document.getElementById('bulkCount');
  var bulkCategoria = document.getElementById('bulkCategoria');
  var bulkAnio = document.getElementById('bulkAnio');

  var inputMasiva = document.getElementById('inputMasiva');
  var zonaMasiva = document.getElementById('zonaMasiva');
  var masivaPlaceholder = document.getElementById('masivaPlaceholder');
  var masivaResumen = document.getElementById('masivaResumen');
  var masivaCategoria = document.getElementById('masivaCategoria');
  var masivaAnio = document.getElementById('masivaAnio');
  var masivaDestacada = document.getElementById('masivaDestacada');
  var masivaError = document.getElementById('masivaError');
  var masivaProgreso = document.getElementById('masivaProgreso');
  var masivaProgresoFill = document.getElementById('masivaProgresoFill');
  var masivaProgresoTexto = document.getElementById('masivaProgresoTexto');
  var btnSubirMasiva = document.getElementById('btnSubirMasiva');

  var usuarioEmail = document.getElementById('usuarioEmail');
  var btnLogout = document.getElementById('btnLogout');

  var fotos = [];
  var editandoId = null;
  var borrandoId = null;
  var archivoSeleccionado = null;
  var imagenActualUrl = null;
  var archivosMasivos = [];
  var subiendoMasiva = false;
  var seleccion = {};
  var BUCKET = 'Fatima-website-imagenes';

  poblarCategorias();

  db.auth.getSession().then(function (result) {
    if (!result.data.session) {
      window.location.href = 'admin.html';
      return;
    }
    if (usuarioEmail) usuarioEmail.textContent = result.data.session.user.email;
    cargarFotos();
  });

  if (btnLogout) {
    btnLogout.addEventListener('click', async function () {
      await db.auth.signOut();
      window.location.href = 'admin.html';
    });
  }

  function poblarCategorias() {
    var placeholders = {
      filtroCategoria: 'Todas las categorías',
      bulkCategoria: 'Categoría…',
      inputCategoria: 'Sin categoría',
      masivaCategoria: 'Sin categoría'
    };
    document.querySelectorAll('.js-categoria').forEach(function (select) {
      var etiqueta = placeholders[select.id] || 'Sin categoría';
      var html = '<option value="">' + etiqueta + '</option>';
      CATEGORIAS.forEach(function (cat) {
        html += '<option value="' + cat + '">' + cat + '</option>';
      });
      select.innerHTML = html;
    });
  }

  async function cargarFotos() {
    cargando.hidden = false;
    vacio.hidden = true;
    if (sinResultados) sinResultados.hidden = true;
    listaFotos.innerHTML = '';
    try {
      var { data, error } = await db
        .from('galeria_fotos')
        .select('*')
        .order('orden', { ascending: true });
      if (error) throw error;
      fotos = data || [];
      limpiarSeleccionInvalida();
      renderFotos();
    } catch (err) {
      listaFotos.innerHTML = '<p style="color:#c0392b">Error al cargar las fotos: ' + escapar(err.message) + '</p>';
    } finally {
      cargando.hidden = true;
    }
  }

  function aplicarFiltros() {
    var texto = filtroTexto.value.trim().toLowerCase();
    var cat = filtroCategoria.value;
    var tipo = filtroTipo.value;
    return fotos.filter(function (f) {
      if (texto && (f.titulo || '').toLowerCase().indexOf(texto) === -1) return false;
      if (cat && (f.categoria || '') !== cat) return false;
      if (tipo === 'destacadas' && !f.destacada) return false;
      return true;
    });
  }

  function renderFotos() {
    var visibles = aplicarFiltros();
    listaFotos.innerHTML = '';

    if (fotos.length === 0) {
      vacio.hidden = false;
      actualizarBulkBar();
      return;
    }
    vacio.hidden = true;

    if (visibles.length === 0) {
      if (sinResultados) sinResultados.hidden = false;
      actualizarBulkBar();
      return;
    }
    if (sinResultados) sinResultados.hidden = true;

    visibles.forEach(function (foto, i) {
      var fullIndex = fotos.findIndex(function (f) { return f.id === foto.id; });
      var meta = [];
      if (foto.categoria) meta.push(escapar(foto.categoria));
      if (foto.anio) meta.push(escapar(String(foto.anio)));

      var card = document.createElement('div');
      card.className = 'admin-card' + (seleccion[foto.id] ? ' seleccionada' : '');
      card.dataset.id = foto.id;
      card.style.animationDelay = Math.min(i * 50, 600) + 'ms';
      card.innerHTML =
        '<div class="admin-card-media">' +
          '<img class="admin-card-img" src="' + escapar(foto.imagen_url) + '" alt="' + escapar(foto.titulo) + '" loading="lazy">' +
          '<label class="admin-card-check" title="Seleccionar">' +
            '<input type="checkbox" class="check-foto" data-id="' + foto.id + '"' + (seleccion[foto.id] ? ' checked' : '') + '>' +
          '</label>' +
          '<button class="admin-card-star' + (foto.destacada ? ' activa' : '') + '" data-accion="destacar" data-id="' + foto.id + '" title="' + (foto.destacada ? 'Quitar de destacadas' : 'Marcar como destacada') + '">' +
            (foto.destacada ? '★' : '☆') +
          '</button>' +
        '</div>' +
        '<div class="admin-card-body">' +
          '<span class="admin-card-titulo">' + escapar(foto.titulo) + '</span>' +
          (meta.length ? '<span class="admin-card-lugar">' + meta.join(' · ') + '</span>' : '') +
          (foto.lugar ? '<span class="admin-card-lugar">' + escapar(foto.lugar) + '</span>' : '') +
          '<span class="admin-card-badges">' +
            (foto.destacada ? '<span class="admin-card-badge admin-badge-dest">Destacada</span>' : '') +
          '</span>' +
        '</div>' +
        '<div class="admin-card-acciones">' +
          '<button class="admin-card-btn" data-accion="editar" data-id="' + foto.id + '" title="Editar">✏️</button>' +
          '<button class="admin-card-btn" data-accion="subir" data-id="' + foto.id + '" title="Mover arriba"' + (fullIndex === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button class="admin-card-btn" data-accion="bajar" data-id="' + foto.id + '" title="Mover abajo"' + (fullIndex === fotos.length - 1 ? ' disabled' : '') + '>↓</button>' +
          '<button class="admin-card-btn admin-card-btn-eliminar" data-accion="borrar" data-id="' + foto.id + '" title="Eliminar">🗑️</button>' +
        '</div>';
      listaFotos.appendChild(card);
    });

    actualizarBulkBar();
  }

  listaFotos.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-accion]');
    if (!btn) return;
    var id = btn.dataset.id;
    var accion = btn.dataset.accion;
    if (accion === 'editar') abrirModalEditar(id);
    if (accion === 'borrar') abrirModalBorrar(id);
    if (accion === 'subir') moverFoto(id, -1);
    if (accion === 'bajar') moverFoto(id, 1);
    if (accion === 'destacar') alternarDestacada(id, btn);
  });

  listaFotos.addEventListener('change', function (e) {
    if (!e.target.classList.contains('check-foto')) return;
    var id = e.target.dataset.id;
    var card = e.target.closest('.admin-card');
    if (e.target.checked) { seleccion[id] = true; if (card) card.classList.add('seleccionada'); }
    else { delete seleccion[id]; if (card) card.classList.remove('seleccionada'); }
    actualizarBulkBar();
  });

  /* ── SELECCIÓN Y ACCIONES EN BLOQUE ── */

  function idsSeleccionados() { return Object.keys(seleccion); }

  function limpiarSeleccionInvalida() {
    var validos = {};
    fotos.forEach(function (f) { if (seleccion[f.id]) validos[f.id] = true; });
    seleccion = validos;
  }

  function actualizarBulkBar() {
    var n = idsSeleccionados().length;
    if (!bulkBar) return;
    bulkBar.hidden = n === 0;
    if (bulkCount) bulkCount.textContent = n + (n === 1 ? ' seleccionada' : ' seleccionadas');
  }

  document.getElementById('bulkLimpiar').addEventListener('click', function () {
    seleccion = {};
    renderFotos();
  });

  document.getElementById('bulkAplicar').addEventListener('click', async function () {
    var cat = bulkCategoria.value;
    var anio = bulkAnio.value.trim();
    if (!cat && !anio) { alert('Elegí una categoría o un año para aplicar.'); return; }
    var ids = idsSeleccionados();
    if (!ids.length) return;
    var cambios = {};
    if (cat) cambios.categoria = cat;
    if (anio) cambios.anio = parseInt(anio, 10);
    await actualizarEnBloque(ids, cambios, 'Error al aplicar los cambios');
  });
document.getElementById('bulkDestacar').addEventListener('click', function () {
    alternarDestacadas(idsSeleccionados(), true);
  });

  document.getElementById('bulkQuitarDestacada').addEventListener('click', function () {
    alternarDestacadas(idsSeleccionados(), false);
  });

  async function alternarDestacadas(ids, valor) {
    if (!ids.length) return;
    await actualizarEnBloque(ids, { destacada: valor }, 'Error al actualizar');
  }

  async function alternarDestacada(id, btn) {
    var foto = fotos.find(function (f) { return f.id === id; });
    if (!foto) return;
    var nueva = !foto.destacada;
    btn.classList.toggle('activa', nueva);
    btn.textContent = nueva ? '★' : '☆';
    btn.title = nueva ? 'Quitar de destacadas' : 'Marcar como destacada';
    foto.destacada = nueva;
    renderFotos();
    try {
      var { error } = await db.from('galeria_fotos').update({ destacada: nueva }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      foto.destacada = !nueva;
      renderFotos();
    }
  }

  async function actualizarEnBloque(ids, cambios, mensajeError) {
    try {
      var { error } = await db.from('galeria_fotos').update(cambios).in('id', ids);
      if (error) throw error;
      seleccion = {};
      await cargarFotos();
    } catch (err) {
      alert(mensajeError + ': ' + err.message);
    }
  }

  document.getElementById('bulkEliminar').addEventListener('click', function () {
    var n = idsSeleccionados().length;
    if (!n) return;
    document.getElementById('borrarBulkTexto').textContent =
      'Se eliminarán ' + n + (n === 1 ? ' foto' : ' fotos') + '. Esta acción no se puede deshacer.';
    modalBorrarBulkOverlay.hidden = false;
  });

  var btnCerrarBorrarBulk = document.getElementById('btnCerrarBorrarBulk');
  var btnCancelarBorrarBulk = document.getElementById('btnCancelarBorrarBulk');
  if (btnCerrarBorrarBulk) btnCerrarBorrarBulk.addEventListener('click', function () { modalBorrarBulkOverlay.hidden = true; });
  if (btnCancelarBorrarBulk) btnCancelarBorrarBulk.addEventListener('click', function () { modalBorrarBulkOverlay.hidden = true; });
  modalBorrarBulkOverlay.addEventListener('click', function (e) { if (e.target === modalBorrarBulkOverlay) modalBorrarBulkOverlay.hidden = true; });

  document.getElementById('btnConfirmarBorrarBulk').addEventListener('click', async function () {
    var ids = idsSeleccionados();
    if (!ids.length) { modalBorrarBulkOverlay.hidden = true; return; }
    try {
      var borradas = fotos.filter(function (f) { return seleccion[f.id]; });
      var { error } = await db.from('galeria_fotos').delete().in('id', ids);
      if (error) throw error;
      var paths = borradas.map(function (f) { return rutaStorage(f.imagen_url); }).filter(Boolean);
      if (paths.length) await db.storage.from(BUCKET).remove(paths);
      modalBorrarBulkOverlay.hidden = true;
      seleccion = {};
      await cargarFotos();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  });

  /* ── REORDENAR ── */

  async function moverFoto(id, direccion) {
    var idx = fotos.findIndex(function (f) { return f.id === id; });
    var nuevoIdx = idx + direccion;
    if (nuevoIdx < 0 || nuevoIdx >= fotos.length) return;
    var temp = fotos[idx];
    fotos[idx] = fotos[nuevoIdx];
    fotos[nuevoIdx] = temp;
    try {
      for (var i = 0; i < fotos.length; i++) {
        var { error } = await db.from('galeria_fotos').update({ orden: i + 1 }).eq('id', fotos[i].id);
        if (error) throw error;
      }
      renderFotos();
    } catch (err) {
      alert('Error al reordenar: ' + err.message);
      cargarFotos();
    }
  }

  /* ── MODAL AGREGAR / EDITAR ── */

function abrirModalAgregar() {
    editandoId = null;
    imagenActualUrl = null;
    archivoSeleccionado = null;
    modalTitulo.textContent = 'Agregar foto';
    inputTitulo.value = '';
    inputCategoria.value = '';
    inputAnio.value = '';
    inputLugar.value = '';
    inputDescripcion.value = '';
    inputDestacada.checked = false;
    previewImagen.hidden = true;
    if (uploadPlaceholder) uploadPlaceholder.hidden = false;
    zonaUpload.classList.remove('tiene-imagen');
    fotoForm.dataset.editando = '0';
    modalError.hidden = true;
    modalOverlay.hidden = false;
  }

  function abrirModalEditar(id) {
    var foto = fotos.find(function (f) { return f.id === id; });
    if (!foto) return;
    editandoId = id;
    imagenActualUrl = foto.imagen_url;
    archivoSeleccionado = null;
    modalTitulo.textContent = 'Editar foto';
    inputTitulo.value = foto.titulo || '';
    inputCategoria.value = foto.categoria || '';
    inputAnio.value = foto.anio || '';
    inputLugar.value = foto.lugar || '';
    inputDescripcion.value = foto.descripcion || '';
    inputDestacada.checked = !!foto.destacada;
    if (inputHistorica) inputHistorica.checked = false;
    previewImagen.src = foto.imagen_url;
    previewImagen.hidden = false;
    uploadPlaceholder.hidden = true;
    inputArchivo.value = '';
    modalError.hidden = true;
    modalOverlay.hidden = false;
    inputTitulo.focus();
  }

  function cerrarModal() {
    modalOverlay.hidden = true;
    editandoId = null;
    archivoSeleccionado = null;
    imagenActualUrl = null;
  }

  if (btnAgregar) btnAgregar.addEventListener('click', abrirModalAgregar);
  document.getElementById('btnCerrarModal').addEventListener('click', cerrarModal);
  document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
  modalOverlay.addEventListener('click', function (e) { if (e.target === modalOverlay) cerrarModal(); });

  zonaUpload.addEventListener('click', function () { inputArchivo.click(); });
  zonaUpload.addEventListener('dragover', function (e) { e.preventDefault(); zonaUpload.classList.add('dragover'); });
  zonaUpload.addEventListener('dragleave', function () { zonaUpload.classList.remove('dragover'); });
  zonaUpload.addEventListener('drop', function (e) {
    e.preventDefault();
    zonaUpload.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      inputArchivo.files = e.dataTransfer.files;
      manejarArchivo();
    }
  });
  inputArchivo.addEventListener('change', manejarArchivo);

  function manejarArchivo() {
    var file = inputArchivo.files[0];
    if (!file) return;
    if (!esImagenValida(file)) return;
    archivoSeleccionado = file;
    var reader = new FileReader();
    reader.onload = function (e) {
      previewImagen.src = e.target.result;
      previewImagen.hidden = false;
      uploadPlaceholder.hidden = true;
    };
    reader.readAsDataURL(file);
  }

  function esImagenValida(file) {
    if (!file.type.startsWith('image/')) { mostrarErrorModal('El archivo debe ser una imagen.'); return false; }
    if (file.size > 15 * 1024 * 1024) { mostrarErrorModal('La imagen no puede superar los 15 MB.'); return false; }
    return true;
  }

  function mostrarErrorModal(msg) {
    modalError.textContent = msg;
    modalError.hidden = false;
  }

  fotoForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    modalError.hidden = true;
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando…';
    try {
      var titulo = inputTitulo.value.trim();
      var categoria = inputCategoria.value || null;
      var anio = inputAnio.value.trim() ? parseInt(inputAnio.value, 10) : null;
      var lugar = inputLugar.value.trim();
      var descripcion = inputDescripcion.value.trim() || null;
      var destacada = inputDestacada.checked;
      var historica = false;
      var imagenUrl = imagenActualUrl;

      if (archivoSeleccionado) imagenUrl = await subirImagen(archivoSeleccionado);
      if (!imagenUrl) throw new Error('Seleccioná una imagen.');

      if (destacada) {
        await db.from('galeria_fotos').update({ destacada: false })
          .neq('id', editandoId || '00000000-0000-0000-0000-000000000000');
      }

      if (editandoId) {
        var { error } = await db.from('galeria_fotos').update({
          titulo: titulo, categoria: categoria, anio: anio, lugar: lugar,
          descripcion: descripcion, imagen_url: imagenUrl, destacada: destacada, es_historica: historica
        }).eq('id', editandoId);
        if (error) throw error;
      } else {
        var { error } = await db.from('galeria_fotos').insert({
          titulo: titulo, categoria: categoria, anio: anio, lugar: lugar,
          descripcion: descripcion, imagen_url: imagenUrl, destacada: destacada,
          es_historica: historica, orden: proximoOrden()
        });
        if (error) throw error;
      }
      cerrarModal();
      cargarFotos();
    } catch (err) {
      mostrarErrorModal(err.message);
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Guardar';
    }
  });

  /* ── CARGA MASIVA ── */

  if (btnCargaMasiva) btnCargaMasiva.addEventListener('click', abrirModalMasiva);
  document.getElementById('btnCerrarMasiva').addEventListener('click', cerrarModalMasiva);
  document.getElementById('btnCancelarMasiva').addEventListener('click', cerrarModalMasiva);
  modalMasivaOverlay.addEventListener('click', function (e) { if (e.target === modalMasivaOverlay) cerrarModalMasiva(); });

  function abrirModalMasiva() {
    archivosMasivos = [];
    inputMasiva.value = '';
    masivaCategoria.value = '';
    masivaAnio.value = '';
    if (masivaHistorica) masivaHistorica.checked = false;
    if (masivaDestacada) masivaDestacada.checked = false;
    masivaError.hidden = true;
    masivaProgreso.hidden = true;
    masivaResumen.hidden = true;
    masivaPlaceholder.hidden = false;
    btnSubirMasiva.disabled = true;
    btnSubirMasiva.textContent = 'Subir fotos';
    modalMasivaOverlay.hidden = false;
  }

  function cerrarModalMasiva() {
    if (subiendoMasiva) return;
    modalMasivaOverlay.hidden = true;
    archivosMasivos = [];
  }

  zonaMasiva.addEventListener('click', function () { inputMasiva.click(); });
  zonaMasiva.addEventListener('dragover', function (e) { e.preventDefault(); zonaMasiva.classList.add('dragover'); });
  zonaMasiva.addEventListener('dragleave', function () { zonaMasiva.classList.remove('dragover'); });
  zonaMasiva.addEventListener('drop', function (e) {
    e.preventDefault();
    zonaMasiva.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      inputMasiva.files = e.dataTransfer.files;
      manejarMasiva();
    }
  });
  inputMasiva.addEventListener('change', manejarMasiva);

  function manejarMasiva() {
    masivaError.hidden = true;
    archivosMasivos = Array.prototype.slice.call(inputMasiva.files).filter(function (f) {
      return f.type.startsWith('image/');
    });
    var ignoradas = inputMasiva.files.length - archivosMasivos.length;
    if (!archivosMasivos.length) {
      masivaResumen.hidden = true;
      masivaPlaceholder.hidden = false;
      btnSubirMasiva.disabled = true;
      btnSubirMasiva.textContent = 'Subir fotos';
      return;
    }
    masivaPlaceholder.hidden = true;
    masivaResumen.hidden = false;
    masivaResumen.innerHTML =
      '<strong>' + archivosMasivos.length + (archivosMasivos.length === 1 ? ' imagen seleccionada' : ' imágenes seleccionadas') + '</strong>' +
      (ignoradas ? '<span class="admin-upload-ayuda">' + ignoradas + ' archivo(s) no eran imágenes y se ignoraron</span>' : '');
    btnSubirMasiva.disabled = false;
    btnSubirMasiva.textContent = 'Subir ' + archivosMasivos.length + (archivosMasivos.length === 1 ? ' foto' : ' fotos');
  }

  btnSubirMasiva.addEventListener('click', async function () {
    if (!archivosMasivos.length) return;
    masivaError.hidden = true;
    subiendoMasiva = true;
    btnSubirMasiva.disabled = true;
    btnSubirMasiva.textContent = 'Subiendo…';
    var cat = masivaCategoria.value || null;
    var anio = masivaAnio.value.trim() ? parseInt(masivaAnio.value, 10) : null;
    var destacada = masivaDestacada.checked;
    var base = proximoOrden();
    var total = archivosMasivos.length;
    var errores = 0;

    masivaProgreso.hidden = false;

    for (var i = 0; i < total; i++) {
      var file = archivosMasivos[i];
      masivaProgresoTexto.textContent = 'Subiendo ' + (i + 1) + ' de ' + total + '…';
      masivaProgresoFill.style.width = Math.round((i / total) * 100) + '%';
      try {
        var url = await subirImagen(file);
        var titulo = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Foto';
        var insert = {
          titulo: titulo, categoria: cat, anio: anio, lugar: '',
          descripcion: null, imagen_url: url, destacada: false,
          es_historica: false, orden: base + i
        };
        if (destacada) insert.destacada = true;
        var { error } = await db.from('galeria_fotos').insert(insert);
        if (error) throw error;
      } catch (err) {
        errores++;
      }
      masivaProgresoFill.style.width = Math.round(((i + 1) / total) * 100) + '%';
    }

    masivaProgresoTexto.textContent = errores === 0
      ? '¡Listo! ' + total + ' ' + (total === 1 ? 'foto subida' : 'fotos subidas') + '.'
      : total - errores + ' subidas, ' + errores + ' con error.';

    setTimeout(async function () {
      modalMasivaOverlay.hidden = true;
      subiendoMasiva = false;
      btnSubirMasiva.disabled = false;
      btnSubirMasiva.textContent = 'Subir fotos';
      await cargarFotos();
    }, 700);
  });

  /* ── SUBIR IMAGEN ── */

  async function subirImagen(file) {
    var extension = file.name.split('.').pop().toLowerCase();
    var nombre = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + extension;
    var { error: uploadError } = await db.storage.from(BUCKET).upload(nombre, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw new Error('Error al subir la imagen: ' + uploadError.message);
    var { data } = db.storage.from(BUCKET).getPublicUrl(nombre);
    return data.publicUrl;
  }

  function proximoOrden() {
    return fotos.reduce(function (max, f) { return Math.max(max, f.orden || 0); }, 0) + 1;
  }

  /* ── BORRAR INDIVIDUAL ── */

  function abrirModalBorrar(id) { borrandoId = id; modalBorrarOverlay.hidden = false; }
  function cerrarModalBorrar() { modalBorrarOverlay.hidden = true; borrandoId = null; }

  document.getElementById('btnCerrarBorrar').addEventListener('click', cerrarModalBorrar);
  document.getElementById('btnCancelarBorrar').addEventListener('click', cerrarModalBorrar);
  modalBorrarOverlay.addEventListener('click', function (e) { if (e.target === modalBorrarOverlay) cerrarModalBorrar(); });

  document.getElementById('btnConfirmarBorrar').addEventListener('click', async function () {
    if (!borrandoId) return;
    try {
      var foto = fotos.find(function (f) { return f.id === borrandoId; });
      var { error } = await db.from('galeria_fotos').delete().eq('id', borrandoId);
      if (error) throw error;
      var path = foto ? rutaStorage(foto.imagen_url) : null;
      if (path) await db.storage.from(BUCKET).remove([path]);
      delete seleccion[borrandoId];
      cerrarModalBorrar();
      cargarFotos();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  });

  /* ── FILTROS ── */

  filtroTexto.addEventListener('input', renderFotos);
  filtroCategoria.addEventListener('change', renderFotos);
  filtroTipo.addEventListener('change', renderFotos);

  /* ── UTILIDADES ── */

  function rutaStorage(url) {
    if (!url || url.indexOf(BUCKET) === -1) return null;
    return url.split('/' + BUCKET + '/')[1] || null;
  }

  function escapar(texto) {
    var div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }
})();
