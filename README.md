# 🎯 RK_QuizMaker (आरके क्विझ मेकर)

> **All-in-One Lifetime Free Quiz Maker & Embed Platform**  
> Quizzes for Blogs, Websites, and Google Forms with 1-Click OnClick Popup & Lifetime Free Google Sheets Database!  
> **Author:** [Ravindra Khillare](https://timepasstimewithravi.blogspot.com/) • **GitHub:** [RaviKhillare/RK_QuizMaker](https://github.com/RaviKhillare/RK_QuizMaker)

---

## 🌟 वैशिष्ट्ये / Key Features

1. **🚀 1-Click OnClick Embed for Blogs & Websites:**
   - तुमच्या Blogger ब्लॉगवर (`timepasstimewithravi.blogspot.com`), WordPress वर किंवा कोणत्याही वेबसाईटवर एका क्लिकवर क्विझ ॲड करा.
   - वाचक (Visitors) बटणावर क्लिक करताच क्विझ एका सुंदर **Popup Modal** मध्ये उघडते, किंवा पोस्टमध्ये **Inline Iframe** द्वारे दाखवता येते.
2. **📝 विविध प्रकारचे प्रश्न (5+ Question Types):**
   - **MCQ (Single Choice):** एकाधिक पर्यायांपैकी एक अचूक उत्तर, पॉईंट्स आणि स्पष्टीकरण.
   - **Checkbox (Multi Choice):** एकापेक्षा जास्त अचूक उत्तरे निवडण्यासाठी.
   - **Short Answer:** कीवर्ड किंवा अचूक शब्दांद्वारे ऑटो-इव्हॅल्युएशन.
   - **Long Answer:** वर्णनात्मक उत्तरे किंवा निबंधासाठी मल्टिलाइन टेक्स्टएरिया.
   - **Live Poll:** रिअल-टाइम व्होटिंग, मत दिल्यानंतर त्वरित ॲनिमेटेड पर्सेंटेज बार आणि व्होट्स दिसतात.
3. **⚡ Bulk Quiz Import (एकत्रित प्रश्न जोडण्याचा पर्याय):**
   - नोटपॅड, वर्ड किंवा व्हॉट्सॲपवरून प्रश्न थेट **Plain Text Paste** करा. आमचा स्मार्ट पार्सर आपोआप प्रश्न, ऑप्शन्स, उत्तरे आणि स्पष्टीकरण ओळखतो.
   - **CSV / Excel** किंवा **Google Sheets URL** द्वारे शेकडो प्रश्न एका सेकंदात इम्पोर्ट करा.
4. **💾 100% Lifetime Free Database:**
   - **Google Sheets** चा वापर डेटाबेस म्हणून केला आहे.
   - कोणताही क्रेडिट कार्ड नाही, कधीही एक्सपायर होत नाही (Supabase सारखे ७ दिवसात पॉज होत नाही), आणि थेट तुमच्या Google Drive मध्ये सेव्ह होते.
   - `Quizzes`, `Questions`, `Responses`, आणि `PollVotes` चे सर्व रेकॉर्ड्स तुम्ही शीटमध्ये थेट पाहू शकता.
5. **📋 Google Forms Add-on सुसंगतता:**
   - आधीचे Google Forms इम्पोर्ट/एक्सपोर्ट टूल देखील १००% सुरक्षित आहे.

---

## 📁 प्रोजेक्ट स्ट्रक्चर / Project Structure

```
RK_QuizMaker/
├── Code.gs                # Google Apps Script Backend (API, Web App, Database & Forms Logic)
├── quiz-player.html       # रिस्पॉन्सिव्ह क्विझ प्लेअर (MCQ, Short, Long, Poll, Timer, Score)
├── quiz-dashboard.html    # क्विझ क्रिएटर व ॲडमिन डॅशबोर्ड + बल्क इम्पोर्ट टूल + एम्बेड जनरेटर
├── embed.js               # ब्लॉगर व वेबसाईटसाठी १-क्लिक पॉपअप लायब्ररी
├── index.html             # GitHub Pages साठी स्टँडअलोन लँडिंग व डेमो पेज
├── appsscript.json        # Apps Script Manifest (OAuth Scopes & Anonymous WebApp access)
├── admin.html             # फॉर्म्स ॲडमिन पॅनल
├── admin-auth.html        # ॲडमिन पासवर्ड ऑथेंटिकेशन
├── sidebar.html           # Google Forms साइडबार इंटरफेस
└── README.md              # संपूर्ण माहिती व इन्स्टॉलेशन गाइड
```

---

## 🚀 इन्स्टॉलेशन व सेटअप गाइड (Installation & Setup)

### स्टेप १: Google Apps Script मध्ये कोड टाका
1. [script.google.com](https://script.google.com) उघडा आणि **New Project** वर क्लिक करा.
2. डाव्या बाजूला फाइल्स तयार करा:
   - `Code.gs` मधील कोड पेस्ट करा.
   - `quiz-player.html` फाइल तयार करून कोड पेस्ट करा.
   - `quiz-dashboard.html` फाइल तयार करून कोड पेस्ट करा.
   - (ऐच्छिक: Google Forms साठी `sidebar.html`, `admin.html`, `admin-auth.html`).
3. Project Settings (गिअर आयकॉन) वर जाऊन **Show "appsscript.json" manifest file** टिक करा आणि `appsscript.json` अपडेट करा.
4. सेव्ह करा (Ctrl + S).

### स्टेप २: Web App म्हणून Deploy करा
1. वरच्या **Deploy** बटणावर क्लिक करा -> **New deployment**.
2. गिअर आयकॉनवर क्लिक करून **Web App** निवडा.
3. खालील सेटिंग्स करा:
   - **Execute as:** `Me (your-email@gmail.com)`
   - **Who has access:** `Anyone` *(हे महत्त्वाचे आहे जेणेकरून तुमच्या ब्लॉगवरील वाचकांना लॉगिन न करता क्विझ सोडवता येईल)*
4. **Deploy** वर क्लिक करा आणि मिळालेली **Web App URL** कॉपी करा.

---

## 💻 ब्लॉगर किंवा वेबसाईटवर Quizzes कसे ॲड करावे? (How to Embed)

### पर्याय १: OnClick Popup Button (सर्वात सोपा व लोकप्रिय)
तुमच्या ब्लॉगर पोस्टमध्ये किंवा वर्डप्रेसमध्ये (HTML View मध्ये) खालील कोड पेस्ट करा:

```html
<!-- RK QuizMaker 1-Click Popup Button -->
<button class="rk-quiz-btn" onclick="RKQuiz.open('QUIZ_ID')">
  🎯 Take Quiz: महाराष्ट्र सामान्य ज्ञान
</button>
<script src="https://ravikhillare.github.io/RK_QuizMaker/embed.js" 
        data-server-url="YOUR_WEB_APP_URL"></script>
```

> **टीप:** `QUIZ_ID` च्या जागी तुमच्या क्विझचा आयडी (डॅशबोर्डमध्ये मिळतो) आणि `YOUR_WEB_APP_URL` च्या जागी तुमची Deploy केलेली URL टाका.

### पर्याय २: Inline Iframe Embed (पोस्टमध्ये थेट क्विझ दाखवण्यासाठी)
```html
<iframe src="YOUR_WEB_APP_URL?quizId=QUIZ_ID&embed=1" 
        width="100%" height="650" frameborder="0" 
        style="border:none; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1);" 
        allowfullscreen></iframe>
```

---

## 📝 Bulk Quiz Import कसे वापरावे? (Bulk Import Format)

डॅशबोर्डमधील **Bulk Import** टॅबमध्ये जाऊन खालीलप्रमाणे साध्या फॉरमॅटमध्ये प्रश्न पेस्ट करा:

```text
1. भारताची राजधानी कोणती आहे?
A) मुंबई
B) नवी दिल्ली
C) कोलकाता
D) चेन्नई
Answer: B
Explanation: १९११ मध्ये नवी दिल्ली राजधानी घोषित झाली.

2. खालीलपैकी कोणत्या वेब टेक्नॉलॉजीज आहेत? [CHECKBOX]
A) HTML
B) CSS
C) Python
Answer: A, B

3. पाण्याचे रासायनिक सूत्र काय आहे? [SHORT]
Answer: H2O

4. या क्विझबद्दल तुमचा अभिप्राय काय आहे? [POLL]
- उत्कृष्ट
- चांगला
- सरासरी
```

**Import to Database** वर क्लिक करताच सर्व प्रश्न एका सेकंदात गुगल शीटमध्ये सेव्ह होतात!

---

## 🗄️ Database Structure (Google Sheets)

तुमच्या Google Drive मध्ये `RK_QuizMaker_Database` नावाने शीट ऑटोमॅटिक तयार होते:
- **`Quizzes`**: Quiz ID, Title, Description, Time Limit, Passing Score, Settings.
- **`Questions`**: Question ID, Type (MCQ, Checkbox, Short, Long, Poll), Options, Answer, Points, Explanation.
- **`Responses`**: Participant Name, Email, Score, Percentage, Pass/Fail, Submitted Answers, Timestamp.
- **`PollVotes`**: Live Poll Votes & Real-time distribution.

---

## 👨‍💻 Developer & Credits

- **Developer:** Ravindra Khillare
- **Blog:** [timepasstimewithravi.blogspot.com](https://timepasstimewithravi.blogspot.com/)
- **Repository:** [github.com/RaviKhillare/RK_QuizMaker](https://github.com/RaviKhillare/RK_QuizMaker)
- **License:** MIT License (100% Free & Open Source)
