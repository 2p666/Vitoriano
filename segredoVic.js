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


    /* =========================================================
       ÁUDIO DO SEGREDO — SISTEMA SIMPLES E ROBUSTO

       TROQUE OS NOMES AQUI se seus arquivos tiverem outros nomes.
       Importante: no GitHub Pages, maiúsculas/minúsculas, espaços,
       acentos e extensão precisam bater 100%.

       Esta versão NÃO depende de "desbloqueio" complexo.
       Ela inicia música/ambiente no primeiro clique/toque e toca efeitos
       diretamente nos eventos de clique.
    ========================================================= */
    const AUDIO_PATHS = {
      musica: 'S.M/darkness.mp3',
      ambiente: 'S.M/SegredoAmbiente.mp3',
      cadeado: 'S.M/Cadeado.mp3',
      carta: 'S.M/CartaAbrindo.mp3',
      universos: {
        carta: 'S.M/UniversoCarta.mp3',
        filhinho: 'S.M/UniversoFilhinho.mp3',
        memoria: 'S.M/UniversoMemoria.mp3',
        sombra: 'S.M/UniversoMensagens.mp3',
        futuro: 'S.M/UniversoFuturo.mp3',
        coracao: 'S.M/UniversoCoracao.mp3'
      }
    };

    const segredoVolumes = {
      musica: 0.22,
      ambiente: 0.16,
      efeito: 0.62,
      universo: 0.30
    };

    function criarAudioSegredo(src, loop = false, volume = 0.3){
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.loop = loop;
      audio.volume = volume;
      audio.setAttribute('playsinline', '');
      audio.addEventListener('error', () => {
        console.warn('[Relicário] Áudio não carregou. Confira caminho/nome:', src);
      });
      return audio;
    }

    const segredoAudio = {
      musica: criarAudioSegredo(AUDIO_PATHS.musica, true, segredoVolumes.musica),
      ambiente: criarAudioSegredo(AUDIO_PATHS.ambiente, true, segredoVolumes.ambiente),
      universos: {
        carta: criarAudioSegredo(AUDIO_PATHS.universos.carta, true, segredoVolumes.universo),
        filhinho: criarAudioSegredo(AUDIO_PATHS.universos.filhinho, true, segredoVolumes.universo),
        memoria: criarAudioSegredo(AUDIO_PATHS.universos.memoria, true, segredoVolumes.universo),
        sombra: criarAudioSegredo(AUDIO_PATHS.universos.sombra, true, segredoVolumes.universo),
        futuro: criarAudioSegredo(AUDIO_PATHS.universos.futuro, true, segredoVolumes.universo),
        coracao: criarAudioSegredo(AUDIO_PATHS.universos.coracao, true, segredoVolumes.universo)
      }
    };

    let audioBaseIniciado = false;
    let universoAtual = null;

    function tocarComFade(audio, alvo = 0.3, duracao = 1200){
      if (!audio) return;
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
        const tentativa = audio.play();

        if (tentativa && tentativa.catch) {
          tentativa.catch((err) => {
            console.warn('[Relicário] O navegador bloqueou ou o arquivo não tocou:', audio.src, err);
          });
        }

        const passos = 18;
        let i = 0;
        const timer = setInterval(() => {
          i++;
          audio.volume = Math.min(alvo, alvo * (i / passos));
          if (i >= passos) clearInterval(timer);
        }, Math.max(20, duracao / passos));
      } catch(err) {
        console.warn('[Relicário] Erro ao tocar áudio:', audio && audio.src, err);
      }
    }

    function pararComFade(audio, duracao = 650){
      if (!audio || audio.paused) return;
      try {
        const inicio = audio.volume || 0;
        const passos = 14;
        let i = 0;
        const timer = setInterval(() => {
          i++;
          audio.volume = Math.max(0, inicio * (1 - i / passos));
          if (i >= passos) {
            clearInterval(timer);
            try { audio.pause(); audio.currentTime = 0; } catch(e) {}
          }
        }, Math.max(20, duracao / passos));
      } catch(e) {}
    }

    function tocarEfeitoPorCaminho(src, volume = segredoVolumes.efeito){
      if (!src) return;
      try {
        const fx = new Audio(src);
        fx.preload = 'auto';
        fx.volume = volume;
        fx.currentTime = 0;
        fx.play().catch((err) => {
          console.warn('[Relicário] Efeito não tocou:', src, err);
        });
      } catch(err) {
        console.warn('[Relicário] Erro no efeito:', src, err);
      }
    }

    // Mantém compatibilidade com as chamadas antigas do código.
    function tocarEfeitoSegredo(audioOuSrc, volume = segredoVolumes.efeito){
      if (!audioOuSrc) return;
      if (typeof audioOuSrc === 'string') {
        tocarEfeitoPorCaminho(audioOuSrc, volume);
        return;
      }
      try {
        audioOuSrc.pause();
        audioOuSrc.currentTime = 0;
        audioOuSrc.volume = volume;
        audioOuSrc.play().catch((err) => {
          console.warn('[Relicário] Efeito não tocou:', audioOuSrc.src, err);
        });
      } catch(err) {
        console.warn('[Relicário] Erro no efeito:', audioOuSrc && audioOuSrc.src, err);
      }
    }

    function iniciarAudioBaseSegredo(){
      if (audioBaseIniciado) return;
      audioBaseIniciado = true;
      tocarComFade(segredoAudio.musica, segredoVolumes.musica, 1800);
      tocarComFade(segredoAudio.ambiente, segredoVolumes.ambiente, 2200);
    }

    function tocarUniverso(nome){
      iniciarAudioBaseSegredo();
      if (universoAtual === nome) return;
      pararUniversoAtual();
      const audio = segredoAudio.universos[nome];
      universoAtual = nome;
      tocarComFade(audio, segredoVolumes.universo, 1000);
    }

    function pararUniversoAtual(){
      if (!universoAtual) return;
      const audio = segredoAudio.universos[universoAtual];
      pararComFade(audio, 650);
      universoAtual = null;
    }

    // Primeira interação real: inicia música e ambiente. Capture=true garante
    // que isso rode antes dos cliques dos itens, laço, chave etc.
    ['pointerdown','mousedown','touchstart','keydown','click'].forEach((evt) => {
      document.addEventListener(evt, iniciarAudioBaseSegredo, { once:true, capture:true });
    });

    // Pausa todos os loops se a pessoa sair da aba, e retoma só base ao voltar.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pararComFade(segredoAudio.musica, 350);
        pararComFade(segredoAudio.ambiente, 350);
        pararUniversoAtual();
        audioBaseIniciado = false;
      }
    });

    // Objetos falsos para chamadas antigas que passavam segredoAudio.cadeado/carta.
    segredoAudio.cadeado = AUDIO_PATHS.cadeado;
    segredoAudio.carta = AUDIO_PATHS.carta;

    /* =========================================================
       OTIMIZAÇÃO SUAVE
       Pausa poeira/luz quando a aba não está visível e evita vídeos
       tocando dentro de relicários fechados.
    ========================================================= */
    let paginaVisivel = !document.hidden;

    function elementoRenderizavel(el){
      if (!el) return false;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1 && rect.bottom >= 0 && rect.right >= 0 && rect.top <= window.innerHeight && rect.left <= window.innerWidth;
    }

    function otimizarVideosSegredo(){
      document.querySelectorAll('video').forEach((video) => {
        try {
          if (paginaVisivel && elementoRenderizavel(video) && video.hasAttribute('autoplay')) {
            video.muted = true;
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        } catch(e) {}
      });
    }

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
    if (lanternImage && lanternFallback) imageFallback(lanternImage, lanternFallback, 'grid');

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
      if (!lanternToggle) return;
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
        if (!paginaVisivel) {
          perf.candleRAF = 0;
          return;
        }
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

        if (lanternActive && lanternToggle) {
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
      keyWrap.classList.add('key-found');
      body.classList.add('key-discovered');
      setTopNote('Você encontrou a chave. Agora leve-a até o coração trancado.');
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

      tocarEfeitoSegredo(segredoAudio.cadeado, 0.62);
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

      scrollBody.classList.remove('unrolling', 'unrolled');
      scrollBody.classList.add('closed');
      letterContent.classList.remove('visible');
      ribbonKnot.style.display = '';
      ribbonKnot.classList.remove('untying');
      letterOpened = false;

      setTopNote('O baú permanece aberto. Os demais itens ainda aguardam.');
    }

function resetLetterState() {
  letterOpened = false;

  scrollBody.classList.remove('unrolling', 'unrolled');
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
  tocarUniverso('carta');
  updateLanternPosition();
}

function closeLetterStage() {
  letterStage.classList.remove('visible');
  letterStage.classList.add('hidden');

  chestStage.classList.remove('hidden');
  chestStage.classList.add('visible');

  resetLetterState();

  if (universoAtual === 'carta') pararUniversoAtual();
  setTopNote('O baú permanece aberto. Os demais itens ainda aguardam.');
}

itemCarta.addEventListener('click', () => {
  openLetterStage();
});

ribbonKnot.addEventListener('click', (e) => {
  e.stopPropagation();
  if (letterOpened) return;

  letterOpened = true;
  tocarEfeitoSegredo(segredoAudio.carta, 0.54);
  ribbonKnot.classList.add('untying');
  setTopNote('O selo se rompeu. O pergaminho está se abrindo.');

  setTimeout(() => {
    ribbonKnot.style.display = 'none';
    scrollBody.classList.remove('closed', 'unrolled');
    scrollBody.classList.add('unrolling');
  }, 650);

  setTimeout(() => {
    scrollBody.classList.remove('unrolling');
    scrollBody.classList.add('unrolled');
  }, 2450);

  setTimeout(() => {
    letterContent.classList.add('visible');
    setTopNote('A carta foi revelada.');
  }, 2750);
});

letterOverlay.addEventListener('click', () => {
  closeLetterStage();
});


    letterOverlay.addEventListener('click', closeLetterStage);

    // Lanterna removida de propósito: a exploração agora depende apenas da vela.
    if (lanternToggle) {
      lanternToggle.style.display = 'none';
      lanternToggle.setAttribute('aria-hidden', 'true');
      lanternToggle.setAttribute('tabindex', '-1');
      lanternToggle.disabled = true;
    }

    let dustCtx, dustW, dustH, dustRAF;
    const dustParticles = [];
    const DUST_COUNT = 34;

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

    function stopDust(){
      if (dustRAF) cancelAnimationFrame(dustRAF);
      dustRAF = null;
      if (dustCtx) dustCtx.clearRect(0, 0, dustW || 0, dustH || 0);
    }

    function startDust() {
      if (dustRAF || !paginaVisivel) return;
      resizeDust();
      if (!dustParticles.length) seedDust();

      let lastTime = 0;
      const frameDelay = 1000 / 24;

      const animate = (time = 0) => {
        if (!paginaVisivel) {
          stopDust();
          return;
        }

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

      dustRAF = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeDust);

    document.addEventListener('visibilitychange', () => {
      paginaVisivel = !document.hidden;
      if (!paginaVisivel) {
        stopDust();
        otimizarVideosSegredo();
      } else {
        startCandleFlicker();
        startDust();
        otimizarVideosSegredo();
      }
    });

    updateLight(window.innerWidth / 2, window.innerHeight / 2);
    updateLanternPosition();
    startCandleFlicker();
    startDust();
    setTimeout(otimizarVideosSegredo, 120);

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
    if (typeof tocarUniverso === 'function') tocarUniverso('filhinho');
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
    if (typeof otimizarVideosSegredo === 'function') setTimeout(otimizarVideosSegredo, 80);
  }

  function fecharFilhinho(){
    const stage = document.getElementById('filhinho-stage');
    const video = document.getElementById('filhinho-video');

    if (!stage) return;

    stage.classList.remove('filhinho-open', 'hearts-revealed');
    stage.setAttribute('aria-hidden', 'true');
    if (typeof universoAtual !== 'undefined' && universoAtual === 'filhinho') pararUniversoAtual();
    document.body.classList.remove('filhinho-rosa');

    if (video) {
      try { video.pause(); video.currentTime = 0; } catch(e){}
    }

    coracoesAtivos.forEach((heart) => heart.remove());
    coracoesAtivos = [];

    if (typeof setTopNote === 'function') {
      setTopNote('O baú permanece aberto. Os demais itens ainda aguardam.');
    }
    if (typeof otimizarVideosSegredo === 'function') setTimeout(otimizarVideosSegredo, 80);
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
    { item: 'item-memoria', stage: 'memoria-stage', bodyClass: 'memory-relic-active', universo: 'memoria', note: 'Uma memória antiga acordou dentro do baú.' },
    { item: 'item-sombra', stage: 'sombra-stage', bodyClass: 'shadow-relic-active', universo: 'sombra', note: 'O canal secreto se abriu. As mensagens ficam guardadas no relicário.' },
    { item: 'item-futuro', stage: 'futuro-stage', bodyClass: 'future-relic-active', universo: 'futuro', note: 'O futuro abriu pequenas constelações para vocês.' },
    { item: 'item-coracao', stage: 'coracao-stage', bodyClass: 'heart-relic-active', universo: 'coracao', note: 'No fim, o coração não precisa de ornamento.' }
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
    if (typeof pararUniversoAtual === 'function') pararUniversoAtual();
    const voice = $('heart-voice');
    if (voice) { try { voice.pause(); voice.currentTime = 0; } catch(e){} }
    if (typeof setTopNote === 'function') setTopNote('O baú permanece aberto. Os demais itens ainda aguardam.');
    if (typeof otimizarVideosSegredo === 'function') setTimeout(otimizarVideosSegredo, 80);
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
    if (cfg.universo && typeof tocarUniverso === 'function') tocarUniverso(cfg.universo);
    playSoft('S.M/RelicarioHover.mp3', 0.22);
    if (typeof otimizarVideosSegredo === 'function') setTimeout(otimizarVideosSegredo, 120);
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
    const box = $('constellation');
    const lines = $('constellation-lines');
    const msg = $('future-message');
    const reset = $('future-reset');
    if (!box || !lines || !msg) return;

    const stars = [...box.querySelectorAll('.star-point')];
    let selected = null;
    const connections = new Set();

    const detalhes = {
      aurora:'a casa que ainda vamos construir', porto:'o descanso depois de dias difíceis', farol:'a luz que guia quando tudo escurece', vento:'as viagens que ainda vão nos atravessar', mar:'Ubatuba e todos os mares futuros', lua:'as noites silenciosas em que só nós bastamos', chave:'as portas que ainda vamos abrir', riso:'teu riso fazendo morada em mim', domingo:'domingos simples e infinitos', cafe:'café, silêncio e presença', livro:'histórias, livros e palavras guardadas', janela:'a janela de um apartamento em paz', museu:'a tua prateleira virando museu', jardim:'pequenas flores em dias comuns', chuva:'chuva na janela e nós dois sem pressa', abraco:'o abraço que reorganiza o mundo', tempo:'o tempo passando sem apagar o que fomos', promessa:'promessas pequenas cumpridas de verdade', familia:'a família que a gente escolhe ser', mesa:'a mesa posta no fim de um dia cansativo', arte:'cartas, desenhos e tudo que eu criar por nós', coragem:'a coragem de continuar escolhendo', cuidado:'cuidar de ti sem te prender', liberdade:'liberdade com endereço e afeto', memoria:'memórias que ainda vão nascer', estrela:'a estrela que recebeu teu nome em mim', manha:'manhãs em que acordar será leve', professor:'o futuro em que ensino e volto para casa', paz:'a paz que sempre pareceu distante', sempre:'o sempre feito de muitos dias pequenos', viagem:'rodoviárias, malas e risos cansados', cozinha:'comida simples e conversa no fim do dia'
    };

    const mensagensEspeciais = {
      'aurora|porto':'Entre a casa e o descanso, eu imagino nós dois fechando a porta do mundo e finalmente respirando em paz.',
      'aurora|paz':'Quando a casa encontrar a paz, ela vai deixar de ser parede e virar abrigo.',
      'aurora|mesa':'Casa também é mesa posta: chegar cansado e ainda assim encontrar presença.',
      'mar|memoria':'Quando o mar tocar a memória, Ubatuba deixa de ser só lugar e vira uma parte viva de nós.',
      'mar|viagem':'Cada viagem até o mar parece dizer que o mundo ainda tem muito para entregar para nós.',
      'riso|domingo':'Teu riso em um domingo simples talvez seja uma das formas mais bonitas de futuro que eu consigo imaginar.',
      'cafe|livro':'Café e livros: um futuro pequeno para o mundo, mas enorme para quem aprendeu a desejar paz.',
      'janela|chuva':'Chuva na janela, silêncio no quarto e nós dois sem precisar fugir de nada.',
      'museu|arte':'Se tua prateleira virou museu, é porque meu amor aprendeu a criar lugares para ficar perto de ti.',
      'chave|liberdade':'A chave e a liberdade dizem a mesma coisa: eu quero abrir portas contigo, não te trancar nelas.',
      'cuidado|liberdade':'Cuidar de ti sem prender talvez seja uma das formas mais maduras de amor que eu ainda quero aprender todos os dias.',
      'promessa|sempre':'O sempre não precisa gritar. Ele pode existir em promessas pequenas cumpridas sem plateia.',
      'professor|paz':'Um dia eu quero ensinar, voltar para casa e sentir que a vida finalmente ficou leve o bastante.',
      'familia|mesa':'Família talvez seja isso: uma mesa onde ninguém precisa merecer o próprio lugar.',
      'estrela|lua':'A lua e a estrela acesas juntas parecem guardar uma noite feita só para lembrar que você existe.',
      'coragem|tempo':'Coragem é continuar escolhendo mesmo quando o tempo muda a forma das coisas.',
      'abraco|paz':'Entre o abraço e a paz existe um lugar que eu reconheço pelo teu nome.',
      'memoria|tempo':'Tempo e memória se encontram para provar que o que foi verdadeiro não desaparece, só muda de forma.',
      'manha|paz':'Uma manhã em paz talvez seja o luxo mais bonito que eu consigo desejar.',
      'cozinha|mesa':'Cozinha e mesa são futuro real: comida simples, conversa boba e uma vida que não precisa impressionar ninguém.'
    };

    function keyFor(a, b){
      return [a, b].sort().join('|');
    }

    function mensagemDaLigacao(a, b){
      const key = keyFor(a, b);
      if (mensagensEspeciais[key]) return mensagensEspeciais[key];
      const da = detalhes[a] || 'uma parte do futuro';
      const db = detalhes[b] || 'outra parte do futuro';
      return `Quando ${da} se liga com ${db}, nasce mais uma forma de dizer que eu quero viver esse amanhã ao teu lado.`;
    }

    function centroRelativo(star){
      const b = box.getBoundingClientRect();
      const r = star.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - b.left,
        y: r.top + r.height / 2 - b.top
      };
    }

    function desenharLinha(a, b){
      const id = keyFor(a.dataset.id, b.dataset.id);
      if (connections.has(id)) return;
      connections.add(id);
      const p1 = centroRelativo(a);
      const p2 = centroRelativo(b);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x.toFixed(2));
      line.setAttribute('y1', p1.y.toFixed(2));
      line.setAttribute('x2', p2.x.toFixed(2));
      line.setAttribute('y2', p2.y.toFixed(2));
      line.setAttribute('class', 'constellation-line');
      line.dataset.connection = id;
      lines.appendChild(line);
      a.classList.add('linked');
      b.classList.add('linked');
    }

    function mostrarMensagem(texto){
      msg.classList.remove('revealed');
      msg.textContent = texto;
      void msg.offsetWidth;
      msg.classList.add('revealed');
    }

    function selecionar(star){
      stars.forEach(s => s.classList.remove('selected'));
      selected = star;
      star.classList.add('selected');
      mostrarMensagem(star.dataset.label || 'Uma estrela acordou. Escolha outra para formar a constelação.');
      playSoft('S.M/Estrela.mp3', 0.18);
    }

    stars.forEach(star => {
      star.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selected || selected === star) {
          selecionar(star);
          return;
        }
        desenharLinha(selected, star);
        const texto = mensagemDaLigacao(selected.dataset.id, star.dataset.id);
        mostrarMensagem(texto);
        playSoft('S.M/Estrela.mp3', 0.26);
        selected.classList.remove('selected');
        star.classList.add('selected');
        selected = star;
      });
    });

    if (reset) {
      reset.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        connections.clear();
        selected = null;
        lines.innerHTML = '';
        stars.forEach(s => s.classList.remove('selected', 'linked'));
        mostrarMensagem('O céu foi limpo. Escolha duas estrelas para acender uma nova promessa.');
      });
    }

    window.addEventListener('resize', () => {
      // Mantém as linhas antigas coerentes se a tela mudar de tamanho.
      const saved = [...connections];
      lines.innerHTML = '';
      connections.clear();
      saved.forEach(id => {
        const [aId, bId] = id.split('|');
        const a = stars.find(s => s.dataset.id === aId);
        const b = stars.find(s => s.dataset.id === bId);
        if (a && b) desenharLinha(a, b);
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


/* =========================================================
   BRILHO DOURADO AUTOMÁTICO — MENÇÕES À MELISSA
   Também funciona em textos que aparecem depois via JavaScript.
========================================================= */
(function(){
  const termosMelGold = [
    'Melissa','Mel','você','voce','vocês','voces','vc',
    'tu','ti','te','contigo','tua','tuas','teu','teus',
    'sua','suas','seu','seus','ela','dela','nela',
    'amor','amada','querida','princesa','meu bem'
  ];

  const regexMelGold = new RegExp(`(?<![\\p{L}\\p{N}_])(${termosMelGold
    .sort((a,b) => b.length - a.length)
    .map(t => t.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'))
    .join('|')})(?![\\p{L}\\p{N}_])`, 'giu');

  const tagsIgnoradas = new Set(['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','INPUT','SELECT','OPTION','CODE','PRE','SVG','AUDIO','VIDEO']);

  function deveIgnorar(node){
    const parent = node && node.parentNode;
    if (!parent || tagsIgnoradas.has(parent.nodeName)) return true;
    if (parent.closest && parent.closest('.mel-gold')) return true;
    return false;
  }

  function destacarTextoNode(node){
    if (deveIgnorar(node)) return;
    const texto = node.nodeValue;
    if (!texto || !regexMelGold.test(texto)) {
      regexMelGold.lastIndex = 0;
      return;
    }
    regexMelGold.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let ultimo = 0;
    texto.replace(regexMelGold, (match, _grupo, offset) => {
      if (offset > ultimo) frag.appendChild(document.createTextNode(texto.slice(ultimo, offset)));
      const span = document.createElement('span');
      span.className = 'mel-gold';
      span.textContent = match;
      frag.appendChild(span);
      ultimo = offset + match.length;
      return match;
    });
    if (ultimo < texto.length) frag.appendChild(document.createTextNode(texto.slice(ultimo)));
    node.parentNode.replaceChild(frag, node);
  }

  function destacarDentro(root=document.body){
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        if (deveIgnorar(node)) return NodeFilter.FILTER_REJECT;
        return regexMelGold.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    regexMelGold.lastIndex = 0;
    nodes.forEach(destacarTextoNode);
  }

  function iniciarMelGold(){
    destacarDentro(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) destacarTextoNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE && !(node.classList && node.classList.contains('mel-gold'))) destacarDentro(node);
        });
      }
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarMelGold);
  else iniciarMelGold();
})();
