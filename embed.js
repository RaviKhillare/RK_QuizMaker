/**
 * RK_QuizMaker Embed Widget v1.0.0
 * Enables 1-click popup and inline quizzes on Blogger, WordPress, and any website.
 * Author: Ravindra Khillare
 * Website: https://timepasstimewithravi.blogspot.com/
 * GitHub: https://github.com/RaviKhillare/RK_QuizMaker
 */

(function (window, document) {
  'use strict';

  // Find the current script tag to detect configured server URL
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  // Default web app server URL (can be customized via data-server-url or RKQuiz.setServerUrl)
  var defaultServerUrl = currentScript && currentScript.getAttribute('data-server-url')
    ? currentScript.getAttribute('data-server-url')
    : 'https://script.google.com/macros/s/AKfycbz_SAMPLE_APP_URL/exec';

  var RKQuiz = {
    serverUrl: defaultServerUrl,

    /**
     * Set the Apps Script Web App URL
     */
    setServerUrl: function (url) {
      if (url) this.serverUrl = url;
    },

    /**
     * Open quiz in a clean, responsive modal popup
     * @param {string} quizId 
     * @param {object} options 
     */
    open: function (quizId, options) {
      options = options || {};
      var server = options.serverUrl || this.serverUrl;
      var quizUrl = server + (server.indexOf('?') > -1 ? '&' : '?') + 'quizId=' + encodeURIComponent(quizId) + '&embed=1';

      // Check if modal already exists, else create
      var modal = document.getElementById('rk-quiz-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'rk-quiz-modal';
        modal.className = 'rk-modal-overlay';
        modal.innerHTML = [
          '<div class="rk-modal-backdrop" onclick="RKQuiz.close()"></div>',
          '<div class="rk-modal-dialog">',
          '  <button type="button" class="rk-modal-close" onclick="RKQuiz.close()" aria-label="Close Quiz">&times;</button>',
          '  <div class="rk-modal-body">',
          '    <iframe id="rk-quiz-iframe" src="about:blank" allow="autoplay; fullscreen" allowfullscreen frameborder="0"></iframe>',
          '  </div>',
          '</div>'
        ].join('\n');
        document.body.appendChild(modal);
      }

      var iframe = document.getElementById('rk-quiz-iframe');
      if (iframe) {
        iframe.src = quizUrl;
      }

      // Show modal with animation
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // Lock background scroll
      setTimeout(function () {
        modal.classList.add('rk-modal-active');
      }, 10);

      // Listen for Escape key
      document.addEventListener('keydown', handleEscKey);
    },

    /**
     * Close the modal popup
     */
    close: function () {
      var modal = document.getElementById('rk-quiz-modal');
      if (modal) {
        modal.classList.remove('rk-modal-active');
        setTimeout(function () {
          modal.style.display = 'none';
          var iframe = document.getElementById('rk-quiz-iframe');
          if (iframe) iframe.src = 'about:blank';
          document.body.style.overflow = '';
        }, 250);
      }
      document.removeEventListener('keydown', handleEscKey);
    },

    /**
     * Initialize inline embeds on page
     */
    init: function () {
      injectStyles();

      // Find any element with data-rk-quiz attribute
      var inlineContainers = document.querySelectorAll('[data-rk-quiz]');
      for (var i = 0; i < inlineContainers.length; i++) {
        var container = inlineContainers[i];
        var qId = container.getAttribute('data-rk-quiz');
        if (qId && !container.hasAttribute('data-rk-initialized')) {
          container.setAttribute('data-rk-initialized', 'true');
          var height = container.getAttribute('data-height') || '650px';
          var server = container.getAttribute('data-server-url') || RKQuiz.serverUrl;
          var url = server + (server.indexOf('?') > -1 ? '&' : '?') + 'quizId=' + encodeURIComponent(qId) + '&embed=1';

          container.innerHTML = '<iframe src="' + url + '" width="100%" height="' + height + '" frameborder="0" style="border:none; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08);" allowfullscreen></iframe>';
        }
      }
    }
  };

  function handleEscKey(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      RKQuiz.close();
    }
  }

  function injectStyles() {
    if (document.getElementById('rk-quiz-styles')) return;

    var css = [
      '/* RK QuizMaker Embed Styles */',
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
      '  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);',
      '  transition: all 0.25s ease;',
      '  text-decoration: none !important;',
      '  outline: none;',
      '}',
      '.rk-quiz-btn:hover {',
      '  transform: translateY(-2px);',
      '  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45);',
      '  background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);',
      '}',
      '.rk-quiz-btn:active {',
      '  transform: translateY(0);',
      '}',
      '.rk-modal-overlay {',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  display: none;',
      '  align-items: center;',
      '  justify-content: center;',
      '  z-index: 999999;',
      '  padding: 16px;',
      '}',
      '.rk-modal-backdrop {',
      '  position: absolute;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  background: rgba(15, 23, 42, 0.7);',
      '  backdrop-filter: blur(5px);',
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
      '.rk-modal-active .rk-modal-backdrop {',
      '  opacity: 1;',
      '}',
      '.rk-modal-active .rk-modal-dialog {',
      '  transform: scale(1) translateY(0);',
      '  opacity: 1;',
      '}',
      '.rk-modal-close {',
      '  position: absolute;',
      '  top: 14px;',
      '  right: 14px;',
      '  width: 36px;',
      '  height: 36px;',
      '  border-radius: 50%;',
      '  background: rgba(0, 0, 0, 0.08);',
      '  border: none;',
      '  font-size: 22px;',
      '  line-height: 1;',
      '  color: #333333;',
      '  cursor: pointer;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  z-index: 10;',
      '  transition: all 0.2s;',
      '}',
      '.rk-modal-close:hover {',
      '  background: #ef4444;',
      '  color: #ffffff;',
      '  transform: rotate(90deg);',
      '}',
      '.rk-modal-body {',
      '  flex: 1;',
      '  width: 100%;',
      '  height: 100%;',
      '  overflow: hidden;',
      '}',
      '#rk-quiz-iframe {',
      '  width: 100%;',
      '  height: 100%;',
      '  border: none;',
      '  display: block;',
      '}',
      '@media (max-width: 640px) {',
      '  .rk-modal-overlay { padding: 0 !important; }',
      '  .rk-modal-dialog {',
      '    width: 100% !important;',
      '    height: 100% !important;',
      '    max-width: 100% !important;',
      '    max-height: 100% !important;',
      '    border-radius: 0 !important;',
      '  }',
      '  .rk-modal-close { top: 10px !important; right: 10px !important; }',
      '}'
    ].join('\n');

    var styleEl = document.createElement('style');
    styleEl.id = 'rk-quiz-styles';
    styleEl.type = 'text/css';
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      RKQuiz.init();
    });
  } else {
    RKQuiz.init();
  }

  window.RKQuiz = RKQuiz;

})(window, document);
