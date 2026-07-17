// ============================================================
// WRO Philippines – Standard User Portal – Announcements Module
// Mobile-first: horizontally scrollable filter chips, tap-to-expand cards
// ============================================================

const PortalAnnouncements = {
  _all: [],

  async render() {
    const content = document.getElementById('portal-content');
    content.innerHTML = `<div class="p-loading"><div class="p-spinner"></div></div>`;

    try {
      const all = await PORTAL_DB.announcements();
      this._all = all;
      this._renderView(all, content);
    } catch (err) {
      content.innerHTML = `<div class="p-page"><div class="p-error-card">Failed to load announcements: ${err.message}</div></div>`;
    }
  },

  _renderView(items, container) {
    const content = container || document.getElementById('portal-content');
    const catColors = {
      general:      '#1d6fa4',
      payment:      '#2dc653',
      qualification:'#e8c027',
      delegation:   '#8338ec',
      competition:  '#e63946',
    };
    const catIcons = {
      general:      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      payment:      '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
      qualification:'<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
      delegation:   '<path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
      competition:  '<path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/><path d="M4 22h16"/>',
    };

    content.innerHTML = `
      <div class="p-page">
        <div class="p-page-header">
          <div>
            <div class="p-page-title">Announcements</div>
            <div class="p-page-sub">Official updates from administrators</div>
          </div>
          <div class="p-count-pill">${this._all.length}</div>
        </div>

        <!-- Horizontally scrollable filter chips -->
        <div class="p-filters" id="ann-filters">
          ${['all','general','payment','qualification','delegation','competition'].map(cat => `
            <button class="p-filter-btn ${cat === 'all' ? 'active' : ''}" data-cat="${cat}"
              onclick="PortalAnnouncements.filterBy('${cat}')">
              ${cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>`).join('')}
        </div>

        ${items.length === 0 ? `
          <div class="p-section">
            <div class="p-empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(246,201,69,0.2)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <div class="p-empty-title">No announcements yet</div>
              <div class="p-empty-sub">Check back later for updates from your administrators.</div>
            </div>
          </div>` : `
        <div id="ann-list" class="p-ann-list">
          ${this._renderCards(items, catColors, catIcons)}
        </div>`}
      </div>`;
  },

  _renderCards(items, catColors, catIcons) {
    const cc = catColors || { general:'#1d6fa4',payment:'#2dc653',qualification:'#e8c027',delegation:'#8338ec',competition:'#e63946' };
    const ci = catIcons  || {};

    if (items.length === 0) {
      return `<div class="p-section"><div class="p-empty-state"><div class="p-empty-title">No announcements in this category.</div></div></div>`;
    }

    return items.map((a, i) => {
      const color = cc[a.category] || '#1d6fa4';
      const icon  = ci[a.category] || ci.general || '';
      const date  = new Date(a.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
      const preview = (a.body || '').slice(0, 100) + ((a.body || '').length > 100 ? '…' : '');

      return `
        <div class="p-ann-card" id="ann-card-${i}">
          <div class="p-ann-card-main" onclick="PortalAnnouncements.toggle(${i})">
            <div class="p-ann-cat-icon" style="background:${color}18;">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
            </div>
            <div class="p-ann-card-body">
              <div class="p-ann-card-meta">
                <span class="p-ann-cat-badge" style="background:${color}18;color:${color};">${a.category}</span>
                <span class="p-ann-card-date">${date}</span>
              </div>
              <div class="p-ann-card-title">${a.title}</div>
              <div class="p-ann-card-preview">${preview}</div>
            </div>
            <div class="p-ann-card-chev">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div class="p-ann-card-expand" id="ann-expand-${i}">
            <div class="p-ann-full-text">${(a.body || '').replace(/\n/g,'<br>')}</div>
            ${a.recipients ? `<div class="p-ann-expand-footer">Recipients: <strong>${a.recipients}</strong></div>` : ''}
          </div>
        </div>`;
    }).join('');
  },

  toggle(i) {
    const card   = document.getElementById(`ann-card-${i}`);
    const expand = document.getElementById(`ann-expand-${i}`);
    if (!expand) return;
    const isOpen = expand.classList.contains('visible');
    // Close all others first
    document.querySelectorAll('.p-ann-card-expand.visible').forEach(el => {
      el.classList.remove('visible');
      el.closest('.p-ann-card')?.classList.remove('open');
    });
    // Toggle selected
    if (!isOpen) {
      expand.classList.add('visible');
      card?.classList.add('open');
      // Scroll into view on mobile
      setTimeout(() => card?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 50);
    }
  },

  filterBy(cat) {
    document.querySelectorAll('.p-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    const filtered = cat === 'all' ? this._all : this._all.filter(a => a.category === cat);
    const list = document.getElementById('ann-list');
    if (list) list.innerHTML = this._renderCards(filtered);
  },
};

window.PortalAnnouncements = PortalAnnouncements;
