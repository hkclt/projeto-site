(function () {
  'use strict';

  const STORAGE_KEY = 'docs-dark-mode';
  let docsData = null;
  let currentPageIndex = 0;

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuToggle = document.getElementById('menuToggle');
  const navList = document.getElementById('navList');
  const contentInner = document.getElementById('contentInner');
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  const darkToggle = document.getElementById('darkToggle');
  const docTitle = document.getElementById('docTitle');

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  function loadTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }

  darkToggle.addEventListener('click', toggleTheme);

  function renderMarkdown(md) {
    let html = md;

    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<pre><code>${escaped}</code></pre>`;
    });

    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    html = html.replace(/\|(.+)\|/g, (line) => {
      if (line.match(/^[\s\|:-]+$/)) return '';
      const cells = line.split('|').filter(c => c.trim());
      if (cells.length === 0) return '';
      const row = cells.map(c => c.trim()).join('</td><td>');
      return `<tr><td>${row}</td></tr>`;
    });

    html = html.replace(/(<tr>.*?<\/tr>\n?){2,}/g, (match) => {
      const rows = match.trim().split('\n').filter(r => r.trim());
      const thead = rows[0];
      const tbody = rows.slice(1).join('\n');
      return `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
    });

    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*\n?)+/g, (match) => {
      return `<ul>${match}</ul>`;
    });

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    html = html.replace(/^---$/gm, '<hr>');

    html = html.replace(/^(?!<[hupbcltd]|<table|<thead|<tbody|<tr)(.+)$/gm, (match) => {
      if (!match.trim()) return '';
      return `<p>${match}</p>`;
    });

    html = html.replace(/\n{2,}/g, '\n');

    return html;
  }

  function renderPage(index) {
    if (!docsData || !docsData.pages[index]) return;

    currentPageIndex = index;
    const page = docsData.pages[index];

    breadcrumbTitle.textContent = page.title;
    contentInner.innerHTML = renderMarkdown(page.content);
    contentInner.style.animation = 'none';
    requestAnimationFrame(() => {
      contentInner.style.animation = 'fadeSlideUp 300ms ease-out';
    });

    const items = navList.querySelectorAll('.nav-item');
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buildSidebar() {
    navList.innerHTML = '';

    const label = document.createElement('div');
    label.className = 'nav-section-label';
    label.textContent = 'Pages';
    navList.appendChild(label);

    docsData.pages.forEach((page, index) => {
      const btn = document.createElement('button');
      btn.className = 'nav-item';
      if (index === currentPageIndex) btn.classList.add('active');
      btn.setAttribute('data-index', index);

      const icon = document.createElement('span');
      icon.className = 'nav-icon';
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;

      btn.appendChild(icon);
      btn.appendChild(document.createTextNode(page.title));

      btn.addEventListener('click', () => renderPage(index));
      navList.appendChild(btn);
    });
  }

  function loadDocs() {
    return fetch('docs.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load docs.json');
        return res.json();
      })
      .then(data => {
        docsData = data;
        docTitle.textContent = data.title;
        buildSidebar();

        const hash = parseInt(window.location.hash.replace('#', ''), 10);
        const startIndex = !isNaN(hash) && hash >= 0 && hash < data.pages.length ? hash : 0;
        renderPage(startIndex);
      })
      .catch(err => {
        contentInner.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--color-text-muted)"><h2>Failed to load documentation</h2><p style="margin-top:8px">${err.message}</p></div>`;
      });
  }

  loadTheme();
  loadDocs();
})();
