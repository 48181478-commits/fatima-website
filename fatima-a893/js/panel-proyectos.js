(function () {
  'use strict';

  var listaProyectos = document.getElementById('listaProyectos');
  if (!listaProyectos) return;

  var cargando = document.getElementById('cargando');
  var vacio = document.getElementById('vacio');
  var btnAgregar = document.getElementById('btnAgregar');
  var modalOverlay = document.getElementById('modalOverlay');
  var modalBorrarOverlay = document.getElementById('modalBorrarOverlay');
  var proyectoForm = document.getElementById('proyectoForm');
  var inputArchivo = document.getElementById('inputArchivo');
  var inputNombre = document.getElementById('inputNombre');
  var inputDescripcion = document.getElementById('inputDescripcion');
  var inputEstado = document.getElementById('inputEstado');
  var previewImagen = document.getElementById('previewImagen');
  var uploadPlaceholder = document.getElementById('uploadPlaceholder');
  var zonaUpload = document.getElementById('zonaUpload');
  var modalTitulo = document.getElementById('modalTitulo');
  var modalError = document.getElementById('modalError');
  var btnGuardar = document.getElementById('btnGuardar');
  var usuarioEmail = document.getElementById('usuarioEmail');
  var btnLogout = document.getElementById('btnLogout');

  var proyectos = [];
  var editandoId = null;
  var borrandoId = null;
  var archivoSeleccionado = null;
  var imagenActualUrl = null;
  var BUCKET = 'Fatima-website-imagenes';

  var ESTADOS = {
    activo: 'Activo',
    en_curso: 'En curso',
    finalizado: 'Finalizado',
    pausado: 'Pausado'
  };

  db.auth.getSession().then(function (result) {
    if (!result.data.session) {
      window.location.href = 'admin.html';
      return;
    }
    if (usuarioEmail) usuarioEmail.textContent = result.data.session.user.email;
    cargarProyectos();
  });

  if (btnLogout) {
    btnLogout.addEventListener('click', async function () {
      await db.auth.signOut();
      window.location.href = 'admin.html';
    });
  }

  async function cargarProyectos() {
    cargando.hidden = false;
    vacio.hidden = true;
    listaProyectos.innerHTML = '';
    try {
      var { data, error } = await db
        .from('proyectos')
        .select('*')
        .order('orden', { ascending: true });
      if (error) throw error;
      proyectos = data || [];
      renderProyectos();
    } catch (err) {
      listaProyectos.innerHTML = '<p style="color:#c0392b">Error al cargar los proyectos: ' + err.message + '</p>';
    } finally {
      cargando.hidden = true;
    }
  }

  function renderProyectos() {
    listaProyectos.innerHTML = '';
    if (proyectos.length === 0) {
      vacio.hidden = false;
      return;
    }
    vacio.hidden = true;

    proyectos.forEach(function (proy, i) {
      var card = document.createElement('div');
      card.className = 'admin-card';
      var img = proy.imagen_url
        ? '<img class="admin-card-img" src="' + escapar(proy.imagen_url) + '" alt="' + escapar(proy.nombre) + '" loading="lazy">'
        : '<div class="admin-card-img admin-card-sinimg">Sin imagen</div>';
      card.innerHTML =
        img +
        '<div class="admin-card-body">' +
          '<span class="admin-card-titulo">' + escapar(proy.nombre) + '</span>' +
          (proy.descripcion ? '<span class="admin-card-lugar">' + escapar(proy.descripcion) + '</span>' : '') +
          '<span class="admin-card-badge admin-badge-estado">' + escapar(ESTADOS[proy.estado] || proy.estado) + '</span>' +
        '</div>' +
        '<div class="admin-card-acciones">' +
          '<button class="admin-card-btn" data-accion="editar" data-id="' + proy.id + '" title="Editar">✏️</button>' +
          '<button class="admin-card-btn" data-accion="subir" data-id="' + proy.id + '" title="Mover arriba"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button class="admin-card-btn" data-accion="bajar" data-id="' + proy.id + '" title="Mover abajo"' + (i === proyectos.length - 1 ? ' disabled' : '') + '>↓</button>' +
          '<button class="admin-card-btn admin-card-btn-eliminar" data-accion="borrar" data-id="' + proy.id + '" title="Eliminar">🗑️</button>' +
        '</div>';
      listaProyectos.appendChild(card);
    });
  }

  listaProyectos.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-accion]');
    if (!btn) return;
    var id = btn.dataset.id;
    var accion = btn.dataset.accion;
    if (accion === 'editar') abrirModalEditar(id);
    if (accion === 'borrar') abrirModalBorrar(id);
    if (accion === 'subir') moverProyecto(id, -1);
    if (accion === 'bajar') moverProyecto(id, 1);
  });

  async function moverProyecto(id, direccion) {
    var idx = proyectos.findIndex(function (p) { return p.id === id; });
    var nuevoIdx = idx + direccion;
    if (nuevoIdx < 0 || nuevoIdx >= proyectos.length) return;
    var temp = proyectos[idx];
    proyectos[idx] = proyectos[nuevoIdx];
    proyectos[nuevoIdx] = temp;
    try {
      for (var i = 0; i < proyectos.length; i++) {
        var { error } = await db.from('proyectos').update({ orden: i + 1 }).eq('id', proyectos[i].id);
        if (error) throw error;
      }
      renderProyectos();
    } catch (err) {
      alert('Error al reordenar: ' + err.message);
      cargarProyectos();
    }
  }

  function abrirModalAgregar() {
    editandoId = null;
    imagenActualUrl = null;
    archivoSeleccionado = null;
    modalTitulo.textContent = 'Agregar proyecto';
    inputNombre.value = '';
    inputDescripcion.value = '';
    inputEstado.value = 'activo';
    previewImagen.hidden = true;
    uploadPlaceholder.hidden = false;
    inputArchivo.value = '';
    modalError.hidden = true;
    modalOverlay.hidden = false;
    inputNombre.focus();
  }

  function abrirModalEditar(id) {
    var proy = proyectos.find(function (p) { return p.id === id; });
    if (!proy) return;
    editandoId = id;
    imagenActualUrl = proy.imagen_url || null;
    archivoSeleccionado = null;
    modalTitulo.textContent = 'Editar proyecto';
    inputNombre.value = proy.nombre;
    inputDescripcion.value = proy.descripcion || '';
    inputEstado.value = proy.estado || 'activo';
    if (proy.imagen_url) {
      previewImagen.src = proy.imagen_url;
      previewImagen.hidden = false;
      uploadPlaceholder.hidden = true;
    } else {
      previewImagen.hidden = true;
      uploadPlaceholder.hidden = false;
    }
    inputArchivo.value = '';
    modalError.hidden = true;
    modalOverlay.hidden = false;
    inputNombre.focus();
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
    if (!file.type.startsWith('image/')) { mostrarErrorModal('El archivo debe ser una imagen.'); return; }
    if (file.size > 10 * 1024 * 1024) { mostrarErrorModal('La imagen no puede superar los 10 MB.'); return; }
    archivoSeleccionado = file;
    var reader = new FileReader();
    reader.onload = function (e) {
      previewImagen.src = e.target.result;
      previewImagen.hidden = false;
      uploadPlaceholder.hidden = true;
    };
    reader.readAsDataURL(file);
  }

  function mostrarErrorModal(msg) {
    modalError.textContent = msg;
    modalError.hidden = false;
  }

  proyectoForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    modalError.hidden = true;
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando…';
    try {
      var nombre = inputNombre.value.trim();
      var descripcion = inputDescripcion.value.trim();
      var estado = inputEstado.value;
      var imagenUrl = imagenActualUrl;

      if (archivoSeleccionado) imagenUrl = await subirImagen(archivoSeleccionado);

      if (editandoId) {
        var { error } = await db.from('proyectos').update({
          nombre: nombre, descripcion: descripcion, estado: estado, imagen_url: imagenUrl
        }).eq('id', editandoId);
        if (error) throw error;
      } else {
        var { error } = await db.from('proyectos').insert({
          nombre: nombre, descripcion: descripcion, estado: estado, imagen_url: imagenUrl, orden: proyectos.length + 1
        });
        if (error) throw error;
      }
      cerrarModal();
      cargarProyectos();
    } catch (err) {
      mostrarErrorModal(err.message);
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Guardar';
    }
  });

  async function subirImagen(file) {
    var extension = file.name.split('.').pop().toLowerCase();
    var nombre = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + extension;
    var { error: uploadError } = await db.storage.from(BUCKET).upload(nombre, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw new Error('Error al subir la imagen: ' + uploadError.message);
    var { data } = db.storage.from(BUCKET).getPublicUrl(nombre);
    return data.publicUrl;
  }

  function abrirModalBorrar(id) { borrandoId = id; modalBorrarOverlay.hidden = false; }
  function cerrarModalBorrar() { modalBorrarOverlay.hidden = true; borrandoId = null; }

  document.getElementById('btnCerrarBorrar').addEventListener('click', cerrarModalBorrar);
  document.getElementById('btnCancelarBorrar').addEventListener('click', cerrarModalBorrar);
  modalBorrarOverlay.addEventListener('click', function (e) { if (e.target === modalBorrarOverlay) cerrarModalBorrar(); });

  document.getElementById('btnConfirmarBorrar').addEventListener('click', async function () {
    if (!borrandoId) return;
    try {
      var proy = proyectos.find(function (p) { return p.id === borrandoId; });
      var { error } = await db.from('proyectos').delete().eq('id', borrandoId);
      if (error) throw error;
      if (proy && proy.imagen_url && proy.imagen_url.indexOf(BUCKET) !== -1) {
        var path = proy.imagen_url.split('/' + BUCKET + '/')[1];
        if (path) await db.storage.from(BUCKET).remove([path]);
      }
      cerrarModalBorrar();
      cargarProyectos();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  });

  function escapar(texto) {
    var div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }
})();
