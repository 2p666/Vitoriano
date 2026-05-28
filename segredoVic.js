const body = document.body;
    const lockStage = document.getElementById('lock-stage');
    const chestStage = document.getElementById('chest-stage');
    const letterStage = document.getElementById('letter-stage');

    const lockAltar = document.getElementById('lock-altar');
    const lockWrap = document.getElementById('lock-wrap');
    const lockImage = document.getElementById('lock-image');
    const lockFallback = document.getElementById('lock-fallback');
    const lockHitArea = document.getElementById('lock-hit-area');
    const slotGlow = document.getElementById('slot-glow');

    const keyWrap = document.getElementById('key-wrap');
    const keyImage = document.getElementById('key-image');
    const keyFallback = document.getElementById('key-fallback');

    const puzzlePanel = document.getElementById('puzzle-panel');
    const puzzleText = document.getElementById('puzzle-text');

    const chestFrontBtn = document.getElementById('chest-front-btn');
    const chestFrontView = document.getElementById('chest-front-view');
    const chestTopView = document.getElementById('chest-top-view');
    const chestBaseFrontImg = document.getElementById('chest-base-front-img');
    const chestLidFrontImg = document.getElementById('chest-lid-front-img');
    const chestTopImg = document.getElementById('chest-top-img');
    const lidFallImg = document.getElementById('lid-fall-img');
    const frontFallback = document.getElementById('front-fallback');
    const topFallback = document.getElementById('top-fallback');

    const itemCarta = document.getElementById('item-carta');

    const ribbonKnot = document.getElementById('ribbon-knot');
    const ribbonImage = document.getElementById('ribbon-image');
    const ribbonFallback = document.getElementById('ribbon-fallback');
    const letterOverlay = document.getElementById('letter-overlay');

    const scrollBody = document.getElementById('scroll-body');
    const letterContent = document.getElementById('letter-content');
    const topNote = document.getElementById('top-note');
    const candleCursor = document.getElementById('candle-cursor');
    const lanternToggle = document.getElementById('lantern-toggle');
    const lanternImage = document.getElementById('lantern-image');
    const lanternFallback = document.getElementById('lantern-fallback');
    const dustCanvas = document.getElementById('dust-canvas');

    let dragActive = false;
    let unlocked = false;
    let letterOpened = false;
    let chestOpened = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let puzzleMode = false;
    let keyInserted = false;
    let lanternActive = false;
    let lanternTransferred = false;

    const keyState = { angle: -32 };
    const lockRequiredAngle = 90;
    const keyRotateStep = 14;

    let userLightClicks = 0;
    let targetLightSize = 290;
    let currentLightSize = 290;
    let decayTimeout = null;

    const perf = {
      mouseRAF: 0,
      mx: window.innerWidth / 2,
      my: window.innerHeight / 2,
      candleRAF: 0,
      dragRAF: 0,
      dx: 0,
      dy: 0
    };

    function imageFallback(imgEl, fallbackEl, displayType = 'block'){
      if (!imgEl) return;
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        fallbackEl.style.display = displayType;
      });
      imgEl.addEventListener('load', () => {
        if (!imgEl.naturalWidth) {
          imgEl.style.display = 'none';
          fallbackEl.style.display = displayType;
        }
      });
    }

    imageFallback(lockImage, lockFallback, 'grid');
    imageFallback(keyImage, keyFallback, 'block');
    imageFallback(ribbonImage, ribbonFallback, 'block');
    imageFallback(chestBaseFrontImg, frontFallback, 'grid');
    imageFallback(chestLidFrontImg, frontFallback, 'grid');
    imageFallback(chestTopImg, topFallback, 'grid');
    imageFallback(lanternImage, lanternFallback, 'grid');

    if (lidFallImg) {
      lidFallImg.src = chestLidFrontImg ? chestLidFrontImg.getAttribute('src') : 'imgVic/tampa-bau.png';
    }

    document.querySelectorAll('.treasure-item').forEach((item) => {
      const img = item.querySelector('img');
      const fallback = item.querySelector('.item-fallback');
      if (!img || !fallback) return;
      img.addEventListener('error', () => {
        img.style.display = 'none';
        fallback.style.display = 'grid';
      });
      img.addEventListener('load', () => {
        if (!img.naturalWidth) {
          img.style.display = 'none';
          fallback.style.display = 'grid';
        }
      });
    });

    function setTopNote(text){
      topNote.innerHTML = `<span class="magic-note">${text}</span>`;
    }

    function updateKeyTransform(extra = '') {
      keyWrap.style.transform = `rotate(${keyState.angle}deg) ${extra}`.trim();
    }
    updateKeyTransform();

    function updateLight(x, y){
      document.documentElement.style.setProperty('--light-x', x + 'px');
      document.documentElement.style.setProperty('--light-y', y + 'px');
      candleCursor.style.left = x + 'px';
      candleCursor.style.top = y + 'px';
    }

    function queueLight(x, y){
      perf.mx = x;
      perf.my = y;
      if (perf.mouseRAF) return;
      perf.mouseRAF = requestAnimationFrame(() => {
        updateLight(perf.mx, perf.my);
        perf.mouseRAF = 0;
      });
    }

    function updateLanternPosition(){
      const rect = lanternToggle.getBoundingClientRect();
      const lx = rect.left + rect.width / 2;
      const ly = rect.top + rect.height / 2 + 10;
      document.documentElement.style.setProperty('--lantern-x', `${lx}px`);
      document.documentElement.style.setProperty('--lantern-y', `${ly}px`);
    }

    function setLightTargetFromClicks(){
      if (lanternTransferred) return;
      targetLightSize = Math.min(680, 290 + userLightClicks * 52);
    }

    function registerLightClick(){
      if (lanternTransferred) return;
      userLightClicks = Math.min(userLightClicks + 1, 8);
      setLightTargetFromClicks();

      clearTimeout(decayTimeout);
      decayTimeout = setTimeout(() => {
        const decay = () => {
          if (userLightClicks <= 0 || lanternTransferred) return;
          userLightClicks--;
          setLightTargetFromClicks();
          if (userLightClicks > 0) {
            decayTimeout = setTimeout(decay, 550);
          }
        };
        decay();
      }, 5000);
    }

    window.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      registerLightClick();
    });

    window.addEventListener('mousemove', (e) => queueLight(e.clientX, e.clientY));
    window.addEventListener('pointermove', (e) => queueLight(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) queueLight(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive:true });

    function startCandleFlicker(){
      let t = 0;
      const animate = () => {
        t += 0.022;

        const a = (Math.sin(t * 1.8) + 1) / 2;
        const b = (Math.sin(t * 4.2 + 1.3) + 1) / 2;
        const c = (Math.sin(t * 9.4 + .6) + 1) / 2;

        const intensity = 0.82 + a * 0.20 + b * 0.18 + c * 0.12;
        const glow = 16 + a * 18 + b * 10 + c * 5;

        currentLightSize += (targetLightSize - currentLightSize) * 0.045;
        const flickerSize = currentLightSize + (a * 26) + (b * 14);
        document.documentElement.style.setProperty('--light-size', `${Math.max(0, flickerSize).toFixed(1)}px`);
        document.documentElement.style.setProperty('--flicker', intensity.toFixed(3));

        if (lanternActive) {
          const lf = 0.92 + a * 0.08 + b * 0.06 + c * 0.04;
          document.documentElement.style.setProperty('--lantern-flicker', lf.toFixed(3));
          updateLanternPosition();
        }

        candleCursor.style.filter = `drop-shadow(0 0 ${glow.toFixed(1)}px var(--cursor-shadow))`;
        perf.candleRAF = requestAnimationFrame(animate);
      };
      if (!perf.candleRAF) perf.candleRAF = requestAnimationFrame(animate);
    }

    function clamp(v, min, max){
      return Math.max(min, Math.min(max, v));
    }

    function normalizeAngle(a){
      return ((a % 360) + 360) % 360;
    }

    function angleDiff(a, b){
      let diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
      return Math.min(diff, 360 - diff);
    }

    function beginDrag(clientX, clientY){
      if (unlocked || keyInserted) return;
      const rect = keyWrap.getBoundingClientRect();
      dragActive = true;
      keyWrap.classList.add('dragging');
      dragOffsetX = clientX - rect.left;
      dragOffsetY = clientY - rect.top;
      queueLight(clientX, clientY);
    }

    function moveDrag(clientX, clientY){
      if (!dragActive || unlocked || keyInserted) return;

      perf.dx = clientX;
      perf.dy = clientY;
      if (perf.dragRAF) return;

      perf.dragRAF = requestAnimationFrame(() => {
        const w = keyWrap.offsetWidth;
        const h = keyWrap.offsetHeight;
        const left = clamp(perf.dx - dragOffsetX, -40, window.innerWidth - w + 40);
        const top = clamp(perf.dy - dragOffsetY, -40, window.innerHeight - h + 40);

        keyWrap.style.left = left + 'px';
        keyWrap.style.top = top + 'px';
        queueLight(perf.dx, perf.dy);

        detectTouchLock(false);
        perf.dragRAF = 0;
      });
    }

    function endDrag(clientX, clientY){
      if (!dragActive) return;
      dragActive = false;
      keyWrap.classList.remove('dragging');
      if (typeof clientX === 'number' && typeof clientY === 'number') {
        queueLight(clientX, clientY);
      }
      detectTouchLock(true);
    }

    keyWrap.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      beginDrag(e.clientX, e.clientY);
      keyWrap.setPointerCapture(e.pointerId);
    });

    keyWrap.addEventListener('pointermove', (e) => {
      if (!dragActive) return;
      e.preventDefault();
      moveDrag(e.clientX, e.clientY);
    });

    keyWrap.addEventListener('pointerup', (e) => {
      endDrag(e.clientX, e.clientY);
      try { keyWrap.releasePointerCapture(e.pointerId); } catch(err){}
    });

    keyWrap.addEventListener('pointercancel', () => endDrag());

    window.addEventListener('keydown', (e) => {
      if (!puzzleMode || unlocked) return;

      if (e.key === 'q' || e.key === 'Q') {
        keyState.angle -= keyRotateStep;
        updateKeyTransform();
        tryUnlock();
      }

      if (e.key === 'e' || e.key === 'E') {
        keyState.angle += keyRotateStep;
        updateKeyTransform();
        tryUnlock();
      }
    });

    function rectsOverlap(a, b){
      return !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
      );
    }

    function activatePuzzleMode(){
      if (puzzleMode || unlocked) return;
      puzzleMode = true;
      keyInserted = true;

      keyWrap.classList.add('puzzle-mode', 'near-lock');
      slotGlow.classList.add('active');
      puzzlePanel.classList.add('show');

      setTopNote('Agora gire a chave até a posição que o buraco exige.');
      puzzleText.innerHTML = 'Use Q e E para girar a chave até a posição <span class="magic-note">90°</span>.';

      const lockRect = lockWrap.getBoundingClientRect();
      const keyRect = keyWrap.getBoundingClientRect();

      const targetLeft = lockRect.left + lockRect.width * 0.36 - keyRect.width * 0.5;
      const targetTop = lockRect.top + lockRect.height * 0.46 - keyRect.height * 0.5;

      keyWrap.style.left = `${targetLeft}px`;
      keyWrap.style.top = `${targetTop}px`;
    }

    function detectTouchLock(onDrop = false){
      if (unlocked || puzzleMode) return;

      const keyRect = keyWrap.getBoundingClientRect();
      const lockRect = lockHitArea.getBoundingClientRect();

      const touching = rectsOverlap(keyRect, lockRect);
      keyWrap.classList.toggle('near-lock', touching);

      if (touching) slotGlow.classList.add('active');
      else if (!puzzleMode) slotGlow.classList.remove('active');

      if ((touching && dragActive) || (touching && onDrop)) {
        activatePuzzleMode();
      }
    }

    function tryUnlock(){
      if (!puzzleMode || unlocked) return;
      const diff = angleDiff(keyState.angle, lockRequiredAngle);
      if (diff <= 10) unlockHeart();
    }

    function unlockHeart(){
      if (unlocked) return;
      unlocked = true;

      puzzlePanel.classList.remove('show');
      slotGlow.classList.remove('active');

      keyState.angle = lockRequiredAngle;
      updateKeyTransform('scale(.96)');
      keyWrap.style.opacity = '.25';

      lockAltar.classList.add('unlocked');
      lockWrap.classList.add('unlocked');

      setTopNote('O cadeado cedeu. Agora o segredo repousa dentro do baú.');

      setTimeout(() => {
        lockStage.classList.remove('visible');
        lockStage.classList.add('hidden');
        chestStage.classList.add('visible');
      }, 1500);
    }

    function openChest(){
      if (chestOpened) return;
      chestOpened = true;

      setTopNote('O baú se abriu. Escolha um dos seis itens.');
      chestFrontView.classList.add('fade');

      setTimeout(() => {
        chestTopView.classList.add('visible');
      }, 500);
    }

    chestFrontBtn.addEventListener('click', openChest);

    function openLetterStage(){
      setTopNote('Entre os objetos, há uma carta selada à tua espera.');
      chestStage.classList.remove('visible');
      chestStage.classList.add('hidden');
      letterStage.classList.add('visible');
      updateLanternPosition();
    }

    function closeLetterStage(){
      letterStage.classList.remove('visible');
      letterStage.classList.add('hidden');
      chestStage.classList.remove('hidden');
      chestStage.classList.add('visible');

      scrollBody.classList.remove('unrolled');
      scrollBody.classList.add('closed');
      letterContent.classList.remove('visible');
      ribbonKnot.style.display = '';
      ribbonKnot.classList.remove('untying');
      letterOpened = false;

      setTopNote('O baú permanece aberto. Os demais itens ainda aguardam.');
    }

function resetLetterState() {
  letterOpened = false;

  scrollBody.classList.remove('unrolled');
  scrollBody.classList.add('closed');

  letterContent.classList.remove('visible');

  ribbonKnot.style.display = '';
  ribbonKnot.classList.remove('untying');
}

function openLetterStage() {
  resetLetterState();

  chestStage.classList.remove('visible');
  chestStage.classList.add('hidden');

  letterStage.classList.remove('hidden');
  letterStage.classList.add('visible');

  setTopNote('Entre os objetos, há uma carta selada à tua espera.');
  updateLanternPosition();
}

function closeLetterStage() {
  letterStage.classList.remove('visible');
  letterStage.classList.add('hidden');

  chestStage.classList.remove('hidden');
  chestStage.classList.add('visible');

  resetLetterState();

  setTopNote('O baú permanece aberto. Os demais itens ainda aguardam.');
}

itemCarta.addEventListener('click', () => {
  openLetterStage();
});

ribbonKnot.addEventListener('click', (e) => {
  e.stopPropagation();
  if (letterOpened) return;

  letterOpened = true;
  ribbonKnot.classList.add('untying');

  setTimeout(() => {
    ribbonKnot.style.display = 'none';
    scrollBody.classList.remove('closed');
    scrollBody.classList.add('unrolled');
  }, 700);

  setTimeout(() => {
    letterContent.classList.add('visible');
  }, 1200);
});

letterOverlay.addEventListener('click', () => {
  closeLetterStage();
});


    letterOverlay.addEventListener('click', closeLetterStage);

    lanternToggle.addEventListener('click', () => {
      if (lanternTransferred) return;

      lanternTransferred = true;
      lanternActive = true;

      body.classList.add('lantern-active');
      lanternToggle.classList.add('active', 'locked-transfer');
      document.documentElement.style.setProperty('--lantern-on', '1');

      userLightClicks = 0;
      targetLightSize = 0;
      currentLightSize = 0;

      clearTimeout(decayTimeout);
      updateLanternPosition();
      puzzlePanel.classList.remove('show');

      setTopNote('A chama foi entregue à lanterna. Agora ela ilumina o caminho.');
    });

    let dustCtx, dustW, dustH, dustRAF;
    const dustParticles = [];
    const DUST_COUNT = 54;

    function resizeDust() {
      const rect = dustCanvas.getBoundingClientRect();
      const ratio = 1;
      dustW = rect.width || window.innerWidth;
      dustH = rect.height || window.innerHeight;
      dustCanvas.width = dustW * ratio;
      dustCanvas.height = dustH * ratio;
      dustCanvas.style.width = dustW + 'px';
      dustCanvas.style.height = dustH + 'px';
      dustCtx = dustCanvas.getContext('2d', { alpha: true });
      dustCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
      updateLanternPosition();
    }

    function seedDust() {
      dustParticles.length = 0;
      for (let i = 0; i < DUST_COUNT; i++) {
        dustParticles.push({
          x: Math.random() * dustW,
          y: Math.random() * dustH,
          r: .4 + Math.random() * 1.6,
          vx: -.08 + Math.random() * .16,
          vy: -.04 + Math.random() * .08,
          a: .03 + Math.random() * .12
        });
      }
    }

    function startDust() {
      resizeDust();
      seedDust();

      let lastTime = 0;
      const frameDelay = 1000 / 30;

      const animate = (time = 0) => {
        if (time - lastTime >= frameDelay) {
          lastTime = time;
          dustCtx.clearRect(0, 0, dustW, dustH);

          for (let i = 0; i < dustParticles.length; i++) {
            const p = dustParticles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -10) p.x = dustW + 10;
            if (p.x > dustW + 10) p.x = -10;
            if (p.y < -10) p.y = dustH + 10;
            if (p.y > dustH + 10) p.y = -10;

            dustCtx.fillStyle = `rgba(255,120,120,${p.a * 0.75})`;
            dustCtx.beginPath();
            dustCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            dustCtx.fill();
          }
        }
        dustRAF = requestAnimationFrame(animate);
      };

      animate();
    }

    window.addEventListener('resize', resizeDust);

    updateLight(window.innerWidth / 2, window.innerHeight / 2);
    updateLanternPosition();
    startCandleFlicker();
    startDust();

    const letterCloseBtn = document.querySelector('.letter-close');
if (letterCloseBtn) {
  letterCloseBtn.addEventListener('click', closeLetterStage);
}


/* =========================================================
   ITEM 2 — RELICÁRIO DO NOSSO FILHINHO
   Código isolado e robusto: não depende dos outros itens.
========================================================= */
(function(){
  const FILHINHO_HEART_IMAGES = [
    'imgVic/coracão.png',
    'imgVic/coracão.png',
    'imgVic/coracão.png'
  ];

  const FILHINHO_HEART_TOTAL = 38;
  const FILHINHO_REVEAL_DELAY = 1150;

  let coracoesAtivos = [];

  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function soltarCoracoesFilhinho(itemFilhinho){
    coracoesAtivos.forEach((heart) => heart.remove());
    coracoesAtivos = [];

    const rect = itemFilhinho ? itemFilhinho.getBoundingClientRect() : null;
    const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const startY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    for (let i = 0; i < FILHINHO_HEART_TOTAL; i++) {
      const heart = document.createElement('img');
      heart.src = FILHINHO_HEART_IMAGES[i % FILHINHO_HEART_IMAGES.length];
      heart.alt = '';
      heart.setAttribute('aria-hidden', 'true');
      heart.draggable = false;
      heart.className = 'filhinho-heart';

      const side = Math.random() < .5 ? -1 : 1;
      const x = side * (160 + Math.random() * (window.innerWidth * .62));
      const y = -120 - Math.random() * (window.innerHeight * .78);
      const size = 34 + Math.random() * 58;
      const scale = .75 + Math.random() * .9;
      const spin = side * (130 + Math.random() * 280);
      const rot = -45 + Math.random() * 90;
      const delay = Math.random() * .48;
      const duration = 2.25 + Math.random() * 1.7;

      heart.style.setProperty('--heart-start-x', `${startX}px`);
      heart.style.setProperty('--heart-start-y', `${startY}px`);
      heart.style.setProperty('--heart-x', `${x.toFixed(1)}px`);
      heart.style.setProperty('--heart-y', `${y.toFixed(1)}px`);
      heart.style.setProperty('--heart-size', `${size.toFixed(1)}px`);
      heart.style.setProperty('--heart-scale', scale.toFixed(2));
      heart.style.setProperty('--heart-spin', `${spin.toFixed(1)}deg`);
      heart.style.setProperty('--heart-rot', `${rot.toFixed(1)}deg`);
      heart.style.setProperty('--heart-delay', `${delay.toFixed(2)}s`);
      heart.style.setProperty('--heart-duration', `${duration.toFixed(2)}s`);

      document.body.appendChild(heart);
      coracoesAtivos.push(heart);
    }

    setTimeout(() => {
      coracoesAtivos.forEach((heart) => heart.remove());
      coracoesAtivos = [];
    }, 5200);
  }

  function abrirFilhinho(){
    const stage = document.getElementById('filhinho-stage');
    const itemFilhinho = document.getElementById('item-filhinho') || document.querySelector('.treasure-item.item-2');
    const video = document.getElementById('filhinho-video');

    if (!stage) {
      console.warn('Relicário do filhinho não encontrado: elemento #filhinho-stage não existe no HTML.');
      return;
    }

    document.body.classList.add('filhinho-rosa');
    stage.classList.add('filhinho-open');
    stage.classList.remove('hearts-revealed');
    stage.setAttribute('aria-hidden', 'false');

    if (video) {
      try { video.pause(); video.currentTime = 0; } catch(e){}
    }

    soltarCoracoesFilhinho(itemFilhinho);

    setTimeout(() => {
      if (stage.classList.contains('filhinho-open')) stage.classList.add('hearts-revealed');
    }, FILHINHO_REVEAL_DELAY);

    if (typeof setTopNote === 'function') {
      setTopNote('Nosso filhinho pintou a chama de rosa e abriu o próprio relicário.');
    }
  }

  function fecharFilhinho(){
    const stage = document.getElementById('filhinho-stage');
    const video = document.getElementById('filhinho-video');

    if (!stage) return;

    stage.classList.remove('filhinho-open', 'hearts-revealed');
    stage.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('filhinho-rosa');

    if (video) {
      try { video.pause(); video.currentTime = 0; } catch(e){}
    }

    coracoesAtivos.forEach((heart) => heart.remove());
    coracoesAtivos = [];

    if (typeof setTopNote === 'function') {
      setTopNote('O baú permanece aberto. Os demais itens ainda aguardam.');
    }
  }

  ready(() => {
    const itemFilhinho = document.getElementById('item-filhinho') || document.querySelector('.treasure-item.item-2');
    const overlay = document.getElementById('filhinho-overlay');
    const close = document.getElementById('filhinho-close');

    if (itemFilhinho) {
      itemFilhinho.id = 'item-filhinho';
      itemFilhinho.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        abrirFilhinho();
      });
    }

    // Delegação extra em captura: garante abertura mesmo se a imagem/fallback receber o clique.
    document.addEventListener('click', (e) => {
      const item = e.target.closest && e.target.closest('#item-filhinho, .treasure-item.item-2');
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      abrirFilhinho();
    }, true);

    if (overlay) overlay.addEventListener('click', fecharFilhinho);
    if (close) close.addEventListener('click', fecharFilhinho);

    window.abrirFilhinho = abrirFilhinho;
    window.fecharFilhinho = fecharFilhinho;
  });
})();


/* =========================================================
   ITENS 3, 4, 5 E 6 — MICRO-MUNDOS DO BAÚ
========================================================= */
(function(){
  const configs = [
    { item: 'item-memoria', stage: 'memoria-stage', bodyClass: 'memory-relic-active', note: 'Uma memória antiga acordou dentro do baú.' },
    { item: 'item-sombra', stage: 'sombra-stage', bodyClass: 'shadow-relic-active', note: 'O canal secreto se abriu. As mensagens ficam guardadas no relicário.' },
    { item: 'item-futuro', stage: 'futuro-stage', bodyClass: 'future-relic-active', note: 'O futuro abriu pequenas constelações para vocês.' },
    { item: 'item-coracao', stage: 'coracao-stage', bodyClass: 'heart-relic-active', note: 'No fim, o coração não precisa de ornamento.' }
  ];

  const openStages = new Set();
  let currentBodyClass = null;

  function $(id){ return document.getElementById(id); }

  function playSoft(src, volume = 0.32){
    if (!src) return;
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return audio;
    } catch(e){}
  }

  function closeAllRelics(){
    configs.forEach(cfg => {
      const stage = $(cfg.stage);
      if (stage) {
        stage.classList.remove('open');
        stage.setAttribute('aria-hidden', 'true');
      }
      document.body.classList.remove(cfg.bodyClass);
    });
    currentBodyClass = null;
    const voice = $('heart-voice');
    if (voice) { try { voice.pause(); voice.currentTime = 0; } catch(e){} }
    if (typeof setTopNote === 'function') setTopNote('O baú permanece aberto. Os demais itens ainda aguardam.');
  }

  function openRelic(cfg){
    closeAllRelics();
    const stage = $(cfg.stage);
    if (!stage) return;
    stage.classList.add('open');
    stage.setAttribute('aria-hidden', 'false');
    document.body.classList.add(cfg.bodyClass);
    currentBodyClass = cfg.bodyClass;
    if (typeof setTopNote === 'function') setTopNote(cfg.note);
    playSoft('S.M/RelicarioHover.mp3', 0.22);
  }

  function bindRelics(){
    configs.forEach(cfg => {
      const item = $(cfg.item);
      if (!item) return;
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openRelic(cfg);
      });
    });

    document.querySelectorAll('[data-close-relic]').forEach(el => {
      el.addEventListener('click', closeAllRelics);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllRelics();
    });
  }


  /* Canal secreto — Firebase / Firestore */
  const firebaseConfig = {
    apiKey: "AIzaSyDG0RVNTRQpi0Gst5BSrkmj4lgPFYCn_FE",
    authDomain: "relicario-melissa.firebaseapp.com",
    projectId: "relicario-melissa",
    storageBucket: "relicario-melissa.firebasestorage.app",
    messagingSenderId: "234022650056",
    appId: "1:234022650056:web:44953bbd9b560ccfdea5fd",
    measurementId: "G-SZM1ZDYP7S"
  };

  let chatInicializado = false;
  let chatDb = null;
  let chatUnsubscribe = null;

  function formatarHora(timestamp){
    try {
      const date = timestamp && timestamp.toDate ? timestamp.toDate() : new Date();
      return date.toLocaleString('pt-BR', {
        day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'
      });
    } catch(e){
      return '';
    }
  }

  function escaparTexto(texto){
    return String(texto || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function criarFlashDeSelo(){
    const flash = document.createElement('div');
    flash.className = 'chat-seal-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 980);
  }

  function renderizarMensagens(snapshot){
    const messages = $('chat-messages');
    if (!messages) return;

    if (!snapshot || snapshot.empty) {
      messages.innerHTML = '<div class="chat-empty">Nenhuma mensagem selada ainda.</div>';
      return;
    }

    const html = [];
    snapshot.forEach(doc => {
      const data = doc.data() || {};
      const author = data.author || data.from || 'Relicário';
      const text = data.message || '';
      const isPaulo = author.toLowerCase().includes('paulo');
      html.push(`
        <article class="chat-message ${isPaulo ? 'from-paulo' : 'from-melissa'}">
          <div class="chat-message-head">
            <span class="chat-message-author">${escaparTexto(author)}</span>
            <span class="chat-message-time">${formatarHora(data.createdAt)}</span>
          </div>
          <div class="chat-message-text">${escaparTexto(text)}</div>
        </article>
      `);
    });

    messages.innerHTML = html.join('');
    messages.scrollTop = messages.scrollHeight;
  }

  function inicializarChatSecreto(){
    if (chatInicializado) return;
    chatInicializado = true;

    const form = $('chat-form');
    const input = $('chat-input');
    const author = $('chat-author');
    const status = $('chat-status');
    const messages = $('chat-messages');
    const sendBtn = $('chat-send');

    if (!form || !input || !author || !status || !messages) return;

    const ultimoAutor = localStorage.getItem('relicario_chat_author');
    if (ultimoAutor) author.value = ultimoAutor;
    author.addEventListener('change', () => {
      localStorage.setItem('relicario_chat_author', author.value);
    });

    if (!window.firebase || !firebase.firestore) {
      status.textContent = 'Firebase não carregou. Confira sua internet e os scripts do HTML.';
      status.className = 'chat-status error';
      messages.innerHTML = '<div class="chat-empty">Não foi possível abrir o canal.</div>';
      return;
    }

    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      chatDb = firebase.firestore();

      chatUnsubscribe = chatDb.collection('mensagens')
        .orderBy('createdAt', 'asc')
        .limit(80)
        .onSnapshot((snapshot) => {
          renderizarMensagens(snapshot);
          status.textContent = 'Canal sincronizado.';
          status.className = 'chat-status ok';
        }, (error) => {
          console.error(error);
          status.textContent = 'Erro ao ler mensagens. Confira as regras do Firestore.';
          status.className = 'chat-status error';
          messages.innerHTML = '<div class="chat-empty">O relicário não conseguiu ler as mensagens.</div>';
        });
    } catch(error) {
      console.error(error);
      status.textContent = 'Erro ao iniciar o canal secreto.';
      status.className = 'chat-status error';
      return;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const texto = input.value.trim();
      const nome = author.value || 'Melissa';

      if (!texto) {
        status.textContent = 'Escreva algo antes de selar.';
        status.className = 'chat-status error';
        input.focus();
        return;
      }

      try {
        if (sendBtn) sendBtn.disabled = true;
        status.textContent = 'Selando mensagem...';
        status.className = 'chat-status';

        await chatDb.collection('mensagens').add({
          author: nome,
          message: texto,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        input.value = '';
        criarFlashDeSelo();
        playSoft('S.M/MensagemSelada.mp3', 0.28);
        status.textContent = 'Mensagem selada no relicário.';
        status.className = 'chat-status ok';
      } catch(error) {
        console.error(error);
        status.textContent = 'Não consegui enviar. Confira as regras do Firestore.';
        status.className = 'chat-status error';
      } finally {
        if (sendBtn) sendBtn.disabled = false;
      }
    });
  }

  function setupMemory(){
    const box = $('memory-text-box');
    document.querySelectorAll('.memory-polaroid').forEach(polaroid => {
      polaroid.addEventListener('mouseenter', () => {
        document.querySelectorAll('.memory-polaroid').forEach(p => p.classList.remove('active'));
        polaroid.classList.add('active');
        if (box) box.textContent = polaroid.dataset.memoryText || '';
        if (polaroid.dataset.memoryAudio) playSoft(polaroid.dataset.memoryAudio, 0.38);
      });
      polaroid.addEventListener('click', () => {
        if (box) box.textContent = polaroid.dataset.memoryText || '';
        if (polaroid.dataset.memoryAudio) playSoft(polaroid.dataset.memoryAudio, 0.45);
      });
    });
  }

  function setupShadow(){
    const confession = $('shadow-confession');
    const responses = [
      'Eu tive medo, sim. Medo de não ser suficiente, medo de perder, medo de não saber cuidar direito do que era raro.',
      'Às vezes amar não veio como uma habilidade pronta. Veio como tentativa, erro, vergonha e vontade de fazer melhor.',
      'Nem toda insegurança nasceu em você. Algumas eu trouxe de antes, e precisei aprender a não colocar esse peso no nosso amor.',
      'No fim, a parte mais verdadeira não foi nunca falhar. Foi continuar escolhendo você com mais consciência do que antes.'
    ];
    document.querySelectorAll('.shadow-fragment').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shadow-fragment').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (confession) confession.textContent = responses[i] || btn.textContent;
        playSoft('S.M/Sombra.mp3', 0.24);
      });
    });
  }

  function setupFuture(){
    const msg = $('future-message');
    document.querySelectorAll('.star-point').forEach(star => {
      star.addEventListener('click', () => {
        document.querySelectorAll('.star-point').forEach(s => s.classList.remove('active'));
        star.classList.add('active');
        if (msg) msg.textContent = star.dataset.star || 'Uma promessa acendeu.';
        playSoft('S.M/Estrela.mp3', 0.24);
      });
    });
  }

  function setupHeart(){
    const btn = $('heart-voice-btn');
    const audio = $('heart-voice');
    if (!btn || !audio) return;
    btn.addEventListener('click', () => {
      try {
        audio.currentTime = 0;
        audio.volume = 0.72;
        audio.play().catch(() => {});
      } catch(e){}
    });
  }

  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(() => {
    bindRelics();
    inicializarChatSecreto();
    setupMemory();
    setupShadow();
    setupFuture();
    setupHeart();
    window.fecharRelicariosDoBau = closeAllRelics;
  });
})();


/* =========================================================
   MOBILE / TOUCH — SEGREDO
   Controles de toque para luz, chave e vídeos.
========================================================= */
(function(){
  const isTouchLike = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 900px)').matches;
  if (!isTouchLike) return;

  document.body.classList.add('mobile-experience');

  function point(e){
    if (e.touches && e.touches[0]) return { x:e.touches[0].clientX, y:e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x:e.changedTouches[0].clientX, y:e.changedTouches[0].clientY };
    return { x:e.clientX || window.innerWidth/2, y:e.clientY || window.innerHeight/2 };
  }

  ['touchstart','touchmove','pointerdown','pointermove'].forEach((evt) => {
    window.addEventListener(evt, (e) => {
      const p = point(e);
      if (typeof queueLight === 'function') queueLight(p.x, p.y);
    }, { passive:true });
  });

  const controls = document.createElement('div');
  controls.className = 'mobile-key-controls';
  controls.innerHTML = `
    <button type="button" id="mobile-key-q">Q</button>
    <span>Girar chave</span>
    <button type="button" id="mobile-key-e">E</button>
  `;
  document.body.appendChild(controls);

  function rotateMobileKey(dir){
    if (typeof puzzleMode === 'undefined' || typeof unlocked === 'undefined') return;
    if (!puzzleMode || unlocked) return;
    keyState.angle += dir * keyRotateStep;
    updateKeyTransform();
    tryUnlock();
  }

  controls.querySelector('#mobile-key-q').addEventListener('click', () => rotateMobileKey(-1));
  controls.querySelector('#mobile-key-e').addEventListener('click', () => rotateMobileKey(1));

  setInterval(() => {
    try{
      document.body.classList.toggle('mobile-puzzle-active', !!puzzleMode && !unlocked);
    }catch(e){}
  }, 160);

  document.querySelectorAll('video').forEach((video) => {
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
  });
})();
