(function () {
  const TRANSITION_MS = 700;

  const deck = document.getElementById('deck');
  const dotsNav = document.getElementById('dots');
  const contentsList = document.getElementById('contentsList');
  const contentsBox = document.getElementById('contents');
  const contentsToggle = document.getElementById('contentsToggle');

  let current = 0;
  let isAnimating = false;

  const slides = Array.from(document.querySelectorAll('.slide'));
  const SLIDE_COUNT = slides.length;
  slides[0].classList.add('is-active');

  for (let i = 0; i < SLIDE_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'page-dot';
    dot.dataset.index = i;
    dot.addEventListener('click', () => goTo(i));
    dotsNav.appendChild(dot);
  }
  const dots = Array.from(dotsNav.querySelectorAll('.page-dot'));
  dots[0].classList.add('is-active');

  slides.forEach((slide, i) => {
    const title = slide.dataset.title || `Slide ${i + 1}`;
    const li = document.createElement('li');
    li.dataset.index = i;
    li.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span><span>${title}</span>`;
    li.addEventListener('click', () => {
      goTo(i);
      closeContents();
    });
    contentsList.appendChild(li);
  });
  const contentsItems = Array.from(contentsList.children);
  contentsItems[0].classList.add('is-active');

  function render() {
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === current);
      s.classList.toggle('is-prev', i < current);
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    contentsItems.forEach((li, i) => li.classList.toggle('is-active', i === current));
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(SLIDE_COUNT - 1, index));
    if (target === current || isAnimating) return;
    isAnimating = true;
    current = target;
    render();
    window.setTimeout(() => { isAnimating = false; }, TRANSITION_MS);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  let wheelCooldown = false;
  deck.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (wheelCooldown || isAnimating) return;
    if (Math.abs(e.deltaY) < 10) return;
    wheelCooldown = true;
    if (e.deltaY > 0) next(); else prev();
    window.setTimeout(() => { wheelCooldown = false; }, TRANSITION_MS + 150);
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    if (e.key === 'End') { e.preventDefault(); goTo(SLIDE_COUNT - 1); }
  });

  let touchStartY = null;
  deck.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  deck.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 50) { dy > 0 ? next() : prev(); }
    touchStartY = null;
  }, { passive: true });

  function openContents() {
    contentsBox.classList.add('is-open');
    contentsToggle.setAttribute('aria-expanded', 'true');
  }
  function closeContents() {
    contentsBox.classList.remove('is-open');
    contentsToggle.setAttribute('aria-expanded', 'false');
  }
  contentsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    contentsBox.classList.contains('is-open') ? closeContents() : openContents();
  });
  document.addEventListener('click', (e) => {
    if (!contentsBox.contains(e.target)) closeContents();
  });

  render();
})();
