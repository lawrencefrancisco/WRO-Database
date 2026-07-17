// ============================================================
// WRO Philippines – Standard User Portal – Announcements Module
// Mobile-first: image-first cards, detail modal, filter chips
// ============================================================

const PortalAnnouncements = {
  _all: [],

  async render() {
    const content = document.getElementById('portal-content');
    content.innerHTML = `<div class="p-loading"><div class="p-spinner"></div></div>`;

    try {
      const all = await PORTAL_DB.announcements();
      this._all = all;
      this._renderView(content);
    } catch (err) {
      content.innerHTML = `<div class="p-page"><div class="p-error-card">Failed to load announcements: ${err.message}</div></div>`;
    }
  },

  _catMeta() {
    return {
      colors: { general:'#1d6fa4', payment:'#2dc653', qualification:'#e8c027', delegation:'#8338ec', competition:'#e63946' },
      icons:  {
        general:      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        payment:      '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
        qualification:'<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
        delegation:   '<path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
        competition:  '<path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/><path d="M4 22h16"/>',
      },
    };
  },

  _renderView(container) {
    const content = container || document.getElementById('portal-content');
    content.innerHTML = `
      <div class="p-page">
        <div class="p-page-header">
          <div>
            <div class="p-page-title">Announcements</div>
            <div class="p-page-sub">Official updates from administrators</div>
          </div>
          <div class="p-count-pill">${this._all.length}</div>
        </div>

        <!-- Scrollable filter chips -->
        <div class="p-filters" id="ann-filters">
          ${['all','general','payment','qualification','delegation','competition'].map(cat => `
            <button class="p-filter-btn ${cat === 'all' ? 'active' : ''}" data-cat="${cat}"
              onclick="PortalAnnouncements.filterBy('${cat}')">
              ${cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>`).join('')}
        </div>

        <div id="ann-list" class="p-ann-list">
          ${this._renderCards(this._all)}
        </div>
      </div>

      <!-- Detail Modal Backdrop -->
      <div id="ann-modal-backdrop" class="p-ann-modal-backdrop" onclick="PortalAnnouncements.closeDetail()" style="display:none;"></div>

      <!-- Detail Modal -->
      <div id="ann-detail-modal" class="p-ann-detail-modal" style="display:none;"></div>`;
  },

  _renderCards(items) {
    const { colors, icons } = this._catMeta();

    if (items.length === 0) {
      return `<div class="p-section">
        <div class="p-empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(246,201,69,0.2)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div class="p-empty-title">No announcements in this category.</div>
        </div>
      </div>`;
    }

    return items.map((a, i) => {
      const color   = colors[a.category] || '#1d6fa4';
      const icon    = icons[a.category]  || icons.general;
      const date    = new Date(a.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
      const img     = a.image_url || a.imageUrl || null;
      const preview = (a.body || '').slice(0, 120) + ((a.body || '').length > 120 ? '…' : '');

      return `
        <div class="p-ann-card" id="ann-card-${i}" onclick="PortalAnnouncements.openDetail(${i})">

          <!-- Image (shown if present) -->
          ${img ? `
          <div class="p-ann-card-img-wrap">
            <img src="${img}" alt="Announcement poster" class="p-ann-card-img" loading="lazy">
          </div>` : ''}

          <!-- Content -->
          <div class="p-ann-card-main" style="cursor:pointer;">
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
        </div>`;
    }).join('');
  },

  openDetail(i) {
    const a = this._all[i];
    if (!a) return;
    const { colors, icons } = this._catMeta();
    const color = colors[a.category] || '#1d6fa4';
    const icon  = icons[a.category]  || icons.general;
    const date  = new Date(a.created_at).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'});
    const img   = a.image_url || a.imageUrl || null;

    const modal = document.getElementById('ann-detail-modal');
    const backdrop = document.getElementById('ann-modal-backdrop');
    if (!modal) return;

    modal.innerHTML = `
      <!-- Close button -->
      <button class="p-ann-modal-close" onclick="PortalAnnouncements.closeDetail()" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <!-- Image (full width, aspect-ratio preserved) -->
      ${img ? `
      <div class="p-ann-modal-img-wrap">
        <img src="${img}" alt="Announcement poster" class="p-ann-modal-img" loading="lazy">
      </div>` : ''}

      <!-- Body -->
      <div class="p-ann-modal-body">
        <!-- Category + Date row -->
        <div class="p-ann-card-meta" style="margin-bottom:0.75rem;">
          <div class="p-ann-cat-icon" style="background:${color}18;width:30px;height:30px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
          </div>
          <span class="p-ann-cat-badge" style="background:${color}18;color:${color};">${a.category}</span>
          <span class="p-ann-card-date">${date}</span>
        </div>

        <h2 class="p-ann-modal-title">${a.title}</h2>

        <div class="p-ann-modal-text">${(a.body || '').replace(/\n/g,'<br>')}</div>

        ${a.recipients ? `
        <div class="p-ann-modal-meta">
          <span>Recipients:</span>
          <strong>${a.recipients}</strong>
        </div>` : ''}
      </div>`;

    modal.style.display   = 'flex';
    backdrop.style.display = 'block';
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('p-ann-modal-open');
      backdrop.classList.add('p-ann-modal-bg-open');
    });
  },

  closeDetail() {
    const modal    = document.getElementById('ann-detail-modal');
    const backdrop = document.getElementById('ann-modal-backdrop');
    if (!modal) return;
    modal.classList.remove('p-ann-modal-open');
    backdrop.classList.remove('p-ann-modal-bg-open');
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.style.display    = 'none';
      backdrop.style.display = 'none';
    }, 280);
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
