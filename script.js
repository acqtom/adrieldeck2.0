(function () {
  const TRANSITION_MS = 700;

  const deck = document.getElementById('deck');
  const dotsNav = document.getElementById('dots');
  const contentsList = document.getElementById('contentsList');
  const contentsBox = document.getElementById('contents');
  const contentsToggle = document.getElementById('contentsToggle');

  let current = 0;
  let isAnimating = false;

  // ---- Read slides already in the DOM ----
  const slides = Array.from(document.querySelectorAll('.slide'));
  const SLIDE_COUNT = slides.length;
  slides[0].classList.add('is-active');

  // ---- Build dots ----
  for (let i = 0; i < SLIDE_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'page-dot';
    dot.dataset.index = i;
    dot.addEventListener('click', () => goTo(i));
    dotsNav.appendChild(dot);
  }
  const dots = Array.from(dotsNav.querySelectorAll('.page-dot'));
  dots[0].classList.add('is-active');

  // ---- Build contents list ----
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

  // ---- Navigation ----
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

  // ---- Wheel navigation (one slide per gesture) ----
  let wheelCooldown = false;
  deck.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (wheelCooldown || isAnimating) return;
    if (Math.abs(e.deltaY) < 10) return;
    wheelCooldown = true;
    if (e.deltaY > 0) next(); else prev();
    window.setTimeout(() => { wheelCooldown = false; }, TRANSITION_MS + 150);
  }, { passive: false });

  // ---- Keyboard navigation ----
  window.addEventListener('keydown', (e) => {
    if (pdfModal.classList.contains('is-open')) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    if (e.key === 'End') { e.preventDefault(); goTo(SLIDE_COUNT - 1); }
  });

  // ---- Touch navigation ----
  let touchStartY = null;
  deck.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  deck.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 50) { dy > 0 ? next() : prev(); }
    touchStartY = null;
  }, { passive: true });

  // ---- Contents panel toggle ----
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

  // ---- Proof document viewer (PDF modal) ----
  const proofGroups = {
    deal01: [
      { type: 'pdf', src: 'assets/deal01-cd-3506.pdf', label: 'Closing Disclosure — 3506 Noah St' },
      { type: 'pdf', src: 'assets/deal01-cd-3504.pdf', label: 'Closing Disclosure — 3504 Noah St' }
    ],
    saphira: [
      { type: 'pdf', src: 'assets/saphira-appraisal.pdf', label: 'Appraisal Report — Saphira Apartments ($3.3M)' }
    ],
    deal03: [
      { type: 'image', src: 'assets/deal03-breakdown.png', label: 'Deal 03 — $430K to $2.2M Profit Breakdown' }
    ]
  };

  const pdfModal = document.getElementById('pdfModal');
  const pdfFrame = document.getElementById('pdfFrame');
  const pdfImage = document.getElementById('pdfImage');
  const pdfLabel = document.getElementById('pdfLabel');
  const pdfCounter = document.getElementById('pdfCounter');
  const pdfPrev = pdfModal.querySelector('.pdf-nav.prev');
  const pdfNext = pdfModal.querySelector('.pdf-nav.next');
  const pdfClose = pdfModal.querySelector('.pdf-close');
  const pdfBackdrop = pdfModal.querySelector('.pdf-modal-backdrop');

  let currentProofGroup = null;
  let currentProofIndex = 0;

  function renderProof() {
    const docs = proofGroups[currentProofGroup];
    const doc = docs[currentProofIndex];
    const isImage = doc.type === 'image';
    pdfFrame.style.display = isImage ? 'none' : 'block';
    pdfImage.style.display = isImage ? 'block' : 'none';
    if (isImage) {
      pdfFrame.src = '';
      pdfImage.src = doc.src;
      pdfImage.alt = doc.label;
    } else {
      pdfImage.src = '';
      pdfFrame.src = doc.src;
    }
    pdfLabel.textContent = doc.label;
    pdfCounter.textContent = `${currentProofIndex + 1} / ${docs.length}`;
    const multiple = docs.length > 1;
    pdfPrev.style.display = multiple ? 'flex' : 'none';
    pdfNext.style.display = multiple ? 'flex' : 'none';
  }

  function openProof(groupName, index) {
    if (!proofGroups[groupName]) return;
    currentProofGroup = groupName;
    currentProofIndex = index;
    renderProof();
    pdfModal.classList.add('is-open');
    pdfModal.setAttribute('aria-hidden', 'false');
  }

  function closeProof() {
    pdfModal.classList.remove('is-open');
    pdfModal.setAttribute('aria-hidden', 'true');
    pdfFrame.src = '';
    pdfImage.src = '';
  }

  function stepProof(delta) {
    const docs = proofGroups[currentProofGroup];
    currentProofIndex = (currentProofIndex + delta + docs.length) % docs.length;
    renderProof();
  }

  document.querySelectorAll('[data-proof-group]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const group = el.dataset.proofGroup;
      const index = parseInt(el.dataset.proofIndex || '0', 10);
      openProof(group, index);
    });
  });

  pdfPrev.addEventListener('click', () => stepProof(-1));
  pdfNext.addEventListener('click', () => stepProof(1));
  pdfClose.addEventListener('click', closeProof);
  pdfBackdrop.addEventListener('click', closeProof);
  window.addEventListener('keydown', (e) => {
    if (!pdfModal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeProof();
    if (e.key === 'ArrowLeft') stepProof(-1);
    if (e.key === 'ArrowRight') stepProof(1);
  });

  render();
})();
