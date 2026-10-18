/* ========= 1) Sidebar: toggle colapsado ========= */
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const icon = document.getElementById("toggle-icon");
  
    if (!sidebar || !icon) return;
  
    sidebar.classList.toggle("collapsed");
  
    if (sidebar.classList.contains("collapsed")) {
      icon.classList.remove("fa-chevron-left");
      icon.classList.add("fa-chevron-right");
    } else {
      icon.classList.remove("fa-chevron-right");
      icon.classList.add("fa-chevron-left");
    }
  }
  
  /* ========= 2) Top bar: fecha actual ========= */
  (function setTodayFancyDate() {
    const el = document.getElementById('fecha-actual');
    if (!el) return;
  
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
    const hoy = new Date();
    const diaSemana = dias[hoy.getDay()];
    const dia = hoy.getDate().toString().padStart(2, '0');
    const mes = meses[hoy.getMonth()];
    const año = hoy.getFullYear();
  
    el.innerText = `${diaSemana} ${dia} de ${mes} del ${año}`;
  })();
  
  /* ========= 3) Tooltips en lista de proyectos (solo con sidebar colapsado) ========= */
  (function bindSidebarTooltips(){
    const sidebar = document.getElementById('sidebar');
    const tip = document.getElementById('smart-tooltip');
    if (!sidebar || !tip) return;
  
    function attach() {
      const items = document.querySelectorAll('.project-list li[data-tooltip]');
      items.forEach(li => {
        // Evitar duplicar listeners
        li._hasTooltip = li._hasTooltip || false;
        if (li._hasTooltip) return;
        li._hasTooltip = true;
  
        li.addEventListener('mouseenter', () => {
          if (!sidebar.classList.contains('collapsed')) return;   // solo contraído
          const text = li.getAttribute('data-tooltip') || '';
          if (!text) return;
  
          const r = li.getBoundingClientRect();
          tip.textContent = text;
          tip.style.top  = (r.top + r.height / 2) + 'px';
          tip.style.left = (r.right + 10) + 'px';
          tip.classList.add('show');
          tip.setAttribute('aria-hidden', 'false');
        });
  
        li.addEventListener('mouseleave', () => {
          tip.classList.remove('show');
          tip.setAttribute('aria-hidden', 'true');
        });
      });
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    } else {
      attach();
    }
  })();
  
  /* ========= 4) Tabla principal #hoursTable: paginación + búsqueda + orden ========= */
  (function initHoursTable(){
    const table = document.getElementById('hoursTable');
    if (!table) return;
  
    const tbody = table.querySelector('tbody');
    const search = document.getElementById('tableSearch');
    const rowsPerSel = document.getElementById('rowsPerPage');
    const info = document.getElementById('tableInfo');
    const pageNowEl = document.getElementById('pageNow');
    const pageTotalEl = document.getElementById('pageTotal');
    const prevBtn = document.querySelector('.page-btn[data-page="prev"]');
    const nextBtn = document.querySelector('.page-btn[data-page="next"]');
  
    let allRows = Array.from(tbody.querySelectorAll('tr'));
    let viewRows = [...allRows];
    let page = 1;
    let rowsPerPage = parseInt(rowsPerSel?.value ?? '10', 10);
    let sortState = { key: null, dir: 1 };
  
    const keyGetter = (td) => {
      if (!td) return '';
      const num  = td.getAttribute('data-num');
      const date = td.getAttribute('data-date');
      if (num !== null && num !== undefined) return parseFloat(num);
      if (date) return date; // YYYY-MM-DD
      return (td.textContent || '').toLowerCase().trim();
    };
  
    function render(){
      const total = viewRows.length;
      const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
      page = Math.min(page, totalPages);
      const start = (page - 1) * rowsPerPage;
      const end   = start + rowsPerPage;
  
      tbody.innerHTML = '';
      viewRows.slice(start, end).forEach((tr,i) => {
        tr.style.animationDelay = `${i * 20}ms`;
        tbody.appendChild(tr);
      });
  
      if (info) info.textContent = `Mostrando ${total ? start+1 : 0} a ${Math.min(end,total)} de ${total} registros`;
      if (pageNowEl) pageNowEl.textContent = page;
      if (pageTotalEl) pageTotalEl.textContent = totalPages;
      if (prevBtn) prevBtn.disabled = page <= 1;
      if (nextBtn) nextBtn.disabled = page >= totalPages;
    }
  
    function applySearch(){
      const q = (search?.value || '').toLowerCase().trim();
      if (!q){
        viewRows = [...allRows];
        page = 1; render(); return;
      }
      viewRows = allRows.filter(tr => tr.textContent.toLowerCase().includes(q));
      page = 1; render();
    }
  
    function applySort(th){
      const key = th.getAttribute('data-sort');
      if (!key) return;
      const dir = (sortState.key === key) ? -sortState.dir : 1;
      sortState = { key, dir };
  
      // iconitos
      table.querySelectorAll('thead th i').forEach(i => i.className = 'fas fa-sort');
      const icon = th.querySelector('i');
      if (icon) icon.className = dir === 1 ? 'fas fa-sort-up' : 'fas fa-sort-down';
  
      viewRows.sort((a,b) => {
        const A = keyGetter(a.querySelector(`[data-key="${key}"]`));
        const B = keyGetter(b.querySelector(`[data-key="${key}"]`));
        if (A < B) return -1*dir;
        if (A > B) return  1*dir;
        return 0;
      });
      page = 1; render();
    }
  
    // Eventos
    if (search) search.addEventListener('input', applySearch);
    if (rowsPerSel) rowsPerSel.addEventListener('change', () => {
      rowsPerPage = parseInt(rowsPerSel.value,10) || 10;
      page = 1; render();
    });
    if (prevBtn) prevBtn.addEventListener('click', () => { if(page>1){ page--; render(); }});
    if (nextBtn) nextBtn.addEventListener('click', () => { page++; render(); });
  
    table.querySelectorAll('thead th[data-sort]').forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => applySort(th));
    });
  
    // Init
    render();
  })();
  
  /* ========= 5) Carrusel de colaboradores (si existe) ========= */
  /* Soporta flechas, drag y wheel. No rompe si no encuentra el markup. */
  (function initCollabScroller(){
    const root = document.querySelector('.pi2-collab.scroller');
    if (!root) return;
  
    const track = root.querySelector('.pi2-collab-track');
    const prev  = root.querySelector('.pi2-collab-nav.prev');
    const next  = root.querySelector('.pi2-collab-nav.next');
    if (!track) return;
  
    const ITEM_W = () => {
      const item = track.querySelector('.pi2-collab-item');
      return item ? (item.getBoundingClientRect().width + 10) : 220;
    };
  
    function scrollByItems(n){
      track.scrollBy({ left: n * ITEM_W(), behavior: 'smooth' });
    }
  
    // Flechas
    prev && prev.addEventListener('click', () => scrollByItems(-1));
    next && next.addEventListener('click', () => scrollByItems(1));
  
    // Drag (mouse/touch)
    let isDown = false, startX = 0, startLeft = 0;
    const start = (clientX) => { isDown = true; startX = clientX; startLeft = track.scrollLeft; };
    const move  = (clientX) => { if(!isDown) return; const dx = clientX - startX; track.scrollLeft = startLeft - dx; };
    const end   = () => { isDown = false; };
  
    track.addEventListener('mousedown', e => start(e.clientX));
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup', end);
  
    track.addEventListener('touchstart', e => start(e.touches[0].clientX), {passive:true});
    track.addEventListener('touchmove',  e => move(e.touches[0].clientX), {passive:true});
    track.addEventListener('touchend', end);
  
    // Wheel horizontal
    track.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  })();
  

  /* =========================================================
   TABLET 768 — Sidebar off-canvas robusto + botón flotante
   ========================================================= */
(function sidebarTabletController(){
  const mq = window.matchMedia('(max-width: 768px)');
  const sidebar = document.getElementById('sidebar');

  if (!sidebar) return;

  /* ---- helpers de estado ---- */
  function isTablet(){ return mq.matches; }
  function isOpen(){ return document.body.classList.contains('sidebar-open'); }

  function openSidebar(){
    // en tablet, abrimos y nos aseguramos de no heredar 'collapsed'
    if (isTablet()){
      sidebar.classList.remove('collapsed');
      document.body.classList.add('sidebar-open');
      updateTriggerUI();
    } else {
      // fuera de tablet, delega al colapsable normal si existe
      if (typeof window.toggleSidebarOriginal === 'function') {
        window.toggleSidebarOriginal();
      }
    }
  }

  function closeSidebar(){
    if (isTablet()){
      document.body.classList.remove('sidebar-open');
      updateTriggerUI();
    } else {
      if (typeof window.toggleSidebarOriginal === 'function') {
        window.toggleSidebarOriginal();
      }
    }
  }

  function toggleSidebarMobile(){
    if (isOpen()) closeSidebar(); else openSidebar();
  }

  /* ---- parchea tu toggleSidebar para que llame a éste en tablet ---- */
  if (!window.toggleSidebarOriginal && typeof window.toggleSidebar === 'function'){
    window.toggleSidebarOriginal = window.toggleSidebar; // guardamos
  }
  window.toggleSidebar = function(){
    if (isTablet()) toggleSidebarMobile();
    else if (typeof window.toggleSidebarOriginal === 'function'){
      // estado limpio al salir de tablet
      document.body.classList.remove('sidebar-open');
      sidebar.classList.remove('collapsed'); // evitamos estados cruzados
      window.toggleSidebarOriginal();
    }
  };

  /* ---- botón flotante (muestra/oculta solo en ≤768) ---- */
  function ensureTrigger(){
    let btn = document.getElementById('sidebarTrigger');
    if (btn) return btn;

    btn = document.createElement('button');
    btn.id = 'sidebarTrigger';
    btn.className = 'sidebar-trigger';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Abrir menú');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<i class="fas fa-bars"></i>';

    // Evita que el click del botón sea interpretado como "click fuera"
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebarMobile();
    });

    document.body.appendChild(btn);
    return btn;
  }

  function updateTriggerUI(){
    const btn = document.getElementById('sidebarTrigger');
    if (!btn) return;
    const i = btn.querySelector('i');
    const open = isOpen();
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (i) i.className = open ? 'fas fa-times' : 'fas fa-bars';
  }

  function mountTrigger(){
    const btn = ensureTrigger();
    // visible solo en tablet
    btn.style.display = isTablet() ? '' : 'none';
    if (!isTablet()){
      // limpiamos estados al volver a desktop
      document.body.classList.remove('sidebar-open');
      sidebar.classList.remove('collapsed');
      updateTriggerUI();
    }
  }

  /* ---- cerrar con overlay (pero NO cuando click es sobre el trigger) ---- */
  document.addEventListener('click', (e) => {
    if (!isTablet() || !isOpen()) return;
    // si no es sidebar ni el botón trigger, cerramos
    if (!e.target.closest('.sidebar') && !e.target.closest('#sidebarTrigger')){
      closeSidebar();
    }
  });

  /* ---- cerrar con ESC ---- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isTablet() && isOpen()) closeSidebar();
  });

  /* ---- reaccionar a cambios de ancho ---- */
  mq.addEventListener('change', () => {
    mountTrigger();
    // garantizar que al entrar a tablet no quede 'collapsed'
    if (isTablet()) sidebar.classList.remove('collapsed');
  });

  // init
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      mountTrigger();
      if (isTablet()) sidebar.classList.remove('collapsed');
    });
  } else {
    mountTrigger();
    if (isTablet()) sidebar.classList.remove('collapsed');
  }
})();
/* ===== Top bar mobile: mover la fecha bajo el título (≤600) ===== */
(function moveDateOnMobile(){
  const left  = document.querySelector('.top-bar-left');
  const right = document.querySelector('.top-bar-right');
  const fecha = document.getElementById('fecha-actual');
  if (!left || !right || !fecha) return;

  const MQ = window.matchMedia('(max-width: 600px)');

  function apply(){
    if (MQ.matches){
      // en mobile la fecha vive bajo el título (izquierda)
      if (fecha.parentElement !== left) left.appendChild(fecha);
    }else{
      // en anchos mayores la devolvemos a la derecha, antes del gato
      if (fecha.parentElement !== right) right.insertBefore(fecha, right.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
  MQ.addEventListener('change', apply);
})();
/* ==========================================================
   Etiquetas para modo "cards": setea data-th en cada celda
   ========================================================== */
   (function labelizeTables(){
    function applyLabels(table){
      if (!table) return;
      const heads = Array.from(table.querySelectorAll('thead th'))
        .map(th => (th.textContent || '').trim());
      table.querySelectorAll('tbody tr').forEach(tr => {
        Array.from(tr.children).forEach((td, idx) => {
          if (!td.hasAttribute('data-th')) {
            td.setAttribute('data-th', heads[idx] || '');
          }
        });
      });
    }
  
    function seed(){
      applyLabels(document.getElementById('hoursTable'));
      applyLabels(document.getElementById('lastLoadTable'));
    }
  
    // Inicial
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', seed);
    } else {
      seed();
    }
  
    // Cuando el contenido se re-renderiza (cambio de menú), volvemos a aplicar
    const mo = new MutationObserver((muts) => {
      let needs = false;
      muts.forEach(m => {
        if (m.addedNodes && m.addedNodes.length) needs = true;
      });
      if (needs) seed();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  })();
/* ====== Mobile cards: reagrupar Acciones en una sola fila (≤600) ====== */
(function mobileActionsBand(){
  const MQ = window.matchMedia('(max-width: 600px)');

  function groupRow(tr, howMany){
    if (!tr || tr.classList.contains('mobile-processed')) return;

    const tds = Array.from(tr.children);
    if (tds.length < howMany) return;

    // Últimas N celdas son las de acciones
    const actionCells = tds.slice(-howMany);

    // Crea la nueva celda "Acciones" y mueve los botones dentro
    const td = document.createElement('td');
    td.className = 'mobile-actions';
    td.setAttribute('data-th', 'Acciones');

    const wrap = document.createElement('div');
    wrap.className = 'actions-wrap';

    actionCells.forEach(c => {
      // Marca las celdas originales para ocultarlas en móvil
      c.classList.add('mobile-hide');
      // Mueve todos los botones que haya
      c.querySelectorAll('button').forEach(btn => wrap.appendChild(btn));
    });

    td.appendChild(wrap);
    tr.appendChild(td);
    tr.classList.add('mobile-processed');
  }

  function ungroupRow(tr){
    if (!tr || !tr.classList.contains('mobile-processed')) return;

    const tdBand = tr.querySelector('td.mobile-actions');
    if (tdBand){
      // Devuelve los botones a la primera celda de acciones original
      const firstHidden = tr.querySelector('td.mobile-hide');
      if (firstHidden){
        tdBand.querySelectorAll('button').forEach(btn => firstHidden.appendChild(btn));
      }
      tdBand.remove();
    }
    tr.querySelectorAll('td.mobile-hide').forEach(td => td.classList.remove('mobile-hide'));
    tr.classList.remove('mobile-processed');
  }

  function apply(){
    const lt = document.getElementById('lastLoadTable');
    const ht = document.getElementById('hoursTable');
    const isMobile = MQ.matches;

    if (isMobile){
      lt?.querySelectorAll('tbody tr').forEach(tr => groupRow(tr, 3)); // Duplicar/Editar/Eliminar
      ht?.querySelectorAll('tbody tr').forEach(tr => groupRow(tr, 2)); // Editar/Eliminar
    } else {
      lt?.querySelectorAll('tbody tr').forEach(ungroupRow);
      ht?.querySelectorAll('tbody tr').forEach(ungroupRow);
    }
  }

  // init + on resize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
  MQ.addEventListener('change', apply);

  // re-aplicar cuando cambie el contenido (navegación por el sidebar)
  const mo = new MutationObserver(() => apply());
  mo.observe(document.body, { childList: true, subtree: true });
})();
/* ===== FIX: que el sidebar vuelva a expandir en desktop ===== */
(function sidebarDesktopFix(){
  const mq = window.matchMedia('(max-width: 768px)');
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // guarda una vez el toggle original de escritorio
  if (!window.toggleSidebarOriginal && typeof window.toggleSidebar === 'function'){
    window.toggleSidebarOriginal = window.toggleSidebar;
  }

  const isTablet = () => mq.matches;

  // NUEVO toggle: en tablet usamos off-canvas; en desktop llamamos al original sin tocar 'collapsed'
  window.toggleSidebar = function(){
    if (isTablet()){
      document.body.classList.toggle('sidebar-open');    // off-canvas
    } else {
      document.body.classList.remove('sidebar-open');    // limpia residuos móviles
      if (typeof window.toggleSidebarOriginal === 'function'){
        window.toggleSidebarOriginal();                  // deja que el original alterne collapsed
      }
    }
  };

  // al entrar/salir de tablet, saneamos estados SIN interferir con 'collapsed' en desktop
  mq.addEventListener('change', (ev) => {
    if (ev.matches){ // entramos a tablet
      sidebar.classList.remove('collapsed');  // que el panel móvil parta expandido
      document.body.classList.remove('sidebar-open');
    } else {          // volvemos a desktop
      document.body.classList.remove('sidebar-open');
      // NO tocar 'collapsed': el click del usuario la alternará normalmente
    }
  });
})();
/* ==========================================================
   HOURS TABLE — Control "Mostrar X" + API pública para refrescar
   ========================================================== */
   (function enhanceRowsPerPage(){
    const table = document.getElementById('hoursTable');
    if (!table) return;
  
    const tbody       = table.querySelector('tbody');
    const search      = document.getElementById('tableSearch');
    const rowsPerSel  = document.getElementById('rowsPerPage');
    const info        = document.getElementById('tableInfo');
    const pageNowEl   = document.getElementById('pageNow');
    const pageTotalEl = document.getElementById('pageTotal');
    const prevBtn     = document.querySelector('.page-btn[data-page="prev"]');
    const nextBtn     = document.querySelector('.page-btn[data-page="next"]');
  
    // Estado interno (si ya existe de tu inicializador, lo reutilizamos)
    let _allRows  = Array.from(tbody.querySelectorAll('tr'));
    let _viewRows = [..._allRows];
    let _page     = 1;
    let _rpp      = parseInt(rowsPerSel?.value ?? '10', 10) || 10;
    let _sort     = { key: null, dir: 1 };
  
    const getCellVal = (tr, key) => {
      const td = tr.querySelector(`[data-key="${key}"]`);
      if (!td) return '';
      const num  = td.getAttribute('data-num');
      const date = td.getAttribute('data-date');
      if (num  != null) return parseFloat(num);
      if (date != null) return date; // YYYY-MM-DD
      return (td.textContent || '').toLowerCase().trim();
    };
  
    function render(){
      const total = _viewRows.length;
      const totalPages = Math.max(1, Math.ceil(total / _rpp));
      _page = Math.min(_page, totalPages);
      const start = (_page - 1) * _rpp;
      const end   = start + _rpp;
  
      // pintar
      tbody.innerHTML = '';
      _viewRows.slice(start, end).forEach((tr,i) => {
        tr.style.animationDelay = `${i*20}ms`;
        tbody.appendChild(tr);
      });
  
      // ui
      info        && (info.textContent = `Mostrando ${total ? start+1 : 0} a ${Math.min(end,total)} de ${total} registros`);
      pageNowEl   && (pageNowEl.textContent = _page);
      pageTotalEl && (pageTotalEl.textContent = totalPages);
      prevBtn     && (prevBtn.disabled = _page <= 1);
      nextBtn     && (nextBtn.disabled = _page >= totalPages);
    }
  
    function applySearch(){
      const q = (search?.value || '').toLowerCase().trim();
      if (!q){ _viewRows = [..._allRows]; _page = 1; render(); return; }
      _viewRows = _allRows.filter(tr => tr.textContent.toLowerCase().includes(q));
      _page = 1; render();
    }
  
    function applySort(th){
      const key = th.getAttribute('data-sort');
      if (!key) return;
      const dir = (_sort.key === key) ? -_sort.dir : 1;
      _sort = { key, dir };
  
      // iconitos
      table.querySelectorAll('thead th i').forEach(i => i.className = 'fas fa-sort');
      const icon = th.querySelector('i');
      if (icon) icon.className = dir === 1 ? 'fas fa-sort-up' : 'fas fa-sort-down';
  
      _viewRows.sort((a,b) => {
        const A = getCellVal(a, key);
        const B = getCellVal(b, key);
        if (A < B) return -1*dir;
        if (A > B) return  1*dir;
        return 0;
      });
      _page = 1; render();
    }
  
    /* ---- Eventos UI ---- */
    search     && search.addEventListener('input', applySearch);
    rowsPerSel && rowsPerSel.addEventListener('change', () => {
      _rpp = parseInt(rowsPerSel.value, 10) || 10;   // << hace funcional "Mostrar X"
      _page = 1;
      render();
    });
    prevBtn    && prevBtn.addEventListener('click', () => { if (_page>1){ _page--; render(); }});
    nextBtn    && nextBtn.addEventListener('click', () => { _page++; render(); });
  
    table.querySelectorAll('thead th[data-sort]').forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => applySort(th));
    });
  
    render(); // primera pintada
  
    /* ---- API pública para otras partes del sitio (nav/duplicar, etc.) ---- */
    // helpers para construir filas desde datos (si quisieras popular por JS)
    function statusBadge(s){
      if (s === 'ok')    return '<span class="badge status--ok"><i class="fas fa-check-circle"></i> Dentro de plazo</span>';
      if (s === 'late')  return '<span class="badge status--late"><i class="fas fa-clock"></i> Fuera de plazo</span>';
      return '<span class="badge status--review"><i class="fas fa-eye"></i> Por revisar</span>';
    }
    const fmt = n => Number(n||0).toFixed(2);
    const fromISO = i => { const [yy,mm,dd] = (i||'').split('-'); return `${dd}-${mm}-${yy}`; };
  
    function buildRow(r){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-key="codigo">${r.codigo}</td>
        <td data-key="proyecto">${r.proyecto}</td>
        <td data-key="area">${r.area}</td>
        <td data-key="tarea">${r.tarea}</td>
        <td data-key="horas" data-num="${Number(r.horas)}">${fmt(r.horas)}</td>
        <td data-key="fecha" data-date="${r.fechaISO}">${fromISO(r.fechaISO)}</td>
        <td data-key="estado">${statusBadge(r.estado)}</td>
        <td><button class="icon-btn icon-btn--edit" title="Editar"><i class="fas fa-pen"></i></button></td>
        <td><button class="icon-btn icon-btn--delete" title="Eliminar"><i class="fas fa-trash"></i></button></td>
      `;
      return tr;
    }
  
    window.HoursTable = {
      /** Reemplaza todas las filas por las nuevas (array de objetos) */
      setRows(rows){
        tbody.innerHTML = '';
        rows.forEach(r => tbody.appendChild(buildRow(r)));
        this.reindex();
        // Respeta la selección del usuario en "Mostrar X"
        if (rowsPerSel) _rpp = parseInt(rowsPerSel.value,10) || _rpp;
        _page = 1;
        render();
      },
      /** Relee las filas del DOM (útil si las añadiste manualmente) */
      reindex(){
        _allRows  = Array.from(tbody.querySelectorAll('tr'));
        _viewRows = [..._allRows];
        // re-aplicar búsqueda/orden si están activos
        if (search && search.value) applySearch();
        if (_sort.key) {
          const th = table.querySelector(`thead th[data-sort="${_sort.key}"]`);
          th && applySort(th);
        } else {
          render();
        }
      },
      /** Cambia el tamaño de página desde código y sincroniza el select */
      setRowsPerPage(n){
        _rpp = Math.max(1, parseInt(n,10) || 10);
        if (rowsPerSel) rowsPerSel.value = String(_rpp);
        _page = 1;
        render();
      },
      /** Forzar repintado con el estado actual */
      refresh(){ render(); },
      /** Estado útil para depurar */
      getState(){ return { total:_allRows.length, filtered:_viewRows.length, page:_page, perPage:_rpp, sort:_sort }; }
    };
  })();
    