// ============================================================
// WRO Philippines – Portal Confirm & Alert Utility
// Replaces native confirm() / alert() with styled modals
// ============================================================

const PortalConfirm = {

  _mount(innerHtml) {
    // Remove any existing dialog
    const old = document.getElementById('p-confirm-overlay');
    if (old) old.remove();

    // Create backdrop wrapper
    const overlay = document.createElement('div');
    overlay.id        = 'p-confirm-overlay';
    overlay.className = 'p-confirm-overlay';
    overlay.innerHTML  = `<div class="p-confirm-box">${innerHtml}</div>`;
    document.body.appendChild(overlay);

    // Click-outside-to-close handled here directly
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._dismiss(overlay);
    });

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      overlay.classList.add('p-confirm-open');
    });

    return overlay;
  },

  _dismiss(el) {
    el.classList.remove('p-confirm-open');
    el.classList.add('p-confirm-closing');
    setTimeout(() => el.remove(), 220);
  },

  /**
   * Styled confirmation dialog.
   * Returns Promise<boolean> — true = confirmed, false = cancelled.
   */
  show({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' } = {}) {
    return new Promise(resolve => {
      const cfg = {
        danger:  { icon: '🗑️', accent: '#e63946', accentBg: 'rgba(230,57,70,0.14)',  border: 'rgba(230,57,70,0.3)',  btnBg: 'linear-gradient(135deg,#e63946,#c62a35)' },
        warning: { icon: '⚠️', accent: '#F6C945', accentBg: 'rgba(246,201,69,0.14)', border: 'rgba(246,201,69,0.3)', btnBg: 'linear-gradient(135deg,#F6C945,#e8a800)', btnColor: '#1a1a2e' },
        info:    { icon: 'ℹ️', accent: '#1d6fa4', accentBg: 'rgba(29,111,164,0.14)', border: 'rgba(29,111,164,0.3)', btnBg: 'linear-gradient(135deg,#1d6fa4,#155a85)' },
      };
      const c = cfg[type] || cfg.danger;
      const btnColor = c.btnColor || '#fff';

      const overlay = this._mount(`
        <div class="p-confirm-icon-ring" style="background:${c.accentBg};border-color:${c.border};">
          <span style="font-size:22px;line-height:1;">${c.icon}</span>
        </div>
        <div class="p-confirm-title">${title}</div>
        ${message ? `<div class="p-confirm-msg">${message}</div>` : ''}
        <div class="p-confirm-actions">
          <button class="p-confirm-btn p-confirm-cancel" id="p-confirm-cancel">${cancelText}</button>
          <button class="p-confirm-btn p-confirm-ok" id="p-confirm-ok"
            style="background:${c.btnBg};color:${btnColor};">
            ${confirmText}
          </button>
        </div>`);

      overlay.querySelector('#p-confirm-ok').addEventListener('click', () => {
        this._dismiss(overlay);
        resolve(true);
      });
      overlay.querySelector('#p-confirm-cancel').addEventListener('click', () => {
        this._dismiss(overlay);
        resolve(false);
      });
    });
  },

  /**
   * Styled info/error alert (no cancel button).
   * Returns Promise<void> when dismissed.
   */
  alert({ title = 'Notice', message = '', type = 'info', confirmText = 'OK' } = {}) {
    return new Promise(resolve => {
      const cfg = {
        danger:  { icon: '❌', accentBg: 'rgba(230,57,70,0.14)',  border: 'rgba(230,57,70,0.3)',  btnBg: 'linear-gradient(135deg,#e63946,#c62a35)' },
        warning: { icon: '⚠️', accentBg: 'rgba(246,201,69,0.14)', border: 'rgba(246,201,69,0.3)', btnBg: 'linear-gradient(135deg,#F6C945,#e8a800)', btnColor: '#1a1a2e' },
        info:    { icon: 'ℹ️', accentBg: 'rgba(29,111,164,0.14)', border: 'rgba(29,111,164,0.3)', btnBg: 'linear-gradient(135deg,#1d6fa4,#155a85)' },
        success: { icon: '✅', accentBg: 'rgba(45,198,83,0.14)',  border: 'rgba(45,198,83,0.3)',  btnBg: 'linear-gradient(135deg,#2dc653,#1e9e3f)' },
      };
      const c = cfg[type] || cfg.info;
      const btnColor = c.btnColor || '#fff';

      const overlay = this._mount(`
        <div class="p-confirm-icon-ring" style="background:${c.accentBg};border-color:${c.border};">
          <span style="font-size:22px;line-height:1;">${c.icon}</span>
        </div>
        <div class="p-confirm-title">${title}</div>
        ${message ? `<div class="p-confirm-msg">${message}</div>` : ''}
        <div class="p-confirm-actions">
          <button class="p-confirm-btn p-confirm-ok" id="p-confirm-ok"
            style="background:${c.btnBg};color:${btnColor};flex:1;">
            ${confirmText}
          </button>
        </div>`);

      overlay.querySelector('#p-confirm-ok').addEventListener('click', () => {
        this._dismiss(overlay);
        resolve();
      });
    });
  },
};

window.PortalConfirm = PortalConfirm;
