(function () {
  "use strict";

  var ALPHABET = ["الف","ب","پ","ت","ٹ","ث","ج","چ","ح","خ","د","ڈ","ذ","ر","ڑ","ز","ژ",
    "س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ک","گ","ل","م","ن","و","ہ","ی"];

  var UD = {"0":"۰","1":"۱","2":"۲","3":"۳","4":"۴","5":"۵","6":"۶","7":"۷","8":"۸","9":"۹"};
  function toUrdu(n){ return String(n).replace(/[0-9]/g, function(d){ return UD[d]; }); }

  var container   = document.getElementById("topicsContainer");
  var alphaNav    = document.getElementById("alphaNav");
  var searchInput = document.getElementById("searchInput");
  var clearBtn    = document.getElementById("clearSearch");
  var searchMeta  = document.getElementById("searchMeta");
  var emptyState  = document.getElementById("emptyState");

  // group by letter
  var byLetter = {}, presentLetters = [];
  TOPICS.forEach(function(t){
    if(!byLetter[t.l]){ byLetter[t.l] = []; presentLetters.push(t.l); }
    byLetter[t.l].push(t);
  });

  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function highlight(text, q){
    if(!q) return esc(text);
    var i = text.indexOf(q);
    if(i === -1) return esc(text);
    return esc(text.slice(0,i)) + '<mark>' + esc(text.slice(i,i+q.length)) + '</mark>' + esc(text.slice(i+q.length));
  }

  function cardHTML(t, q){
    return (
      '<article class="topic-card" id="topic-'+t.n+'">' +
        '<button class="topic-head" aria-expanded="false">' +
          '<span class="topic-num">'+toUrdu(t.n)+'</span>' +
          '<span class="topic-title">'+highlight(t.t,q)+'</span>' +
          '<span class="topic-ref-mini">'+esc(t.s)+'</span>' +
          '<span class="chevron" aria-hidden="true">&#9662;</span>' +
        '</button>' +
        '<div class="topic-body">' +
          '<div class="topic-body-inner">' +
            '<p class="ayat-arabic">'+t.ar+'</p>' +
            '<p class="ayat-urdu">'+highlight(t.u,q)+'</p>' +
            '<div class="ref-row">' +
              '<span class="badge">پارہ '+toUrdu(t.p)+'</span>' +
              '<span class="badge">سورہ '+esc(t.s)+'</span>' +
              '<span class="badge">رکوع '+toUrdu(t.r)+'</span>' +
              '<span class="badge">آیت '+toUrdu(t.a)+'</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function sectionHTML(letter, topics, q){
    return (
      '<section class="letter-section" data-letter="'+letter+'">' +
        '<div class="letter-divider" id="letter-'+letter+'">' +
          '<span class="letter-line"></span>' +
          '<span class="letter-medal"><span>'+letter+'</span></span>' +
          '<span class="letter-line"></span>' +
        '</div>' +
        '<div class="topics-grid">'+topics.map(function(t){ return cardHTML(t,q); }).join('')+'</div>' +
      '</section>'
    );
  }

  function render(list, q){
    if(!list.length){
      container.innerHTML = "";
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;
    var grouped = {}, order = [];
    list.forEach(function(t){
      if(!grouped[t.l]){ grouped[t.l]=[]; order.push(t.l); }
      grouped[t.l].push(t);
    });
    container.innerHTML = order.map(function(l){ return sectionHTML(l,grouped[l],q); }).join('');
  }

  function buildNav(){
    alphaNav.innerHTML = ALPHABET.map(function(l){
      var has = byLetter[l] && byLetter[l].length;
      return '<button class="alpha-btn'+(has?"":" disabled")+'" data-letter="'+l+'"'+
        (has?"":" disabled aria-disabled=\"true\"")+'>'+l+'</button>';
    }).join('');
  }

  function doSearch(){
    var q = (searchInput.value||"").trim();
    clearBtn.hidden = !q;
    if(!q){
      render(TOPICS,"");
      searchMeta.innerHTML = "";
      return;
    }
    var found = TOPICS.filter(function(t){
      return t.t.indexOf(q)!==-1 || t.u.indexOf(q)!==-1 || t.s.indexOf(q)!==-1;
    });
    render(found, q);
    if(!found.length){
      searchMeta.innerHTML = "";
    } else if(found.length === 1){
      searchMeta.innerHTML = "ایک مضمون ملا";
    } else {
      searchMeta.innerHTML = "<b>"+toUrdu(found.length)+"</b> مضامین ملے";
    }
  }

  // accordion
  container.addEventListener("click", function(e){
    var head = e.target.closest(".topic-head");
    if(!head) return;
    var card = head.closest(".topic-card");
    var opening = !card.classList.contains("open");
    card.classList.toggle("open", opening);
    head.setAttribute("aria-expanded", String(opening));
  });

  // alphabet nav click
  alphaNav.addEventListener("click", function(e){
    var btn = e.target.closest(".alpha-btn");
    if(!btn || btn.disabled) return;
    if(searchInput.value){ searchInput.value=""; doSearch(); }
    var target = document.getElementById("letter-"+btn.dataset.letter);
    if(target){
      var offset = alphaNav.offsetHeight + 10;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - offset, behavior:"smooth" });
    }
  });

  searchInput.addEventListener("input", doSearch);
  clearBtn.addEventListener("click", function(){
    searchInput.value="";
    doSearch();
    searchInput.focus();
  });

  // scroll spy — highlight active letter in nav
  var spy = null;
  function setupSpy(){
    if(typeof IntersectionObserver === "undefined") return;
    if(spy) spy.disconnect();
    var dividers = document.querySelectorAll(".letter-divider");
    if(!dividers.length) return;
    spy = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          var l = e.target.id.replace("letter-","");
          alphaNav.querySelectorAll(".alpha-btn").forEach(function(b){
            b.classList.toggle("active", b.dataset.letter === l);
          });
        }
      });
    },{ rootMargin:"-40% 0px -50% 0px" });
    dividers.forEach(function(d){ spy.observe(d); });
  }

  new MutationObserver(setupSpy).observe(container,{childList:true});

  buildNav();
  render(TOPICS,"");
})();
