/**
 * @OnlyCurrentDoc
 */

// Default Configuration
var DEFAULT_SETTINGS = {
  addonTitle: "Google Forms Addon",
  addonSubtitle: "Bulk Import/Export Tool",
  avatarIcon: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
  youtubeUrl: "https://youtube.com",
  facebookUrl: "https://facebook.com",
  linkedinUrl: "https://linkedin.com",
  bloggerUrl: "https://blogger.com",
  emailAddr: "mailto:contact@example.com",
  notifications: "[]" // JSON stringified array of objects {text, link}
};

function onOpen(e) {
  FormApp.getUi()
    .createAddonMenu()
    .addItem('Open Import/Export Tool', 'showSidebar')
    .addSeparator()
    .addItem('Admin Settings', 'openAdminAuth')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  var template = HtmlService.createTemplateFromFile('sidebar');
  template.settings = getSettings(); // Inject settings
  
  var html = template.evaluate()
    .setTitle('Bulk Import/Export')
    .setWidth(300);
  FormApp.getUi().showSidebar(html);
}

// ADMIN FUNCTIONS

function openAdminAuth() {
  var html = HtmlService.createHtmlOutputFromFile('admin-auth')
    .setWidth(300)
    .setHeight(200);
  FormApp.getUi().showModalDialog(html, 'Admin Authentication');
}

function checkAdminPassword(password) {
  if (!password) return false;
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  var txtHash = rawHash.map(function(b) {
    return ("0" + (b < 0 ? b + 256 : b).toString(16)).slice(-2);
  }).join("");
  
  // Hash for 'Bharati@8446'
  return txtHash === '71da474e0c7ca26b49f9dedb51df52f12cf0c40623a9301255327aad432dc97f'; 
}

function showAdminPanel() {
  var html = HtmlService.createHtmlOutputFromFile('admin')
    .setWidth(400)
    .setHeight(600);
  FormApp.getUi().showModalDialog(html, 'Admin Panel');
}

function getSettings() {
  var props = PropertiesService.getScriptProperties();
  var saved = props.getProperties();
  
  // Merge defaults with saved
  var settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  for (var key in saved) {
    if (saved.hasOwnProperty(key)) {
      settings[key] = saved[key];
    }
  }
  
  // Parse notifications if string
  try {
      if (typeof settings.notifications === 'string') {
          settings.notifications = JSON.parse(settings.notifications);
      }
  } catch (e) {
      settings.notifications = [];
  }
  
  return settings;
}

function saveSettings(settings) {
  // Ensure notifications is stringified
  if (typeof settings.notifications !== 'string') {
      settings.notifications = JSON.stringify(settings.notifications);
  }
  PropertiesService.getScriptProperties().setProperties(settings);
}

/**
 * Exports MCQ questions to a new Google Sheet with separate columns for each option
 */
function exportMCQToSheet() {
  var form = FormApp.getActiveForm();
  var title = form.getTitle() || 'Untitled Form';
  var items = form.getItems();
  
  var mcqItems = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
      mcqItems.push(item);
    }
  }
  
  if (mcqItems.length === 0) {
    throw new Error("No Multiple Choice questions found in form.");
  }
  
  var ssName = title + ' - MCQ Template';
  var ss = SpreadsheetApp.create(ssName);
  var sheet = ss.getActiveSheet();
  
  // Find max choices
  var maxChoices = 0;
  for (var i = 0; i < mcqItems.length; i++) {
    var choiceCount = mcqItems[i].asMultipleChoiceItem().getChoices().length;
    if (choiceCount > maxChoices) maxChoices = choiceCount;
  }
  
  // Build headers
  var headers = ['Question Title', 'Help Text', 'Required'];
  for (var c = 1; c <= maxChoices; c++) {
    headers.push('Option ' + c);
  }
  headers.push('Answer');
  
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4285F4').setFontColor('white');
  
  var rows = [];
  for (var i = 0; i < mcqItems.length; i++) {
    var item = mcqItems[i];
    var mcItem = item.asMultipleChoiceItem();
    var choicesArray = mcItem.getChoices();
    var row = [
      item.getTitle(),
      item.getHelpText(),
      mcItem.isRequired() ? 'Yes' : 'No'
    ];
    
    for (var c = 0; c < maxChoices; c++) {
      row.push(c < choicesArray.length ? choicesArray[c].getValue() : '');
    }
    row.push(''); // Answer column
    rows.push(row);
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  try {
    sheet.autoResizeColumns(1, headers.length);
  } catch(e) {}
  
  return ss.getUrl();
}

/**
 * Exports Checkbox questions to a new Google Sheet
 */
function exportCheckboxToSheet() {
  var form = FormApp.getActiveForm();
  var title = form.getTitle() || 'Untitled Form';
  var items = form.getItems();
  
  var checkboxItems = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.getType() === FormApp.ItemType.CHECKBOX) {
      checkboxItems.push(item);
    }
  }
  
  if (checkboxItems.length === 0) {
    throw new Error("No Checkbox questions found in form.");
  }
  
  var ssName = title + ' - Checkbox Template';
  var ss = SpreadsheetApp.create(ssName);
  var sheet = ss.getActiveSheet();
  
  // Find max choices
  var maxChoices = 0;
  for (var i = 0; i < checkboxItems.length; i++) {
    var choiceCount = checkboxItems[i].asCheckboxItem().getChoices().length;
    if (choiceCount > maxChoices) maxChoices = choiceCount;
  }
  
  // Build headers
  var headers = ['Question Title', 'Help Text', 'Required'];
  for (var c = 1; c <= maxChoices; c++) {
    headers.push('Option ' + c);
  }
  headers.push('Answer (Check/Uncheck)');
  
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#34A853').setFontColor('white');
  
  var rows = [];
  for (var i = 0; i < checkboxItems.length; i++) {
    var item = checkboxItems[i];
    var cbItem = item.asCheckboxItem();
    var choicesArray = cbItem.getChoices();
    var row = [
      item.getTitle(),
      item.getHelpText(),
      cbItem.isRequired() ? 'Yes' : 'No'
    ];
    
    for (var c = 0; c < maxChoices; c++) {
      row.push(c < choicesArray.length ? choicesArray[c].getValue() : '');
    }
    row.push(''); // Answer column
    rows.push(row);
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  try {
    sheet.autoResizeColumns(1, headers.length);
  } catch(e) {}
  
  return ss.getUrl();
}

/**
 * Exports Dropdown/List questions to a new Google Sheet
 */
function exportListToSheet() {
  var form = FormApp.getActiveForm();
  var title = form.getTitle() || 'Untitled Form';
  var items = form.getItems();
  
  var listItems = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.getType() === FormApp.ItemType.LIST) {
      listItems.push(item);
    }
  }
  
  if (listItems.length === 0) {
    throw new Error("No Dropdown questions found in form.");
  }
  
  var ssName = title + ' - Dropdown Template';
  var ss = SpreadsheetApp.create(ssName);
  var sheet = ss.getActiveSheet();
  
  // Find max choices
  var maxChoices = 0;
  for (var i = 0; i < listItems.length; i++) {
    var choiceCount = listItems[i].asListItem().getChoices().length;
    if (choiceCount > maxChoices) maxChoices = choiceCount;
  }
  
  // Build headers
  var headers = ['Question Title', 'Help Text', 'Required'];
  for (var c = 1; c <= maxChoices; c++) {
    headers.push('Option ' + c);
  }
  headers.push('Answer');
  
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#EA4335').setFontColor('white');
  
  var rows = [];
  for (var i = 0; i < listItems.length; i++) {
    var item = listItems[i];
    var listItem = item.asListItem();
    var choicesArray = listItem.getChoices();
    var row = [
      item.getTitle(),
      item.getHelpText(),
      listItem.isRequired() ? 'Yes' : 'No'
    ];
    
    for (var c = 0; c < maxChoices; c++) {
      row.push(c < choicesArray.length ? choicesArray[c].getValue() : '');
    }
    row.push(''); // Answer column
    rows.push(row);
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  try {
    sheet.autoResizeColumns(1, headers.length);
  } catch(e) {}
  
  return ss.getUrl();
}

/**
 * Exports Text questions to a new Google Sheet
 */
function exportTextToSheet() {
  var form = FormApp.getActiveForm();
  var title = form.getTitle() || 'Untitled Form';
  var items = form.getItems();
  
  var textItems = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.getType() === FormApp.ItemType.TEXT) {
      textItems.push(item);
    }
  }
  
  if (textItems.length === 0) {
    throw new Error("No Short Answer questions found in form.");
  }
  
  var ssName = title + ' - Short Answer Template';
  var ss = SpreadsheetApp.create(ssName);
  var sheet = ss.getActiveSheet();
  
  var headers = ['Question Title', 'Help Text', 'Required', 'Answer'];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#FBBC04').setFontColor('white');
  
  var rows = [];
  for (var i = 0; i < textItems.length; i++) {
    var item = textItems[i];
    var textItem = item.asTextItem();
    rows.push([
      item.getTitle(),
      item.getHelpText(),
      textItem.isRequired() ? 'Yes' : 'No',
      ''
    ]);
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  try {
    sheet.autoResizeColumns(1, headers.length);
  } catch(e) {}
  
  return ss.getUrl();
}

/**
 * Exports Paragraph Text questions to a new Google Sheet
 */
function exportParagraphToSheet() {
  var form = FormApp.getActiveForm();
  var title = form.getTitle() || 'Untitled Form';
  var items = form.getItems();
  
  var paraItems = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.getType() === FormApp.ItemType.PARAGRAPH_TEXT) {
      paraItems.push(item);
    }
  }
  
  if (paraItems.length === 0) {
    throw new Error("No Long Answer questions found in form.");
  }
  
  var ssName = title + ' - Long Answer Template';
  var ss = SpreadsheetApp.create(ssName);
  var sheet = ss.getActiveSheet();
  
  var headers = ['Question Title', 'Help Text', 'Required', 'Answer'];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#FBBC04').setFontColor('white');
  
  var rows = [];
  for (var i = 0; i < paraItems.length; i++) {
    var item = paraItems[i];
    var paraItem = item.asParagraphTextItem();
    rows.push([
      item.getTitle(),
      item.getHelpText(),
      paraItem.isRequired() ? 'Yes' : 'No',
      ''
    ]);
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  try {
    sheet.autoResizeColumns(1, headers.length);
  } catch(e) {}
  
  return ss.getUrl();
}

/**
 * Exports the current form questions to a new Google Sheet.
 * Returns the URL of the created spreadsheet.
 */
function exportFormToSheet() {
  var form = FormApp.getActiveForm();
  var title = form.getTitle() || 'Untitled Form';
  var items = form.getItems();
  
  var ssName = title + ' - Export';
  var ss = SpreadsheetApp.create(ssName);
  var sheet = ss.getActiveSheet();
  
  // Header Row
  var headers = ['Question Title', 'Type', 'Help Text', 'Required', 'Choices/Grid (Comma Sep)'];
  sheet.appendRow(headers);
  
  // Format Header
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#efefef');
  
  var rows = [];
  
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var row = parseItemForExport(item);
    if (row && row.length > 0) {
      rows.push(row);
    }
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  
  // Auto-resize
  try {
    sheet.autoResizeColumns(1, headers.length);
  } catch(e) {}
  
  return ss.getUrl();
}

/**
 * Helper to parse a form item into a row array.
 */
function parseItemForExport(item) {
  var type = item.getType();
  var title = item.getTitle();
  var helpText = item.getHelpText();
  var required = false;
  var choices = "";

  switch (type) {
    case FormApp.ItemType.MULTIPLE_CHOICE:
      var mcItem = item.asMultipleChoiceItem();
      required = mcItem.isRequired();
      choices = mcItem.getChoices().map(function(c) { return c.getValue(); }).join(", ");
      break;
      
    case FormApp.ItemType.CHECKBOX:
      var cbItem = item.asCheckboxItem();
      required = cbItem.isRequired();
      choices = cbItem.getChoices().map(function(c) { return c.getValue(); }).join(", ");
      break;
      
    case FormApp.ItemType.LIST:
      var listItem = item.asListItem();
      required = listItem.isRequired();
      choices = listItem.getChoices().map(function(c) { return c.getValue(); }).join(", ");
      break;
      
    case FormApp.ItemType.TEXT:
      required = item.asTextItem().isRequired();
      break;
      
    case FormApp.ItemType.PARAGRAPH_TEXT:
      required = item.asParagraphTextItem().isRequired();
      break;
      
    case FormApp.ItemType.DATE:
      required = item.asDateItem().isRequired();
      break;
      
    case FormApp.ItemType.TIME:
      required = item.asTimeItem().isRequired();
      break;
      
    case FormApp.ItemType.SCALE:
      required = item.asScaleItem().isRequired();
      choices = "Min: " + item.asScaleItem().getLowerBound() + ", Max: " + item.asScaleItem().getUpperBound();
      break;
      
    default:
      // For types not explicitly handled or layout items, we defaults to false/empty
      break;
  }
  
  return [title, type.toString(), helpText, required, choices];
}


/**
 * Imports questions from a spreadsheet URL.
 * Expected Columns: Title, Type, Help Text, Required, Choices
 */
function importQuestionsFromSheet(sheetUrl) {
  try {
    var ss = SpreadsheetApp.openByUrl(sheetUrl);
    var sheet = ss.getSheets()[0]; // Read first sheet
    var data = sheet.getDataRange().getValues();
    
    // Assume Row 1 is header
    if (data.length < 2) throw new Error("Sheet is empty or missing data.");
    
    var form = FormApp.getActiveForm();
    var addedCount = 0;
    
    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        // Skip empty rows
        if (!row[0]) continue;
        
        var title = row[0];
        var typeStr = String(row[1]).toUpperCase();
        var helpText = row[2];
        var isReq = Boolean(row[3]);
        var choicesStr = row[4];
        var correctAnswer = row[5]; // Column F
        
        createQuestion(form, title, typeStr, helpText, isReq, choicesStr, correctAnswer);
        addedCount++;
    }
    
    return "Successfully imported " + addedCount + " questions.";
    
  } catch (err) {
    throw new Error("Import failed: " + err.message);
  }
}

/**
 * Creates a question in the form based on parsed data.
 */
function createQuestion(form, title, typeStr, helpText, isReq, choicesStr, correctAnswer) {
  var item;
  typeStr = typeStr ? typeStr.trim().toUpperCase() : "TEXT";
  
  // Clean up choices
  var choices = [];
  if (choicesStr && (typeof choicesStr === 'string' || typeof choicesStr === 'number')) {
      choices = String(choicesStr).split(",").map(function(s){ return s.trim(); });
  }

  // Logic to add specific items
  if (typeStr.indexOf("MULTIPLE_CHOICE") > -1 || typeStr === "RADIO") {
      item = form.addMultipleChoiceItem();
      
      if(choices.length > 0) {
          if (correctAnswer) {
              form.setIsQuiz(true); // Enable Quiz Mode
              var choiceObjs = choices.map(function(c) {
                  return item.createChoice(c, c === String(correctAnswer));
              });
              item.setChoices(choiceObjs);
          } else {
              item.setChoiceValues(choices);
          }
      }
      
  } else if (typeStr.indexOf("CHECKBOX") > -1) {
      item = form.addCheckboxItem();
      
      if(choices.length > 0) {
         if (correctAnswer) {
              form.setIsQuiz(true);
              // Handle multiple correct answers split by comma if needed, usually simple match for now
              var corrects = String(correctAnswer).split(',').map(function(s){return s.trim();});
              var choiceObjs = choices.map(function(c) {
                  return item.createChoice(c, corrects.indexOf(c) > -1);
              });
              item.setChoices(choiceObjs);
          } else {
              item.setChoiceValues(choices);
          }
      }
      
  } else if (typeStr.indexOf("LIST") > -1 || typeStr === "DROPDOWN") {
      item = form.addListItem();
      if(choices.length > 0) item.setChoiceValues(choices);
      
  } else if (typeStr.indexOf("PARAGRAPH") > -1 || typeStr === "LONG_ANSWER") {
      item = form.addParagraphTextItem();
      
  } else if (typeStr.indexOf("DATE") > -1) {
      item = form.addDateItem();
      
  } else if (typeStr.indexOf("TIME") > -1) {
      item = form.addTimeItem();
      
  } else if (typeStr.indexOf("SCALE") > -1) {
      item = form.addScaleItem();
      // Parse Min/Max from choices if available, e.g. "1, 5" or "Min: 1, Max: 5"
      // Default to 1-5
      var distinctNums = String(choicesStr).match(/\d+/g);
      if (distinctNums && distinctNums.length >= 2) {
          var min = parseInt(distinctNums[0]);
          var max = parseInt(distinctNums[1]);
          // Validate constraints (1-10 usually)
          if(min < 0) min = 0;
          if(max > 10) max = 10;
          if(min < max) item.setBounds(min, max);
      }
      
  } else {
      // Default to text (Short Answer)
      item = form.addTextItem();
  }
  
  if(title) item.setTitle(title);
  if(helpText) item.setHelpText(helpText);
  if(item.setRequired) item.setRequired(isReq);
}

/**
 * Creates a sample spreadsheet template for the user.
 */
function createTemplate() {
  var ss = SpreadsheetApp.create("Google Form Import Template");
  var sheet = ss.getActiveSheet();
  
  var headers = ['Question Title', 'Type', 'Help Text', 'Required', 'Choices/Grid (Comma Sep)', 'Correct Answer'];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#efefef');
  
  var data = [
    ["What is your full name?", "TEXT", "Please enter your first and last name", true, "", ""],
    ["Which department do you belong to?", "MULTIPLE_CHOICE", "", true, "Sales, Marketing, Engineering, HR", "Sales"],
    ["Select your skills (Check all that apply)", "CHECKBOX", "", false, "Javascript, Python, Google Apps Script, SQL", "Javascript"],
    ["Select your Manager", "LIST", "Choose from the dropdown", true, "Alice, Bob, Charlie", ""],
    ["Describe your project experience", "PARAGRAPH", "Be descriptive", false, "", ""],
    ["Project Start Date", "DATE", "", true, "", ""],
    ["Preferred Meeting Time", "TIME", "", false, "", ""],
    ["Rate your satisfaction (1-10)", "SCALE", "1 is low, 10 is high", true, "1, 10", ""]
  ];
  
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.autoResizeColumns(1, headers.length);
  
  return ss.getUrl();
}

// ============================================================================
// RK_QUIZMAKER - CORE PLATFORM & WEB APP ENGINE
// Lifetime Free Database using Google Sheets
// Embeddable Quizzes with OnClick & Iframe support
// Multi-Question Types: MCQ, Checkbox, Short Answer, Long Answer, Poll
// Bulk Import Parser
// ============================================================================

var RK_DB_PROP_KEY = 'RK_QUIZMAKER_DB_ID';

/**
 * Web App Entry Point: Serves Quiz Player, Dashboard, or JSON API
 */
function doGet(e) {
  e = e || { parameter: {} };
  var quizId = e.parameter.quizId || e.parameter.id;
  var apiAction = e.parameter.api;
  
  // CORS & API Endpoints
  if (apiAction === 'getQuiz') {
    return createJsonResponse(getQuiz(quizId, false));
  } else if (apiAction === 'listQuizzes') {
    return createJsonResponse(listQuizzes());
  } else if (apiAction === 'getPollResults') {
    var qId = e.parameter.questionId;
    return createJsonResponse(getPollResults(quizId, qId));
  } else if (apiAction === 'ping') {
    return createJsonResponse({ status: 'ok', time: new Date().toISOString() });
  }
  
  // HTML Views
  if (quizId) {
    // Serve Quiz Player (for direct view, iframe embed, or popup modal)
    var template = HtmlService.createTemplateFromFile('quiz-player');
    template.quizId = quizId;
    template.embed = e.parameter.embed === '1' || e.parameter.embed === 'true';
    template.webAppUrl = ScriptApp.getService().getUrl();
    var output = template.evaluate()
      .setTitle('RK Quiz Player')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    return output;
  }
  
  // Default: Serve Creator / Admin Dashboard
  var template = HtmlService.createTemplateFromFile('quiz-dashboard');
  template.settings = getSettings();
  template.webAppUrl = ScriptApp.getService().getUrl();
  var output = template.evaluate()
    .setTitle('RK QuizMaker - Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return output;
}

/**
 * Web App POST Entry Point: Handles external AJAX / API submissions
 */
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (ex) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    var action = data.action;
    var result = { success: false, error: 'Unknown action' };
    
    if (action === 'submitQuizResponse') {
      result = submitQuizResponse(data.quizId, data.submission);
    } else if (action === 'submitPollVote') {
      result = submitPollVote(data.quizId, data.questionId, data.selectedOption);
    } else if (action === 'saveQuiz') {
      result = saveQuiz(data.quiz);
    } else if (action === 'deleteQuiz') {
      result = deleteQuiz(data.quizId);
    } else if (action === 'bulkImport') {
      result = bulkImportQuestions(data.quizId, data.rawText, data.format);
    }
    
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

/**
 * Helper to return CORS-friendly JSON
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Returns or automatically initializes the lifetime free Google Sheets Database
 */
function getOrCreateDatabaseSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(RK_DB_PROP_KEY);
  var ss;
  
  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch (e) {
      ss = null;
    }
  }
  
  if (!ss) {
    // Create new Database Sheet
    ss = SpreadsheetApp.create('RK_QuizMaker_Database');
    props.setProperty(RK_DB_PROP_KEY, ss.getId());
  }
  
  // Ensure required tabs exist
  ensureSheetHeaders(ss, 'Quizzes', [
    'id', 'title', 'description', 'timeLimitMinutes', 'passingScore',
    'allowRetake', 'showAnswers', 'shuffleQuestions', 'createdAt', 'status'
  ], '#4285F4');
  
  ensureSheetHeaders(ss, 'Questions', [
    'quizId', 'questionId', 'type', 'question', 'optionsJson',
    'correctAnswer', 'points', 'explanation', 'orderIndex'
  ], '#34A853');
  
  ensureSheetHeaders(ss, 'Responses', [
    'responseId', 'quizId', 'userName', 'userEmail', 'score',
    'totalPoints', 'percentage', 'passed', 'answersJson', 'submittedAt'
  ], '#EA4335');
  
  ensureSheetHeaders(ss, 'PollVotes', [
    'voteId', 'quizId', 'questionId', 'selectedOption', 'timestamp'
  ], '#FBBC04');
  
  return ss;
}

/**
 * Ensures a sheet with proper headers exists in the DB
 */
function ensureSheetHeaders(ss, sheetName, headers, headerColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground(headerColor || '#333333')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground(headerColor || '#333333')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Returns database spreadsheet URL for the user to view/manage in Google Drive
 */
function getDatabaseSpreadsheetUrl() {
  var ss = getOrCreateDatabaseSpreadsheet();
  return ss.getUrl();
}

/**
 * Allows setting a custom existing Google Sheet as the Database
 */
function setDatabaseSpreadsheetUrl(sheetUrl) {
  try {
    var ss = SpreadsheetApp.openByUrl(sheetUrl);
    PropertiesService.getScriptProperties().setProperty(RK_DB_PROP_KEY, ss.getId());
    getOrCreateDatabaseSpreadsheet(); // Ensure tables are initialized
    return { success: true, url: ss.getUrl() };
  } catch (err) {
    throw new Error('Invalid Google Sheet URL: ' + err.message);
  }
}

/**
 * Lists all quizzes with summary counts
 */
function listQuizzes() {
  var ss = getOrCreateDatabaseSpreadsheet();
  var quizSheet = ss.getSheetByName('Quizzes');
  var qSheet = ss.getSheetByName('Questions');
  
  var quizData = quizSheet.getDataRange().getValues();
  if (quizData.length < 2) return [];
  
  // Count questions per quiz
  var qCounts = {};
  var questionsData = qSheet.getDataRange().getValues();
  for (var i = 1; i < questionsData.length; i++) {
    var qQuizId = String(questionsData[i][0]);
    qCounts[qQuizId] = (qCounts[qQuizId] || 0) + 1;
  }
  
  var quizzes = [];
  for (var r = 1; r < quizData.length; r++) {
    var row = quizData[r];
    if (!row[0]) continue;
    var qId = String(row[0]);
    quizzes.push({
      id: qId,
      title: row[1] || 'Untitled Quiz',
      description: row[2] || '',
      timeLimitMinutes: Number(row[3]) || 0,
      passingScore: Number(row[4]) || 50,
      allowRetake: Boolean(row[5]),
      showAnswers: Boolean(row[6]),
      shuffleQuestions: Boolean(row[7]),
      createdAt: row[8] || '',
      status: row[9] || 'ACTIVE',
      questionCount: qCounts[qId] || 0
    });
  }
  
  return quizzes;
}

/**
 * Retrieves a single quiz and its questions
 * @param {string} quizId
 * @param {boolean} includeAnswers - If false (for test takers), strips correct answer & explanation
 */
function getQuiz(quizId, includeAnswers) {
  if (!quizId) throw new Error('Quiz ID is required');
  var ss = getOrCreateDatabaseSpreadsheet();
  var quizSheet = ss.getSheetByName('Quizzes');
  var qSheet = ss.getSheetByName('Questions');
  
  var quizRows = quizSheet.getDataRange().getValues();
  var quizMeta = null;
  for (var i = 1; i < quizRows.length; i++) {
    if (String(quizRows[i][0]) === String(quizId)) {
      var row = quizRows[i];
      quizMeta = {
        id: String(row[0]),
        title: row[1] || 'Untitled Quiz',
        description: row[2] || '',
        timeLimitMinutes: Number(row[3]) || 0,
        passingScore: Number(row[4]) || 50,
        allowRetake: Boolean(row[5]),
        showAnswers: Boolean(row[6]),
        shuffleQuestions: Boolean(row[7]),
        createdAt: row[8] || '',
        status: row[9] || 'ACTIVE'
      };
      break;
    }
  }
  
  if (!quizMeta) {
    throw new Error('Quiz not found with ID: ' + quizId);
  }
  
  // Fetch questions
  var qRows = qSheet.getDataRange().getValues();
  var questions = [];
  for (var j = 1; j < qRows.length; j++) {
    var qRow = qRows[j];
    if (String(qRow[0]) === String(quizId)) {
      var options = [];
      try {
        options = JSON.parse(qRow[4] || '[]');
      } catch (e) {
        options = String(qRow[4] || '').split(',').map(function(s) { return s.trim(); });
      }
      
      var qObj = {
        quizId: String(qRow[0]),
        questionId: String(qRow[1]),
        type: String(qRow[2]).toUpperCase(),
        question: qRow[3] || '',
        options: options,
        points: Number(qRow[6]) || 1,
        orderIndex: Number(qRow[8]) || j
      };
      
      if (includeAnswers) {
        qObj.correctAnswer = qRow[5];
        qObj.explanation = qRow[7] || '';
      }
      
      // If poll, also attach current poll stats
      if (qObj.type === 'POLL') {
        qObj.pollStats = getPollResults(quizId, qObj.questionId);
      }
      
      questions.push(qObj);
    }
  }
  
  // Sort questions
  questions.sort(function(a, b) { return a.orderIndex - b.orderIndex; });
  
  // Shuffle if needed for test-taker
  if (!includeAnswers && quizMeta.shuffleQuestions) {
    questions = shuffleArray(questions);
  }
  
  quizMeta.questions = questions;
  return quizMeta;
}

/**
 * Creates or updates a quiz and its questions
 */
function saveQuiz(quiz) {
  if (!quiz) throw new Error('Quiz data is missing');
  var ss = getOrCreateDatabaseSpreadsheet();
  var quizSheet = ss.getSheetByName('Quizzes');
  var qSheet = ss.getSheetByName('Questions');
  
  var quizId = quiz.id || ('quiz_' + Utilities.getUuid().slice(0, 8));
  var isNew = !quiz.id;
  var createdAt = quiz.createdAt || new Date().toISOString();
  
  var quizRows = quizSheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < quizRows.length; i++) {
    if (String(quizRows[i][0]) === String(quizId)) {
      rowIndex = i + 1;
      break;
    }
  }
  
  var rowData = [
    quizId,
    quiz.title || 'Untitled Quiz',
    quiz.description || '',
    Number(quiz.timeLimitMinutes) || 0,
    Number(quiz.passingScore) || 50,
    quiz.allowRetake !== false,
    quiz.showAnswers !== false,
    Boolean(quiz.shuffleQuestions),
    createdAt,
    quiz.status || 'ACTIVE'
  ];
  
  if (rowIndex > 0) {
    quizSheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    quizSheet.appendRow(rowData);
  }
  
  // Update Questions
  if (quiz.questions && Array.isArray(quiz.questions)) {
    // Remove existing questions for this quiz
    var qRows = qSheet.getDataRange().getValues();
    for (var k = qRows.length - 1; k >= 1; k--) {
      if (String(qRows[k][0]) === String(quizId)) {
        qSheet.deleteRow(k + 1);
      }
    }
    
    // Add updated questions
    var newQRows = [];
    for (var m = 0; m < quiz.questions.length; m++) {
      var q = quiz.questions[m];
      var qId = q.questionId || ('q_' + (m + 1) + '_' + Utilities.getUuid().slice(0, 4));
      var optionsJson = JSON.stringify(q.options || []);
      newQRows.push([
        quizId,
        qId,
        (q.type || 'MCQ').toUpperCase(),
        q.question || '',
        optionsJson,
        q.correctAnswer || '',
        Number(q.points) || 1,
        q.explanation || '',
        m + 1
      ]);
    }
    
    if (newQRows.length > 0) {
      qSheet.getRange(qSheet.getLastRow() + 1, 1, newQRows.length, newQRows[0].length).setValues(newQRows);
    }
  }
  
  return { success: true, quizId: quizId };
}

/**
 * Deletes a quiz and all associated data
 */
function deleteQuiz(quizId) {
  if (!quizId) throw new Error('Quiz ID required');
  var ss = getOrCreateDatabaseSpreadsheet();
  
  var sheets = ['Quizzes', 'Questions', 'Responses', 'PollVotes'];
  for (var s = 0; s < sheets.length; s++) {
    var sheet = ss.getSheetByName(sheets[s]);
    if (!sheet) continue;
    var data = sheet.getDataRange().getValues();
    var colIndex = (sheets[s] === 'Quizzes') ? 0 : (sheets[s] === 'Questions' ? 0 : 1);
    for (var r = data.length - 1; r >= 1; r--) {
      if (String(data[r][colIndex]) === String(quizId)) {
        sheet.deleteRow(r + 1);
      }
    }
  }
  return { success: true, deletedQuizId: quizId };
}

/**
 * Evaluates and records a quiz response in Google Sheets
 */
function submitQuizResponse(quizId, submission) {
  if (!quizId || !submission) throw new Error('Quiz ID and submission data are required');
  var ss = getOrCreateDatabaseSpreadsheet();
  var respSheet = ss.getSheetByName('Responses');
  
  var fullQuiz = getQuiz(quizId, true);
  var questions = fullQuiz.questions;
  var userAnswers = submission.answers || {};
  
  var score = 0;
  var totalPoints = 0;
  var review = [];
  
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    var qType = q.type.toUpperCase();
    var qId = q.questionId;
    var userAns = userAnswers[qId];
    var isCorrect = false;
    var pts = Number(q.points) || 1;
    
    if (qType === 'MCQ') {
      totalPoints += pts;
      if (userAns !== undefined && userAns !== null) {
        isCorrect = String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        if (isCorrect) score += pts;
      }
    } else if (qType === 'CHECKBOX') {
      totalPoints += pts;
      var correctArr = String(q.correctAnswer).split(',').map(function(s){ return s.trim().toLowerCase(); }).filter(Boolean);
      var userArr = Array.isArray(userAns) ? userAns.map(function(s){ return String(s).trim().toLowerCase(); }) : [String(userAns || '').trim().toLowerCase()];
      correctArr.sort();
      userArr.sort();
      isCorrect = (correctArr.join('|') === userArr.join('|'));
      if (isCorrect) score += pts;
    } else if (qType === 'SHORT_ANSWER' || qType === 'TEXT') {
      totalPoints += pts;
      var accepted = String(q.correctAnswer).split(',').map(function(s){ return s.trim().toLowerCase(); });
      var cleanUserAns = String(userAns || '').trim().toLowerCase();
      isCorrect = accepted.indexOf(cleanUserAns) > -1;
      if (isCorrect) score += pts;
    } else if (qType === 'LONG_ANSWER' || qType === 'PARAGRAPH') {
      // Long answers don't get auto-graded; totalPoints not increased or marked neutral
      isCorrect = null;
    } else if (qType === 'POLL') {
      // Record poll vote automatically
      if (userAns !== undefined && userAns !== null) {
        submitPollVote(quizId, qId, userAns);
      }
      isCorrect = null;
    }
    
    review.push({
      questionId: qId,
      question: q.question,
      type: qType,
      options: q.options,
      userAnswer: userAns,
      correctAnswer: fullQuiz.showAnswers ? q.correctAnswer : null,
      isCorrect: isCorrect,
      pointsEarned: isCorrect ? pts : 0,
      maxPoints: pts,
      explanation: fullQuiz.showAnswers ? q.explanation : ''
    });
  }
  
  var percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 100;
  var passed = percentage >= fullQuiz.passingScore;
  var responseId = 'resp_' + Utilities.getUuid().slice(0, 8);
  var submittedAt = new Date().toISOString();
  
  var respRow = [
    responseId,
    quizId,
    submission.userName || 'Anonymous',
    submission.userEmail || '',
    score,
    totalPoints,
    percentage,
    passed ? 'PASS' : 'FAIL',
    JSON.stringify(userAnswers),
    submittedAt
  ];
  
  respSheet.appendRow(respRow);
  
  return {
    success: true,
    responseId: responseId,
    userName: submission.userName,
    score: score,
    totalPoints: totalPoints,
    percentage: percentage,
    passed: passed,
    passingScore: fullQuiz.passingScore,
    review: review
  };
}

/**
 * Records a vote for a Poll question and returns live distribution percentages
 */
function submitPollVote(quizId, questionId, selectedOption) {
  if (!quizId || !questionId || selectedOption === undefined) {
    throw new Error('Quiz ID, question ID, and selected option are required');
  }
  var ss = getOrCreateDatabaseSpreadsheet();
  var pollSheet = ss.getSheetByName('PollVotes');
  
  var voteId = 'vote_' + Utilities.getUuid().slice(0, 8);
  pollSheet.appendRow([
    voteId,
    quizId,
    questionId,
    String(selectedOption),
    new Date().toISOString()
  ]);
  
  return getPollResults(quizId, questionId);
}

/**
 * Computes poll vote counts and percentages for a question
 */
function getPollResults(quizId, questionId) {
  var ss = getOrCreateDatabaseSpreadsheet();
  var pollSheet = ss.getSheetByName('PollVotes');
  var data = pollSheet.getDataRange().getValues();
  
  var counts = {};
  var totalVotes = 0;
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[1]) === String(quizId) && String(row[2]) === String(questionId)) {
      var opt = String(row[3]);
      counts[opt] = (counts[opt] || 0) + 1;
      totalVotes++;
    }
  }
  
  var percentages = {};
  for (var key in counts) {
    percentages[key] = totalVotes > 0 ? Math.round((counts[key] / totalVotes) * 100) : 0;
  }
  
  return {
    totalVotes: totalVotes,
    counts: counts,
    percentages: percentages
  };
}

/**
 * Bulk imports questions from plain text, CSV, or Google Sheet
 */
function bulkImportQuestions(quizId, rawData, format) {
  if (!quizId) throw new Error('Quiz ID is required for bulk import');
  format = (format || 'TEXT').toUpperCase();
  
  var parsedQuestions = [];
  if (format === 'TEXT') {
    parsedQuestions = parseBulkTextQuestions(rawData);
  } else if (format === 'CSV') {
    parsedQuestions = parseCsvQuestions(rawData);
  } else if (format === 'SHEET_URL') {
    parsedQuestions = parseSheetUrlQuestions(rawData);
  }
  
  if (!parsedQuestions || parsedQuestions.length === 0) {
    throw new Error('No valid questions could be parsed from the provided input.');
  }
  
  var ss = getOrCreateDatabaseSpreadsheet();
  var qSheet = ss.getSheetByName('Questions');
  
  var startOrder = qSheet.getLastRow();
  var newRows = [];
  for (var i = 0; i < parsedQuestions.length; i++) {
    var q = parsedQuestions[i];
    var qId = 'q_' + (startOrder + i) + '_' + Utilities.getUuid().slice(0, 4);
    newRows.push([
      quizId,
      qId,
      q.type,
      q.question,
      JSON.stringify(q.options || []),
      q.correctAnswer || '',
      Number(q.points) || 1,
      q.explanation || '',
      startOrder + i
    ]);
  }
  
  qSheet.getRange(qSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  
  return {
    success: true,
    importedCount: parsedQuestions.length,
    questions: parsedQuestions
  };
}

/**
 * Smart Plain-Text Question Parser
 * Supports MCQ, Checkbox, Short Answer, Long Answer, and Poll
 */
function parseBulkTextQuestions(text) {
  if (!text || typeof text !== 'string') return [];
  
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into question blocks (separated by 2 or more newlines)
  var blocks = text.split(/\n{2,}/);
  var questions = [];
  
  for (var b = 0; b < blocks.length; b++) {
    var block = blocks[b].trim();
    if (!block) continue;
    
    var lines = block.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
    if (lines.length === 0) continue;
    
    var firstLine = lines[0];
    
    // Check for explicit type tags like [POLL], [CHECKBOX], [SHORT], [LONG], [MCQ]
    var typeTagMatch = firstLine.match(/\[(POLL|CHECKBOX|SHORT|LONG|MCQ|TEXT|PARAGRAPH)\]/i);
    var explicitType = typeTagMatch ? typeTagMatch[1].toUpperCase() : null;
    
    // Clean question title: remove leading numbers like "1.", "Q1:", "1)" and type tag
    var qText = firstLine.replace(/^(?:Q\s*\d+[:.)]|\d+[:.)]\s*)/i, '')
                         .replace(/\[(?:POLL|CHECKBOX|SHORT|LONG|MCQ|TEXT|PARAGRAPH)\]/i, '')
                         .trim();
    
    var options = [];
    var correctAnswer = '';
    var explanation = '';
    var points = 1;
    
    for (var li = 1; li < lines.length; li++) {
      var line = lines[li];
      
      // Check Answer line
      var ansMatch = line.match(/^(?:Answer|Ans|Correct|Correct Answer)\s*[:=-]\s*(.*)$/i);
      if (ansMatch) {
        correctAnswer = ansMatch[1].trim();
        continue;
      }
      
      // Check Explanation line
      var expMatch = line.match(/^(?:Explanation|Explain|Note)\s*[:=-]\s*(.*)$/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        continue;
      }
      
      // Check Points line
      var ptsMatch = line.match(/^(?:Points|Marks)\s*[:=-]\s*(\d+)/i);
      if (ptsMatch) {
        points = parseInt(ptsMatch[1], 10);
        continue;
      }
      
      // Check Option lines: A) Option, [ ] Option, - Option, * Option
      var optMatch = line.match(/^(?:[A-H][).:\-\s]|\[[ xX]?\]|\*|\-|\u2022)\s*(.*)$/i);
      if (optMatch) {
        options.push(optMatch[1].trim());
      } else if (line.match(/^[A-H]\s*$/i)) {
        // Just the letter, skip
      } else {
        // Additional option without bullet or continuation
        if (options.length > 0) {
          options.push(line);
        } else {
          // If no options started yet, append to question title
          qText += ' ' + line;
        }
      }
    }
    
    // Infer question type if not explicitly tagged
    var determinedType = explicitType;
    if (!determinedType) {
      if (firstLine.toUpperCase().indexOf('POLL') > -1 || block.toUpperCase().indexOf('POLL:') > -1) {
        determinedType = 'POLL';
      } else if (options.length > 0) {
        if (correctAnswer.indexOf(',') > -1) {
          determinedType = 'CHECKBOX';
        } else {
          determinedType = 'MCQ';
        }
      } else if (correctAnswer) {
        determinedType = 'SHORT_ANSWER';
      } else {
        determinedType = 'LONG_ANSWER';
      }
    }
    
    if (determinedType === 'SHORT') determinedType = 'SHORT_ANSWER';
    if (determinedType === 'LONG') determinedType = 'LONG_ANSWER';
    if (determinedType === 'PARAGRAPH') determinedType = 'LONG_ANSWER';
    if (determinedType === 'TEXT') determinedType = 'SHORT_ANSWER';
    
    // Clean correct answer letter reference (e.g. if Answer is "B", map to Option value)
    if (correctAnswer && options.length > 0) {
      var letterMatch = correctAnswer.match(/^[A-H]$/i);
      if (letterMatch) {
        var idx = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
        if (options[idx]) {
          correctAnswer = options[idx];
        }
      }
    }
    
    questions.push({
      question: qText,
      type: determinedType,
      options: options,
      correctAnswer: correctAnswer,
      explanation: explanation,
      points: determinedType === 'POLL' ? 0 : points
    });
  }
  
  return questions;
}

/**
 * Parses CSV table data
 */
function parseCsvQuestions(csvText) {
  var rows = Utilities.parseCsv(csvText);
  if (rows.length < 2) return [];
  
  var questions = [];
  // Row 0 is header: Question, Type, Options (comma-sep), Answer, Points, Explanation
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    
    var qText = r[0];
    var type = (r[1] || 'MCQ').toUpperCase();
    var optsStr = r[2] || '';
    var ans = r[3] || '';
    var pts = Number(r[4]) || 1;
    var exp = r[5] || '';
    
    var opts = optsStr ? optsStr.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
    
    questions.push({
      question: qText,
      type: type,
      options: opts,
      correctAnswer: ans,
      points: pts,
      explanation: exp
    });
  }
  return questions;
}

/**
 * Imports questions from an external Google Sheet URL
 */
function parseSheetUrlQuestions(sheetUrl) {
  var ss = SpreadsheetApp.openByUrl(sheetUrl);
  var sheet = ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  var questions = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    
    var qText = row[0];
    var type = String(row[1] || 'MCQ').toUpperCase();
    var optsStr = String(row[4] || '');
    var ans = String(row[5] || '');
    var exp = String(row[2] || ''); // help text / explanation
    
    var opts = optsStr ? optsStr.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
    
    questions.push({
      question: qText,
      type: type,
      options: opts,
      correctAnswer: ans,
      points: 1,
      explanation: exp
    });
  }
  return questions;
}

/**
 * Helper to shuffle questions array
 */
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