(function () {
  'use strict';

  var grilla = document.getElementById('galeriaGrilla');
  var filtrosBox = document.getElementById('galeriaFiltros');
  var cargando = document.getElementById('galeriaCargando');
  var historiaFotos = document.getElementById('historiaFotos');
  var historiaTimeline = document.getElementById('historiaTimeline');
  var visor = document.getElementById('visorGaleria');
  if (!grilla || !visor || typeof bootstrap === 'undefined') return;

  var imagen = document.getElementById('visorImagen');
  var titulo = document.getElementById('visorTitulo');
  var meta = document.getElementById('visorMeta');
  var lugar = document.getElementById('visorLugar');
  var descripcion = document.getElementById('visorDescripcion');
  var contador = document.getElementById('visorContador');
  var modal = bootstrap.Modal.getOrCreateInstance(visor);

  var todasFotos = [];
  var categoriaActiva = '';
  var visorLista = [];
  var visorIndice = 0;

  var FOTOS_FALLBACK = [
    {
      titulo: 'El patio', lugar: 'Patio central', categoria: 'Vida escolar',
      imagen_url: 'img/patio.jpg', destacada: true, es_historica: false,
      descripcion: 'El patio durante el recreo, corazón de la vida cotidiana del colegio.'
    },
    {
      titulo: 'SensePad, Proyecto Destacado', lugar: 'Feria de Ciencias', categoria: 'Feria de Ciencias',
      imagen_url: 'img/sensepad.jpg', es_historica: false,
      descripcion: 'El equipo de SensePad con el certificado y la placa de Proyecto Destacado 2026.'
    },
    {
      titulo: 'FireNova en el laboratorio', lugar: 'Laboratorio de informática', categoria: 'Talleres y orientaciones',
      imagen_url: 'img/firenova.jpg', es_historica: false,
      descripcion: 'Un alumno trabaja en el mapa de calor de FireNova, sistema de alerta temprana de incendios.'
    },
    {
      titulo: 'Los primeros años', lugar: 'Barrio Villa Soldati', categoria: 'Historia', anio: 1968,
      imagen_url: 'img/padre-leoncio-historica.jpg', es_historica: true,
      descripcion: 'Foto de archivo: el padre Leoncio caminando de la mano con los primeros chicos del barrio.'
    },
    {
      titulo: 'El padre Leoncio con los chicos', lugar: 'Nuestro fundador', categoria: 'Historia', anio: 1972,
      imagen_url: 'img/padre-leoncio.jpg', es_historica: true,
      descripcion: 'El padre Leoncio Herrero, fundador de la obra, rodeado de alumnos.'
    }
  ];

  function escapar(texto) {
    var div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  function iniciar(fotos) {
    todasFotos = fotos || [];
    if (cargando) cargando.hidden = true;
    construirFiltros();
    renderGrilla();
    renderHistoria();
  }

  function categoriasDisponibles() {
    var vistas = {};
    var lista = [];
    todasFotos.forEach(function (f) {
      if (f.categoria && !vistas[f.categoria]) { vistas[f.categoria] = true; lista.push(f.categoria); }
    });
    if (typeof CATEGORIAS !== 'undefined') {
      lista.sort(function (a, b) {
        var ia = CATEGORIAS.indexOf(a); if (ia === -1) ia = 999;
        var ib = CATEGORIAS.indexOf(b); if (ib === -1) ib = 999;
        return ia - ib;
      });
    }
    return lista;
  }

  function construirFiltros() {
    if (!filtrosBox) return;
    var cats = categoriasDisponibles();
    if (cats.length < 2) { filtrosBox.hidden = true; filtrosBox.innerHTML = ''; return; }
    filtrosBox.hidden = false;
    var html = '<button class="chip-filtro' + (categoriaActiva === '' ? ' activo' : '') + '" data-categoria="">Todas</button>';
    cats.forEach(function (c) {
      html += '<button class="chip-filtro' + (categoriaActiva === c ? ' activo' : '') + '" data-categoria="' + escapar(c) + '">' + escapar(c) + '</button>';
    });
    filtrosBox.innerHTML = html;
  }

  if (filtrosBox) {
    filtrosBox.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip-filtro');
      if (!btn) return;
      categoriaActiva = btn.dataset.categoria || '';
      construirFiltros();
      renderGrilla();
    });
  }

  function listaVisible() {
    if (!categoriaActiva) return todasFotos.slice();
    return todasFotos.filter(function (f) { return f.categoria === categoriaActiva; });
  }

  function renderGrilla() {
    var lista = listaVisible();
    grilla.innerHTML = '';
    lista.forEach(function (foto, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'foto-galeria aparecer' +
        (foto.destacada ? ' destacada' : '') +
        (foto.es_historica ? ' historica' : '');
      btn.style.animationDelay = Math.min(i * 40, 400) + 'ms';
      btn.innerHTML =
        '<img src="' + escapar(foto.imagen_url) + '" alt="' + escapar(foto.titulo) + '" loading="lazy" width="1000" height="1000">' +
        (foto.es_historica ? '<span class="marca-historica">Archivo</span>' : '') +
        '<span class="marca-foto">' +
          '<span class="marca-foto-titulo">' + escapar(foto.titulo) + '</span>' +
          (foto.lugar ? '<span class="marca-foto-lugar">' + escapar(foto.lugar) + '</span>' : '') +
        '</span>';
      btn.addEventListener('click', (function (indice) {
        return function () { abrirVisor(lista, indice); };
      })(i));
      grilla.appendChild(btn);
    });
  }

  function renderHistoria() {
    if (!historiaFotos || !historiaTimeline) return;
    var historicas = todasFotos.filter(function (f) { return f.es_historica; });
    if (!historicas.length) { historiaFotos.hidden = true; return; }

    var grupos = {};
    historicas.forEach(function (f) {
      var clave = f.anio ? String(f.anio) : 'sin';
      if (!grupos[clave]) grupos[clave] = [];
      grupos[clave].push(f);
    });

    var claves = Object.keys(grupos).filter(function (k) { return k !== 'sin'; })
      .sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
    if (grupos['sin']) claves.push('sin');

    historiaTimeline.innerHTML = '';
    claves.forEach(function (clave) {
      var etiqueta = clave === 'sin' ? 'Sin fecha' : clave;
      var fotosHtml = '';
      grupos[clave].forEach(function (f) {
        var idx = historicas.indexOf(f);
        fotosHtml += '<button class="foto-historia aparecer" data-index="' + idx + '">' +
          '<img src="' + escapar(f.imagen_url) + '" alt="' + escapar(f.titulo) + '" loading="lazy">' +
          '<span class="foto-historia-titulo">' + escapar(f.titulo) + '</span>' +
        '</button>';
      });
      var grupo = document.createElement('div');
      grupo.className = 'linea-tiempo-grupo';
      grupo.innerHTML =
        '<div class="linea-tiempo-anio">' + escapar(etiqueta) + '</div>' +
        '<div class="linea-tiempo-contenido"><div class="linea-tiempo-fotos">' + fotosHtml + '</div></div>';
      historiaTimeline.appendChild(grupo);
    });

    historiaTimeline.querySelectorAll('.foto-historia').forEach(function (btn) {
      btn.addEventListener('click', function () {
        abrirVisor(historicas, parseInt(btn.dataset.index, 10));
      });
    });

    historiaFotos.hidden = false;
  }

  function abrirVisor(lista, indice) {
    visorLista = lista;
    visorIndice = indice;
    pintarVisor();
    modal.show();
  }

  function pintarVisor() {
    if (!visorLista.length) return;
    visorIndice = (visorIndice + visorLista.length) % visorLista.length;
    var foto = visorLista[visorIndice];

    imagen.src = foto.imagen_url;
    imagen.alt = foto.titulo || '';
    titulo.textContent = foto.titulo || '';

    var partes = [];
    if (foto.categoria) partes.push(foto.categoria);
    if (foto.anio) partes.push(foto.anio);
    if (partes.length) { meta.textContent = partes.join(' · '); meta.hidden = false; }
    else { meta.hidden = true; }

    if (foto.lugar) { lugar.textContent = foto.lugar; lugar.hidden = false; }
    else { lugar.hidden = true; }

    if (foto.descripcion) { descripcion.textContent = foto.descripcion; descripcion.hidden = false; }
    else { descripcion.hidden = true; }

    contador.textContent = (visorIndice + 1) + ' / ' + visorLista.length;

    [visorIndice - 1, visorIndice + 1].forEach(function (salto) {
      var previa = new Image();
      previa.src = visorLista[(visorIndice + salto + visorLista.length) % visorLista.length].imagen_url;
    });
  }

  document.getElementById('visorAnterior').addEventListener('click', function () { visorIndice--; pintarVisor(); });
  document.getElementById('visorSiguiente').addEventListener('click', function () { visorIndice++; pintarVisor(); });

  visor.addEventListener('keydown', function (evento) {
    if (evento.key === 'ArrowLeft') { evento.preventDefault(); visorIndice--; pintarVisor(); }
    if (evento.key === 'ArrowRight') { evento.preventDefault(); visorIndice++; pintarVisor(); }
  });

  if (typeof db !== 'undefined') {
    db.from('galeria_fotos')
      .select('*')
      .order('orden', { ascending: true })
      .then(function (result) {
        var fotos = (!result.error && result.data && result.data.length) ? result.data : FOTOS_FALLBACK;
        iniciar(fotos);
      })
      .catch(function () { iniciar(FOTOS_FALLBACK); });
  } else {
    iniciar(FOTOS_FALLBACK);
  }
})();
