/**
 * RK QuizMaker - Shared Studio Engine
 * Fast Omni-Search, Bilingual Language Switcher (EN / मराठी), Mobile Responsiveness & Font Optimization
 */

(function () {
  // --- 1. LANGUAGE DICTIONARY (EN <-> MR) ---
  const I18N = {
    en: {
      nav_blog_designer: 'Blog Designer',
      nav_dashboard: 'Dashboard',
      nav_overview: 'Overview',
      nav_quizzes: 'My Quizzes',
      nav_create_quiz: 'Create Quiz',
      nav_quiz_builder: 'Quiz Builder',
      nav_bulk_import: 'Bulk Import',
      nav_embed_share: 'Embed & Share',
      nav_results_polls: 'Results & Polls',
      nav_database: 'Sheets Cloud DB',
      nav_active_sync: 'Active Sync',
      nav_visit_blog: 'Blog',
      nav_admin: 'Admin / Creator',
      top_search_placeholder: 'Search quizzes, questions, blocks...',
      top_sheets_live: 'Google Sheets: Live',
      top_new_quiz: '+ New Quiz',
      search_no_results: 'No matching quizzes or questions found',
      search_quizzes_heading: 'QUIZZES LIBRARY',
      search_questions_heading: 'QUESTIONS',
      search_tools_heading: 'STUDIO TOOLS',
      search_students_heading: 'STUDENT RESULTS'
    },
    mr: {
      nav_blog_designer: 'ब्लॉग डिझायनर',
      nav_dashboard: 'डॅशबोर्ड',
      nav_overview: 'डॅशबोर्ड सारांश',
      nav_quizzes: 'माझ्या क्विझ',
      nav_create_quiz: 'क्विझ तयार करा',
      nav_quiz_builder: 'क्विझ बिल्डर',
      nav_bulk_import: 'बल्क इम्पोर्ट',
      nav_embed_share: 'एम्बेड आणि शेअर',
      nav_results_polls: 'निकाल आणि पोल्स',
      nav_database: 'क्लाउड डेटाबेस',
      nav_active_sync: 'सक्रिय सिंक',
      nav_visit_blog: 'ब्लॉग पहा',
      nav_admin: 'प्रशासक / शिक्षक',
      top_search_placeholder: 'क्विझ, प्रश्न, निकाल शोधा...',
      top_sheets_live: 'गुगल शीट्स: लाइव्ह',
      top_new_quiz: '+ नवीन क्विझ',
      search_no_results: 'कोणतीही जुळणारी क्विझ किंवा प्रश्न सापडला नाही',
      search_quizzes_heading: 'क्विझ लायब्ररी',
      search_questions_heading: 'प्रश्न',
      search_tools_heading: 'स्टुडिओ टूल्स',
      search_students_heading: 'विद्यार्थी निकाल'
    }
  };

  let currentLang = localStorage.getItem('rk_lang') || 'en';

  window.getCurrentLanguage = function () {
    return currentLang;
  };

  window.togglePlatformLanguage = function () {
    currentLang = currentLang === 'en' ? 'mr' : 'en';
    localStorage.setItem('rk_lang', currentLang);
    applyLanguage(currentLang);
  };

  window.applyLanguage = function (lang) {
    currentLang = lang || localStorage.getItem('rk_lang') || 'en';
    const dict = I18N[currentLang] || I18N.en;

    // Update Language Button Label
    const btnLabel = document.getElementById('topLangLabel');
    if (btnLabel) {
      btnLabel.textContent = currentLang.toUpperCase();
    }

    // Update Nav items with data-path
    const pathMap = {
      'blog-designer': dict.nav_blog_designer,
      'dashboard': dict.nav_dashboard,
      'overview': dict.nav_overview,
      'quizzes': dict.nav_quizzes,
      'create-quiz': dict.nav_create_quiz,
      'quiz-builder': dict.nav_quiz_builder,
      'bulk': dict.nav_bulk_import,
      'bulk-import': dict.nav_bulk_import,
      'embed': dict.nav_embed_share,
      'embed-share': dict.nav_embed_share,
      'results': dict.nav_results_polls,
      'results-polls': dict.nav_results_polls,
      'database': dict.nav_database
    };

    document.querySelectorAll('nav a[data-path], .sidebar-nav button[data-path], [data-path]').forEach(link => {
      const path = link.getAttribute('data-path');
      if (pathMap[path]) {
        // Find text node or child span without icon
        const span = link.querySelector('span:not(.material-symbols-outlined):not([style*="font-size:10px"])');
        if (span) {
          span.textContent = pathMap[path];
        } else {
          // If plain text after icon (like in index.html button)
          const icon = link.querySelector('i, span.material-symbols-outlined');
          if (icon) {
            // Keep icon, update text
            const badge = link.querySelector('span[style*="font-size:10px"]');
            link.innerHTML = '';
            link.appendChild(icon);
            link.appendChild(document.createTextNode(' ' + pathMap[path]));
            if (badge) link.appendChild(badge);
          }
        }
      }
    });

    // Update Search Placeholder
    const searchInputs = document.querySelectorAll('input[type="search"], #globalOmniSearch');
    searchInputs.forEach(input => {
      input.placeholder = dict.top_search_placeholder;
    });

    // Update top header status pills if present
    const sheetsStatus = document.getElementById('sheetsLivePillText');
    if (sheetsStatus) sheetsStatus.textContent = dict.top_sheets_live;

    const newQuizBtn = document.getElementById('topNewQuizBtnText');
    if (newQuizBtn) newQuizBtn.textContent = dict.top_new_quiz;

    // Dispatch custom event for page-specific translations
    window.dispatchEvent(new CustomEvent('rk-lang-change', { detail: { lang: currentLang, dict: dict } }));
  };

  // --- 2. OMNI-SEARCH ENGINE ---
  window.handleOmniSearch = function (query) {
    const input = document.getElementById('globalOmniSearch');
    const clearBtn = document.getElementById('clearOmniSearchBtn');
    const resultsBox = document.getElementById('omniSearchResults');

    if (!resultsBox) return;

    query = (query || '').trim().toLowerCase();

    if (clearBtn) {
      if (query.length > 0) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
    }

    if (!query || query.length < 1) {
      resultsBox.classList.add('hidden');
      resultsBox.innerHTML = '';
      return;
    }

    const dict = I18N[currentLang] || I18N.en;

    // Fetch data from storage
    let quizzes = [];
    try {
      quizzes = JSON.parse(localStorage.getItem('rk_quizzes_v2') || '[]');
    } catch (e) { quizzes = []; }

    let submissions = [];
    try {
      submissions = JSON.parse(localStorage.getItem('rk_submissions_v2') || '[]');
    } catch (e) { submissions = []; }

    // Tools shortcuts
    const studioTools = [
      { name: 'Quiz Builder Studio', desc: 'Create MCQ, Checkbox, Polls', url: 'quiz-builder.html', icon: 'quiz' },
      { name: 'Blog Post Designer', desc: 'Visual Gutenberg-style editor', url: 'blog-designer.html', icon: 'design_services' },
      { name: 'Bulk Import Studio', desc: 'Import from Google Sheets or CSV', url: 'bulk-import.html', icon: 'upload_file' },
      { name: 'Embed & Share Center', desc: 'Blogger OnClick popup buttons', url: 'embed-share.html', icon: 'share' },
      { name: 'Results & Analytics Hub', desc: 'Student marks, leaderboard & polls', url: 'results-polls.html', icon: 'analytics' },
      { name: 'Google Sheets Cloud DB', desc: '100% Free Lifetime DB settings', url: 'results-polls.html#database', icon: 'table_chart' }
    ];

    const matchingTools = studioTools.filter(t => t.name.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query));

    // Matching Quizzes
    const matchingQuizzes = quizzes.filter(q =>
      (q.title && q.title.toLowerCase().includes(query)) ||
      (q.category && q.category.toLowerCase().includes(query)) ||
      (q.description && q.description.toLowerCase().includes(query))
    );

    // Matching Questions
    const matchingQuestions = [];
    quizzes.forEach(q => {
      (q.questions || []).forEach(qn => {
        if (qn.question && qn.question.toLowerCase().includes(query)) {
          matchingQuestions.push({
            question: qn.question,
            quizTitle: q.title,
            quizId: q.id,
            type: qn.type
          });
        }
      });
    });

    // Matching Students
    const matchingSubs = submissions.filter(s =>
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.quizTitle && s.quizTitle.toLowerCase().includes(query))
    );

    let html = '';

    // Render Tools
    if (matchingTools.length > 0) {
      html += `<div class="px-2.5 py-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">${dict.search_tools_heading}</div>`;
      matchingTools.forEach(t => {
        html += `
          <a href="${t.url}" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors text-text-primary group">
            <span class="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">${t.icon}</span>
            <div class="min-w-0 flex-1">
              <div class="font-title-sm text-[13px] font-semibold text-text-primary leading-tight">${escapeHtml(t.name)}</div>
              <div class="font-body-sm text-[11px] text-text-muted truncate">${escapeHtml(t.desc)}</div>
            </div>
            <span class="material-symbols-outlined text-[16px] text-text-muted">chevron_right</span>
          </a>
        `;
      });
    }

    // Render Quizzes
    if (matchingQuizzes.length > 0) {
      html += `<div class="px-2.5 py-1 mt-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">${dict.search_quizzes_heading}</div>`;
      matchingQuizzes.slice(0, 4).forEach(q => {
        html += `
          <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors text-text-primary">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="material-symbols-outlined text-[18px] text-primary">assignment</span>
              <div class="min-w-0">
                <div class="font-title-sm text-[13px] font-semibold text-text-primary truncate">${escapeHtml(q.title)}</div>
                <div class="font-body-sm text-[11px] text-text-muted">${(q.questions || []).length} Questions • ${escapeHtml(q.category || 'Exam')}</div>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <a href="quiz-builder.html?quizId=${q.id}" class="p-1 rounded hover:bg-surface-container text-primary" title="Edit Quiz"><span class="material-symbols-outlined text-[16px]">edit</span></a>
              <a href="embed-share.html?quizId=${q.id}" class="p-1 rounded hover:bg-surface-container text-secondary" title="Embed"><span class="material-symbols-outlined text-[16px]">code</span></a>
            </div>
          </div>
        `;
      });
    }

    // Render Questions
    if (matchingQuestions.length > 0) {
      html += `<div class="px-2.5 py-1 mt-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">${dict.search_questions_heading}</div>`;
      matchingQuestions.slice(0, 3).forEach(qn => {
        html += `
          <a href="quiz-builder.html?quizId=${qn.quizId}" class="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors text-text-primary">
            <span class="material-symbols-outlined text-[16px] text-status-warning mt-0.5">help</span>
            <div class="min-w-0 flex-1">
              <div class="font-body-sm text-[12.5px] font-medium text-text-primary leading-snug truncate">${escapeHtml(qn.question)}</div>
              <div class="font-label-sm text-[10.5px] text-text-muted">${escapeHtml(qn.quizTitle)} (${qn.type})</div>
            </div>
          </a>
        `;
      });
    }

    // Render Students
    if (matchingSubs.length > 0) {
      html += `<div class="px-2.5 py-1 mt-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">${dict.search_students_heading}</div>`;
      matchingSubs.slice(0, 3).forEach(s => {
        html += `
          <a href="results-polls.html" class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors text-text-primary">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">${(s.name || 'S')[0]}</span>
              <div class="min-w-0">
                <div class="font-title-sm text-[12px] font-semibold text-text-primary truncate">${escapeHtml(s.name)}</div>
                <div class="font-body-sm text-[10px] text-text-muted truncate">${escapeHtml(s.quizTitle || '')}</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${s.passed ? 'bg-emerald-50 text-secondary' : 'bg-rose-50 text-status-danger'}">${s.percent || 0}%</span>
          </a>
        `;
      });
    }

    if (!html) {
      html = `
        <div class="p-4 text-center text-text-muted font-body-sm text-[13px]">
          <span class="material-symbols-outlined text-[24px] text-text-muted mb-1">search_off</span>
          <div>${dict.search_no_results}</div>
        </div>
      `;
    }

    resultsBox.innerHTML = html;
    resultsBox.classList.remove('hidden');
  };

  window.clearOmniSearch = function () {
    const input = document.getElementById('globalOmniSearch');
    if (input) input.value = '';
    const resultsBox = document.getElementById('omniSearchResults');
    if (resultsBox) {
      resultsBox.classList.add('hidden');
      resultsBox.innerHTML = '';
    }
    const clearBtn = document.getElementById('clearOmniSearchBtn');
    if (clearBtn) clearBtn.classList.add('hidden');
  };

  // Close search dropdown on click outside or Escape
  document.addEventListener('click', function (e) {
    const searchBox = document.querySelector('.omni-search-wrapper');
    const resultsBox = document.getElementById('omniSearchResults');
    if (!resultsBox) return;
    if (!e.target.closest('.omni-search-wrapper')) {
      resultsBox.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.clearOmniSearch();
    }
  });

  // --- 3. MOBILE SIDEBAR DRAWER TOGGLE ---
  window.toggleMobileSidebar = function () {
    const sidebar = document.querySelector('aside');
    let backdrop = document.getElementById('sidebarBackdrop');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'sidebarBackdrop';
      backdrop.className = 'fixed inset-0 bg-black/40 backdrop-blur-xs z-40 hidden lg:hidden transition-opacity';
      backdrop.onclick = window.toggleMobileSidebar;
      document.body.appendChild(backdrop);
    }

    if (!sidebar) return;

    if (sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
    } else {
      sidebar.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // --- 4. AUTO INIT ON LOAD ---
  window.addEventListener('DOMContentLoaded', function () {
    applyLanguage(currentLang);

    // Setup mobile drawer default state
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      sidebar.classList.add('transition-transform', 'duration-300', 'ease-in-out');
      if (window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
      }
    }

    window.addEventListener('resize', function () {
      if (sidebar) {
        if (window.innerWidth >= 1024) {
          sidebar.classList.remove('-translate-x-full');
          const backdrop = document.getElementById('sidebarBackdrop');
          if (backdrop) backdrop.classList.add('hidden');
        } else if (!sidebar.classList.contains('-translate-x-full')) {
          sidebar.classList.add('-translate-x-full');
        }
      }
    });
  });
})();
