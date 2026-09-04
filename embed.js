/**
 * RK_QuizMaker Embed Widget & Standalone Player v2.1.0
 * Enables 1-click popup and inline quizzes on Blogger, WordPress, and any website.
 * Works 100% standalone (zero server required) AND supports Google Sheets/Apps Script sync.
 * 
 * Author: Ravindra Khillare
 * Website: https://timepasstimewithravi.blogspot.com/
 * GitHub: https://github.com/RaviKhillare/RK_QuizMaker
 */

(function (window, document) {
  'use strict';

  // Find current script tag to detect configured server URL
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var rawServerUrl = currentScript && currentScript.getAttribute('data-server-url')
    ? currentScript.getAttribute('data-server-url').trim()
    : '';

  var isSampleUrl = !rawServerUrl ||
    rawServerUrl.indexOf('SAMPLE_') > -1 ||
    rawServerUrl.indexOf('AKfycbz_SAMPLE') > -1;

  var configuredServerUrl = isSampleUrl ? '' : rawServerUrl;

  // Built-in Default Quizzes
  var DEFAULT_BUILTIN_QUIZZES = {
    'quiz_maha_gk': {
      id: 'quiz_maha_gk',
      title: 'Maharashtra General Knowledge & History 2026',
      description: 'Test your knowledge on Maharashtra geography, culture, historical forts, and current affairs.',
      timeLimitMinutes: 10,
      passingScore: 50,
      allowRetake: true,
      showAnswers: true,
      shuffleQuestions: false,
      questions: [
        {
          questionId: 'q1',
          type: 'MCQ',
          question: 'What is the capital city of Maharashtra?',
          options: ['Pune', 'Mumbai', 'Nagpur', 'Nashik'],
          correctAnswer: 'Mumbai',
          points: 1,
          explanation: 'Mumbai is the financial and state capital of Maharashtra.'
        },
        {
          questionId: 'q2',
          type: 'MCQ',
          question: 'Which of the following forts was the birthplace of Chhatrapati Shivaji Maharaj?',
          options: ['Raigad Fort', 'Shivneri Fort', 'Sinhagad Fort', 'Torna Fort'],
          correctAnswer: 'Shivneri Fort',
          points: 1,
          explanation: 'Chhatrapati Shivaji Maharaj was born at Shivneri Fort near Junnar, Pune district.'
        },
        {
          questionId: 'q3',
          type: 'CHECKBOX',
          question: 'Which of these rivers flow through Maharashtra? (Select all that apply)',
          options: ['Godavari', 'Krishna', 'Ganga', 'Tapi'],
          correctAnswer: 'Godavari, Krishna, Tapi',
          points: 2,
          explanation: 'Godavari, Krishna, and Tapi flow through Maharashtra, while Ganga flows across North India.'
        },
        {
          questionId: 'q4',
          type: 'SHORT_ANSWER',
          question: 'Which city in Maharashtra is known as the "Wine Capital of India"?',
          options: [],
          correctAnswer: 'Nashik',
          points: 1,
          explanation: 'Nashik produces over half of India’s wine and is renowned as the Wine Capital.'
        },
        {
          questionId: 'q5',
          type: 'POLL',
          question: 'Which mode of study do you find most effective?',
          options: ['Online Quizzes & Videos', 'Printed Books', 'Group Discussions', 'Hybrid (Both)'],
          correctAnswer: '',
          points: 0,
          explanation: 'Thank you for your valuable feedback!'
        }
      ]
    },
    'quiz_web_dev': {
      id: 'quiz_web_dev',
      title: 'Modern Web Development Essentials',
      description: 'Comprehensive quiz covering HTML5, CSS3, JavaScript, and Web APIs.',
      timeLimitMinutes: 15,
      passingScore: 60,
      allowRetake: true,
      showAnswers: true,
      shuffleQuestions: false,
      questions: [
        {
          questionId: 'qw1',
          type: 'MCQ',
          question: 'Which HTML tag is used to link an external JavaScript file?',
          options: ['<js>', '<javascript>', '<script>', '<link>'],
          correctAnswer: '<script>',
          points: 1,
          explanation: 'The <script src="..."> tag is standard for loading JavaScript.'
        },
        {
          questionId: 'qw2',
          type: 'CHECKBOX',
          question: 'Which of the following are valid CSS display properties?',
          options: ['flex', 'grid', 'float-left', 'inline-block'],
          correctAnswer: 'flex, grid, inline-block',
          points: 2,
          explanation: 'flex, grid, and inline-block are valid CSS display properties.'
        },
        {
          questionId: 'qw3',
          type: 'SHORT_ANSWER',
          question: 'What does CSS stand for?',
          options: [],
          correctAnswer: 'Cascading Style Sheets',
          points: 1,
          explanation: 'CSS stands for Cascading Style Sheets.'
        },
        {
          questionId: 'qw4',
          type: 'POLL',
          question: 'Which JavaScript frontend framework do you prefer?',
          options: ['React', 'Vue.js', 'Angular', 'Vanilla JS'],
          correctAnswer: '',
          points: 0,
          explanation: 'Thank you for sharing your preference!'
        }
      ]
    }
  };

  // State
  var quizzesRegistry = {};
  for (var k in DEFAULT_BUILTIN_QUIZZES) {
    quizzesRegistry[k] = DEFAULT_BUILTIN_QUIZZES[k];
  }

  var activeQuiz = null;
  var userAnswers = {};
  var pollVotes = {};
  var timerInterval = null;
  var timeLeftSeconds = 0;
  var isTimerEnabled = true;

  var RKQuiz = {
    serverUrl: configuredServerUrl,
    quizzes: quizzesRegistry,

    /**
     * Register a quiz dynamically from the host page/blog
     * @param {object} quizObj 
     */
    register: function (quizObj) {
      if (quizObj && quizObj.id) {
        this.quizzes[quizObj.id] = quizObj;
        // Refresh any matching scene cards on the page
        this.init();
      }
    },

    /**
     * Set cloud server URL
     */
    setServerUrl: function (url) {
      if (url && url.indexOf('SAMPLE_') === -1) {
        this.serverUrl = url.trim();
      }
    },

    /**
     * Open quiz in a clean, responsive modal popup
     * @param {string|object} quizOrId 
     * @param {object} options 
     */
    open: function (quizOrId, options) {
      injectStyles();
      options = options || {};

      var quiz = null;
      if (typeof quizOrId === 'object' && quizOrId !== null) {
        quiz = quizOrId;
        if (quiz.id) this.quizzes[quiz.id] = quiz;
      } else if (typeof quizOrId === 'string') {
        quiz = this.quizzes[quizOrId] || null;
      }

      var server = options.serverUrl || this.serverUrl;
      var hasRealServer = server && server.indexOf('http') === 0 && server.indexOf('SAMPLE_') === -1;

      var modal = getOrCreateModal();

      if (quiz) {
        renderNativePlayer(quiz, modal);
      } else if (hasRealServer && typeof quizOrId === 'string') {
        renderIframePlayer(quizOrId, server, modal);
      } else {
        renderNotFoundError(quizOrId, modal);
      }

      // Display modal
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      setTimeout(function () {
        modal.classList.add('rk-modal-active');
      }, 10);
    },

    /**
     * Close the modal popup unconditionally
     */
    close: function () {
      var modal = document.getElementById('rk-quiz-modal');
      if (modal) {
        modal.classList.remove('rk-modal-active');
        setTimeout(function () {
          modal.style.display = 'none';
          document.body.style.overflow = '';
          if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
          }
        }, 250);
      }
    },

    /**
     * Initialize inline embeds & auto-enhance standalone buttons with Quiz Scene cards
     */
    init: function () {
      injectStyles();

      // 1. Auto-decorate standalone buttons into Quiz Scene Cards
      autoEnhanceStandaloneButtons();

      // 2. Render explicitly marked quiz scene containers [data-rk-quiz-card]
      var cardContainers = document.querySelectorAll('[data-rk-quiz-card]');
      for (var j = 0; j < cardContainers.length; j++) {
        var cardBox = cardContainers[j];
        var qId = cardBox.getAttribute('data-rk-quiz-card');
        if (qId && !cardBox.hasAttribute('data-rk-initialized')) {
          cardBox.setAttribute('data-rk-initialized', 'true');
          var qObj = this.quizzes[qId];
          if (qObj) {
            cardBox.innerHTML = generateSceneCardHtml(qObj);
          }
        }
      }

      // 3. Render inline embeds [data-rk-quiz]
      var inlineContainers = document.querySelectorAll('[data-rk-quiz]');
      for (var i = 0; i < inlineContainers.length; i++) {
        var container = inlineContainers[i];
        var quizId = container.getAttribute('data-rk-quiz');
        if (quizId && !container.hasAttribute('data-rk-initialized')) {
          container.setAttribute('data-rk-initialized', 'true');
          var q = this.quizzes[quizId];
          if (q) {
            renderInlinePlayer(q, container);
          }
        }
      }
    }
  };

  /**
   * Generates rich HTML for the Quiz Scene Teaser Card
   */
  function generateSceneCardHtml(quiz) {
    var qCount = (quiz.questions || []).length;
    var timeText = quiz.timeLimitMinutes > 0 ? (quiz.timeLimitMinutes + ' Mins (वेळ मर्यादा)') : 'Untimed (वेळ मर्यादा नाही)';
    var passScore = (quiz.passingScore || 50) + '% Pass';

    return [
      '<div class="rk-quiz-card" onclick="RKQuiz.open(\'' + quiz.id + '\')">',
      '  <div class="rk-card-badge-row">',
      '    <span class="rk-card-pill"><i class="fas fa-bolt"></i> Interactive Quiz</span>',
      '    <span class="rk-card-chip"><i class="fas fa-question-circle"></i> ' + qCount + ' Questions</span>',
      '    <span class="rk-card-chip"><i class="fas fa-stopwatch"></i> ' + timeText + '</span>',
      '    <span class="rk-card-chip"><i class="fas fa-award"></i> ' + passScore + '</span>',
      '  </div>',
      '  <h3 class="rk-card-title">' + escapeHtml(quiz.title) + '</h3>',
      (quiz.description ? '  <p class="rk-card-desc">' + escapeHtml(quiz.description) + '</p>' : ''),
      '  <div class="rk-card-footer">',
      '    <button type="button" class="rk-quiz-btn" onclick="event.stopPropagation(); RKQuiz.open(\'' + quiz.id + '\')">',
      '      🎯 Take Quiz / चाचणी सुरू करा',
      '    </button>',
      '    <span class="rk-card-cta-hint"><i class="fas fa-mouse-pointer"></i> क्लिक करून चाचणी सुरू करा</span>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  /**
   * If a blog has a simple button like <button class="rk-quiz-btn" onclick="RKQuiz.open('quiz_maha_gk')">,
   * this automatically builds the Quiz Scene above it!
   */
  function autoEnhanceStandaloneButtons() {
    var buttons = document.querySelectorAll('button.rk-quiz-btn, a.rk-quiz-btn');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];

      // Check if already decorated or inside an existing rk-quiz-card
      if (btn.closest('.rk-quiz-card') || btn.getAttribute('data-rk-decorated') === 'true') {
        continue;
      }

      // Try to determine quiz ID from onclick attribute or data-quiz-id
      var qId = btn.getAttribute('data-quiz-id') || '';
      if (!qId) {
        var onclickStr = btn.getAttribute('onclick') || '';
        var match = onclickStr.match(/RKQuiz\.open\(['"]([^'"]+)['"]\)/);
        if (match && match[1]) {
          qId = match[1];
        }
      }

      if (qId && RKQuiz.quizzes[qId]) {
        btn.setAttribute('data-rk-decorated', 'true');
        var qObj = RKQuiz.quizzes[qId];

        // Create scene card wrapper and replace/wrap the button
        var sceneWrapper = document.createElement('div');
        sceneWrapper.innerHTML = generateSceneCardHtml(qObj);
        var sceneCard = sceneWrapper.firstElementChild;

        btn.parentNode.insertBefore(sceneCard, btn);
        btn.style.display = 'none'; // Hide lone button, since scene card has the button inside it
      }
    }
  }

  function getOrCreateModal() {
    var modal = document.getElementById('rk-quiz-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'rk-quiz-modal';
      modal.className = 'rk-modal-overlay';
      // NOTE: Backdrop does NOT have onclick="RKQuiz.close()" so clicking outside will NOT close the quiz!
      modal.innerHTML = [
        '<div class="rk-modal-backdrop"></div>',
        '<div class="rk-modal-dialog">',
        '  <button type="button" class="rk-modal-close" onclick="window.RKQuizInternal.confirmClose()" aria-label="Close Quiz">&times;</button>',
        '  <div class="rk-modal-body" id="rk-modal-body-content"></div>',
        '</div>'
      ].join('\n');
      document.body.appendChild(modal);
    }
    return modal;
  }

  // ==========================================================================
  // NATIVE STANDALONE PLAYER RENDERING (ZERO BACKEND DEPENDENCY)
  // ==========================================================================
  function renderNativePlayer(quiz, modal) {
    activeQuiz = quiz;
    userAnswers = {};
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    var bodyContent = document.getElementById('rk-modal-body-content');
    if (!bodyContent) return;

    var questions = (quiz.questions || []).slice();
    if (quiz.shuffleQuestions) {
      questions = shuffleArray(questions);
    }

    var totalPoints = 0;
    questions.forEach(function (q) {
      if (q.type !== 'POLL') totalPoints += (Number(q.points) || 1);
    });

    // Determine initial timer state
    var hasTimeLimit = Number(quiz.timeLimitMinutes) > 0;
    isTimerEnabled = hasTimeLimit;
    if (hasTimeLimit) {
      timeLeftSeconds = Number(quiz.timeLimitMinutes) * 60;
    } else {
      timeLeftSeconds = 0;
    }

    // Timer Mode Controller HTML
    var timerControllerHtml = '';
    if (hasTimeLimit) {
      timerControllerHtml = [
        '<div class="rk-timer-control-box">',
        '  <div class="rk-mode-switch">',
        '    <button type="button" class="rk-mode-chip ' + (isTimerEnabled ? 'active' : '') + '" id="rk-btn-mode-timed" onclick="window.RKQuizInternal.setTimerMode(true)">',
        '      ⏱️ Timed (' + quiz.timeLimitMinutes + 'm)',
        '    </button>',
        '    <button type="button" class="rk-mode-chip ' + (!isTimerEnabled ? 'active' : '') + '" id="rk-btn-mode-untimed" onclick="window.RKQuizInternal.setTimerMode(false)">',
        '      ⏳ Untimed (वेळ मर्यादा नाही)',
        '    </button>',
        '  </div>',
        '  <div class="rk-timer-badge" id="rk-live-timer"><i class="fas fa-stopwatch"></i> ' + formatTimer(timeLeftSeconds) + '</div>',
        '</div>'
      ].join('\n');
    } else {
      timerControllerHtml = '<div class="rk-meta-chip"><i class="fas fa-infinity"></i> Untimed (वेळ मर्यादा नाही)</div>';
    }

    var html = [
      '<div class="rk-player-wrapper">',
      '  <div class="rk-player-header">',
      '    <div class="rk-header-top">',
      '      <h2>' + escapeHtml(quiz.title) + '</h2>',
      '      ' + timerControllerHtml,
      '    </div>',
      (quiz.description ? '    <p class="rk-header-desc">' + escapeHtml(quiz.description) + '</p>' : ''),
      '    <div class="rk-meta-row">',
      '      <span class="rk-meta-chip"><i class="fas fa-question-circle"></i> ' + questions.length + ' Questions</span>',
      '      <span class="rk-meta-chip"><i class="fas fa-award"></i> ' + totalPoints + ' Total Points</span>',
      '      <span class="rk-meta-chip"><i class="fas fa-percentage"></i> Pass: ' + (quiz.passingScore || 50) + '%</span>',
      '    </div>',
      '    <div class="rk-progress-container">',
      '      <div class="rk-progress-bar" id="rk-quiz-progress" style="width: 0%"></div>',
      '    </div>',
      '  </div>',
      '  <div class="rk-player-body">',
      '    <div class="rk-user-card">',
      '      <div class="rk-user-title"><i class="fas fa-user-edit"></i> Participant Details</div>',
      '      <div class="rk-user-inputs">',
      '        <input type="text" id="rk-player-name" class="rk-input" placeholder="Your Name" value="Guest Learner">',
      '        <input type="email" id="rk-player-email" class="rk-input" placeholder="Your Email (Optional)">',
      '      </div>',
      '    </div>',
      '    <div id="rk-questions-list">'
    ];

    questions.forEach(function (q, idx) {
      var typeLabel = q.type.replace('_', ' ');
      var ptsLabel = q.type === 'POLL' ? 'Opinion Poll' : ((q.points || 1) + ' Point' + ((q.points || 1) > 1 ? 's' : ''));

      html.push('      <div class="rk-q-card" data-qid="' + q.questionId + '">');
      html.push('        <div class="rk-q-header">');
      html.push('          <span class="rk-q-badge">Q' + (idx + 1) + ' • ' + typeLabel + '</span>');
      html.push('          <span class="rk-q-pts">' + ptsLabel + '</span>');
      html.push('        </div>');
      html.push('        <div class="rk-q-text">' + escapeHtml(q.question) + '</div>');

      if (q.type === 'MCQ') {
        html.push('        <div class="rk-options-group">');
        (q.options || []).forEach(function (opt) {
          html.push('          <div class="rk-opt-item" onclick="window.RKQuizInternal.selectMCQ(\'' + q.questionId + '\', \'' + escapeQuotes(opt) + '\', this)">');
          html.push('            <i class="far fa-circle rk-opt-icon"></i>');
          html.push('            <span class="rk-opt-label">' + escapeHtml(opt) + '</span>');
          html.push('          </div>');
        });
        html.push('        </div>');
      } else if (q.type === 'CHECKBOX') {
        html.push('        <div class="rk-options-group">');
        (q.options || []).forEach(function (opt) {
          html.push('          <div class="rk-opt-item" onclick="window.RKQuizInternal.selectCheckbox(\'' + q.questionId + '\', \'' + escapeQuotes(opt) + '\', this)">');
          html.push('            <i class="far fa-square rk-opt-icon"></i>');
          html.push('            <span class="rk-opt-label">' + escapeHtml(opt) + '</span>');
          html.push('          </div>');
        });
        html.push('        </div>');
      } else if (q.type === 'SHORT_ANSWER') {
        html.push('        <div class="rk-text-answer">');
        html.push('          <input type="text" class="rk-input" placeholder="Type your short answer..." oninput="window.RKQuizInternal.recordText(\'' + q.questionId + '\', this.value)">');
        html.push('        </div>');
      } else if (q.type === 'LONG_ANSWER') {
        html.push('        <div class="rk-text-answer">');
        html.push('          <textarea class="rk-input" rows="3" placeholder="Write your detailed answer..." oninput="window.RKQuizInternal.recordText(\'' + q.questionId + '\', this.value)"></textarea>');
        html.push('        </div>');
      } else if (q.type === 'POLL') {
        html.push('        <div class="rk-poll-group" id="rk-poll-group-' + q.questionId + '">');
        (q.options || []).forEach(function (opt) {
          var sId = sanitizeId(opt);
          html.push('          <div class="rk-poll-item" id="rk-pbar-' + q.questionId + '-' + sId + '" onclick="window.RKQuizInternal.votePoll(\'' + q.questionId + '\', \'' + escapeQuotes(opt) + '\')">');
          html.push('            <div class="rk-poll-fill" style="width: 0%"></div>');
          html.push('            <div class="rk-poll-text">');
          html.push('              <span>' + escapeHtml(opt) + '</span>');
          html.push('              <span class="rk-poll-pct">0%</span>');
          html.push('            </div>');
          html.push('          </div>');
        });
        html.push('        </div>');
      }

      html.push('      </div>');
    });

    html.push('    </div>'); // end rk-questions-list

    // Action button & Explicit Close Button at end
    html.push('    <div class="rk-submit-wrap">');
    html.push('      <button type="button" class="rk-submit-btn" id="rk-btn-submit" onclick="window.RKQuizInternal.submit()">');
    html.push('        Submit Quiz & View Results <i class="fas fa-arrow-right"></i>');
    html.push('      </button>');
    html.push('      <button type="button" class="rk-close-bottom-btn" onclick="window.RKQuizInternal.confirmClose()">');
    html.push('        <i class="fas fa-times-circle"></i> Exit / Close Quiz (क्विझ बंद करा)');
    html.push('      </button>');
    html.push('    </div>');

    // Result Card (hidden by default)
    html.push('    <div id="rk-result-card" class="rk-result-card" style="display:none;"></div>');
    html.push('  </div>'); // end rk-player-body
    html.push('</div>'); // end rk-player-wrapper

    bodyContent.innerHTML = html.join('\n');

    // Start timer if applicable
    if (isTimerEnabled && timeLeftSeconds > 0) {
      startTimer();
    }
  }

  function renderInlinePlayer(quiz, container) {
    var wrapper = document.createElement('div');
    wrapper.id = 'rk-inline-' + quiz.id;
    wrapper.style.cssText = 'width:100%; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.08); background:#ffffff;';
    container.innerHTML = '';
    container.appendChild(wrapper);

    var dummyModal = {
      querySelector: function (s) { return wrapper.querySelector(s); }
    };
    var bodyWrap = document.createElement('div');
    bodyWrap.id = 'rk-modal-body-content';
    wrapper.appendChild(bodyWrap);
    renderNativePlayer(quiz, dummyModal);
  }

  function renderIframePlayer(quizId, serverUrl, modal) {
    var bodyContent = document.getElementById('rk-modal-body-content');
    if (!bodyContent) return;
    var quizUrl = serverUrl + (serverUrl.indexOf('?') > -1 ? '&' : '?') + 'quizId=' + encodeURIComponent(quizId) + '&embed=1';
    bodyContent.innerHTML = '<iframe src="' + quizUrl + '" width="100%" height="100%" style="border:none; width:100%; height:85vh; border-radius:12px;" allow="autoplay; fullscreen" allowfullscreen></iframe>';
  }

  function renderNotFoundError(quizId, modal) {
    var bodyContent = document.getElementById('rk-modal-body-content');
    if (!bodyContent) return;
    bodyContent.innerHTML = [
      '<div style="padding: 40px 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">',
      '  <div style="font-size: 52px; margin-bottom: 16px;">⚠️</div>',
      '  <h2 style="font-size: 22px; color: #1e293b; margin-bottom: 12px; font-weight: 700;">Quiz Not Found</h2>',
      '  <p style="color: #64748b; font-size: 15px; max-width: 500px; margin: 0 auto 24px; line-height: 1.6;">',
      '    Could not load quiz: <code>' + escapeHtml(quizId || 'Unknown') + '</code>.<br>',
      '    If this is a newly created custom quiz, please ensure you have pasted the full embed snippet containing <code>RKQuiz.register(...)</code> on your blog post.',
      '  </p>',
      '  <button type="button" class="rk-quiz-btn" onclick="RKQuiz.close()">Close</button>',
      '</div>'
    ].join('\n');
  }

  // ==========================================================================
  // QUIZ LOGIC & EVENT HANDLERS
  // ==========================================================================
  window.RKQuizInternal = {
    /**
     * Toggles between Timed and Untimed (Practice) modes
     */
    setTimerMode: function (timed) {
      isTimerEnabled = timed;
      var btnTimed = document.getElementById('rk-btn-mode-timed');
      var btnUntimed = document.getElementById('rk-btn-mode-untimed');
      var timerEl = document.getElementById('rk-live-timer');

      if (btnTimed) btnTimed.classList.toggle('active', timed);
      if (btnUntimed) btnUntimed.classList.toggle('active', !timed);

      if (timed) {
        if (!timerInterval && timeLeftSeconds > 0) {
          startTimer();
        }
        if (timerEl) timerEl.innerHTML = '<i class="fas fa-stopwatch"></i> ' + formatTimer(timeLeftSeconds);
      } else {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        if (timerEl) timerEl.innerHTML = '<i class="fas fa-infinity"></i> Untimed Mode';
      }
    },

    /**
     * Confirms before exiting to prevent accidental answer loss
     */
    confirmClose: function () {
      var answeredCount = 0;
      for (var k in userAnswers) {
        if (userAnswers[k] !== undefined && userAnswers[k] !== null && userAnswers[k] !== '') {
          answeredCount++;
        }
      }

      if (answeredCount > 0) {
        if (confirm('Are you sure you want to exit the quiz? Any answered questions will be lost. (तुम्हाला खरोखर चाचणी बंद करायची आहे का?)')) {
          RKQuiz.close();
        }
      } else {
        RKQuiz.close();
      }
    },

    selectMCQ: function (qId, optVal, element) {
      userAnswers[qId] = optVal;
      var parent = element.parentElement;
      var items = parent.querySelectorAll('.rk-opt-item');
      for (var i = 0; i < items.length; i++) {
        items[i].classList.remove('selected');
        var icon = items[i].querySelector('.rk-opt-icon');
        if (icon) { icon.className = 'far fa-circle rk-opt-icon'; }
      }
      element.classList.add('selected');
      var selIcon = element.querySelector('.rk-opt-icon');
      if (selIcon) { selIcon.className = 'fas fa-check-circle rk-opt-icon'; }
      updateProgressBar();
    },

    selectCheckbox: function (qId, optVal, element) {
      if (!Array.isArray(userAnswers[qId])) userAnswers[qId] = [];
      var idx = userAnswers[qId].indexOf(optVal);
      var icon = element.querySelector('.rk-opt-icon');

      if (idx === -1) {
        userAnswers[qId].push(optVal);
        element.classList.add('selected');
        if (icon) icon.className = 'fas fa-check-square rk-opt-icon';
      } else {
        userAnswers[qId].splice(idx, 1);
        element.classList.remove('selected');
        if (icon) icon.className = 'far fa-square rk-opt-icon';
      }
      updateProgressBar();
    },

    recordText: function (qId, val) {
      userAnswers[qId] = val.trim();
      updateProgressBar();
    },

    votePoll: function (qId, optVal) {
      userAnswers[qId] = optVal;
      if (!pollVotes[qId]) pollVotes[qId] = {};
      pollVotes[qId][optVal] = (pollVotes[qId][optVal] || 0) + 1;

      var total = 0;
      for (var k in pollVotes[qId]) total += pollVotes[qId][k];

      var group = document.getElementById('rk-poll-group-' + qId);
      if (group) {
        var items = group.querySelectorAll('.rk-poll-item');
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          item.classList.add('voted');
        }
      }

      for (var opt in pollVotes[qId]) {
        var sId = sanitizeId(opt);
        var el = document.getElementById('rk-pbar-' + qId + '-' + sId);
        if (el) {
          var count = pollVotes[qId][opt];
          var pct = Math.round((count / total) * 100);
          var fill = el.querySelector('.rk-poll-fill');
          var pctText = el.querySelector('.rk-poll-pct');
          if (fill) fill.style.width = pct + '%';
          if (pctText) pctText.textContent = pct + '%';
        }
      }

      updateProgressBar();
    },

    submit: function () {
      if (!activeQuiz) return;

      var nameInput = document.getElementById('rk-player-name');
      var name = (nameInput ? nameInput.value.trim() : '') || 'Anonymous';
      var emailInput = document.getElementById('rk-player-email');
      var email = (emailInput ? emailInput.value.trim() : '');

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      var totalPoints = 0;
      var earnedPoints = 0;
      var reviewItems = [];

      (activeQuiz.questions || []).forEach(function (q) {
        if (q.type === 'POLL') {
          reviewItems.push({
            question: q.question,
            type: q.type,
            userAnswer: userAnswers[q.questionId] || '(No vote)',
            isCorrect: null,
            points: 0,
            explanation: q.explanation
          });
          return;
        }

        var pts = Number(q.points) || 1;
        totalPoints += pts;
        var userAns = userAnswers[q.questionId];
        var isCorrect = false;

        if (q.type === 'MCQ') {
          isCorrect = userAns && String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        } else if (q.type === 'CHECKBOX') {
          var correctList = (q.correctAnswer || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
          var userList = (userAns || []).map(function (s) { return s.trim().toLowerCase(); });
          isCorrect = correctList.length > 0 &&
            correctList.length === userList.length &&
            correctList.every(function (val) { return userList.indexOf(val) > -1; });
        } else if (q.type === 'SHORT_ANSWER') {
          isCorrect = userAns && String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        } else if (q.type === 'LONG_ANSWER') {
          isCorrect = userAns && String(userAns).trim().length > 10;
        }

        if (isCorrect) earnedPoints += pts;

        reviewItems.push({
          question: q.question,
          type: q.type,
          userAnswer: userAns || '(No Answer)',
          correctAnswer: q.correctAnswer,
          isCorrect: isCorrect,
          points: isCorrect ? pts : 0,
          maxPoints: pts,
          explanation: q.explanation
        });
      });

      var percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;
      var passingScore = activeQuiz.passingScore || 50;
      var passed = percentage >= passingScore;

      // Hide questions and user cards
      var questionsList = document.getElementById('rk-questions-list');
      var submitWrap = document.querySelector('.rk-submit-wrap');
      var userCard = document.querySelector('.rk-user-card');

      if (questionsList) questionsList.style.display = 'none';
      if (submitWrap) submitWrap.style.display = 'none';
      if (userCard) userCard.style.display = 'none';

      var resultCard = document.getElementById('rk-result-card');
      if (resultCard) {
        var resHtml = [
          '<div class="rk-score-banner ' + (passed ? 'pass' : 'fail') + '">',
          '  <div class="rk-score-circle">',
          '    <span class="rk-score-pct">' + percentage + '%</span>',
          '    <span class="rk-score-lbl">' + (passed ? 'PASSED' : 'FAILED') + '</span>',
          '  </div>',
          '  <h3 class="rk-score-greet">' + (passed ? '🎉 Congratulations, ' + escapeHtml(name) + '!' : 'Keep practicing, ' + escapeHtml(name) + '!') + '</h3>',
          '  <p class="rk-score-sub">' + (passed ? 'You cleared the quiz requirements.' : 'You scored below the required passing percentage.') + '</p>',
          '  <div class="rk-score-stats">',
          '    <div class="rk-stat-box"><strong>' + earnedPoints + ' / ' + totalPoints + '</strong><span>Score</span></div>',
          '    <div class="rk-stat-box"><strong>' + percentage + '%</strong><span>Percentage</span></div>',
          '    <div class="rk-stat-box"><strong>' + passingScore + '%</strong><span>Passing Mark</span></div>',
          '  </div>',
          '</div>'
        ];

        // Detailed review
        if (activeQuiz.showAnswers !== false && reviewItems.length > 0) {
          resHtml.push('<div class="rk-review-wrap">');
          resHtml.push('  <h4 style="font-size:16px; font-weight:700; margin-bottom:14px; color:#1e293b;"><i class="fas fa-list-check"></i> Answer Review & Explanations:</h4>');

          reviewItems.forEach(function (item, idx) {
            var badgeClass = item.isCorrect === true ? 'correct' : (item.isCorrect === false ? 'incorrect' : 'poll');
            var badgeText = item.isCorrect === true ? '✓ Correct (+' + item.points + ' pts)' : (item.isCorrect === false ? '✗ Incorrect (0 pts)' : 'Recorded');

            resHtml.push('  <div class="rk-review-card ' + badgeClass + '">');
            resHtml.push('    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">');
            resHtml.push('      <span class="rk-review-badge ' + badgeClass + '">' + badgeText + '</span>');
            resHtml.push('    </div>');
            resHtml.push('    <div style="font-weight:700; font-size:15px; margin-bottom:8px; color:#0f172a;">Q' + (idx + 1) + ': ' + escapeHtml(item.question) + '</div>');
            resHtml.push('    <div class="rk-review-line"><strong>Your Answer:</strong> ' + escapeHtml(formatAns(item.userAnswer)) + '</div>');

            if (item.isCorrect === false && item.correctAnswer) {
              resHtml.push('    <div class="rk-review-line correct-line"><strong>Correct Answer:</strong> ' + escapeHtml(item.correctAnswer) + '</div>');
            }
            if (item.explanation) {
              resHtml.push('    <div class="rk-review-exp"><i class="fas fa-lightbulb"></i> ' + escapeHtml(item.explanation) + '</div>');
            }
            resHtml.push('  </div>');
          });

          resHtml.push('</div>');
        }

        // Action buttons
        resHtml.push('<div style="display:flex; gap:12px; margin-top:20px; flex-wrap:wrap;">');
        if (activeQuiz.allowRetake !== false) {
          resHtml.push('  <button type="button" class="rk-quiz-btn" style="background:#4f46e5;" onclick="window.RKQuizInternal.retake()"><i class="fas fa-redo"></i> Retake Quiz</button>');
        }
        resHtml.push('  <button type="button" class="rk-quiz-btn" style="background:#64748b;" onclick="RKQuiz.close()"><i class="fas fa-times"></i> Close</button>');
        resHtml.push('</div>');

        resultCard.innerHTML = resHtml.join('\n');
        resultCard.style.display = 'block';

        var bodyContent = document.getElementById('rk-modal-body-content');
        if (bodyContent) bodyContent.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Background submission to server if configured
      if (RKQuiz.serverUrl && RKQuiz.serverUrl.indexOf('http') === 0 && RKQuiz.serverUrl.indexOf('SAMPLE_') === -1) {
        try {
          var payload = {
            action: 'submitResponse',
            quizId: activeQuiz.id,
            userName: name,
            userEmail: email,
            score: earnedPoints,
            totalPoints: totalPoints,
            percentage: percentage,
            passed: passed,
            answers: userAnswers
          };
          if (navigator.sendBeacon) {
            navigator.sendBeacon(RKQuiz.serverUrl, JSON.stringify(payload));
          } else {
            fetch(RKQuiz.serverUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }).catch(function () {});
          }
        } catch (ex) {}
      }
    },

    retake: function () {
      if (activeQuiz) {
        renderNativePlayer(activeQuiz, getOrCreateModal());
      }
    }
  };

  function updateProgressBar() {
    if (!activeQuiz || !activeQuiz.questions) return;
    var total = activeQuiz.questions.length;
    var answered = 0;
    activeQuiz.questions.forEach(function (q) {
      var a = userAnswers[q.questionId];
      if (a !== undefined && a !== null && (Array.isArray(a) ? a.length > 0 : String(a).trim() !== '')) {
        answered++;
      }
    });
    var pct = Math.round((answered / total) * 100);
    var pBar = document.getElementById('rk-quiz-progress');
    if (pBar) pBar.style.width = pct + '%';
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    var timerEl = document.getElementById('rk-live-timer');
    timerInterval = setInterval(function () {
      if (!isTimerEnabled) return;
      timeLeftSeconds--;
      if (timerEl) timerEl.innerHTML = '<i class="fas fa-stopwatch"></i> ' + formatTimer(timeLeftSeconds);

      if (timeLeftSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        alert('Time limit reached! Submitting your answers.');
        window.RKQuizInternal.submit();
      }
    }, 1000);
  }

  function formatTimer(sec) {
    if (sec <= 0) return '00:00';
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function shuffleArray(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function formatAns(ans) {
    if (ans === undefined || ans === null || ans === '') return '(No Answer)';
    if (Array.isArray(ans)) return ans.join(', ');
    return String(ans);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeQuotes(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  function sanitizeId(str) {
    return String(str).replace(/[^a-zA-Z0-9]/g, '_');
  }

  // ==========================================================================
  // INJECT CSS STYLES
  // ==========================================================================
  function injectStyles() {
    if (document.getElementById('rk-quiz-styles')) return;

    var css = [
      '/* RK QuizMaker Universal Styles */',
      '.rk-quiz-btn {',
      '  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);',
      '  color: #ffffff !important;',
      '  border: none;',
      '  padding: 12px 24px;',
      '  border-radius: 8px;',
      '  font-size: 15px;',
      '  font-weight: 600;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  cursor: pointer;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  gap: 8px;',
      '  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);',
      '  transition: all 0.25s ease;',
      '  text-decoration: none !important;',
      '  outline: none;',
      '}',
      '.rk-quiz-btn:hover {',
      '  transform: translateY(-2px);',
      '  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45);',
      '  background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);',
      '}',
      '.rk-quiz-btn:active { transform: translateY(0); }',
      '/* Quiz Scene Card Styles (Above button & blog teaser) */',
      '.rk-quiz-card {',
      '  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);',
      '  border: 1.5px solid #e2e8f0;',
      '  border-radius: 16px;',
      '  padding: 22px 24px;',
      '  max-width: 640px;',
      '  margin: 20px auto;',
      '  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04);',
      '  cursor: pointer;',
      '  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);',
      '  position: relative;',
      '  overflow: hidden;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  text-align: left;',
      '  border-top: 4px solid #4f46e5;',
      '}',
      '.rk-quiz-card:hover {',
      '  transform: translateY(-4px);',
      '  box-shadow: 0 20px 30px -10px rgba(79, 70, 229, 0.25);',
      '  border-color: #818cf8;',
      '}',
      '.rk-card-badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: center; }',
      '.rk-card-pill { display: inline-flex; align-items: center; gap: 6px; background: #eef2ff; color: #4f46e5; font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }',
      '.rk-card-chip { display: inline-flex; align-items: center; gap: 6px; background: #ffffff; color: #334155; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; border: 1px solid #e2e8f0; }',
      '.rk-card-chip i { color: #4f46e5; }',
      '.rk-card-title { font-size: 18.5px; font-weight: 700; color: #0f172a; margin: 0 0 8px; line-height: 1.35; }',
      '.rk-card-desc { font-size: 13.5px; color: #64748b; margin: 0 0 16px; line-height: 1.55; }',
      '.rk-card-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed #e2e8f0; padding-top: 16px; flex-wrap: wrap; gap: 10px; }',
      '.rk-card-cta-hint { font-size: 12px; color: #94a3b8; font-weight: 500; display: inline-flex; align-items: center; gap: 5px; }',
      '/* Modal Overlay & Dialog */',
      '.rk-modal-overlay {',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  display: none;',
      '  align-items: center;',
      '  justify-content: center;',
      '  z-index: 9999999;',
      '  padding: 16px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '}',
      '.rk-modal-backdrop {',
      '  position: absolute;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  background: rgba(15, 23, 42, 0.75);',
      '  backdrop-filter: blur(6px);',
      '  opacity: 0;',
      '  transition: opacity 0.25s ease;',
      '}',
      '.rk-modal-dialog {',
      '  position: relative;',
      '  background: #ffffff;',
      '  width: 100%;',
      '  max-width: 820px;',
      '  height: 90vh;',
      '  max-height: 850px;',
      '  border-radius: 16px;',
      '  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);',
      '  overflow: hidden;',
      '  display: flex;',
      '  flex-direction: column;',
      '  transform: scale(0.92) translateY(20px);',
      '  opacity: 0;',
      '  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);',
      '}',
      '.rk-modal-active .rk-modal-backdrop { opacity: 1; }',
      '.rk-modal-active .rk-modal-dialog { transform: scale(1) translateY(0); opacity: 1; }',
      '.rk-modal-close {',
      '  position: absolute;',
      '  top: 14px;',
      '  right: 14px;',
      '  width: 36px;',
      '  height: 36px;',
      '  background: rgba(255, 255, 255, 0.85);',
      '  border: none;',
      '  border-radius: 50%;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  font-size: 20px;',
      '  color: #1e293b;',
      '  cursor: pointer;',
      '  z-index: 20;',
      '  transition: all 0.2s ease;',
      '  box-shadow: 0 2px 8px rgba(0,0,0,0.15);',
      '}',
      '.rk-modal-close:hover { background: #fee2e2; color: #ef4444; transform: scale(1.08); }',
      '.rk-modal-body {',
      '  flex: 1;',
      '  overflow-y: auto;',
      '  -webkit-overflow-scrolling: touch;',
      '  display: flex;',
      '  flex-direction: column;',
      '}',
      '/* Player Header & Timer Mode Controls */',
      '.rk-player-wrapper { display: flex; flex-direction: column; min-height: 100%; }',
      '.rk-player-header {',
      '  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);',
      '  color: #ffffff;',
      '  padding: 24px 28px 20px;',
      '  position: relative;',
      '}',
      '.rk-header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 8px; padding-right: 36px; flex-wrap: wrap; }',
      '.rk-header-top h2 { font-size: 20px; font-weight: 700; margin: 0; line-height: 1.3; }',
      '.rk-header-desc { font-size: 13.5px; opacity: 0.9; margin: 0 0 14px; line-height: 1.5; }',
      '.rk-timer-control-box { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }',
      '.rk-mode-switch { display: inline-flex; background: rgba(0, 0, 0, 0.2); padding: 3px; border-radius: 20px; gap: 3px; }',
      '.rk-mode-chip { background: transparent; border: none; color: #ffffff; padding: 4px 10px; border-radius: 16px; font-size: 11.5px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-family: inherit; }',
      '.rk-mode-chip:hover { background: rgba(255, 255, 255, 0.2); }',
      '.rk-mode-chip.active { background: #ffffff; color: #4f46e5; box-shadow: 0 2px 5px rgba(0,0,0,0.15); }',
      '.rk-meta-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }',
      '.rk-meta-chip { font-size: 12px; background: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 20px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; }',
      '.rk-timer-badge { background: #fef08a; color: #854d0e; font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.12); flex-shrink: 0; }',
      '.rk-progress-container { height: 6px; background: rgba(255, 255, 255, 0.25); border-radius: 4px; overflow: hidden; margin-top: 6px; }',
      '.rk-progress-bar { height: 100%; background: #38bdf8; transition: width 0.3s ease; }',
      '.rk-player-body { padding: 24px 28px; background: #f8fafc; flex: 1; }',
      '.rk-user-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }',
      '.rk-user-title { font-weight: 600; font-size: 13px; color: #64748b; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }',
      '.rk-user-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }',
      '.rk-input { width: 100%; padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; font-family: inherit; box-sizing: border-box; transition: all 0.2s; background: #ffffff; color: #1e293b; }',
      '.rk-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); }',
      '.rk-q-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 18px; box-shadow: 0 2px 5px rgba(0,0,0,0.04); }',
      '.rk-q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }',
      '.rk-q-badge { font-size: 11px; font-weight: 700; color: #4f46e5; background: #e0e7ff; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }',
      '.rk-q-pts { font-size: 12px; font-weight: 600; color: #64748b; }',
      '.rk-q-text { font-size: 15.5px; font-weight: 700; color: #0f172a; margin-bottom: 14px; line-height: 1.45; }',
      '.rk-options-group { display: flex; flex-direction: column; gap: 10px; }',
      '.rk-opt-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; background: #ffffff; min-height: 48px; box-sizing: border-box; }',
      '.rk-opt-item:hover { border-color: #cbd5e1; background: #f8fafc; }',
      '.rk-opt-item.selected { border-color: #4f46e5; background: #eef2ff; color: #4338ca; }',
      '.rk-opt-item.selected .rk-opt-icon { color: #4f46e5; }',
      '.rk-opt-icon { font-size: 16px; color: #94a3b8; flex-shrink: 0; }',
      '.rk-opt-label { font-size: 14.5px; font-weight: 500; }',
      '.rk-poll-group { display: flex; flex-direction: column; gap: 10px; }',
      '.rk-poll-item { position: relative; border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden; cursor: pointer; background: #ffffff; min-height: 48px; display: flex; align-items: center; transition: border-color 0.2s; }',
      '.rk-poll-item:hover { border-color: #cbd5e1; }',
      '.rk-poll-fill { position: absolute; top: 0; left: 0; bottom: 0; background: #e0e7ff; transition: width 0.4s ease; z-index: 1; }',
      '.rk-poll-text { position: relative; z-index: 2; display: flex; justify-content: space-between; width: 100%; padding: 12px 16px; font-weight: 600; font-size: 14px; color: #1e293b; }',
      '.rk-poll-pct { font-weight: 700; color: #4f46e5; }',
      '.rk-submit-wrap { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; }',
      '.rk-submit-btn { width: 100%; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); }',
      '.rk-submit-btn:hover { background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%); transform: translateY(-1px); }',
      '.rk-close-bottom-btn { width: 100%; background: transparent; color: #64748b; border: 1.5px solid #cbd5e1; padding: 11px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; }',
      '.rk-close-bottom-btn:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }',
      '/* Result View */',
      '.rk-result-card { background: #ffffff; border-radius: 14px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }',
      '.rk-score-banner { text-align: center; padding: 24px 16px; border-radius: 12px; margin-bottom: 24px; }',
      '.rk-score-banner.pass { background: #f0fdf4; border: 1px solid #bbf7d0; }',
      '.rk-score-banner.fail { background: #fef2f2; border: 1px solid #fecaca; }',
      '.rk-score-circle { width: 90px; height: 90px; border-radius: 50%; margin: 0 auto 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; }',
      '.rk-score-banner.pass .rk-score-circle { background: #dcfce7; color: #15803d; border: 3px solid #86efac; }',
      '.rk-score-banner.fail .rk-score-circle { background: #fee2e2; color: #b91c1c; border: 3px solid #fca5a5; }',
      '.rk-score-pct { font-size: 22px; font-weight: 800; line-height: 1; }',
      '.rk-score-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; margin-top: 3px; }',
      '.rk-score-greet { font-size: 19px; font-weight: 700; margin: 0 0 6px; color: #0f172a; }',
      '.rk-score-sub { font-size: 13.5px; color: #64748b; margin: 0 0 16px; }',
      '.rk-score-stats { display: flex; justify-content: center; gap: 16px; }',
      '.rk-stat-box { background: #ffffff; padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; }',
      '.rk-stat-box strong { font-size: 16px; color: #0f172a; font-weight: 700; }',
      '.rk-stat-box span { font-size: 11px; color: #64748b; }',
      '.rk-review-card { background: #ffffff; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; border-left: 4px solid #cbd5e1; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }',
      '.rk-review-card.correct { border-left-color: #10b981; }',
      '.rk-review-card.incorrect { border-left-color: #ef4444; }',
      '.rk-review-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }',
      '.rk-review-badge.correct { background: #dcfce7; color: #166534; }',
      '.rk-review-badge.incorrect { background: #fee2e2; color: #991b1b; }',
      '.rk-review-badge.poll { background: #e0e7ff; color: #3730a3; }',
      '.rk-review-line { font-size: 13.5px; color: #334155; margin-bottom: 4px; }',
      '.rk-review-line.correct-line { color: #15803d; font-weight: 600; }',
      '.rk-review-exp { font-size: 12.5px; color: #64748b; background: #f8fafc; padding: 8px 12px; border-radius: 6px; margin-top: 6px; border-left: 2px solid #f59e0b; }',
      '/* Mobile Responsiveness */',
      '@media (max-width: 640px) {',
      '  .rk-modal-overlay { padding: 0 !important; }',
      '  .rk-modal-dialog {',
      '    width: 100% !important;',
      '    height: 100% !important;',
      '    max-height: 100vh !important;',
      '    border-radius: 0 !important;',
      '    transform: none !important;',
      '  }',
      '  .rk-player-header { padding: 18px 16px 14px !important; }',
      '  .rk-player-body { padding: 16px 14px !important; }',
      '  .rk-user-inputs { grid-template-columns: 1fr !important; }',
      '  .rk-score-stats { gap: 8px !important; }',
      '  .rk-stat-box { padding: 6px 10px !important; }',
      '  .rk-quiz-card { padding: 16px 18px !important; margin: 14px 0 !important; }',
      '}'
    ];

    var style = document.createElement('style');
    style.id = 'rk-quiz-styles';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css.join('\n')));
    document.head.appendChild(style);
  }

  // Self-initialize on script load
  injectStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { RKQuiz.init(); });
  } else {
    RKQuiz.init();
  }

  window.RKQuiz = RKQuiz;

})(window, document);
