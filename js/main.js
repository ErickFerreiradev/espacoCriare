
/* ---------- 1) MENU + CABEÇALHO ---------- */
(function () {
  var header = document.querySelector('header');
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('menu');

  if (!header || !toggle || !nav) return;

  function setMenu(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }

  toggle.addEventListener('click', function () {
    setMenu(!nav.classList.contains('open'));
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 860) setMenu(false);
  });

  // Sombra no cabeçalho ao rolar
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Destaca no menu a seção que está na tela
  if ('IntersectionObserver' in window) {
    var links = {};
    nav.querySelectorAll('a').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) {
          links[id].classList.toggle('active', id === entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    ['inicio', 'sobre', 'atendimentos', 'espaco', 'contato'].forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }
})();

/* ---------- 2) CARROSSÉIS ---------- */
(function () {
  var carousels = document.querySelectorAll('.carousel');

  carousels.forEach(function (c) {
    var track = c.querySelector('.carousel-track');
    var originalSlides = track ? Array.from(track.children) : [];
    var dots = c.querySelector('.carousel-dots');
    var autoplayInterval = null;
    var userInteracted = false;

    if (!track || !dots || originalSlides.length === 0) return;

    // 1. DUAS VELOCIDADES DIFERENTES DE TRANSIÇÃO
    var AUTO_TRANSITION = 'transform 2s cubic-bezier(0.25, 1, 0.5, 1)'; // Deslize longo e elegante para o auto
    var MANUAL_TRANSITION = 'transform 0.3s ease-out';                      // Resposta rápida para cliques/touch

    var slidesCount = originalSlides.length;
    var isTransitioning = false;

    // Clonagem para loop infinito
    var firstClone = originalSlides[0].cloneNode(true);
    var lastClone = originalSlides[slidesCount - 1].cloneNode(true);

    track.appendChild(firstClone);
    track.insertBefore(lastClone, originalSlides[0]);

    var currentIndex = 1;

    // Posição inicial sem animação
    track.style.transition = 'none';
    track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';

    // Criação dos dots
    dots.innerHTML = '';
    for (var k = 0; k < slidesCount; k++) {
      (function (k) {
        var b = document.createElement('button');
        b.setAttribute('aria-label', 'Ir para foto ' + (k + 1));
        b.onclick = function () { 
          if (isTransitioning) return;
          pauseAutoplayPermanently();
          goToRealIndex(k, false); // Transição manual rápida
        };
        dots.appendChild(b);
      })(k);
    }
    
    function updateDots() {
        var dotButtons = dots.children;
        var activeIndex = currentIndex - 1;
        
        if (currentIndex === 0) activeIndex = slidesCount - 1;
        if (currentIndex === slidesCount + 1) activeIndex = 0;
        
        for (var j = 0; j < dotButtons.length; j++) {
          dotButtons[j].classList.toggle('active', j === activeIndex);
        }
    }
    updateDots();

    function goToRealIndex(n, isAuto) {
      currentIndex = n + 1;
      applyTransition(isAuto);
    }

    function slide(direction, isAuto) {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex += direction;
      applyTransition(isAuto);
    }

    // Aplica a velocidade baseando-se em quem acionou a mudança
    function applyTransition(isAuto) {
      track.style.transition = isAuto ? AUTO_TRANSITION : MANUAL_TRANSITION;
      track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
      updateDots();
    }

    // Pulo invisível de ajuste do loop
    track.addEventListener('transitionend', function() {
      isTransitioning = false;
      
      if (currentIndex === slidesCount + 1) {
        track.style.transition = 'none';
        currentIndex = 1;
        track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
      } else if (currentIndex === 0) {
        track.style.transition = 'none';
        currentIndex = slidesCount;
        track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
      }
    });

    // Setas com velocidade rápida (manual)
    var prevBtn = c.querySelector('.prev');
    var nextBtn = c.querySelector('.next');

    if (prevBtn) {
      prevBtn.onclick = function () { 
        pauseAutoplayPermanently(); 
        slide(-1, false); 
      };
    }
    if (nextBtn) {
      nextBtn.onclick = function () { 
        pauseAutoplayPermanently(); 
        slide(1, false); 
      };
    }

    // Touch no celular com velocidade rápida (manual)
    var startX = null;
    c.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      pauseAutoplayPermanently();
    }, { passive: true });

    c.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) {
        slide(dx < 0 ? 1 : -1, false);
      }
      startX = null;
    });

    // Autoplay com velocidade suave (automática)
    function startAutoplay() {
      if (userInteracted) return;
      
      clearInterval(autoplayInterval);
      autoplayInterval = setInterval(function () {
        if (!isTransitioning) slide(1, true); // true ativa o estilo AUTO_TRANSITION
      }, 9000); 
    }

    function pauseAutoplayPermanently() {
      userInteracted = true;
      clearInterval(autoplayInterval);
    }

    c.addEventListener('mouseenter', function() {
      clearInterval(autoplayInterval);
    });
    
    c.addEventListener('mouseleave', function() {
      if (!userInteracted) startAutoplay();
    });

    startAutoplay();
  });
})();

/* ---------- 3) ANIMAÇÃO DE ENTRADA AO ROLAR ---------- */
(function () {
  var els = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('active'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('active');
      io.unobserve(el);
      // depois de aparecer, tira o atraso para o efeito de hover ser imediato
      setTimeout(function () { el.style.transitionDelay = '0s'; }, 1300);
    });
  }, { threshold: 0.1 });

  els.forEach(function (el) { io.observe(el); });
})();
