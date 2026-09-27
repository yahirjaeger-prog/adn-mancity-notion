/*
 * ADN visual: comportamiento del componente.
 * Todo el código vive dentro de esta función: no deja variables globales.
 */
(function () {
  // ── Imágenes del componente (carpeta img/ junto a este archivo) ──
  // Para sustituir una imagen: reemplaza el archivo manteniendo el nombre y
  // actualiza `ancho` y `alto`. Los `puntos` son coordenadas relativas (0–1).
  const S = (function () {
    const base = new URL('img/', document.currentScript.src).href;

    const IMAGENES = {
      escudo: {
        archivo: 'escudo.webp', ancho: 560, alto: 560,
        alt: 'Escudo de Manchester City',
        demuestra: 'El identificador visual del club.',
        puntos: { barco: [.60, .40], anio: [.935, .505], rios: [.66, .60], rosa: [.58, .65] }
      }
    };

    Object.keys(IMAGENES).forEach(function (k) { IMAGENES[k].src = base + IMAGENES[k].archivo; });

    function crearImagen(clave) {
      const d = IMAGENES[clave];
      const img = new Image();
      img.src = d.src;
      img.alt = d.alt;
      img.decoding = 'async';
      img.draggable = false;
      return img;
    }

    // Coloca la imagen dentro de su marco como `object-fit: cover`, centrando
    // un punto de interés y aplicando un zoom opcional. Nunca deforma la imagen.
    function encuadrar(marco, img, clave, opciones) {
      const d = IMAGENES[clave];
      const o = opciones || {};
      const p = typeof o.punto === 'string' ? d.puntos[o.punto] : (o.punto || [.5, .5]);
      const cw = marco.clientWidth, ch = marco.clientHeight;
      if (!cw || !ch) return;
      const escala = Math.max(cw / d.ancho, ch / d.alto) * (o.zoom || 1);
      const w = d.ancho * escala, h = d.alto * escala;
      const x = Math.min(0, Math.max(cw - w, cw / 2 - p[0] * w));
      const y = Math.min(0, Math.max(ch - h, ch / 2 - p[1] * h));
      img.style.position = 'absolute';
      img.style.maxWidth = 'none';
      img.style.left = x + 'px';
      img.style.top = y + 'px';
      img.style.width = w + 'px';
      img.style.height = h + 'px';
      img.style.transformOrigin = (p[0] * w) + 'px ' + (p[1] * h) + 'px';
    }

    return { IMAGENES: IMAGENES, crearImagen: crearImagen, encuadrar: encuadrar };
  })();

  /*
   * Contenido: los tres conceptos de 03.3 y, como nota, lo que el trabajo
   * dice de cada uno en 03.1. `escena` elige la animación de cada palabra.
   */
  const genes = [
    {
      palabra: 'Escudo',
      nota: 'Uno de los elementos visuales consistentes con los que se reconoce la identidad del club.',
      escena: 'trazo'
    },
    {
      palabra: 'Colores',
      nota: 'Una estética vinculada históricamente al azul celeste.',
      escena: 'tonos'
    },
    {
      palabra: 'Aplicaciones',
      nota: 'Los elementos de identidad se trasladan a productos oficiales y canales digitales.',
      escena: 'soportes'
    }
  ];

  (function () {
    const NS = 'http://www.w3.org/2000/svg';
      const css = getComputedStyle(document.querySelector('.mc-adn-visual'));
    const color = function (v) { return css.getPropertyValue(v).trim(); };
    const C = {
      tinta: color('--tinta'), celeste: color('--celeste'), medio: color('--celeste-medio'),
      claro: color('--celeste-claro'), velo: color('--celeste-velo'), linea: color('--linea')
    };
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

    function crear(etiqueta, atributos, padre) {
      const nodo = document.createElementNS(NS, etiqueta);
      for (const k in atributos) nodo.setAttribute(k, atributos[k]);
      if (padre) padre.appendChild(nodo);
      return nodo;
    }
    const acotar = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
    const suave = function (p) { return p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; };
    const salida = function (p) { return 1 - Math.pow(1 - p, 3); };

    function animar(duracion, cadaCuadro, alTerminar) {
      const t0 = performance.now();
      (function cuadro(ahora) {
        const t = Math.min(ahora - t0, duracion);
        cadaCuadro(t);
        if (t < duracion) requestAnimationFrame(cuadro);
        else if (alTerminar) alTerminar();
      })(t0);
    }

    // ── ESCUDO: una línea fina dibuja una forma circular, revela el escudo real y desaparece ──
    function trazo(svg, escena) {
      const eco = crear('circle', { fill: 'none', stroke: C.celeste, 'stroke-width': 1, opacity: 0 }, svg);
      const eje = crear('line', { stroke: C.celeste, 'stroke-width': 1, opacity: 0 }, svg);
      const linea = crear('circle', { fill: 'none', stroke: C.tinta, 'stroke-width': 1.25 }, svg);
      const lapiz = crear('circle', { r: 2.6, fill: C.tinta, opacity: 0 }, svg);
      const semilla = crear('circle', { r: 3, fill: C.tinta, class: 'semilla' }, svg);
      const escudo = document.createElement('div');
      escudo.className = 'escudo';
      escudo.appendChild(S.crearImagen('escudo'));
      escena.appendChild(escudo);
      let g = null;

      function ajustar(W, H) {
        const R = Math.min(H * .4, 40, (W - 30) / 2);
        g = { x: 18 + R, y: H / 2, R: R, L: 2 * Math.PI * R, Le: 2 * Math.PI * (R + 9), H: H };
        [linea, eco].forEach(function (c) {
          c.setAttribute('cx', g.x);
          c.setAttribute('cy', g.y);
          c.setAttribute('transform', 'rotate(180 ' + g.x + ' ' + g.y + ')');
        });
        linea.setAttribute('r', R);
        eco.setAttribute('r', R + 9);
        linea.setAttribute('stroke-dasharray', g.L + ' ' + g.L);
        linea.setAttribute('stroke-dashoffset', g.L);
        eco.setAttribute('stroke-dasharray', g.Le + ' ' + g.Le);
        eje.setAttribute('x1', g.x);
        eje.setAttribute('x2', g.x);
        semilla.setAttribute('cx', 18);
        semilla.setAttribute('cy', g.y);
        const d = 2 * R - 7;
        escudo.style.setProperty('--x', (g.x - d / 2) + 'px');
        escudo.style.setProperty('--y', (g.y - d / 2) + 'px');
        escudo.style.setProperty('--d', d + 'px');
      }

      function lapizEn(angulo) {
        const a = angulo * Math.PI / 180;
        lapiz.setAttribute('cx', g.x + Math.cos(a) * g.R);
        lapiz.setAttribute('cy', g.y + Math.sin(a) * g.R);
      }

      function revelar(visible) {
        escudo.classList.toggle('is-visible', visible);
        semilla.classList.toggle('is-oculta', visible);
      }

      function reproducir(fin, inmediato) {
        escena.classList.add('sin-transicion');
        revelar(false);
        escena.getBoundingClientRect();
        escena.classList.remove('sin-transicion');
        if (inmediato) { revelar(true); fin(); return; }
        setTimeout(function () { revelar(true); }, 550);
        animar(2300, function (t) {
          const dibujo = suave(acotar(t / 1000, 0, 1));
          const borrado = suave(acotar((t - 1350) / 850, 0, 1));
          linea.setAttribute('stroke-dashoffset', g.L * (1 - dibujo) - g.L * borrado);
          lapizEn(180 + 360 * (dibujo + borrado));
          lapiz.setAttribute('opacity', t < 60 ? 0 : 1 - borrado);

          const ecoP = suave(acotar((t - 180) / 1100, 0, 1));
          eco.setAttribute('stroke-dashoffset', g.Le * (1 - ecoP * .38));
          eco.setAttribute('opacity', .9 * ecoP * (1 - borrado));

          // un eje vertical cruza el círculo, como el centro de un campo
          const ejeP = salida(acotar((t - 820) / 520, 0, 1));
          const mitad = (g.H / 2 - 4) * ejeP;
          eje.setAttribute('y1', g.y - mitad);
          eje.setAttribute('y2', g.y + mitad);
          eje.setAttribute('opacity', .8 * (1 - borrado));
        }, fin);
      }

      return { ajustar: ajustar, reproducir: reproducir };
    }

    // ── COLORES: una ola de tonos recorre la banda y se asienta ──
    function tonos(svg) {
      const escala = [C.velo, C.claro, C.medio, C.celeste, C.tinta].map(function (h) {
        return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); });
      });
      function tono(v) {
        const x = acotar(v, 0, 1) * (escala.length - 1);
        const i = Math.min(Math.floor(x), escala.length - 2);
        const f = x - i;
        const a = escala[i], b = escala[i + 1];
        return 'rgb(' + [0, 1, 2].map(function (k) { return Math.round(a[k] + (b[k] - a[k]) * f); }).join(',') + ')';
      }

      const grupo = crear('g', {}, svg);
      const semilla = crear('rect', { width: 9, height: 9, fill: C.celeste }, svg);
      let barras = [];
      let g = null;
      let visto = false;

      function base(i, n) { return .3 + .42 * (i / Math.max(n - 1, 1)); }

      function ajustar(W, H) {
        const inicio = 36;
        const n = acotar(Math.floor((W - inicio) / 13), 6, 30);
        const hueco = 3;
        const ancho = (W - inicio - 4 - hueco * (n - 1)) / n;
        g = { n: n, alto: H * .56, y: H / 2 };
        grupo.textContent = '';
        barras = [];
        for (let i = 0; i < n; i++) {
          barras.push(crear('rect', {
            x: inicio + i * (ancho + hueco), width: ancho,
            y: g.y, height: 0, fill: tono(base(i, n))
          }, grupo));
        }
        semilla.setAttribute('x', 13.5);
        semilla.setAttribute('y', g.y - 4.5);
        if (visto) pintar(1e9);
      }

      function pintar(t) {
        const calma = suave(acotar((t - 700) / 1600, 0, 1));
        barras.forEach(function (b, i) {
          const crece = salida(acotar((t - i * 26) / 520, 0, 1));
          const h = g.alto * crece;
          b.setAttribute('y', g.y - h / 2);
          b.setAttribute('height', h);
          const ola = Math.sin(t / 1000 * Math.PI * 2 * .7 - i * .42);
          b.setAttribute('fill', tono(base(i, g.n) + (1 - calma) * .55 * ola));
        });
      }

      function reproducir(fin, inmediato) {
        visto = true;
        if (inmediato) { pintar(1e9); fin(); return; }
        animar(2400, pintar, fin);
      }

      return { ajustar: ajustar, reproducir: reproducir };
    }

    // ── APLICACIONES: la identidad se multiplica sobre objetos reconocibles ──
    // Pequeñas ilustraciones centradas en (0, 0). El punto que llevan todas
    // marca el lugar del escudo: la misma identidad en cada soporte.
    function soportes(svg) {
      const linea = { stroke: C.tinta, 'stroke-width': 1.1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
      function trazar(g, etiqueta, atributos) {
        return crear(etiqueta, Object.assign({}, linea, atributos), g);
      }
      function marca(g, x, y, r, relleno) {
        return crear('circle', { cx: x, cy: y, r: r, fill: relleno }, g);
      }
      const silueta = {
        camiseta: 'M-5,-14 Q0,-9.5 5,-14 L11,-12 L16.5,-6.5 L12.5,-2.5 L10,-4.5 L10,15 L-10,15 L-10,-4.5 L-12.5,-2.5 L-16.5,-6.5 L-11,-12 Z',
        sudadera: 'M-6,-13 C-4.5,-18.5 4.5,-18.5 6,-13 L11.5,-11 C13.5,-5 15.5,3 16.5,10 L12.5,11 L10,1 L10,16 L-10,16 L-10,1 L-12.5,11 L-16.5,10 C-15.5,3 -13.5,-5 -11.5,-11 Z',
        // banda ondulada de grosor constante, como tela que cae
        bufanda: 'M-20,-5 C-12,-10 -4,-10 0,-5 C4,0 12,0 20,-5 L20,5 C12,10 4,10 0,5 C-4,0 -12,0 -20,5 Z',
        flecos: 'M-20,-3.5 h-4.5 M-20,-1.2 h-4.5 M-20,1.2 h-4.5 M-20,3.5 h-4.5 M20,-3.5 h4.5 M20,-1.2 h4.5 M20,1.2 h4.5 M20,3.5 h4.5'
      };
      let recortes = 0;
      function bufandaCon(g, fondo, extremos, letras) {
        const id = 'bufanda-' + (++recortes) + '-' + Math.random().toString(36).slice(2, 6);
        crear('path', { d: silueta.bufanda }, crear('clipPath', { id: id }, crear('defs', {}, g)));
        crear('path', { d: silueta.bufanda, fill: fondo }, g);
        const franjas = crear('g', { 'clip-path': 'url(#' + id + ')' }, g);
        crear('rect', { x: -21, y: -12, width: 6.5, height: 24, fill: extremos }, franjas);
        crear('rect', { x: 14.5, y: -12, width: 6.5, height: 24, fill: extremos }, franjas);
        trazar(g, 'path', { d: 'M-8,-3.4 L8,3.4', stroke: letras, 'stroke-width': 1.6, 'stroke-dasharray': '2.6 1.8' });
        trazar(g, 'path', { d: silueta.bufanda, fill: 'none' });
        trazar(g, 'path', { d: silueta.flecos, fill: 'none', 'stroke-width': .8 });
      }

      const figuras = [
        function camiseta(g) {
          trazar(g, 'path', { d: silueta.camiseta, fill: C.celeste });
          trazar(g, 'path', { d: 'M-5,-14 Q0,-9.5 5,-14', fill: 'none', 'stroke-width': 2 });
          marca(g, 5, -5.5, 1.9, C.tinta);
        },
        function bufanda(g) {
          bufandaCon(g, C.celeste, C.tinta, '#fff');
        },
        function balon(g) {
          trazar(g, 'circle', { r: 12.5, fill: '#fff' });
          const p = [], q = [];
          for (let k = 0; k < 5; k++) {
            const a = (-90 + k * 72) * Math.PI / 180;
            p.push((Math.cos(a) * 4.6).toFixed(2) + ',' + (Math.sin(a) * 4.6).toFixed(2));
            q.push('M' + (Math.cos(a) * 4.6).toFixed(2) + ',' + (Math.sin(a) * 4.6).toFixed(2) +
                   ' L' + (Math.cos(a) * 12.5).toFixed(2) + ',' + (Math.sin(a) * 12.5).toFixed(2));
          }
          trazar(g, 'path', { d: q.join(' '), fill: 'none', 'stroke-width': .9 });
          trazar(g, 'polygon', { points: p.join(' '), fill: C.celeste });
        },
        function sudadera(g) {
          trazar(g, 'path', { d: silueta.sudadera, fill: C.tinta });
          crear('path', { d: 'M-4,-12 C-2,-8 2,-8 4,-12', fill: 'none', stroke: '#fff', 'stroke-width': .9, 'stroke-linecap': 'round' }, g);
          crear('path', { d: 'M0,-8.5 L0,16 M-6,9 L6,9', fill: 'none', stroke: 'rgba(255,255,255,.45)', 'stroke-width': .8 }, g);
          marca(g, 5, -4, 1.8, C.celeste);
        },
        function gorra(g) {
          trazar(g, 'path', { d: 'M-12,4 C-12,-6 -7,-11 0,-11 C7,-11 12,-6 12,4 Z', fill: C.tinta });
          trazar(g, 'path', { d: 'M-12,4 L12,4 C17,4 20,6 21,8 L-12,8 Z', fill: C.celeste });
          crear('path', { d: 'M0,-11 L0,4', stroke: 'rgba(255,255,255,.4)', 'stroke-width': .8 }, g);
          marca(g, -4, -3, 1.9, C.celeste);
        },
        function taza(g) {
          crear('rect', { x: -10, y: -11, width: 17, height: 21, rx: 2, fill: '#fff' }, g);
          crear('rect', { x: -10, y: -4, width: 17, height: 6, fill: C.celeste }, g);
          trazar(g, 'rect', { x: -10, y: -11, width: 17, height: 21, rx: 2, fill: 'none' });
          trazar(g, 'path', { d: 'M7,-6 C12.5,-6 14,-4 14,-.5 C14,3 12,5 7,5', fill: 'none' });
          marca(g, -1.5, -1, 1.7, C.tinta);
        },
        function banderin(g) {
          trazar(g, 'path', { d: 'M-11,-13 L14,-5.5 L-11,2 Z', fill: C.celeste });
          trazar(g, 'path', { d: 'M-11,-14 L-11,15', fill: 'none', 'stroke-width': 1.4 });
          marca(g, -5, -5.5, 1.8, C.tinta);
        },
        function bolsa(g) {
          trazar(g, 'path', { d: 'M-5,-7 C-5,-15 5,-15 5,-7', fill: 'none' });
          trazar(g, 'path', { d: 'M-10,-7 L10,-7 L11,14 L-11,14 Z', fill: C.claro });
          marca(g, 0, 3, 2.2, C.tinta);
        },
        function camisetaClara(g) {
          trazar(g, 'path', { d: silueta.camiseta, fill: '#fff' });
          trazar(g, 'path', { d: 'M-5,-14 Q0,-9.5 5,-14', fill: 'none', stroke: C.celeste, 'stroke-width': 2 });
          marca(g, 5, -5.5, 1.9, C.celeste);
        },
        function bufandaClara(g) {
          bufandaCon(g, C.claro, C.celeste, C.tinta);
        }
      ];
      const desvio = [-.55, .5, -.1, .65, -.6, .2, -.75, .45, -.3, .6];
      const giro = [-4, 3, 0, -2, 5, -3, 2, -5, 4, 0];

      const grupo = crear('g', {}, svg);
      const semilla = crear('rect', { width: 10, height: 14, fill: 'none', stroke: C.tinta, 'stroke-width': 1 }, svg);
      let piezas = [];
      let g = null;
      let visto = false;

      function soporte(i) {
        const nodo = crear('g', { class: 'soporte' }, grupo);
        const flota = crear('g', { class: 'soporte__flota' }, nodo);
        figuras[i % figuras.length](flota);
        return { nodo: nodo, flota: flota };
      }

      function posicion(nodo, x, y, s, r, o) {
        nodo.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg) scale(' + s + ')';
        nodo.style.opacity = o;
      }

      function ajustar(W, H) {
        const n = acotar(Math.round((W - 40) / 42), 4, 10);
        const s = acotar(W / 420, .62, 1);
        g = { W: W, H: H, n: n, s: s, ox: 23, oy: H / 2, destinos: [] };
        grupo.textContent = '';
        piezas = [];
        const paso = (W - 52) / n;
        for (let i = 0; i < n; i++) {
          piezas.push(soporte(i));
          g.destinos.push({ x: 48 + (i + .5) * paso, y: H / 2 + desvio[i] * H * .22 });
        }
        semilla.setAttribute('x', 18);
        semilla.setAttribute('y', H / 2 - 7);
        piezas.forEach(function (p, i) {
          const d = g.destinos[i];
          if (visto) posicion(p.nodo, d.x, d.y, s, giro[i], 1);
          else posicion(p.nodo, g.ox, g.oy, .3, 0, 0);
        });
      }

      function reproducir(fin, inmediato) {
        visto = true;
        if (inmediato) { ajustar(g.W, g.H); fin(); return; }
        piezas.forEach(function (p) {
          p.nodo.classList.remove('is-en-camino');
          p.flota.classList.remove('is-flotando');
          posicion(p.nodo, g.ox, g.oy, .3, 0, 0);
        });
        grupo.getBoundingClientRect(); // fija el punto de partida antes de animar
        piezas.forEach(function (p, i) {
          p.nodo.style.transitionDelay = (i * 75) + 'ms';
          p.nodo.classList.add('is-en-camino');
          const d = g.destinos[i];
          posicion(p.nodo, d.x, d.y, g.s, giro[i], 1);
          p.flota.style.animationDelay = (i * 75 + 620) + 'ms';
          p.flota.classList.add('is-flotando');
        });
        setTimeout(fin, piezas.length * 75 + 800);
      }

      return { ajustar: ajustar, reproducir: reproducir };
    }

    const fabricas = { trazo: trazo, tonos: tonos, soportes: soportes };

    // ── Montaje ───────────────────────────────
    const contenedor = document.getElementById('mca-genes');

    genes.forEach(function (gen, i) {
      const fila = document.createElement('div');
      fila.className = 'gen';

      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'gen__palabra';
      boton.setAttribute('aria-describedby', 'mca-nota-' + i);
      boton.innerHTML = '<span class="gen__indice"></span><span class="gen__texto"></span>';
      boton.querySelector('.gen__indice').textContent = String(i + 1).padStart(2, '0');
      boton.querySelector('.gen__texto').textContent = gen.palabra;

      const nota = document.createElement('p');
      nota.className = 'gen__nota';
      nota.id = 'mca-nota-' + i;
      nota.textContent = gen.nota;

      const escena = document.createElement('div');
      escena.className = 'gen__escena';
      escena.setAttribute('aria-hidden', 'true');
      const svg = crear('svg', {}, escena);

      fila.append(boton, nota, escena);
      contenedor.appendChild(fila);

      const anim = fabricas[gen.escena](svg, escena);
      let enCurso = false;

      function ajustar() { anim.ajustar(escena.clientWidth, escena.clientHeight); }

      function activar() {
        if (enCurso) return;
        enCurso = true;
        fila.classList.add('is-activo');
        const terminar = function () {
          enCurso = false;
          fila.classList.remove('is-activo');
        };
        anim.reproducir(terminar, sinMovimiento.matches);
      }

      fila.addEventListener('mouseenter', activar);
      fila.addEventListener('click', activar);
      boton.addEventListener('focus', activar);

      ajustar();
      if ('ResizeObserver' in window) new ResizeObserver(ajustar).observe(escena);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
    });
  })();
})();
