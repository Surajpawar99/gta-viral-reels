// GTA Viral Reels Hub JavaScript
let allReels = [];
let activeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  try {
    const res = await fetch('reels.json');
    if (!res.ok) throw new Error('Could not load reels catalog');
    allReels = await res.json();
    
    updateCounters();
    renderReels(allReels);
    setupEvents();
  } catch (err) {
    console.error('Initialization error:', err);
    document.getElementById('reelsGrid').innerHTML = `
      <div class="empty-state">
        <p>⚠️ रील्स लोड करताना समस्या आली: ${err.message}</p>
      </div>
    `;
  }
}

function updateCounters() {
  const countAll = document.getElementById('count-all');
  if (countAll) countAll.textContent = allReels.length;
}

function renderReels(reels) {
  const grid = document.getElementById('reelsGrid');
  if (!grid) return;

  if (reels.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>🔍 एकही रील सापडला नाही. कृपया दुसरा शब्द शोधा.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = reels.map(reel => {
    const creatorClass = reel.creator === 'CarryMinati' ? 'creator-carry' 
                        : reel.creator === 'IShowSpeed' ? 'creator-speed' 
                        : 'creator-gta';

    return `
      <article class="reel-card" data-id="${reel.id}">
        <div class="video-wrapper">
          <video 
            src="${reel.video_url}" 
            playsinline 
            loop 
            preload="metadata"
            controls
          ></video>
          <div class="video-badges">
            <span class="creator-badge ${creatorClass}">${reel.creator}</span>
            <span class="hd-badge">1080p 60FPS</span>
          </div>
        </div>

        <div class="card-body">
          <span class="reel-number">Reel #${String(reel.number).padStart(2, '0')} • ${reel.size_mb} MB</span>
          <h2 class="reel-title">${escapeHtml(reel.title)}</h2>
          <p class="reel-hook">${escapeHtml(reel.hook)}</p>

          <div class="action-buttons">
            <a href="${reel.video_url}" download="${reel.filename}" class="btn btn-primary">
              <span>📥 Download Reel (HD)</span>
            </a>
            <button class="btn btn-secondary copy-btn" data-caption="${escapeAttr(reel.caption)}">
              <span>📋 Copy Caption & Tags</span>
            </button>
          </div>

          <details class="caption-details">
            <summary class="caption-summary">कॅप्शन & हॅशटॅग्स पहा ▾</summary>
            <div class="caption-box">${escapeHtml(reel.caption)}</div>
          </details>
        </div>
      </article>
    `;
  }).join('');

  setupCardInteractions();
}

function setupCardInteractions() {
  // Copy button handler
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-caption');
      copyToClipboard(textToCopy);
    });
  });

  // Single video playback (pause others when one plays)
  const videos = document.querySelectorAll('.video-wrapper video');
  videos.forEach(v => {
    v.addEventListener('play', () => {
      videos.forEach(other => {
        if (other !== v && !other.paused) {
          other.pause();
        }
      });
    });
  });
}

function setupEvents() {
  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      filterAndSearch(q, activeFilter);
    });
  }

  // Filter Pills
  const pills = document.querySelectorAll('.pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-filter');
      const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
      filterAndSearch(q, activeFilter);
    });
  });
}

function filterAndSearch(query, filter) {
  let filtered = allReels;

  // Apply category filter
  if (filter !== 'all') {
    filtered = filtered.filter(r => 
      r.creator.toLowerCase() === filter.toLowerCase() || 
      r.category.toLowerCase().includes(filter.toLowerCase())
    );
  }

  // Apply search query
  if (query) {
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(query) ||
      r.hook.toLowerCase().includes(query) ||
      r.caption.toLowerCase().includes(query) ||
      r.creator.toLowerCase().includes(query)
    );
  }

  renderReels(filtered);
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('✅ कॅप्शन आणि हॅशटॅग कॉपी झाले! थेट Instagram वर पेस्ट करा.');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('✅ कॅप्शन आणि हॅशटॅग कॉपी झाले!');
  } catch (err) {
    alert('कॉपी करण्यात अडचण आली, कृपया मॅन्युअली कॉपी करा.');
  }
  document.body.removeChild(textArea);
}

let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return str
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
