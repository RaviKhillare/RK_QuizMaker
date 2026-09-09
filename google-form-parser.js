/**
 * RK QuizMaker - Google Form to Quiz Parser Engine
 * Extracts questions, options, answer keys, points & explanations from Google Forms links or source HTML.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GoogleFormParser = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Resilient CORS Proxies
  const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];

  /**
   * Normalizes any Google Form URL to a clean public viewform URL
   */
  function normalizeGoogleFormUrl(url) {
    if (!url) return '';
    let clean = url.trim();

    // If edit URL, change to viewform
    if (clean.includes('/edit')) {
      clean = clean.replace(/\/edit(\?[^#]*)?/, '/viewform');
    }

    // Ensure has viewform if ends with form id
    if (clean.includes('docs.google.com/forms/d/') && !clean.includes('/viewform')) {
      clean = clean.replace(/\/+$/, '') + '/viewform';
    }

    return clean;
  }

  /**
   * Extract JSON array using bracket balancing (handles arbitrary nested brackets and quotes)
   */
  function extractJsonArray(text, varName) {
    const startIdx = text.indexOf(varName);
    if (startIdx === -1) return null;
    const bracketStart = text.indexOf('[', startIdx);
    if (bracketStart === -1) return null;

    let depth = 0;
    let inString = false;
    let quoteChar = '';
    let escape = false;

    for (let i = bracketStart; i < text.length; i++) {
      const char = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (inString) {
        if (char === quoteChar) {
          inString = false;
        }
      } else {
        if (char === '"' || char === "'") {
          inString = true;
          quoteChar = char;
        } else if (char === '[') {
          depth++;
        } else if (char === ']') {
          depth--;
          if (depth === 0) {
            return text.substring(bracketStart, i + 1);
          }
        }
      }
    }
    return null;
  }

  /**
   * Parses raw Google Form HTML into structured Quiz object
   */
  function parseGoogleFormHtml(html) {
    if (!html || typeof html !== 'string') {
      throw new Error('Invalid HTML content provided.');
    }

    let title = 'Google Form Quiz';
    let description = '';
    let questions = [];

    // Method 1: Extract from FB_PUBLIC_LOAD_DATA_
    const jsonArrayStr = extractJsonArray(html, 'FB_PUBLIC_LOAD_DATA_');
    if (jsonArrayStr) {
      try {
        let data;
        try {
          data = JSON.parse(jsonArrayStr);
        } catch (e) {
          data = new Function(`return ${jsonArrayStr};`)();
        }

        const formData = data[1];
        if (formData) {
          // Extract Title
          if (formData[8]) title = String(formData[8]);
          else if (formData[0]) title = String(formData[0]);

          // Extract Description
          if (formData[1] && typeof formData[1] === 'string') {
            description = formData[1];
          } else if (Array.isArray(formData[1]) && typeof formData[1][0] === 'string' && !Array.isArray(formData[1][0])) {
            description = formData[1][0];
          }

          // Extract Items
          const items = Array.isArray(formData[1]) ? formData[1] : [];
          items.forEach((item, idx) => {
            if (!Array.isArray(item)) return;

            const qText = item[1] || '';
            const qDesc = item[2] || '';
            const qTypeCode = item[3]; // 0: Short text, 1: Paragraph, 2: Multiple Choice, 3: Dropdown, 4: Checkboxes
            const payload = item[4];

            if (!qText && !payload) return; // Skip non-question section breaks

            // Determine type
            let type = 'MCQ';
            if (qTypeCode === 4) {
              type = 'CHECKBOX';
            } else if (qTypeCode === 0 || qTypeCode === 1) {
              type = 'SHORT_ANSWER';
            } else if (qTypeCode === 2 || qTypeCode === 3) {
              type = 'MCQ';
            }

            let options = [];
            let correctAnswer = '';
            let points = 1;
            let explanation = qDesc || '';

            if (Array.isArray(payload) && payload[0]) {
              const entryData = payload[0];

              // Parse choices
              if (Array.isArray(entryData[1])) {
                options = entryData[1].map(opt => {
                  if (Array.isArray(opt)) return String(opt[0] || '').trim();
                  return String(opt || '').trim();
                }).filter(Boolean);
              }

              // Check if quiz answer key is configured (entryData[8])
              if (Array.isArray(entryData[8])) {
                const grading = entryData[8];
                if (grading[0] !== undefined && grading[0] !== null) {
                  points = Number(grading[0]) || 1;
                }
                if (Array.isArray(grading[1])) {
                  const correctList = grading[1].map(c => Array.isArray(c) ? c[0] : c).filter(Boolean);
                  if (correctList.length > 0) {
                    correctAnswer = correctList.join(', ');
                  }
                }
                if (grading[2] && Array.isArray(grading[2]) && typeof grading[2][0] === 'string') {
                  explanation = grading[2][0] || explanation;
                }
              }
            }

            // Fallback default answer for MCQ if no grading key was provided
            if (!correctAnswer && options.length > 0) {
              correctAnswer = options[0];
            }

            if (qText) {
              questions.push({
                id: 'gfq_' + Date.now() + '_' + idx,
                title: qText,
                question: qText,
                type: type,
                options: options,
                answer: correctAnswer,
                correctAnswer: correctAnswer,
                points: points,
                explanation: explanation
              });
            }
          });
        }
      } catch (err) {
        console.warn('GoogleFormParser FB_PUBLIC_LOAD_DATA_ parse warning:', err.message);
      }
    }

    // Method 2: DOM & Regex Fallback
    if (questions.length === 0) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i) ||
                          html.match(/class="[^"]*(?:freebirdFormviewerViewHeaderTitle|F9NWF)[^"]*"[^>]*>([^<]+)</i);
      if (titleMatch) {
        title = titleMatch[1].replace(/\s*-\s*Google Forms\s*$/i, '').trim();
      }

      const qMatches = [...html.matchAll(/(?:class="[^"]*(?:freebirdFormviewerViewNumberedItemContainer|Qr7Oae|geS5n)[^"]*"|role="listitem")[^>]*>([\s\S]+?)(?=(?:class="[^"]*(?:freebirdFormviewerViewNumberedItemContainer|Qr7Oae|geS5n)[^"]*"|role="listitem")|$)/gi)];

      qMatches.forEach((match, idx) => {
        const blockHtml = match[1];
        const qTitleMatch = blockHtml.match(/class="[^"]*(?:M7eMe|freebirdFormviewerViewItemsItemItemTitle)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                            blockHtml.match(/role="heading"[^>]*>([\s\S]*?)<\/(?:div|span|h\d)>/i);
        if (!qTitleMatch) return;
        const qTitle = qTitleMatch[1].replace(/<[^>]+>/g, '').trim();
        if (!qTitle) return;

        const optMatches = [...blockHtml.matchAll(/class="[^"]*(?:aDTYNe|docssharedWizToggleLabeledLabelText|ulDsOb)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)>/gi)];
        let options = optMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        options = [...new Set(options)];

        let type = 'MCQ';
        if (blockHtml.includes('role="checkbox"')) {
          type = 'CHECKBOX';
        } else if (blockHtml.includes('type="text"') || blockHtml.includes('<textarea')) {
          type = 'SHORT_ANSWER';
        }

        questions.push({
          id: 'gfq_dom_' + Date.now() + '_' + idx,
          title: qTitle,
          question: qTitle,
          type: type,
          options: options,
          answer: options[0] || '',
          correctAnswer: options[0] || '',
          points: 1,
          explanation: ''
        });
      });
    }

    if (questions.length === 0) {
      throw new Error('Could not extract any questions from the provided Google Form. Please ensure the link is a public Google Form.');
    }

    return {
      title: title || 'Google Form Quiz',
      description: description || `Imported from Google Form on ${new Date().toLocaleDateString()}`,
      questions: questions
    };
  }

  /**
   * Fetches Google Form HTML using multi-proxy fallback
   */
  async function fetchGoogleFormHtml(rawUrl, onProgress) {
    const cleanUrl = normalizeGoogleFormUrl(rawUrl);
    if (!cleanUrl) {
      throw new Error('Please provide a valid Google Form URL.');
    }

    if (onProgress) onProgress(1, 'Connecting to Google Form...');

    let lastError = null;

    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxyUrl = CORS_PROXIES[i](cleanUrl);
      try {
        if (onProgress) onProgress(i + 1, `Fetching via engine ${i + 1}/${CORS_PROXIES.length}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        if (html && (html.includes('FB_PUBLIC_LOAD_DATA_') || html.includes('docs.google.com') || html.includes('freebird') || html.includes('M7eMe'))) {
          if (onProgress) onProgress(4, 'Form received! Parsing questions and answers...');
          return html;
        } else if (html && html.length > 500) {
          // Might be standard HTML
          return html;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Proxy ${i + 1} failed:`, err.message);
      }
    }

    throw new Error(`Unable to fetch Google Form automatically due to network/CORS restrictions (${lastError ? lastError.message : 'Timeout'}). You can use the "Paste Form HTML" option below to parse instantly!`);
  }

  /**
   * Converts Google Form URL into a ready-to-use RK Quiz object
   */
  async function convertGoogleFormToQuiz(urlOrHtml, onProgress) {
    let html = '';
    const isUrl = typeof urlOrHtml === 'string' && /^(https?:\/\/|www\.)/i.test(urlOrHtml.trim());

    if (isUrl) {
      html = await fetchGoogleFormHtml(urlOrHtml, onProgress);
    } else {
      html = urlOrHtml;
    }

    const parsed = parseGoogleFormHtml(html);

    const quiz = {
      id: 'quiz_' + Date.now(),
      title: parsed.title,
      description: parsed.description,
      category: 'Google Forms',
      timeLimitMinutes: Math.max(10, Math.ceil(parsed.questions.length * 1.5)),
      passingScore: 60,
      shuffleQuestions: false,
      showAnswers: true,
      allowRetake: true,
      questions: parsed.questions
    };

    return quiz;
  }

  return {
    normalizeGoogleFormUrl,
    extractJsonArray,
    parseGoogleFormHtml,
    fetchGoogleFormHtml,
    convertGoogleFormToQuiz
  };
}));
