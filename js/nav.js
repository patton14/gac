/* ================= NAV.JS — Router del pantallazo con demo + loader =================
 - Cambia TODO el contenido central según el ítem del sidebar (por código/ID).
 - Siempre muestra 3 filas en "Última carga realizada".
 - Si un proyecto no tiene datos, genera datos de ejemplo (no queda vacío).
 - Muestra un loader cada vez que cambias de proyecto.
 - Usa window.HoursTable.setRows si existe (mantiene paginación/búsqueda/orden).
============================================================================= */

(() => {
    // ---------------------- Helpers ----------------------
    const $  = (s, c=document) => c.querySelector(s);
    const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
    const fmt = n => Number(n || 0).toFixed(2);
  
    // "DD-MM-YYYY" <-> "YYYY-MM-DD"
    const toISO   = d => { const [dd,mm,yy] = (d||'').split('-'); return `${yy}-${mm}-${dd}`; };
    const fromISO = i => { const [yy,mm,dd] = (i||'').split('-'); return `${dd}-${mm}-${yy}`; };
  
    const statusPill = s =>
      s === 'ok'   ? `<span class="status-pill ok"><i class="fas fa-check-circle"></i> Dentro de plazo</span>` :
      s === 'late' ? `<span class="status-pill late"><i class="fas fa-circle-exclamation"></i> Fuera de plazo</span>` :
                     `<span class="status-pill review"><i class="fas fa-eye"></i> Por revisar</span>`;
  
    const statusBadge = s =>
      s === 'ok'   ? `<span class="badge status--ok"><i class="fas fa-check-circle"></i> Dentro de plazo</span>` :
      s === 'late' ? `<span class="badge status--late"><i class="fas fa-clock"></i> Fuera de plazo</span>` :
                     `<span class="badge status--review"><i class="fas fa-eye"></i> Por revisar</span>`;
  
    // ---------------------- Loader (overlay) ----------------------
    const LOADER_MIN_MS = 350;
    function ensureLoader() {
      if ($('#nav-loader')) return;
      const style = document.createElement('style');
      style.textContent = `
        #nav-loader{position:fixed;inset:0;background:rgba(247,249,252,.7);backdrop-filter:saturate(1.2) blur(2px);
          display:none;align-items:center;justify-content:center;z-index:9999}
        #nav-loader.show{display:flex}
        .nav-spinner{width:56px;height:56px;border-radius:50%;border:6px solid rgba(0,0,0,.08);
          border-top-color:#4f46e5;animation:navspin .9s linear infinite}
        @keyframes navspin{to{transform:rotate(360deg)}}
      `;
      document.head.appendChild(style);
      const el = document.createElement('div');
      el.id = 'nav-loader';
      el.innerHTML = `<div class="nav-spinner" aria-label="Cargando…"></div>`;
      document.body.appendChild(el);
    }
    function showLoader(){
      ensureLoader();
      const el = $('#nav-loader');
      el.classList.add('show');
      el._shownAt = performance.now();
    }
    function hideLoader(){
      const el = $('#nav-loader');
      if (!el) return;
      const elapsed = performance.now() - (el._shownAt || 0);
      const wait = Math.max(0, LOADER_MIN_MS - elapsed);
      setTimeout(() => el.classList.remove('show'), wait);
    }
  
    // ---------------------- Datos base ----------------------
    const PROJECTS = {
      "2504024": {
        name: "BESS AMANECER",
        stats: { today: 4, week: 30, month: 145, late: 10 },
        last: [
          { codigo:"2504024", proyecto:"BESS AMANECER", area:"Energía", tarea:"Modelado", horas:6.00, fecha:"05-08-2025", estado:"ok" },
          { codigo:"2312089", proyecto:"Monitoreo Puelche", area:"Ambiental", tarea:"Informe",  horas:2.50, fecha:"02-08-2025", estado:"review" },
          { codigo:"9999999", proyecto:"Proyecto Test Transformación", area:"Transformación", tarea:"testODC2", horas:3.27, fecha:"01-08-2025", estado:"late" }
        ],
        hours: [
          { codigo:"9999999", proyecto:"Proyecto Test Transformación", area:"Transformación", tarea:"testODC2", horas:3.27, fechaISO:"2025-08-01", estado:"late" },
          { codigo:"2504024", proyecto:"BESS AMANECER", area:"Energía", tarea:"Modelado", horas:6.00, fechaISO:"2025-08-05", estado:"ok" },
          { codigo:"2312089", proyecto:"Monitoreo Puelche", area:"Ambiental", tarea:"Informe", horas:2.50, fechaISO:"2025-08-02", estado:"review" }
        ]
      },
      "2312089": {
        name: "Monitoreo Puelche-Operación",
        stats: { today: 2, week: 12, month: 58, late: 0 },
        last: [
          { codigo:"2312089", proyecto:"Monitoreo Puelche-Operación", area:"Ambiental", tarea:"Informe",          horas:1.50, fecha:"07-08-2025", estado:"ok" },
          { codigo:"2312089", proyecto:"Monitoreo Puelche-Operación", area:"Ambiental", tarea:"Revisión",         horas:0.50, fecha:"06-08-2025", estado:"review" },
          { codigo:"2312089", proyecto:"Monitoreo Puelche-Operación", area:"Ambiental", tarea:"Trabajo de campo", horas:2.00, fecha:"05-08-2025", estado:"ok" }
        ],
        hours: [
          { codigo:"2312089", proyecto:"Monitoreo Puelche-Operación", area:"Ambiental", tarea:"Informe",          horas:1.50, fechaISO:"2025-08-07", estado:"ok" },
          { codigo:"2312089", proyecto:"Monitoreo Puelche-Operación", area:"Ambiental", tarea:"Revisión",         horas:0.50, fechaISO:"2025-08-06", estado:"review" },
          { codigo:"2312089", proyecto:"Monitoreo Puelche-Operación", area:"Ambiental", tarea:"Trabajo de campo", horas:2.00, fechaISO:"2025-08-05", estado:"ok" }
        ]
      }
    };
  
    // Genera datos de ejemplo consistentes para proyectos que no estén en PROJECTS
    function demoDataFor(code, name){
      const n = Number(String(code).slice(-3)) || 1;
      const today = new Date();
      const mkDate = (offset) => {
        const d = new Date(today); d.setDate(d.getDate() - offset);
        const dd = String(d.getDate()).padStart(2,'0');
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const yy = d.getFullYear();
        return { human: `${dd}-${mm}-${yy}`, iso: `${yy}-${mm}-${dd}` };
      };
      const estados = ['ok','review','late'];
      const randH = k => ( (n*k)%7 + 1 ) + ((k%2)?0.5:0); // 1.0..8.0 pasos de 0.5
  
      const last = [0,1,2].map(i => {
        const d = mkDate(i+1);
        return {
          codigo: String(code),
          proyecto: name || `Proyecto ${code}`,
          area: i%2 ? 'Operaciones' : 'General',
          tarea: i%2 ? 'Revisión' : 'Actividad',
          horas: randH(i+1),
          fecha: d.human,
          estado: estados[(n+i)%3]
        };
      });
  
      const hours = Array.from({length: 9}, (_,i) => {
        const d = mkDate(i+3);
        return {
          codigo: String(code),
          proyecto: name || `Proyecto ${code}`,
          area: i%2 ? 'Operaciones' : 'General',
          tarea: i%2 ? 'Tarea B' : 'Tarea A',
          horas: randH(i+4),
          fechaISO: d.iso,
          estado: estados[(n+i+1)%3]
        };
      });
  
      return {
        name: name || `Proyecto ${code}`,
        stats: {
          today: Math.min(8, Math.max(1, (n % 7) + 1)),
          week:  10 + (n % 40),
          month: 60 + (n % 120),
          late:  (n % 12)
        },
        last, hours
      };
    }
  
    const emptyProject = (code, name) => demoDataFor(code, name); // <- nunca queda vacío
  
    // --------------- Siempre 3 filas en "Última carga" ---------------
    function normalizeLastRows(data){
      const out = [];
      const seen = new Set();
  
      (data.last || []).forEach(r => {
        const key = `${r.codigo}|${r.fecha}`;
        if (seen.has(key)) return;
        out.push({ ...r });
        seen.add(key);
      });
  
      if (out.length < 3) {
        (data.hours || []).some(h => {
          const fechaHumana = h.fecha ? h.fecha : fromISO(h.fechaISO);
          const key = `${h.codigo}|${fechaHumana}`;
          if (seen.has(key)) return false;
          out.push({
            codigo: h.codigo, proyecto: h.proyecto, area: h.area, tarea: h.tarea,
            horas: h.horas, fecha: fechaHumana, estado: h.estado
          });
          seen.add(key);
          return out.length >= 3;
        });
      }
  
      while (out.length < 3) {
        // Con demoDataFor casi nunca pasa, pero lo dejamos por si acaso
        out.push({
          codigo: String(data.code || '—'),
          proyecto: data.name || '—',
          area: 'General', tarea: 'Actividad',
          horas: 1, fecha: fromISO(new Date().toISOString().slice(0,10)),
          estado: 'review'
        });
      }
      return out.slice(0,3);
    }
  
    // ------------------- Renders del pantallazo -------------------
    function renderCards(stats){
      const map = {
        today:  '.cards .today .value',
        week:   '.cards .week .value',
        month:  '.cards .month .value',
        late:   '.cards .warning .value'
      };
      if ($(map.today))  $(map.today).textContent  = `${stats.today} hrs`;
      if ($(map.week))   $(map.week).textContent   = `${stats.week} hrs`;
      if ($(map.month))  $(map.month).textContent  = `${stats.month} hrs`;
      if ($(map.late))   $(map.late).textContent   = `${stats.late} hrs`;
    }
  
    function renderLastLoad(rows){
      const tbody = $('#lastLoadTable tbody');
      if (!tbody) return;
  
      tbody.innerHTML = '';
      rows.slice(0,3).forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.codigo}</td>
          <td>${r.proyecto}</td>
          <td>${r.area}</td>
          <td>${r.tarea}</td>
          <td>${fmt(r.horas)}</td>
          <td>${r.fecha}</td>
          <td>${statusPill(r.estado)}</td>
          <td><button class="btn-icon btn-duplicate" title="Duplicar"><i class="fas fa-copy"></i></button></td>
          <td><button class="btn-icon btn-edit" title="Editar"><i class="fas fa-pen"></i></button></td>
          <td><button class="btn-icon btn-delete" title="Eliminar"><i class="fas fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
      });
  
      const badge = $('#last-load .badge-soft');
      if (badge) badge.textContent = '3 registros';
    }
  
    function renderFormTitle(code, name){
      const h3 = $('.form-section__title h3');
      if (h3) h3.textContent = `${code} ${name}`.trim();
    }
  
    function setMainTableRows(rows){
      if (window.HoursTable && typeof window.HoursTable.setRows === 'function') {
        window.HoursTable.setRows(rows);
        return;
      }
      const tbody = $('#hoursTable tbody');
      if (!tbody) return;
      tbody.innerHTML = rows.map(r => `
        <tr>
          <td data-key="codigo">${r.codigo}</td>
          <td data-key="proyecto">${r.proyecto}</td>
          <td data-key="area">${r.area}</td>
          <td data-key="tarea">${r.tarea}</td>
          <td data-key="horas" data-num="${Number(r.horas)}">${fmt(r.horas)}</td>
          <td data-key="fecha" data-date="${r.fechaISO}">${fromISO(r.fechaISO)}</td>
          <td data-key="estado">${statusBadge(r.estado)}</td>
          <td><button class="icon-btn icon-btn--edit" title="Editar"><i class="fas fa-pen"></i></button></td>
          <td><button class="icon-btn icon-btn--delete" title="Eliminar"><i class="fas fa-trash"></i></button></td>
        </tr>
      `).join('');
      const info = $('#tableInfo');
      if (info) info.textContent = `Mostrando 1 a ${rows.length} de ${rows.length} registros`;
      const pageNow = $('#pageNow'), pageTotal = $('#pageTotal');
      if (pageNow) pageNow.textContent = '1';
      if (pageTotal) pageTotal.textContent = '1';
    }
  
    // ------------------------- Router -------------------------
    function parseProjectFromLi(li){
      const id = li.getAttribute('data-id');
      if (id) {
        const name = (li.getAttribute('data-name') || li.textContent || '').trim();
        return { code: id, name };
      }
      const txt = li.querySelector('span')?.innerText || li.innerText || '';
      const m = txt.trim().match(/^(\d{6,9})\s+(.+)$/);
      const code = m ? m[1] : txt.trim();
      const name = m ? m[2].replace(/\bNuevo\b/i,'').trim() : '';
      return { code, name };
    }
  
    function setActiveLi(li){
      $$('.project-list li').forEach(el => el.classList.remove('active'));
      li.classList.add('active');
    }
  
    function selectProject(code, name){
      showLoader();               // <-- Loader ON
      // Simula ciclo de carga (y hace que el loader se vea aunque sea rápido)
      requestAnimationFrame(() => {
        const base = PROJECTS[code] || emptyProject(code, name);
        const data = { ...base, code };
  
        renderCards(data.stats);
        const lastRows = normalizeLastRows(data);
        renderLastLoad(lastRows);
        renderFormTitle(code, data.name || name);
        const rows = (data.hours || []).map(r => ({ ...r, fechaISO: r.fechaISO || toISO(r.fecha) }));
        setMainTableRows(rows);
  
        if (location.hash !== `#p=${code}`) location.hash = `#p=${code}`;
        hideLoader();             // <-- Loader OFF (respetando LOADER_MIN_MS)
      });
    }
  
    function bindSidebarNavigation(){
      const container = document.querySelector('.sidebar-scrollable') || document;
      container.addEventListener('click', (e) => {
        const li = e.target.closest('.project-list li');
        if (!li) return;
        const { code, name } = parseProjectFromLi(li);
        if (!code) return;
        setActiveLi(li);
        selectProject(code, name);
      });
    }
  
    function bootWithHashOrFirst(){
      const m = location.hash.match(/#p=(\d{6,9})/);
      if (m) {
        const code = m[1];
        const li = $$('.project-list li').find(el => parseProjectFromLi(el).code === code);
        if (li) setActiveLi(li);
        const name = li ? parseProjectFromLi(li).name : (PROJECTS[code]?.name || "");
        selectProject(code, name);
      } else {
        const li = $('.project-list li.active') || $('.project-list li');
        if (li) {
          const { code, name } = parseProjectFromLi(li);
          if (code) {
            setActiveLi(li);
            selectProject(code, name);
          }
        }
      }
    }
  
    window.addEventListener('hashchange', () => {
      const m = location.hash.match(/#p=(\d{6,9})/);
      if (!m) return;
      const code = m[1];
      const li = $$('.project-list li').find(el => parseProjectFromLi(el).code === code);
      if (li) setActiveLi(li);
      const name = li ? parseProjectFromLi(li).name : (PROJECTS[code]?.name || "");
      selectProject(code, name);
    });
  
    // ------------------------ Init ------------------------
    document.addEventListener('DOMContentLoaded', () => {
      ensureLoader();
      bindSidebarNavigation();
      bootWithHashOrFirst();
    });
  })();
  