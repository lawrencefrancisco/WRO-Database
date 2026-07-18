// ============================================================
// WRO Philippines – Standard User Portal – Notifications Module
// ============================================================

const PortalNotifications = {
  async render() {
    const content = document.getElementById('portal-content');
    content.innerHTML = `<div class="p-loading"><div class="p-spinner"></div></div>`;

    try {
      const notifications = await PORTAL_DB.notifications();

      const unreadCount = notifications.filter(n => !n.is_read).length;

      content.innerHTML = `
        <div class="p-page">
          <div class="p-page-header">
            <div>
              <div class="p-page-title">Notification History</div>
              <div class="p-page-sub">Recent updates to your account and teams</div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              ${unreadCount > 0 ? `<div class="p-count-pill" style="background: rgba(230,57,70,0.12); color: var(--p-red);">${unreadCount} Unread</div>` : ''}
              ${unreadCount > 0 ? `<button onclick="PortalNotifications.markAllRead()" style="background: var(--p-border); border: none; padding: 6px 12px; border-radius: 6px; color: var(--p-txt); cursor: pointer; font-size: 12px; font-weight: 600;">Mark all read</button>` : ''}
            </div>
          </div>

          ${notifications.length === 0 ? `
            <div class="p-section">
              <div class="p-empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(246,201,69,0.2)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <div class="p-empty-title">No notifications</div>
                <div class="p-empty-sub">You're all caught up!</div>
              </div>
            </div>` : `
          <div class="p-section">
            <div style="display:flex; flex-direction: column; gap: 10px;">
              ${notifications.map(n => `
                <div style="padding: 16px; border-left: 4px solid ${n.is_read ? 'transparent' : 'var(--p-yellow)'}; background: ${n.is_read ? 'var(--p-card)' : 'var(--p-card-2)'}; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; border-top: 1px solid var(--p-border); border-right: 1px solid var(--p-border); border-bottom: 1px solid var(--p-border);">
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span style="font-weight: 600; font-size: 14px; color: var(--p-txt);">${n.title}</span>
                      ${!n.is_read ? `<span style="width: 8px; height: 8px; background: var(--p-red); border-radius: 50%;"></span>` : ''}
                    </div>
                    <div style="font-size: 13px; color: var(--p-txt-2); line-height: 1.4; margin-bottom: 8px;">
                      ${n.message}
                    </div>
                    <div style="font-size: 11px; color: var(--p-muted); display: flex; gap: 12px;">
                      <span>${new Date(n.created_at).toLocaleString()}</span>
                      ${n.triggered_by ? `<span>By: ${n.triggered_by}</span>` : ''}
                    </div>
                  </div>
                  ${!n.is_read ? `
                    <button onclick="PortalNotifications.markRead(${n.id})" style="background: none; border: none; color: var(--p-blue); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center;" title="Mark as read">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>`}
        </div>`;
    } catch (err) {
      content.innerHTML = `<div class="p-page"><div class="p-error-card">Failed to load notifications: ${err.message}</div></div>`;
    }
  },

  async markRead(id) {
    try {
      await PORTAL_DB.markNotificationRead(id);
      this.render();
    } catch (err) {
      console.error(err);
    }
  },

  async markAllRead() {
    try {
      await PORTAL_DB.markAllNotificationsRead();
      this.render();
    } catch (err) {
      console.error(err);
    }
  }
};

window.PortalNotifications = PortalNotifications;
