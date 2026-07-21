// ============================================================
// WRO Philippines – Standard User Portal – Announcements Module
// Mobile-first: image-first cards, detail modal, filter chips
// Supports per-announcement read/unread tracking
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

      // Mark all read in the background (DB) so dashboard notifications clear,
      // but do NOT instantly clear the UI badges here so the user can see which ones are new.
      // The local 'new' badges will clear individually when clicked (openDetail),
      // or entirely if the page is reloaded (since DB is updated).
      const unread = all.filter(a => !a.is_read);
      if (unread.length > 0) {
        PORTAL_DB.markAllAnnouncementsRead().catch(() => {});
      }
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
    const unreadCount = this._all.filter(a => !a.is_read).length;
    content.innerHTML = `
      <div class="p-page">
        <div class="p-page-header">
          <div>
            <div class="p-page-title">Announcements</div>
            <div class="p-page-sub">Official updates from administrators</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="p-count-pill">${this._all.length}</div>
            ${unreadCount > 0 ? `<div style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(230,57,70,0.15);color:#e63946;border:1px solid rgba(230,57,70,0.3);">${unreadCount} unread</div>` : ''}
          </div>
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

      <!-- Fullscreen Image Overlay -->
      <div id="ann-fullscreen-overlay" class="p-ann-fullscreen-overlay" onclick="PortalAnnouncements.closeImageFullscreen()" style="display:none;">
        <button class="p-ann-fs-close" aria-label="Close Fullscreen">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <img id="ann-fullscreen-img" class="p-ann-fs-img" src="" alt="Fullscreen image">
      </div>`;
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
      const isUnread = !a.is_read;

      return `
        <div class="p-ann-card ${isUnread ? 'p-ann-card--unread' : ''}" id="ann-card-${a.id}" onclick="PortalRouter.navigate('announcement_detail', { id: ${a.id} })" style="${isUnread ? `border-left:3px solid ${color};` : ''}">

          ${isUnread ? `<div style="position:absolute;top:12px;right:12px;width:8px;height:8px;background:#e63946;border-radius:50%;box-shadow:0 0 5px rgba(230,57,70,0.6);"></div>` : ''}

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
                ${isUnread ? `<span style="font-size:10px;font-weight:700;color:#e63946;background:rgba(230,57,70,0.12);border-radius:10px;padding:1px 7px;">NEW</span>` : ''}
              </div>
              <div class="p-ann-card-title" style="${isUnread ? 'color:#fff;font-weight:700;' : ''}">${a.title}</div>
              <div class="p-ann-card-preview">${preview}</div>
            </div>
            <div class="p-ann-card-chev">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </div>`;
    }).join('');
  },

  async renderDetail(opts) {
    const content = document.getElementById('portal-content');
    content.innerHTML = `<div class="p-loading"><div class="p-spinner"></div></div>`;

    try {
      if (this._all.length === 0) {
        this._all = await PORTAL_DB.announcements();
      }
      const a = this._all.find(x => x.id == opts.id);
      
      if (!a) {
        content.innerHTML = `
          <div class="p-page" style="text-align:center; padding-top:4rem;">
            <div class="p-error-card" style="display:inline-block;">Announcement not found or has been deleted.</div>
            <br><br>
            <button class="p-btn p-btn-primary" onclick="PortalRouter.navigate('announcements')">Back to Announcements</button>
          </div>`;
        return;
      }

      const { colors, icons } = this._catMeta();
      const color = colors[a.category] || '#1d6fa4';
      const icon  = icons[a.category]  || icons.general;
      const date  = new Date(a.created_at).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});
      const img   = a.image_url || a.imageUrl || null;

      // Mark as read in DB if unread
      if (!a.is_read) {
        a.is_read = true;
        PORTAL_DB.markAnnouncementRead(a.id).catch(() => {});
      }

      content.innerHTML = `
        <div class="p-ann-detail-page">
          <div class="p-ann-detail-nav">
            <button class="p-ann-back-btn" onclick="PortalRouter.navigate('announcements')">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Announcements
            </button>
          </div>

          ${img ? `
          <div class="p-ann-hero-img-wrap">
            <img src="${img}" alt="Announcement Poster" class="p-ann-hero-img" onclick="PortalAnnouncements.openImageFullscreen('${img}')" title="Click to view fullscreen">
          </div>` : ''}

          <div class="p-ann-detail-body-container">
            <div class="p-ann-card-meta" style="margin-bottom:1.25rem;">
              <div class="p-ann-cat-icon" style="background:${color}18;width:32px;height:32px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
              </div>
              <span class="p-ann-cat-badge" style="background:${color}18;color:${color};font-size:0.8rem;">${a.category}</span>
              <span class="p-ann-card-date" style="font-size:0.85rem;">${date}</span>
            </div>

            <h1 class="p-ann-detail-title">${a.title}</h1>
            
            <div class="p-ann-detail-text">${(a.body || '').replace(/\n/g,'<br>')}</div>

            ${a.recipients ? `
            <div class="p-ann-detail-meta">
              <span>Recipients:</span>
              <strong>${a.recipients}</strong>
            </div>` : ''}
          </div>
        </div>

        <!-- Fullscreen Image Overlay -->
        <div id="ann-fullscreen-overlay" class="p-ann-fullscreen-overlay" onclick="PortalAnnouncements.closeImageFullscreen()" style="display:none;">
          <button class="p-ann-fs-close" aria-label="Close Fullscreen">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img id="ann-fullscreen-img" class="p-ann-fs-img" src="" alt="Fullscreen image">
        </div>`;

    } catch (err) {
      content.innerHTML = `<div class="p-page"><div class="p-error-card">Failed to load announcement details: ${err.message}</div></div>`;
    }
  },

  // Update the header unread count badge in real time
  _refreshUnreadBadge() {
    const remaining = this._all.filter(a => !a.is_read).length;
    // Update the count pill in the page header
    const headerBadge = document.querySelector('.p-page-header [style*="e63946"]');
    if (headerBadge) {
      if (remaining === 0) {
        headerBadge.remove();
      } else {
        headerBadge.textContent = `${remaining} unread`;
      }
    }
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

  openImageFullscreen(src) {
    const overlay = document.getElementById('ann-fullscreen-overlay');
    const imgEl = document.getElementById('ann-fullscreen-img');
    if (!overlay || !imgEl) return;
    imgEl.src = src;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.classList.add('p-ann-fs-open');
    });
  },

  closeImageFullscreen() {
    const overlay = document.getElementById('ann-fullscreen-overlay');
    if (!overlay) return;
    overlay.classList.remove('p-ann-fs-open');
    setTimeout(() => {
      overlay.style.display = 'none';
      const imgEl = document.getElementById('ann-fullscreen-img');
      if (imgEl) imgEl.src = '';
    }, 250);
  },
};

window.PortalAnnouncements = PortalAnnouncements;
