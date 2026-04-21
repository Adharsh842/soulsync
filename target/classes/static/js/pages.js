/**
 * SoulSync Page Modules
 * Each page renders into the main #content element
 */

const Pages = {};

/* ════════════════════════════════════════════════
   DASHBOARD PAGE
   ════════════════════════════════════════════════ */
Pages.dashboard = {
  async render(root) {
    root.innerHTML = `<div class="page-container" id="dashboard-page"><div class="empty-state"><div class="spinner"></div></div></div>`;
    try {
      const [coupleRes, moodRes, datesRes, notesRes] = await Promise.allSettled([
        api.users.couple(),
        api.moods.analytics(30),
        api.specialDates.upcoming(),
        api.loveNotes.list(0, 3),
      ]);

      const couple = coupleRes.status === 'fulfilled' ? coupleRes.value.data : null;
      const mood   = moodRes.status   === 'fulfilled' ? moodRes.value.data   : null;
      const dates  = datesRes.status  === 'fulfilled' ? datesRes.value.data  : [];
      const notes  = notesRes.status  === 'fulfilled' ? notesRes.value.data?.content : [];

      const user = api.getUser();
      const upcomingDate = dates?.[0];
      const daysUntil = upcomingDate ? Math.max(0, Math.ceil((new Date(upcomingDate.eventDate) - new Date()) / 86400000)) : null;

      document.getElementById('dashboard-page').innerHTML = `
        <!-- Welcome Banner -->
        <div class="glass-card no-hover" style="padding:var(--space-8);margin-bottom:var(--space-8);background:var(--gradient-primary);border:none;position:relative;overflow:hidden">
          <div style="position:absolute;top:-30px;right:-30px;font-size:120px;opacity:0.08;line-height:1">💞</div>
          <div style="position:relative;z-index:1">
            <p style="color:rgba(255,255,255,0.85);font-size:0.9rem;margin-bottom:4px">Welcome back,</p>
            <h1 style="color:white;font-size:2rem;margin-bottom:var(--space-3)">${escapeHtml(user?.displayName)} 💕</h1>
            ${couple ? `<p style="color:rgba(255,255,255,0.9)">Connected with <strong>${escapeHtml(couple.partnerDisplayName)}</strong></p>` : `
              <p style="color:rgba(255,255,255,0.9);margin-bottom:var(--space-4)">You haven't connected with your partner yet</p>
              <button class="btn" style="background:rgba(255,255,255,0.25);color:white;border:1px solid rgba(255,255,255,0.4)" onclick="showInviteModal()">💌 Connect with Partner</button>`}
          </div>
        </div>

        <!-- Stats Row -->
        <div class="grid-4 stagger" style="margin-bottom:var(--space-8)">
          <div class="glass-card stat-card">
            <div class="stat-card-icon">💬</div>
            <div class="stat-card-label">Today's Mood</div>
            <div class="stat-card-value">${mood ? (moodEmoji(mood.averageMoodScore)) : '—'}</div>
            <div class="stat-card-trend">${mood ? `Avg: ${mood.averageMoodScore}/5` : 'Log your mood'}</div>
          </div>
          <div class="glass-card stat-card">
            <div class="stat-card-icon">📅</div>
            <div class="stat-card-label">Next Event</div>
            <div class="stat-card-value">${daysUntil !== null ? daysUntil : '—'}</div>
            <div class="stat-card-trend">${upcomingDate ? `days until ${upcomingDate.title}` : 'No upcoming events'}</div>
          </div>
          <div class="glass-card stat-card">
            <div class="stat-card-icon">💌</div>
            <div class="stat-card-label">Love Notes</div>
            <div class="stat-card-value">${notes?.length || 0}</div>
            <div class="stat-card-trend">Received for you</div>
          </div>
          <div class="glass-card stat-card">
            <div class="stat-card-icon">📸</div>
            <div class="stat-card-label">Together Since</div>
            <div class="stat-card-value">${couple?.createdAt ? daysSince(couple.createdAt) : '—'}</div>
            <div class="stat-card-trend">days of memories</div>
          </div>
        </div>

        <!-- On This Day + Upcoming -->
        <div class="grid-2 stagger" style="margin-bottom:var(--space-8)">
          <div class="glass-card no-hover" style="padding:var(--space-6)">
            <h3 style="margin-bottom:var(--space-5)">📅 Upcoming Events</h3>
            ${dates?.length ? dates.slice(0,4).map(d => `
              <div style="display:flex;gap:var(--space-3);align-items:center;padding:var(--space-3) 0;border-bottom:1px solid var(--divider)">
                <div style="width:46px;height:46px;border-radius:var(--radius-md);background:${d.colorHex}22;border:2px solid ${d.colorHex};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
                  <span style="font-size:0.85rem;font-weight:700;color:${d.colorHex}">${new Date(d.eventDate).getDate()}</span>
                  <span style="font-size:0.6rem;text-transform:uppercase;color:${d.colorHex}">${new Date(d.eventDate).toLocaleString('default',{month:'short'})}</span>
                </div>
                <div>
                  <div style="font-weight:600;font-size:0.9rem">${escapeHtml(d.title)}</div>
                  <div class="text-muted">${d.daysUntil === 0 ? '🎉 Today!' : `In ${d.daysUntil} days`}</div>
                </div>
              </div>`).join('') : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">📅</div><div class="empty-title" style="font-size:1rem">No upcoming events</div></div>'}
          </div>

          <div class="glass-card no-hover" style="padding:var(--space-6)">
            <h3 style="margin-bottom:var(--space-5)">🌊 Mood Trend (30 days)</h3>
            ${mood?.timeline?.length ? renderMiniMoodChart(mood.timeline) : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">🌊</div><div class="empty-title" style="font-size:1rem">Start logging moods</div></div>'}
          </div>
        </div>

        <!-- Recent Love Notes -->
        ${notes?.length ? `
        <div class="glass-card no-hover" style="padding:var(--space-6);margin-bottom:var(--space-8)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-5)">
            <h3>💌 Recent Love Notes</h3>
            <a href="#notes" class="btn btn-sm btn-ghost">View all</a>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--space-4)">
            ${notes.slice(0,3).map(n => `
              <div class="glass-card note-card" onclick="Router.navigate('#notes')">
                <div class="note-title">${escapeHtml(n.title || 'Untitled note')}</div>
                <div class="note-preview">${escapeHtml(n.isLocked ? '🔒 Locked until ' + formatDate(n.unlockAt) : n.content)}</div>
                <div class="note-timestamp" style="margin-top:var(--space-3)">${timeAgo(n.createdAt)}</div>
              </div>`).join('')}
          </div>
        </div>` : ''}`;

      // On this day memories
      try {
        const otdRes = await api.memories.onThisDay();
        if (otdRes.data?.length) {
          document.getElementById('dashboard-page').insertAdjacentHTML('beforeend', `
            <div class="glass-card no-hover" style="padding:var(--space-6)">
              <h3 style="margin-bottom:var(--space-5)">✨ On This Day</h3>
              <div style="display:flex;gap:var(--space-4);overflow-x:auto;padding-bottom:var(--space-3)">
                ${otdRes.data.map(m => `
                  <div style="flex-shrink:0;width:200px;border-radius:var(--radius-lg);overflow:hidden;background:var(--bg-tertiary);cursor:pointer" onclick="Router.navigate('#timeline')">
                    <div style="height:140px;overflow:hidden">
                      <img src="${escapeHtml(m.mediaUrl)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.background='var(--bg-tertiary)'">
                    </div>
                    <div style="padding:var(--space-3)">
                      <div style="font-weight:600;font-size:0.85rem">${escapeHtml(m.title)}</div>
                      <div class="text-muted">${new Date(m.memoryDate).getFullYear()}</div>
                    </div>
                  </div>`).join('')}
              </div>
            </div>`);
        }
      } catch {}
    } catch (e) {
      document.getElementById('dashboard-page').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Error loading dashboard</div><div class="empty-desc">${e.message}</div></div>`;
    }
  }
};

/* ════════════════════════════════════════════════
   CHAT PAGE
   ════════════════════════════════════════════════ */
Pages.chat = {
  messages: [],
  page: 0,
  typingTimer: null,
  isTyping: false,

  async render(root) {
    const user = api.getUser();
    root.innerHTML = `
      <div class="chat-container">
        <div class="chat-header glass-card no-hover" style="margin:0;border-radius:0;border-left:none;border-right:none;border-top:none;padding:var(--space-4) var(--space-6);display:flex;align-items:center;gap:var(--space-3)">
          <div class="avatar avatar-md" id="partner-avatar">?</div>
          <div>
            <div style="font-weight:700" id="partner-name">Loading...</div>
            <div class="text-muted" id="partner-status">● Online</div>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages">
          <div class="empty-state"><div class="spinner"></div></div>
        </div>
        <div class="typing-indicator" id="typing-indicator" style="display:none">
          <div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>
          <span id="typing-name"></span> is typing...
        </div>
        <div class="chat-input-area">
          <button class="btn btn-icon btn-ghost" onclick="Pages.chat.showEmojiPicker()">😊</button>
          <div class="chat-input-wrap">
            <textarea class="chat-input" id="chat-input" placeholder="Type a message..." rows="1"></textarea>
            <label style="cursor:pointer;color:var(--text-muted);font-size:1.1rem" title="Attach media">
              <input type="file" style="display:none" accept="image/*,video/*,audio/*" onchange="Pages.chat.handleMediaUpload(this)">📎</label>
          </div>
          <button class="btn btn-primary btn-icon" onclick="Pages.chat.sendMessage()" id="send-btn">➤</button>
        </div>
      </div>`;

    // Load couple / partner info
    try {
      const couple = App.coupleInfo || (await api.users.couple()).data;
      document.getElementById('partner-name').textContent = couple.partnerDisplayName;
      if (couple.partnerAvatarUrl) {
        document.getElementById('partner-avatar').innerHTML = `<img src="${couple.partnerAvatarUrl}" alt="">`;
      } else {
        document.getElementById('partner-avatar').textContent = couple.partnerDisplayName?.charAt(0) || '?';
      }
    } catch { document.getElementById('partner-name').textContent = 'Partner'; }

    await this.loadMessages();
    this.bindInputEvents();
    this.bindWsEvents();
  },

  async loadMessages() {
    try {
      const res = await api.messages.list(0, 50);
      const msgs = (res.data?.content || []).reverse();
      this.messages = msgs;
      this.renderMessages();
    } catch (e) {
      document.getElementById('chat-messages').innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div class="empty-title">Start your conversation</div></div>`;
    }
  },

  renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const user = api.getUser();
    if (!this.messages.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div class="empty-title">No messages yet</div><div class="empty-desc">Send your first message 💕</div></div>`;
      return;
    }
    container.innerHTML = this.messages.map(m => this.renderBubble(m, user)).join('');
    container.scrollTop = container.scrollHeight;
  },

  renderBubble(m, user) {
    const isOwn = m.senderId === user?.id;
    const reactions = (m.reactions || []).reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc;
    }, {});
    const reactionHtml = Object.entries(reactions).map(([e, c]) =>
      `<span class="reaction-pill">${e} ${c}</span>`).join('');

    return `
      <div class="message-group ${isOwn ? 'own' : ''}">
        ${!isOwn ? `<div class="avatar avatar-sm">${m.senderDisplayName?.charAt(0) || '?'}</div>` : ''}
        <div>
          <div class="message-bubble-list">
            <div class="message-bubble" ondblclick="Pages.chat.quickReact(${m.id})" title="Double-click to react">
              ${m.mediaUrl ? `<div style="margin-bottom:var(--space-2)"><img src="${escapeHtml(m.mediaUrl)}" style="max-width:240px;border-radius:12px" onerror="this.style.display='none'"></div>` : ''}
              ${m.content ? escapeHtml(m.content) : ''}
            </div>
          </div>
          ${reactionHtml ? `<div class="message-reactions">${reactionHtml}</div>` : ''}
          <div class="message-meta">
            ${formatTime(m.createdAt)} ${isOwn ? (m.isRead ? '✓✓' : '✓') : ''}
          </div>
        </div>
      </div>`;
  },

  addMessage(msg) {
    this.messages.push(msg);
    const user = api.getUser();
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const wasEmpty = container.querySelector('.empty-state');
    if (wasEmpty) container.innerHTML = '';
    container.insertAdjacentHTML('beforeend', this.renderBubble(msg, user));
    container.scrollTop = container.scrollHeight;
  },

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content) return;
    input.value = '';
    input.style.height = 'auto';
    this.stopTyping();
    try {
      await api.messages.send({ content, messageType: 'TEXT' });
    } catch (e) { Toast.error('Failed to send', e.message); }
  },

  quickReact(msgId) {
    const emojis = ['❤️','😂','😮','😢','👍','🔥'];
    const picker = document.createElement('div');
    picker.style.cssText = 'position:fixed;z-index:999;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:8px;display:flex;gap:8px;box-shadow:var(--shadow-lg);backdrop-filter:blur(20px)';
    picker.innerHTML = emojis.map(e => `<span style="cursor:pointer;font-size:1.4rem;padding:4px;border-radius:8px;transition:transform 0.1s" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform=''" onclick="Pages.chat.addReaction(${msgId},'${e}');this.closest('div').remove()">${e}</span>`).join('');
    // Position near center
    picker.style.top = '50%'; picker.style.left = '50%'; picker.style.transform = 'translate(-50%,-50%)';
    document.body.appendChild(picker);
    setTimeout(() => document.addEventListener('click', () => picker.remove(), { once: true }), 100);
  },

  async addReaction(msgId, emoji) {
    try { await api.messages.react(msgId, emoji); }
    catch(e) { Toast.error('Reaction failed', e.message); }
  },

  async handleMediaUpload(input) {
    const file = input.files[0];
    if (!file) return;
    Toast.info('Uploading...', '');
    try {
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const res = isVideo ? await api.files.video(file) : isAudio ? await api.files.voice(file) : await api.files.photo(file);
      await api.messages.send({ content: '', messageType: isVideo ? 'VIDEO' : isAudio ? 'VOICE' : 'IMAGE', mediaUrl: res.data.url });
    } catch(e) { Toast.error('Upload failed', e.message); }
  },

  showEmojiPicker() {
    const emojis = ['❤️','💕','😍','🥰','😘','💋','🌹','✨','💫','🎉','😂','🤣','😊','🙏','💪'];
    const picker = document.createElement('div');
    picker.style.cssText = 'position:fixed;bottom:120px;left:80px;z-index:999;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px;display:flex;flex-wrap:wrap;gap:8px;max-width:240px;box-shadow:var(--shadow-lg);backdrop-filter:blur(20px)';
    picker.innerHTML = emojis.map(e => `<span style="cursor:pointer;font-size:1.4rem;padding:4px;border-radius:8px" onclick="Pages.chat.insertEmoji('${e}');this.closest('div').remove()">${e}</span>`).join('');
    document.body.appendChild(picker);
    setTimeout(() => document.addEventListener('click', () => picker.remove(), { once: true }), 100);
  },

  insertEmoji(emoji) {
    const input = document.getElementById('chat-input');
    if (input) { input.value += emoji; input.focus(); }
  },

  bindInputEvents() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    input.addEventListener('input', () => {
      // Auto-resize
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      // Typing indicator
      if (!this.isTyping) this.startTyping();
      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => this.stopTyping(), 2000);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });
  },

  startTyping() {
    this.isTyping = true;
    const couple = App.coupleInfo;
    if (couple) WS.send('/app/chat.typing', { coupleId: couple.coupleId, isTyping: true });
  },

  stopTyping() {
    this.isTyping = false;
    clearTimeout(this.typingTimer);
    const couple = App.coupleInfo;
    if (couple) WS.send('/app/chat.typing', { coupleId: couple.coupleId, isTyping: false });
  },

  bindWsEvents() {
    window.addEventListener('ws:message', e => {
      this.addMessage(e.detail);
    });
    window.addEventListener('ws:typing', e => {
      const data = e.detail;
      const user = api.getUser();
      if (data.userId === user?.id) return;
      const indicator = document.getElementById('typing-indicator');
      const name = document.getElementById('typing-name');
      if (!indicator) return;
      if (data.isTyping) {
        indicator.style.display = 'flex';
        if (name) name.textContent = data.displayName;
      } else {
        indicator.style.display = 'none';
      }
    });
  },
};

/* ════════════════════════════════════════════════
   TIMELINE PAGE
   ════════════════════════════════════════════════ */
Pages.timeline = {
  page: 0,
  hasMore: true,

  async render(root) {
    root.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <div class="page-header-left">
            <h2>📸 Our Memories</h2>
            <span class="page-subtitle">Your shared timeline</span>
          </div>
          <button class="btn btn-primary" onclick="Pages.timeline.showAddModal()">+ Add Memory</button>
        </div>
        <div id="timeline-grid" class="timeline-grid stagger"></div>
        <div id="timeline-load-more" style="text-align:center;margin-top:var(--space-8);display:none">
          <button class="btn btn-secondary" onclick="Pages.timeline.loadMore()">Load more</button>
        </div>
      </div>`;
    this.page = 0; this.hasMore = true;
    await this.loadMemories();
  },

  async loadMemories(append = false) {
    const grid = document.getElementById('timeline-grid');
    if (!grid) return;
    if (!append) grid.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;
    try {
      const res = await api.memories.timeline(this.page, 12);
      const memories = res.data?.content || [];
      this.hasMore = !res.data?.last;

      if (!memories.length && !append) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📸</div><div class="empty-title">No memories yet</div><div class="empty-desc">Start preserving your moments together</div><button class="btn btn-primary" style="margin-top:var(--space-4)" onclick="Pages.timeline.showAddModal()">Add First Memory</button></div>`;
        return;
      }

      if (!append) grid.innerHTML = '';
      grid.insertAdjacentHTML('beforeend', memories.map(m => this.renderCard(m)).join(''));
      document.getElementById('timeline-load-more').style.display = this.hasMore ? 'block' : 'none';
    } catch(e) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><div class="empty-title">Could not load memories</div><div class="empty-desc">${e.message}</div></div>`;
    }
  },

  async loadMore() {
    this.page++;
    await this.loadMemories(true);
  },

  renderCard(m) {
    return `
      <div class="glass-card memory-card" onclick="Pages.timeline.openMemory(${m.id})">
        <div class="memory-card-image-wrap" style="position:relative">
          ${m.mediaType === 'VIDEO'
            ? `<video src="${escapeHtml(m.mediaUrl)}" class="memory-card-image" muted></video>`
            : m.mediaType === 'VOICE'
            ? `<div class="memory-card-image" style="display:flex;align-items:center;justify-content:center;font-size:3rem">🎙️</div>`
            : `<img src="${escapeHtml(m.mediaUrl)}" class="memory-card-image" alt="${escapeHtml(m.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=memory-card-image style=display:flex;align-items:center;justify-content:center;font-size:3rem>📸</div>'">`}
          <div class="memory-card-overlay">
            <span style="color:white;font-size:0.85rem">${m.locationName ? `📍 ${escapeHtml(m.locationName)}` : ''}</span>
          </div>
          <button class="memory-fav-btn ${m.isFavorite ? 'active' : ''}" onclick="event.stopPropagation();Pages.timeline.toggleFav(${m.id},this)">
            ${m.isFavorite ? '❤️' : '🤍'}
          </button>
          ${m.mediaType === 'VIDEO' ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:2rem;pointer-events:none">▶️</div>` : ''}
        </div>
        <div class="memory-card-body">
          <div class="memory-card-title">${escapeHtml(m.title)}</div>
          <div class="memory-card-meta">
            <span>📅 ${formatDate(m.memoryDate)}</span>
            ${m.uploaderDisplayName ? `<span>by ${escapeHtml(m.uploaderDisplayName)}</span>` : ''}
          </div>
          ${m.caption ? `<p style="font-size:0.82rem;color:var(--text-muted);margin-top:var(--space-2);-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(m.caption)}</p>` : ''}
          ${m.tags?.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:var(--space-2)">${m.tags.map(t=>`<span class="badge badge-pink" style="font-size:0.7rem">#${t}</span>`).join('')}</div>` : ''}
        </div>
      </div>`;
  },

  async openMemory(id) {
    try {
      const res = await api.memories.get(id);
      const m = res.data;
      modal(`📸 ${escapeHtml(m.title)}`, `
        <div style="margin-bottom:var(--space-4);border-radius:var(--radius-lg);overflow:hidden">
          ${m.mediaType === 'VIDEO'
            ? `<video src="${escapeHtml(m.mediaUrl)}" controls style="width:100%;max-height:400px"></video>`
            : m.mediaType === 'VOICE'
            ? `<audio src="${escapeHtml(m.mediaUrl)}" controls style="width:100%"></audio>`
            : `<img src="${escapeHtml(m.mediaUrl)}" style="width:100%;max-height:400px;object-fit:contain" alt="">`}
        </div>
        ${m.caption ? `<p style="margin-bottom:var(--space-4)">${escapeHtml(m.caption)}</p>` : ''}
        <div style="display:flex;gap:var(--space-4);flex-wrap:wrap;font-size:0.85rem;color:var(--text-muted)">
          <span>📅 ${formatDate(m.memoryDate)}</span>
          ${m.locationName ? `<span>📍 ${escapeHtml(m.locationName)}</span>` : ''}
          ${m.uploaderDisplayName ? `<span>👤 ${escapeHtml(m.uploaderDisplayName)}</span>` : ''}
          <span>👁 ${m.viewCount} views</span>
        </div>
        ${m.tags?.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:var(--space-3)">${m.tags.map(t=>`<span class="badge badge-pink">#${t}</span>`).join('')}</div>` : ''}`,
        `<button class="btn btn-ghost" onclick="Pages.timeline.deleteMemory(${m.id})">🗑 Delete</button>
         <button class="btn btn-primary" onclick="this.closest('.modal-backdrop').remove()">Close</button>`);
    } catch(e) { Toast.error('Could not load memory', e.message); }
  },

  async toggleFav(id, btn) {
    try {
      const res = await api.memories.favorite(id);
      btn.className = `memory-fav-btn ${res.data.isFavorite ? 'active' : ''}`;
      btn.textContent = res.data.isFavorite ? '❤️' : '🤍';
    } catch(e) { Toast.error('Failed', e.message); }
  },

  async deleteMemory(id) {
    if (!confirm('Delete this memory?')) return;
    try {
      await api.memories.delete(id);
      document.querySelector('.modal-backdrop')?.remove();
      Toast.success('Memory deleted');
      await this.loadMemories();
    } catch(e) { Toast.error('Delete failed', e.message); }
  },

  showAddModal() {
    const m = modal('📸 Add Memory',
      `<div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Title *</label>
          <input class="form-input" id="mem-title" placeholder="Give this memory a name">
        </div>
        <div class="form-group">
          <label class="form-label">Caption</label>
          <textarea class="form-textarea" id="mem-caption" placeholder="Describe this moment..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" class="form-input" id="mem-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">Upload Photo / Video / Voice</label>
          <input type="file" class="form-input" id="mem-file" accept="image/*,video/*,audio/*">
          <span class="form-hint">Or enter a URL below</span>
        </div>
        <div class="form-group">
          <label class="form-label">Media URL (optional)</label>
          <input class="form-input" id="mem-url" placeholder="https://...">
        </div>
        <div class="form-group">
          <label class="form-label">Location</label>
          <input class="form-input" id="mem-location" placeholder="Where was this?">
        </div>
        <div class="form-group">
          <label class="form-label">Tags (comma separated)</label>
          <input class="form-input" id="mem-tags" placeholder="date, vacation, anniversary">
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.timeline.saveMemory(this)">Save Memory</button>`);
  },

  async saveMemory(btn) {
    const title = document.getElementById('mem-title')?.value?.trim();
    if (!title) { Toast.error('Title required'); return; }

    btn.disabled = true; btn.textContent = 'Saving...';

    try {
      let mediaUrl = document.getElementById('mem-url')?.value?.trim();
      let mediaType = 'PHOTO';
      const fileInput = document.getElementById('mem-file');

      if (fileInput?.files[0]) {
        const file = fileInput.files[0];
        mediaType = file.type.startsWith('video/') ? 'VIDEO' : file.type.startsWith('audio/') ? 'VOICE' : 'PHOTO';
        const res = mediaType === 'VIDEO' ? await api.files.video(file) : mediaType === 'VOICE' ? await api.files.voice(file) : await api.files.photo(file);
        mediaUrl = res.data.url;
      }

      if (!mediaUrl) { Toast.error('Please provide a photo/video URL or upload a file'); btn.disabled = false; btn.textContent = 'Save Memory'; return; }

      const tags = document.getElementById('mem-tags')?.value?.split(',').map(t=>t.trim()).filter(Boolean) || [];
      await api.memories.create({
        title,
        caption: document.getElementById('mem-caption')?.value,
        mediaUrl,
        mediaType,
        memoryDate: document.getElementById('mem-date')?.value,
        locationName: document.getElementById('mem-location')?.value,
        tags,
      });

      document.querySelector('.modal-backdrop')?.remove();
      Toast.success('Memory saved! 📸');
      await this.loadMemories();
    } catch(e) {
      Toast.error('Save failed', e.message);
      btn.disabled = false; btn.textContent = 'Save Memory';
    }
  },
};

/* ════════════════════════════════════════════════
   MOOD PAGE
   ════════════════════════════════════════════════ */
Pages.mood = {
  selectedMood: null,

  async render(root) {
    root.innerHTML = `<div class="page-container">
      <div class="page-header">
        <div class="page-header-left"><h2>🌊 Mood Tracker</h2><span class="page-subtitle">How are you feeling today?</span></div>
      </div>
      <div id="mood-content"></div>
    </div>`;
    await this.loadMoodPage();
  },

  async loadMoodPage() {
    const container = document.getElementById('mood-content');
    if (!container) return;
    try {
      const [analyticsRes, moodsRes] = await Promise.all([api.moods.analytics(30), api.moods.list(30)]);
      const analytics = analyticsRes.data;
      const moods = moodsRes.data || [];

      const MOODS = [
        { label: 'ECSTATIC', emoji: '🤩', score: 5, color: '#FF6B9D' },
        { label: 'HAPPY',    emoji: '😊', score: 4, color: '#C084FC' },
        { label: 'CONTENT',  emoji: '🙂', score: 3, color: '#60A5FA' },
        { label: 'NEUTRAL',  emoji: '😐', score: 3, color: '#94A3B8' },
        { label: 'ANXIOUS',  emoji: '😰', score: 2, color: '#FBBF24' },
        { label: 'SAD',      emoji: '😢', score: 2, color: '#818CF8' },
        { label: 'ANGRY',    emoji: '😤', score: 1, color: '#F87171' },
        { label: 'LONELY',   emoji: '🥺', score: 1, color: '#A78BFA' },
      ];

      container.innerHTML = `
        <div class="grid-2" style="gap:var(--space-6)">
          <!-- Log Mood -->
          <div class="glass-card no-hover" style="padding:var(--space-6)">
            <h3 style="margin-bottom:var(--space-5)">Log Today's Mood</h3>
            <div class="mood-grid" id="mood-options">
              ${MOODS.map(m => `
                <div class="mood-option" data-mood="${m.label}" data-score="${m.score}" onclick="Pages.mood.selectMood(this,'${m.label}',${m.score})">
                  <div class="mood-emoji">${m.emoji}</div>
                  <div class="mood-label">${m.label}</div>
                </div>`).join('')}
            </div>
            <div class="form-group" style="margin-top:var(--space-5)">
              <label class="form-label">Energy Level (1-10)</label>
              <input type="range" min="1" max="10" value="5" id="energy-slider" style="width:100%;accent-color:var(--rose)">
              <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-muted)"><span>Low</span><span id="energy-val">5</span><span>High</span></div>
            </div>
            <div class="form-group" style="margin-top:var(--space-4)">
              <label class="form-label">Notes (optional)</label>
              <textarea class="form-textarea" id="mood-note" placeholder="What's on your mind?"></textarea>
            </div>
            <button class="btn btn-primary w-full" style="margin-top:var(--space-4)" onclick="Pages.mood.saveMood()">Save Mood 💫</button>
          </div>

          <!-- Stats -->
          <div style="display:flex;flex-direction:column;gap:var(--space-5)">
            <div class="glass-card no-hover" style="padding:var(--space-6)">
              <h3 style="margin-bottom:var(--space-5)">30-Day Overview</h3>
              <div class="grid-2" style="gap:var(--space-4)">
                <div class="stat-card" style="padding:var(--space-4)">
                  <div class="stat-card-label">Avg Mood</div>
                  <div class="stat-card-value" style="font-size:1.5rem">${analytics.averageMoodScore ? analytics.averageMoodScore.toFixed(1) : '—'}/5</div>
                </div>
                <div class="stat-card" style="padding:var(--space-4)">
                  <div class="stat-card-label">Total Entries</div>
                  <div class="stat-card-value" style="font-size:1.5rem">${analytics.totalEntries || 0}</div>
                </div>
              </div>
            </div>

            <div class="glass-card no-hover" style="padding:var(--space-6)">
              <h3 style="margin-bottom:var(--space-5)">Mood Distribution</h3>
              ${analytics.moodDistribution ? Object.entries(analytics.moodDistribution).map(([label, count]) => {
                const mood = MOODS.find(m => m.label === label);
                const pct = analytics.totalEntries ? Math.round((count / analytics.totalEntries) * 100) : 0;
                return `<div style="margin-bottom:var(--space-3)">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span style="font-size:0.85rem">${mood?.emoji || ''} ${label}</span>
                    <span style="font-size:0.8rem;color:var(--text-muted)">${pct}%</span>
                  </div>
                  <div style="height:6px;background:var(--bg-tertiary);border-radius:99px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:${mood?.color || 'var(--rose)'};border-radius:99px;transition:width 0.8s ease"></div>
                  </div>
                </div>`;
              }).join('') : '<div class="text-muted">No data yet</div>'}
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="glass-card no-hover" style="padding:var(--space-6);margin-top:var(--space-6)">
          <h3 style="margin-bottom:var(--space-5)">Mood History</h3>
          ${moods.length ? `
            <div style="display:flex;gap:var(--space-3);overflow-x:auto;padding-bottom:var(--space-3)">
              ${moods.slice(0,14).map(m => {
                const mood = MOODS.find(x => x.label === m.moodLabel);
                return `<div style="flex-shrink:0;text-align:center;width:52px">
                  <div style="font-size:1.6rem">${mood?.emoji || '😐'}</div>
                  <div style="font-size:0.68rem;color:var(--text-muted);margin-top:2px">${new Date(m.loggedDate).toLocaleDateString('en',{month:'short',day:'numeric'})}</div>
                  ${m.note ? `<div title="${escapeHtml(m.note)}" style="font-size:0.65rem;color:var(--rose);cursor:help">•••</div>` : ''}
                </div>`;
              }).join('')}
            </div>` : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">🌊</div><div class="empty-title" style="font-size:1rem">Start logging your moods daily</div></div>'}
        </div>`;

      // Energy slider
      const slider = document.getElementById('energy-slider');
      const val = document.getElementById('energy-val');
      if (slider && val) slider.oninput = () => val.textContent = slider.value;
    } catch(e) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Error</div><div class="empty-desc">${e.message}</div></div>`;
    }
  },

  selectMood(el, label, score) {
    document.querySelectorAll('.mood-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    this.selectedMood = { label, score };
  },

  async saveMood() {
    if (!this.selectedMood) { Toast.error('Please select a mood'); return; }
    const note = document.getElementById('mood-note')?.value;
    const energy = parseInt(document.getElementById('energy-slider')?.value || 5);
    try {
      await api.moods.log({
        moodScore: this.selectedMood.score,
        moodLabel: this.selectedMood.label,
        note, energyLevel: energy,
        loggedDate: new Date().toISOString().split('T')[0]
      });
      Toast.success('Mood logged! 🌊');
      this.selectedMood = null;
      await this.loadMoodPage();
    } catch(e) { Toast.error('Failed to save mood', e.message); }
  }
};

/* ════════════════════════════════════════════════
   SPECIAL DATES PAGE
   ════════════════════════════════════════════════ */
Pages.dates = {
  async render(root) {
    root.innerHTML = `<div class="page-container">
      <div class="page-header">
        <div class="page-header-left"><h2>📅 Special Dates</h2><span class="page-subtitle">Your milestones & celebrations</span></div>
        <button class="btn btn-primary" onclick="Pages.dates.showAddModal()">+ Add Event</button>
      </div>
      <div id="dates-content"></div>
    </div>`;
    await this.loadDates();
  },

  async loadDates() {
    const container = document.getElementById('dates-content');
    if (!container) return;
    container.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;
    try {
      const res = await api.specialDates.list();
      const events = res.data || [];
      if (!events.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">No events yet</div><div class="empty-desc">Add your special dates to celebrate together</div><button class="btn btn-primary" style="margin-top:var(--space-4)" onclick="Pages.dates.showAddModal()">Add First Event</button></div>`;
        return;
      }

      // Group upcoming vs past
      const today = new Date();
      const upcoming = events.filter(e => new Date(e.eventDate) >= today || e.daysUntil >= 0);
      const past     = events.filter(e => new Date(e.eventDate) <  today && e.daysUntil < 0);

      container.innerHTML = `
        ${upcoming.length ? `
          <h3 style="margin-bottom:var(--space-4);color:var(--text-muted);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em">Upcoming</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-bottom:var(--space-8)">
            ${upcoming.map(e => this.renderCard(e)).join('')}
          </div>` : ''}
        ${past.length ? `
          <h3 style="margin-bottom:var(--space-4);color:var(--text-muted);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em">Past Events</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-3)">
            ${past.map(e => this.renderCard(e)).join('')}
          </div>` : ''}`;
    } catch(e) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Error loading events</div></div>`;
    }
  },

  renderCard(e) {
    const eventDate = new Date(e.eventDate);
    const isSoon = e.daysUntil >= 0 && e.daysUntil <= 7;
    const isToday = e.daysUntil === 0;
    const icons = { ANNIVERSARY:'💍', BIRTHDAY:'🎂', FIRST_DATE:'💕', MILESTONE:'🏆', HOLIDAY:'🎉', OTHER:'📅' };
    return `
      <div class="glass-card event-card">
        <div class="event-date-badge" style="background:${e.colorHex}22;border:2px solid ${e.colorHex}">
          <span class="day" style="color:${e.colorHex}">${eventDate.getDate()}</span>
          <span class="month" style="color:${e.colorHex}">${eventDate.toLocaleString('default',{month:'short'})}</span>
        </div>
        <div class="event-info">
          <div class="event-title">${icons[e.eventType] || '📅'} ${escapeHtml(e.title)}</div>
          ${e.description ? `<div class="text-muted" style="font-size:0.82rem;margin-top:2px">${escapeHtml(e.description)}</div>` : ''}
          <div class="event-countdown ${isSoon ? 'soon' : ''}">
            ${isToday ? '🎉 Today!' : e.daysUntil > 0 ? `In ${e.daysUntil} day${e.daysUntil > 1 ? 's' : ''}` : `${Math.abs(e.daysUntil)} days ago`}
            ${e.isRecurring ? ' · Yearly' : ''}
          </div>
        </div>
        <div class="event-actions">
          ${isToday ? renderCountdown(e.eventDate) : ''}
          <button class="btn btn-icon btn-ghost" onclick="Pages.dates.deleteEvent(${e.id})" title="Delete">🗑</button>
        </div>
      </div>`;
  },

  async deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    try {
      await api.specialDates.delete(id);
      Toast.success('Event deleted');
      await this.loadDates();
    } catch(e) { Toast.error('Delete failed', e.message); }
  },

  showAddModal() {
    modal('📅 Add Special Date',
      `<div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Event Title *</label>
          <input class="form-input" id="event-title" placeholder="Our Anniversary, Birthday...">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="event-desc" placeholder="Optional details">
        </div>
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input type="date" class="form-input" id="event-date">
        </div>
        <div class="form-group">
          <label class="form-label">Event Type</label>
          <select class="form-select" id="event-type">
            ${['ANNIVERSARY','BIRTHDAY','FIRST_DATE','MILESTONE','HOLIDAY','OTHER'].map(t=>`<option>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <input type="color" id="event-color" value="#FF6B9D" style="width:60px;height:40px;border:none;cursor:pointer;background:none;border-radius:8px">
        </div>
        <div style="display:flex;gap:var(--space-3);align-items:center">
          <input type="checkbox" id="event-recurring" style="accent-color:var(--rose)">
          <label for="event-recurring" style="cursor:pointer">Recurring event (yearly)</label>
        </div>
        <div class="form-group">
          <label class="form-label">Reminder (days before)</label>
          <input type="number" class="form-input" id="event-reminder" value="7" min="1" max="90">
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.dates.saveEvent(this)">Save Event</button>`);
  },

  async saveEvent(btn) {
    const title = document.getElementById('event-title')?.value?.trim();
    const date  = document.getElementById('event-date')?.value;
    if (!title || !date) { Toast.error('Title and date required'); return; }
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
      await api.specialDates.create({
        title, eventDate: date,
        description: document.getElementById('event-desc')?.value,
        eventType: document.getElementById('event-type')?.value,
        colorHex: document.getElementById('event-color')?.value,
        isRecurring: document.getElementById('event-recurring')?.checked,
        recurrenceType: 'YEARLY',
        reminderDays: parseInt(document.getElementById('event-reminder')?.value || 7),
      });
      document.querySelector('.modal-backdrop')?.remove();
      Toast.success('Event added! 📅');
      await this.loadDates();
    } catch(e) {
      Toast.error('Failed', e.message);
      btn.disabled = false; btn.textContent = 'Save Event';
    }
  }
};

/* ════════════════════════════════════════════════
   LOVE NOTES PAGE
   ════════════════════════════════════════════════ */
Pages.notes = {
  async render(root) {
    root.innerHTML = `<div class="page-container">
      <div class="page-header">
        <div class="page-header-left"><h2>💌 Love Notes</h2><span class="page-subtitle">Messages from the heart</span></div>
        <button class="btn btn-primary" onclick="Pages.notes.showWriteModal()">✍️ Write Note</button>
      </div>
      <div id="notes-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-5)">
        <div class="empty-state" style="grid-column:1/-1"><div class="spinner"></div></div>
      </div>
    </div>`;
    await this.loadNotes();
  },

  async loadNotes() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    try {
      const res = await api.loveNotes.list(0, 20);
      const notes = res.data?.content || [];
      if (!notes.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">💌</div><div class="empty-title">No love notes yet</div><div class="empty-desc">Write something beautiful for your partner</div><button class="btn btn-primary" style="margin-top:var(--space-4)" onclick="Pages.notes.showWriteModal()">Write First Note</button></div>`;
        return;
      }
      grid.innerHTML = notes.map(n => this.renderNote(n)).join('');
    } catch(e) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><div class="empty-title">Error loading notes</div></div>`;
    }
  },

  renderNote(n) {
    const now = new Date();
    const locked = n.isLocked && n.unlockAt && new Date(n.unlockAt) > now;
    const themes = { default: 'var(--gradient-warm)', rose: 'linear-gradient(135deg,#FF6B9D,#E84D85)', midnight: 'linear-gradient(135deg,#1a1a2e,#16213e)', aurora: 'linear-gradient(135deg,#00c9ff,#92fe9d)' };
    return `
      <div class="glass-card note-card ${locked ? '' : 'pointer'}" onclick="${locked ? '' : `Pages.notes.openNote(${n.id})`}">
        <div class="note-sender">
          <div class="avatar avatar-sm" style="background:${themes[n.theme] || themes.default}">${n.senderDisplayName?.charAt(0) || '?'}</div>
          <div>
            <div class="note-sender-name">${escapeHtml(n.senderDisplayName)}</div>
            <div class="note-timestamp">${timeAgo(n.createdAt)}</div>
          </div>
          ${!n.isRead && !locked ? '<span class="badge badge-pink">New</span>' : ''}
        </div>
        ${locked ? `
          <div class="note-locked">
            <div class="note-locked-icon">🔒</div>
            <div style="font-weight:600">${escapeHtml(n.title || 'Locked Note')}</div>
            <div class="note-unlock-time">Unlocks ${formatDate(n.unlockAt)}</div>
            ${renderCountdownSmall(n.unlockAt)}
          </div>` : `
          ${n.title ? `<div class="note-title">${escapeHtml(n.title)}</div>` : ''}
          <div class="note-preview">${escapeHtml(n.content)}</div>`}
      </div>`;
  },

  async openNote(id) {
    try {
      const res = await api.loveNotes.read(id);
      const n = res.data;
      const themes = {
        default: 'var(--gradient-warm)',
        rose: 'linear-gradient(135deg,#FF6B9D,#E84D85)',
        midnight: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        aurora: 'linear-gradient(135deg,#00c9ff,#92fe9d)'
      };
      modal(n.title || '💌 Love Note', `
        <div style="background:${themes[n.theme]||themes.default};border-radius:var(--radius-lg);padding:var(--space-8);margin-bottom:var(--space-4);text-align:center;min-height:120px;display:flex;align-items:center;justify-content:center">
          <p style="color:white;font-family:var(--font-display);font-size:1.15rem;line-height:1.8;font-style:italic">${escapeHtml(n.content)}</p>
        </div>
        <div style="text-align:center;color:var(--text-muted);font-size:0.85rem">
          — ${escapeHtml(n.senderDisplayName)} · ${formatDate(n.createdAt)}
        </div>
        ${n.mediaUrl ? `<div style="margin-top:var(--space-4)"><img src="${escapeHtml(n.mediaUrl)}" style="width:100%;border-radius:var(--radius-md)" onerror="this.remove()"></div>` : ''}`,
        `<button class="btn btn-primary w-full" onclick="this.closest('.modal-backdrop').remove()">💕 Close</button>`);
      await this.loadNotes();
    } catch(e) { Toast.error('Could not open note', e.message); }
  },

  showWriteModal() {
    modal('✍️ Write a Love Note', `
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Title (optional)</label>
          <input class="form-input" id="note-title" placeholder="A little surprise...">
        </div>
        <div class="form-group">
          <label class="form-label">Your message *</label>
          <textarea class="form-textarea" id="note-content" placeholder="Write from the heart..." style="min-height:140px"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Theme</label>
          <select class="form-select" id="note-theme">
            <option value="default">🌸 Default (Warm)</option>
            <option value="rose">🌹 Rose</option>
            <option value="midnight">🌙 Midnight</option>
            <option value="aurora">🌈 Aurora</option>
          </select>
        </div>
        <div style="background:var(--bg-overlay);border-radius:var(--radius-md);padding:var(--space-4)">
          <div style="font-weight:600;margin-bottom:var(--space-3)">⏰ Scheduling</div>
          <label style="display:flex;gap:var(--space-3);align-items:center;cursor:pointer;margin-bottom:var(--space-3)">
            <input type="checkbox" id="note-scheduled" style="accent-color:var(--rose)" onchange="document.getElementById('note-deliver-wrap').style.display=this.checked?'block':'none'">
            Schedule for later
          </label>
          <div id="note-deliver-wrap" style="display:none">
            <input type="datetime-local" class="form-input" id="note-deliver-at">
          </div>
        </div>
        <div style="background:var(--bg-overlay);border-radius:var(--radius-md);padding:var(--space-4)">
          <div style="font-weight:600;margin-bottom:var(--space-3)">🔒 Lock Note</div>
          <label style="display:flex;gap:var(--space-3);align-items:center;cursor:pointer;margin-bottom:var(--space-3)">
            <input type="checkbox" id="note-locked" style="accent-color:var(--rose)" onchange="document.getElementById('note-unlock-wrap').style.display=this.checked?'block':'none'">
            Lock until a specific time
          </label>
          <div id="note-unlock-wrap" style="display:none">
            <input type="datetime-local" class="form-input" id="note-unlock-at">
          </div>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.notes.saveNote(this)">Send Note 💌</button>`);
  },

  async saveNote(btn) {
    const content = document.getElementById('note-content')?.value?.trim();
    if (!content) { Toast.error('Please write a message'); return; }
    btn.disabled = true; btn.textContent = 'Sending...';
    const isScheduled = document.getElementById('note-scheduled')?.checked;
    const isLocked    = document.getElementById('note-locked')?.checked;
    try {
      await api.loveNotes.create({
        title:      document.getElementById('note-title')?.value,
        content,
        theme:      document.getElementById('note-theme')?.value || 'default',
        isScheduled,
        deliverAt:  isScheduled ? document.getElementById('note-deliver-at')?.value : null,
        isLocked,
        unlockAt:   isLocked   ? document.getElementById('note-unlock-at')?.value   : null,
      });
      document.querySelector('.modal-backdrop')?.remove();
      Toast.success('Love note sent! 💌');
      await this.loadNotes();
    } catch(e) {
      Toast.error('Failed to send', e.message);
      btn.disabled = false; btn.textContent = 'Send Note 💌';
    }
  }
};

/* ════════════════════════════════════════════════
   PROFILE PAGE
   ════════════════════════════════════════════════ */
Pages.profile = {
  async render(root) {
    root.innerHTML = `<div class="page-container"><div class="empty-state"><div class="spinner"></div></div></div>`;
    try {
      const [userRes, coupleRes] = await Promise.allSettled([api.users.me(), api.users.couple()]);
      const user   = userRes.status   === 'fulfilled' ? userRes.value.data   : api.getUser();
      const couple = coupleRes.status === 'fulfilled' ? coupleRes.value.data : null;

      root.innerHTML = `<div class="page-container">
        <div class="page-header">
          <div class="page-header-left"><h2>👤 Profile</h2><span class="page-subtitle">Your account & couple settings</span></div>
        </div>
        <div class="grid-2" style="gap:var(--space-6);align-items:start">
          <!-- Profile Card -->
          <div class="glass-card no-hover" style="padding:var(--space-8);text-align:center">
            <div style="position:relative;display:inline-block;margin-bottom:var(--space-5)">
              <div class="avatar avatar-xl" style="margin:auto" id="profile-avatar">
                ${user.avatarUrl ? `<img src="${user.avatarUrl}" alt="">` : (user.displayName?.charAt(0) || '?')}
              </div>
              <label style="position:absolute;bottom:0;right:0;background:var(--rose);color:white;width:28px;height:28px;border-radius:99px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.8rem" title="Change avatar">
                <input type="file" style="display:none" accept="image/*" onchange="Pages.profile.uploadAvatar(this)">📷
              </label>
            </div>
            <h2 style="margin-bottom:4px">${escapeHtml(user.displayName)}</h2>
            <div class="text-muted">@${escapeHtml(user.username)}</div>
            ${user.bio ? `<p style="margin-top:var(--space-3);font-size:0.9rem">${escapeHtml(user.bio)}</p>` : ''}
            <div style="margin-top:var(--space-5);display:flex;gap:var(--space-3);justify-content:center">
              <button class="btn btn-secondary btn-sm" onclick="Pages.profile.showEditModal()">✏️ Edit Profile</button>
              <button class="btn btn-ghost btn-sm" onclick="App.logout()">⏻ Logout</button>
            </div>
          </div>

          <!-- Couple Card -->
          <div style="display:flex;flex-direction:column;gap:var(--space-5)">
            ${couple ? `
              <div class="glass-card no-hover" style="padding:var(--space-6)">
                <h3 style="margin-bottom:var(--space-5)">💑 Couple</h3>
                <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-5)">
                  <div class="avatar avatar-lg">${couple.partnerDisplayName?.charAt(0) || '?'}</div>
                  <div>
                    <div style="font-weight:700">${escapeHtml(couple.partnerDisplayName)}</div>
                    <div class="text-muted">@${escapeHtml(couple.partnerUsername)}</div>
                  </div>
                </div>
                <div style="background:var(--bg-overlay);border-radius:var(--radius-md);padding:var(--space-4)">
                  <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px">Couple Code</div>
                  <div style="font-family:var(--font-mono);font-size:1.1rem;font-weight:700;color:var(--rose)">${couple.coupleCode}</div>
                </div>
                ${couple.anniversaryDate ? `<div style="margin-top:var(--space-4)">Anniversary: <strong>${formatDate(couple.anniversaryDate)}</strong></div>` : ''}
                <div style="margin-top:var(--space-3)" class="text-muted">Together since ${formatDate(couple.createdAt)} (${daysSince(couple.createdAt)} days)</div>
              </div>` : `
              <div class="glass-card no-hover" style="padding:var(--space-6);text-align:center">
                <div style="font-size:2.5rem;margin-bottom:var(--space-4)">💔</div>
                <h3 style="margin-bottom:var(--space-3)">Not Connected Yet</h3>
                <p class="text-muted" style="margin-bottom:var(--space-5)">Connect with your partner to unlock all features</p>
                <button class="btn btn-primary" onclick="showInviteModal()">💌 Connect Partner</button>
              </div>`}

            <!-- Account Info -->
            <div class="glass-card no-hover" style="padding:var(--space-6)">
              <h3 style="margin-bottom:var(--space-4)">Account Details</h3>
              <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                <div style="display:flex;justify-content:space-between;padding:var(--space-3) 0;border-bottom:1px solid var(--divider)">
                  <span class="text-muted">Email</span>
                  <span style="font-weight:500">${escapeHtml(user.email)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:var(--space-3) 0;border-bottom:1px solid var(--divider)">
                  <span class="text-muted">Username</span>
                  <span style="font-weight:500">@${escapeHtml(user.username)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:var(--space-3) 0">
                  <span class="text-muted">Member since</span>
                  <span style="font-weight:500">${formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    } catch(e) {
      root.innerHTML = `<div class="page-container"><div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Error loading profile</div></div></div>`;
    }
  },

  showEditModal() {
    const user = api.getUser();
    modal('✏️ Edit Profile', `
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input class="form-input" id="edit-name" value="${escapeHtml(user?.displayName || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Bio</label>
          <textarea class="form-textarea" id="edit-bio">${escapeHtml(user?.bio || '')}</textarea>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.profile.saveProfile(this)">Save</button>`);
  },

  async saveProfile(btn) {
    btn.disabled = true;
    try {
      const res = await api.users.updateMe({
        displayName: document.getElementById('edit-name')?.value,
        bio: document.getElementById('edit-bio')?.value,
      });
      api.setUser({ ...api.getUser(), ...res.data });
      document.querySelector('.modal-backdrop')?.remove();
      Toast.success('Profile updated!');
      await Pages.profile.render(document.getElementById('content'));
    } catch(e) { Toast.error('Update failed', e.message); btn.disabled = false; }
  },

  async uploadAvatar(input) {
    const file = input.files[0]; if (!file) return;
    Toast.info('Uploading avatar...');
    try {
      const res = await api.files.avatar(file);
      await api.users.updateMe({ avatarUrl: res.data.url });
      api.setUser({ ...api.getUser(), avatarUrl: res.data.url });
      const avatar = document.getElementById('profile-avatar');
      if (avatar) avatar.innerHTML = `<img src="${res.data.url}" alt="">`;
      Toast.success('Avatar updated!');
    } catch(e) { Toast.error('Upload failed', e.message); }
  }
};

/* ── Helpers ────────────────────────────────────── */
function moodEmoji(score) {
  if (score >= 4.5) return '🤩';
  if (score >= 3.5) return '😊';
  if (score >= 2.5) return '😐';
  if (score >= 1.5) return '😢';
  return '😤';
}

function daysSince(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function renderMiniMoodChart(timeline) {
  const recent = timeline.slice(-14);
  const maxScore = 5;
  return `<div class="mood-chart-bar">
    ${recent.map(m => {
      const pct = Math.round((m.moodScore / maxScore) * 100);
      return `<div class="mood-bar-item" style="height:${pct}%">
        <div class="chart-tooltip">${m.moodLabel}<br>${new Date(m.loggedDate).toLocaleDateString('en',{month:'short',day:'numeric'})}</div>
      </div>`;
    }).join('')}
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:0.7rem;color:var(--text-muted)">
    <span>${recent[0] ? new Date(recent[0].loggedDate).toLocaleDateString('en',{month:'short',day:'numeric'}) : ''}</span>
    <span>${recent[recent.length-1] ? new Date(recent[recent.length-1].loggedDate).toLocaleDateString('en',{month:'short',day:'numeric'}) : ''}</span>
  </div>`;
}

function renderCountdown(dateStr) {
  // Just a label for event cards
  return `<span class="badge badge-pink">🎉 Today</span>`;
}

function renderCountdownSmall(dateStr) {
  if (!dateStr) return '';
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return '';
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  return `<div style="display:flex;gap:var(--space-2);justify-content:center;margin-top:var(--space-3)">
    <div class="countdown-unit"><span class="countdown-num">${days}</span><span class="countdown-label">days</span></div>
    <div class="countdown-unit"><span class="countdown-num">${hrs}</span><span class="countdown-label">hrs</span></div>
  </div>`;
}

function showInviteModal() {
  modal('💌 Connect with Your Partner',
    `<div style="text-align:center">
      <div style="font-size:3rem;margin-bottom:var(--space-4)">💑</div>
      <p style="margin-bottom:var(--space-6)">Generate an invite code and share it with your partner, or enter the code they shared with you.</p>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div>
          <button class="btn btn-primary w-full" onclick="generateInviteCode()">Generate My Invite Code</button>
          <div id="invite-code-display" style="margin-top:var(--space-3);display:none">
            <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:var(--space-4);font-family:var(--font-mono);font-size:1.2rem;font-weight:700;letter-spacing:0.1em;color:var(--rose)" id="generated-code"></div>
            <p class="text-muted" style="font-size:0.8rem;margin-top:var(--space-2)">Share this code with your partner (valid 7 days)</p>
          </div>
        </div>
        <div class="divider-text">or</div>
        <div class="form-group">
          <label class="form-label">Enter Partner's Code</label>
          <input class="form-input" id="join-code" placeholder="SS12345678" style="text-align:center;font-size:1.1rem;letter-spacing:0.1em">
        </div>
        <button class="btn btn-secondary w-full" onclick="joinWithCode()">Join Couple</button>
      </div>
    </div>`);
}

async function generateInviteCode() {
  try {
    const res = await api.auth.generateInvite();
    document.getElementById('generated-code').textContent = res.data.code;
    document.getElementById('invite-code-display').style.display = 'block';
  } catch(e) { Toast.error('Failed to generate code', e.message); }
}

async function joinWithCode() {
  const code = document.getElementById('join-code')?.value?.trim();
  if (!code) { Toast.error('Enter a code'); return; }
  try {
    const res = await api.auth.joinCouple(code);
    Toast.success('Connected! 💕', 'You are now a couple on SoulSync');
    document.querySelector('.modal-backdrop')?.remove();
    // Reload app with couple info
    const coupleRes = await api.users.couple();
    App.coupleInfo = coupleRes.data;
    WS.connect(App.coupleInfo.coupleId);
    Router.navigate('#dashboard');
  } catch(e) { Toast.error('Could not join', e.message); }
}

window.Pages = Pages;
window.showInviteModal = showInviteModal;
window.generateInviteCode = generateInviteCode;
window.joinWithCode = joinWithCode;