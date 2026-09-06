(function () {
  const BTT_DARK_CSS = `
    html, body {
      background-color: #0f172a !important;
      color: #cbd5e1 !important;
      min-height: 100vh;
    }
    a:link, a:visited {
      color: #60a5fa !important;
    }
    a:hover {
      color: #93c5fd !important;
    }
    .windowbg, #preview_body, div#preview_body {
      background-color: #1e293b !important;
      color: #cbd5e1 !important;
    }
    .windowbg2 {
      background-color: #182234 !important;
      color: #cbd5e1 !important;
    }
    .windowbg3 {
      background-color: #1e293b !important;
      color: #cbd5e1 !important;
    }
    .catbg, .catbg2, .catbg3, tr.catbg td, tr.catbg2 td, tr.catbg3 td {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      background-image: none !important;
    }
    .titlebg, .titlebg2, tr.titlebg td, tr.titlebg2 td, tr.titlebg th, tr.titlebg2 th, #preview_subject, td#preview_subject {
      background-color: #334155 !important;
      color: #f8fafc !important;
      background-image: none !important;
    }
    .bordercolor, .tborder {
      background-color: #334155 !important;
      border: 1px solid #334155 !important;
    }
    #topic_summary, #topic_summary table, #topic_summary tbody, #topic_summary tr, #topic_summary td {
      background-color: #1e293b !important;
      color: #cbd5e1 !important;
    }
    #topic_summary .windowbg2, #topic_summary tr.windowbg2 td {
      background-color: #182234 !important;
      color: #cbd5e1 !important;
    }
    #topic_summary .catbg, #topic_summary .catbg2, #topic_summary .catbg3,
    #topic_summary tr.catbg td, #topic_summary tr.catbg2 td, #topic_summary tr.catbg3 td {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      background-image: none !important;
    }
    #topic_summary .titlebg, #topic_summary tr.titlebg td {
      background-color: #334155 !important;
      color: #f8fafc !important;
      background-image: none !important;
    }
    #quickReplyOptions, #quickReplyOptions table, #quickReplyOptions td, #quickReplyOptions tr {
      background-color: #1e293b !important;
      color: #cbd5e1 !important;
      border-color: #334155 !important;
    }
    #quickReplyOptions .catbg, #quickReplyOptions .titlebg {
      background-color: #334155 !important;
      color: #f8fafc !important;
      background-image: none !important;
    }
    .maintab_back, .maintab_active_back,
    .maintab_left, .maintab_right,
    .maintab_active_left, .maintab_active_right,
    .mirrortab_back, .mirrortab_active_back,
    .mirrortab_left, .mirrortab_right,
    .mirrortab_active_left, .mirrortab_active_right {
      background-color: #1e293b !important;
      background-image: none !important;
      border-color: #475569 !important;
    }
    .maintab_active_back, .maintab_active_left, .maintab_active_right,
    .mirrortab_active_back, .mirrortab_active_left, .mirrortab_active_right {
      background-color: #334155 !important;
    }
    .maintab_back a, .maintab_left a, .maintab_right a,
    .mirrortab_back a, .mirrortab_left a, .mirrortab_right a {
      color: #94a3b8 !important;
      font-weight: 700 !important;
      text-decoration: none !important;
      text-shadow: none !important;
    }
    .maintab_back a:hover, .mirrortab_back a:hover {
      color: #f8fafc !important;
      text-decoration: none !important;
    }
    .maintab_active_back a, .maintab_active_left a, .maintab_active_right a,
    .mirrortab_active_back a, .mirrortab_active_left a, .mirrortab_active_right a {
      color: #60a5fa !important;
      font-weight: 800 !important;
      text-decoration: none !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
    }
    textarea, select, button, input:not([type="checkbox"]):not([type="radio"]) {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      border: 1px solid #475569 !important;
    }
    textarea:focus, input:focus, select:focus {
      outline: none !important;
      border-color: #60a5fa !important;
      box-shadow: 0 0 0 1px #60a5fa !important;
    }
    select option {
      background-color: #1e293b !important;
      color: #f8fafc !important;
    }
    input[type="submit"], input[type="button"], input[type="reset"], button {
      cursor: pointer;
    }
    input[type="submit"]:hover, input[type="button"]:hover, button:hover {
      background-color: #334155 !important;
      border-color: #60a5fa !important;
      color: #ffffff !important;
    }
    img[style*="bbc_bg.gif"] {
      background-image: none !important;
      background-color: #334155 !important;
      border-radius: 3px;
    }
    .post, .inner, .keyinfo, .smalltext, .middletext, .nav, td, #preview_body, #preview_subject, #topic_summary, td[id^="msg"] {
      color: #cbd5e1 !important;
    }
    form[action*="action=pm"] .windowbg, form[action*="action=pm"] .windowbg2, form[action*="action=pm"] td[class^="windowbg"], form[action*="action=pm"] .signature {
      background-color: #0f172a !important;
      color: #cbd5e1 !important;
    }
    form[action*="action=post"] .windowbg, form#postmodify .windowbg {
      background-color: #1e293b !important;
      color: #cbd5e1 !important;
    }
    form[action*="action=post"] .windowbg2, form#postmodify .windowbg2 {
      background-color: #182234 !important;
      color: #cbd5e1 !important;
    }
    .quote, .quoteheader, blockquote, div.quote, td.quote, .code, .codeheader {
      background-color: #020617 !important;
      border: 1px solid #475569 !important;
      color: #cbd5e1 !important;
    }
    .quoteheader, .codeheader {
      color: #94a3b8 !important;
      font-weight: 700 !important;
    }
    abbr, acronym, span[title], span[style*="border-bottom"], span[style*="dotted"], *[style*="border-bottom"], *[style*="dotted"] {
      border-bottom-color: #94a3b8 !important;
    }
    abbr, acronym, span[title] {
      border-bottom: 1px dotted #94a3b8 !important;
      text-decoration: none !important;
    }
    .smalltext, .middletext {
      color: #94a3b8 !important;
    }
    .smalltext i, .smalltext em {
      color: #cbd5e1 !important;
    }
    hr, .hrcolor {
      background-color: #334155 !important;
      color: #334155 !important;
      border-color: #334155 !important;
      height: 1px !important;
      border: 0 !important;
    }
    .error {
      color: #f87171 !important;
      font-weight: bold !important;
    }
    .highlight {
      background-color: #854d0e !important;
      color: #fef08a !important;
    }
  `;

  function injectDark() {
    let style = document.getElementById("ere-btt-dark-theme");
    if (!style) {
      style = document.createElement("style");
      style.id = "ere-btt-dark-theme";
      style.textContent = BTT_DARK_CSS;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  function removeDark() {
    document.getElementById("ere-btt-dark-theme")?.remove();
    document.getElementById("ere-btt-dark-theme-boot")?.remove();
  }

  try {
    if (localStorage.getItem("ere_btt_dark_theme") === "1") {
      let bootStyle = document.getElementById("ere-btt-dark-theme-boot");
      if (!bootStyle) {
        bootStyle = document.createElement("style");
        bootStyle.id = "ere-btt-dark-theme-boot";
        bootStyle.textContent = `
          html, body {
            background-color: #0f172a !important;
            color: #cbd5e1 !important;
          }
        `;
        (document.head || document.documentElement).appendChild(bootStyle);
      }
    }
  } catch (e) {}

  chrome.storage.local.get("bitcointalkDarkTheme", (data) => {
    if (data && data.bitcointalkDarkTheme) {
      try { localStorage.setItem("ere_btt_dark_theme", "1"); } catch (e) {}
      injectDark();
    } else {
      try { localStorage.removeItem("ere_btt_dark_theme"); } catch (e) {}
      removeDark();
    }
  });
})();
