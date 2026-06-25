(function () {
  "use strict";

  var ALPHABET = ["الف","ب","پ","ت","ٹ","ث","ج","چ","ح","خ","د","ڈ","ذ","ر","ڑ","ز","ژ",
    "س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ک","گ","ل","م","ن","و","ہ","ی"];

  var UD = { "0":"۰","1":"۱","2":"۲","3":"۳","4":"۴","5":"۵","6":"۶","7":"۷","8":"۸","9":"۹" };
  function toUrdu(num) {
    return String(num).replace(/[0-9]/g, function (d) { return UD[d]; });
  }

  var container = document.getElementById("topicsContainer");
  var alphaNav = document.getElementById("alphaNav");
  var searchInput = document.getElementById("searchInput");
  var clearBtn = document.getElementById("clearSearch");
  var searchMeta = document.getElementById("searchMeta");
  var emptyState = document.getElementById("emptyState");

  // group topics by letter, preserving file order
  var byLetter = {};
  var presentLetters = [];
  TOPICS.forEach(function (t) {
    if (!byLetter[t.l]) { byLetter[t.l] = []; presentLetters.push(t.l); }
    byLetter[t.l].push(t);
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    var idx = text.indexOf(q);
    if (idx === -1) return escapeHtml(text);
    return escapeHtml(text.slice(0, idx)) + "<mark>" + escapeHtml(text.slice(idx, idx + q.length)) + "</mark>" + escapeHtml(text.slice(idx + q.length));
  }

  function topicCardHTML(t, q) {
    return (
      '<article class="topic-card" id="topic-' + t.n + '" data-n="' + t.n + '">' +
        '<button class="topic-head" aria-expanded="false">' +
          '<span class="topic-num">' + toUrdu(t.n) + '</span>' +
          '<span class="topic-title">' + highlight(t.t, q) + '</span>' +
          '<span class="topic-ref-mini">' + escapeHtml(t.s) + '</span>' +
          '<span class="chevron">&#9662;</span>' +
        '</button>' +
        '<div class="topic-body">' +
          '<div class="topic-body-inner">' +
            '<p class="ayat-arabic">' + t.ar + '</p>' +
            '<p class="ayat-urdu">' + highlight(t.u, q) + '</p>' +
            '<div class="ref-badges">' +
              '<span class="badge">پارہ ' + toUrdu(t.p) + '</span>' +
              '<span class="badge">سورہ ' + escapeHtml(t.s) + ' (' + toUrdu(t.sn) + ')</span>' +
              '<span class="badge">رکوع ' + toUrdu(t.r) + '</span>' +
              '<span class="badge">آیت ' + toUrdu(t.a) + '</span>' +
              '<span class="badge translator">ترجمہ: شیخ الہند محمود الحسنؒ</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function letterSectionHTML(letter, topics, q) {
    var cards = topics.map(function (t) { return topicCardHTML(t, q); }).join("");
    return (
      '<section class="letter-section" data-letter="' + letter + '">' +
        '<div class="letter-divider" id="letter-' + letter + '">' +
          '<span class="letter-line"></span>' +
          '<span class="letter-medal"><span>' + letter + '</span></span>' +
          '<span class="letter-line"></span>' +
        '</div>' +
        '<div class="topics-grid">' + cards + '</div>' +
      '</section>'
    );
  }

  function render(filtered, q) {
    if (filtered.length === 0) {
      container.innerHTML = "";
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;
    var grouped = {};
    var order = [];
    filtered.forEach(function (t) {
      if (!grouped[t.l]) { grouped[t.l] = []; order.push(t.l); }
      grouped[t.l].push(t);
    });
    var html = order.map(function (l) { return letterSectionHTML(l, grouped[l], q); }).join("");
    container.innerHTML = html;
  }

  function buildAlphaNav() {
    var html = ALPHABET.map(function (l) {
      var has = byLetter[l] && byLetter[l].length > 0;
      return '<button class="alpha-btn' + (has ? "" : " disabled") + '" data-letter="' + l + '"' +
        (has ? "" : " disabled aria-disabled=\"true\"") + '>' + l + "</button>";
    }).join("");
    alphaNav.innerHTML = html;
  }

  function normalize(s) {
    return (s || "").toString().trim();
  }

  function runSearch() {
    var q = normalize(searchInput.value);
    clearBtn.hidden = q.length === 0;
    if (!q) {
      render(TOPICS, "");
      searchMeta.innerHTML = "";
      return;
    }
    var filtered = TOPICS.filter(function (t) {
      return t.t.indexOf(q) !== -1 || t.u.indexOf(q) !== -1 || t.s.indexOf(q) !== -1;
    });
    render(filtered, q);
    searchMeta.innerHTML = "<b>" + toUrdu(filtered.length) + "</b> نتائج ملے، بلحاظ \"" + escapeHtml(q) + "\"";
  }

  // accordion toggle (event delegation)
  container.addEventListener("click", function (e) {
    var head = e.target.closest(".topic-head");
    if (!head) return;
    var card = head.closest(".topic-card");
    var isOpen = card.classList.contains("open");
    card.classList.toggle("open", !isOpen);
    head.setAttribute("aria-expanded", String(!isOpen));
  });

  alphaNav.addEventListener("click", function (e) {
    var btn = e.target.closest(".alpha-btn");
    if (!btn || btn.disabled) return;
    if (searchInput.value) {
      searchInput.value = "";
      runSearch();
    }
    var target = document.getElementById("letter-" + btn.dataset.letter);
    if (target) {
      var navHeight = alphaNav.offsetHeight + 8;
      var y = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  });

  searchInput.addEventListener("input", runSearch);
  clearBtn.addEventListener("click", function () {
    searchInput.value = "";
    runSearch();
    searchInput.focus();
  });

  // highlight active alpha button on scroll
  var observer = null;
  function setupObserver() {
    if (typeof IntersectionObserver === "undefined") return;
    if (observer) observer.disconnect();
    var dividers = document.querySelectorAll(".letter-divider");
    if (!dividers.length) return;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var letter = entry.target.id.replace("letter-", "");
          alphaNav.querySelectorAll(".alpha-btn").forEach(function (b) {
            b.classList.toggle("active", b.dataset.letter === letter);
          });
        }
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    dividers.forEach(function (d) { observer.observe(d); });
  }

  // re-run observer setup whenever the list re-renders
  var mo = new MutationObserver(setupObserver);
  mo.observe(container, { childList: true });

  // init
  document.getElementById("statTotal").textContent = toUrdu(TOPICS.length);
  buildAlphaNav();
  render(TOPICS, "");
})();
