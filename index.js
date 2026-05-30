const marcoTemporal = new Date(2025, 6, 1, 0, 0, 0);
    const CAPA_NORMAL = 'imgVic/Book.png';
    const CAPA_MAGICA = 'imgVic/kooB.png';

    /*
      MORCEGOS DO LIVRO
      Imagem usada nos morcegos: imgVic/cego1.png
      Se sua imagem estiver com outra extensão, troque apenas este caminho.
    */
    const BAT_IMAGE = 'imgVic/cego1.png';
    const BAT_TOTAL = 30;

    /*
      ÁUDIO DAS ASAS DOS MORCEGOS
      Coloque seu arquivo neste caminho ou troque o nome abaixo.
      O som toca junto com a animação e faz fade-out no final.
    */
    const BAT_WINGS_AUDIO_SRC = 'S.M/AsasMorcegos.mp3';
    const BAT_WINGS_VOLUME = 0.58;
    const BAT_ANIMATION_TIME_MS = 6200;


    /*
      SONS AMBIENTES SUTIS
      Coloque seus arquivos nestes caminhos ou altere os nomes abaixo.
      O código aplica eco/reverb leve por Web Audio API para dar profundidade.
    */
    const AMBIENT_WIND_AUDIO_SRC = 'S.M/VentoLeve.mp3';
    const AMBIENT_CANDLE_CRACKLE_AUDIO_SRC = 'S.M/EstalosVela.mp3';
    const AMBIENT_WOOD_CREAK_AUDIO_SRC = 'S.M/MadeiraRangendo.mp3';

    const AMBIENT_VOLUME = {
      vento: 0.09,
      vela: 0.7,
      madeira: 0.24
    };

    const AMBIENT_REVERB = {
      vento: { delay: 0.42, feedback: 0.22, wet: 0.18 },
      vela: { delay: 0.18, feedback: 0.12, wet: 0.11 },
      madeira: { delay: 0.32, feedback: 0.24, wet: 0.26 }
    };



    /*
      SONS CURTOS DE INTERAÇÃO
      Coloque seus arquivos nestes caminhos ou altere os nomes abaixo.
      O som da vela é cortado automaticamente para não passar de 1.1s.
    */
    const CANDLE_PICKUP_SOUND_SRC = 'S.M/pepitas.mp3';
    const CANDLE_PICKUP_SOUND_VOLUME = 0.62;
    const CANDLE_PICKUP_SOUND_MAX_MS = 1100;

    const MESSAGE_POP_SOUND_SRC = 'S.M/Mensagem.mp3';
    const MESSAGE_POP_SOUND_VOLUME = 0.22;
    const MESSAGE_POP_SOUND_MAX_MS = 950;

    const body = document.body;
    const introScreen = document.getElementById('intro-screen');
    const relogioTempo = document.getElementById('relogio-tempo');
    const pickupCandle = document.getElementById('pickup-candle');
    const guideToast = document.getElementById('guide-toast');
    const bookStage = document.getElementById('book-stage');
    const book = document.getElementById('book');
    const batBurst = document.getElementById('bat-burst');
    const trilha = document.getElementById('trilha-sonora');
    const somFogoRelogio = document.getElementById('som-fogo-relogio');
    const somPapel = document.getElementById('som-papel');
    const somVela = document.getElementById('som-vela');
    const apagao = document.getElementById('apagao-overlay');
    const candleCursor = document.getElementById('candle-cursor');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const magicOpening = document.getElementById('magic-opening');
    const magicOpeningBtn = document.getElementById('magic-opening-btn');

    const frontCoverImage = document.getElementById('front-cover-image');
    const frontCoverSuptitle = document.getElementById('front-cover-suptitle');
    const frontCoverMainTitle = document.getElementById('front-cover-main-title');

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const indicator = document.getElementById('page-indicator');
    const contador = document.getElementById('contador-tempo');

    const fireCanvas = document.getElementById('fire-canvas');
    const smokeCanvas = document.getElementById('smoke-canvas');
    const dustCanvas = document.getElementById('dust-canvas');

    const secretStage = document.getElementById('secret-stage');
    const draggablePhoto = document.getElementById('draggable-photo');
    const secretButton = document.getElementById('secret-button');

    const finalWriting = document.getElementById('final-writing');
    const finalWritingText = document.getElementById('final-writing-text');

    const sheets = [...document.querySelectorAll('.sheet')];

    let currentStep = 0;
    let bloqueado = false;
    let intervaloRelogio = null;
    let timerInatividade = null;
    let velaColetada = false;
    let toastTimer = null;
    let visitouFinal = false;
    let capaTransformada = false;
    let assinaturaAnimada = false;
    let trilhaStarted = false;
    let finalBookClosed = false;
    let morcegosJaSaíram = false;

    /*
      ARANHA DO FUNDO FALSO
      Troque este caminho se sua imagem tiver outro nome/extensão.
      A aranha sai de trás do vídeo que esconde o segredo e dá 2 voltas nele.
    */
    const SPIDER_IMAGE = 'imgVic/Aranha.png';

    /*
      A aranha deve aparecer apenas quando a página do vídeo falso estiver aberta.
      No seu livro atual, essa página corresponde ao passo 3 do contador interno.
      Se um dia você mover o vídeo para outra página, troque apenas este número.
    */
    const SPIDER_TRIGGER_STEP = 5;
    let aranhaJaSaiuDoVideo = false;

    const TOTAL_STEPS = sheets.length;
    const TOTAL_PAGINAS = TOTAL_STEPS - 1;

    const PERF = {
      mouseRAF: 0,
      lastMouseX: window.innerWidth / 2,
      lastMouseY: window.innerHeight / 2,
      resizeRAF: 0,
      dragRAF: 0,
      dragX: 0,
      dragY: 0,
      candleRAF: 0
    };


    /* =========================================================
       OTIMIZAÇÃO SUAVE
       Mantém o visual, mas evita canvas/vídeos trabalhando quando
       não estão visíveis ou quando a aba está em segundo plano.
    ========================================================= */
    let paginaVisivel = !document.hidden;

    function relicarioAtivo(){
      return !!(bookStage && bookStage.classList.contains('active'));
    }

    function elementoRenderizavel(el){
      if (!el) return false;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1 && rect.bottom >= 0 && rect.right >= 0 && rect.top <= window.innerHeight && rect.left <= window.innerWidth;
    }

    function videoPodeRodar(video){
      if (!paginaVisivel) return false;
      if (!elementoRenderizavel(video)) return false;
      const sheet = video.closest('.sheet');
      if (sheet && sheets.length) {
        const index = sheets.indexOf(sheet);
        // Deixa rodar só vídeos próximos da página atual. Isso evita autoplay escondido nas páginas distantes.
        if (index !== -1 && Math.abs(index - currentStep) > 1) return false;
      }
      return true;
    }

    function otimizarVideosVisiveis(){
      document.querySelectorAll('video').forEach((video) => {
        try {
          if (videoPodeRodar(video)) {
            if (video.hasAttribute('autoplay')) {
              video.muted = true;
              video.play().catch(() => {});
            }
          } else {
            video.pause();
          }
        } catch(e) {}
      });
    }


    function fecharAberturaMagica(){
      if (!magicOpening) return;
      magicOpening.classList.add('hidden');
      setTimeout(() => {
        magicOpening.style.display = 'none';
      }, 1300);
    }

    if (magicOpeningBtn) {
      magicOpeningBtn.addEventListener('click', fecharAberturaMagica);
    }

    if (magicOpening) {
      magicOpening.addEventListener('click', (e) => {
        if (e.target === magicOpening) fecharAberturaMagica();
      });
    }

    function mostrarMensagem(texto) {
      clearTimeout(toastTimer);
      guideToast.textContent = texto;
      guideToast.classList.add('show');
      tocarSomCurto(MESSAGE_POP_SOUND_SRC, MESSAGE_POP_SOUND_VOLUME, MESSAGE_POP_SOUND_MAX_MS);
      toastTimer = setTimeout(() => guideToast.classList.remove('show'), 2600);
    }

    function aplicarMouseLuz(x, y){
      document.documentElement.style.setProperty('--mouse-x', x + 'px');
      document.documentElement.style.setProperty('--mouse-y', y + 'px');
      if (candleCursor && window.innerWidth > 760){
        candleCursor.style.left = x + 'px';
        candleCursor.style.top = y + 'px';
      }
    }

    function atualizarMouseLuz(x, y){
      PERF.lastMouseX = x;
      PERF.lastMouseY = y;
      if (PERF.mouseRAF) return;

      PERF.mouseRAF = requestAnimationFrame(() => {
        aplicarMouseLuz(PERF.lastMouseX, PERF.lastMouseY);
        PERF.mouseRAF = 0;
      });
    }

    window.addEventListener('mousemove', (e) => atualizarMouseLuz(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) atualizarMouseLuz(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive:true });

    function iniciarFlickerDaVela(){
      let t = 0;
      const flicker = () => {
        t += 0.018;

        const layer1 = (Math.sin(t * 1.9) + 1) / 2;
        const layer2 = (Math.sin(t * 3.7 + 1.4) + 1) / 2;
        const layer3 = (Math.sin(t * 8.5 + .8) + 1) / 2;
        const randomPulse = 0.92 + (((Math.sin(t * 12.4) + 1) / 2) * 0.14);

        const intensity = (0.72 + layer1 * 0.12 + layer2 * 0.08 + layer3 * 0.08) * randomPulse;
        const size = 280 + layer1 * 28 + layer2 * 22 + layer3 * 16;

        document.documentElement.style.setProperty('--flicker-strength', intensity.toFixed(3));
        document.documentElement.style.setProperty('--light-size', `${size.toFixed(1)}px`);

        if (candleCursor.classList.contains('active') && window.innerWidth > 760) {
          const glow = 10 + layer1 * 8;
          candleCursor.style.filter = `drop-shadow(0 0 ${glow}px rgba(255,191,98,${0.34 + layer2 * 0.18}))`;
        }

        PERF.candleRAF = requestAnimationFrame(flicker);
      };

      if (!PERF.candleRAF) PERF.candleRAF = requestAnimationFrame(flicker);
    }


    function tocarSomCurto(src, volume = 0.35, maxMs = 1000) {
      if (!src) return;

      try {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = volume;
        audio.currentTime = 0;
        audio.play().catch(() => {});

        setTimeout(() => {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch(e){}
        }, maxMs);
      } catch(e){}
    }

    async function tocarAudio(audio, volume = 1) {
      if (!audio) return;
      try {
        audio.volume = volume;
        audio.currentTime = 0;
        await audio.play();
      } catch(e){}
    }


    /* =========================================================
       SISTEMA DE ÁUDIO AMBIENTE COM ECO / PROFUNDIDADE
    ========================================================= */

    let ambientAudioContext = null;
    let ambientStarted = false;
    let ambientNodes = {
      vento: null,
      vela: null
    };

    function obterContextoAudioAmbiente(){
      if (ambientAudioContext) return ambientAudioContext;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ambientAudioContext = new AudioCtx();
      return ambientAudioContext;
    }

    async function garantirAudioAmbienteAtivo(){
      const ctx = obterContextoAudioAmbiente();
      if (!ctx) return null;
      try {
        if (ctx.state === 'suspended') await ctx.resume();
      } catch(e){}
      return ctx;
    }

    function criarFonteComEco(src, volume = 0.12, reverb = { delay:.25, feedback:.16, wet:.16 }, loop = false){
      const ctx = obterContextoAudioAmbiente();
      if (!ctx || !src) return null;

      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.loop = loop;
      audio.volume = 1;

      const source = ctx.createMediaElementSource(audio);
      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      const masterGain = ctx.createGain();
      const delay = ctx.createDelay(1.6);
      const feedback = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      dryGain.gain.value = Math.max(0, Math.min(1, 1 - reverb.wet));
      wetGain.gain.value = reverb.wet;
      masterGain.gain.value = 0;
      delay.delayTime.value = reverb.delay;
      feedback.gain.value = reverb.feedback;
      filter.type = 'lowpass';
      filter.frequency.value = 2400;

      source.connect(dryGain);
      dryGain.connect(masterGain);

      source.connect(delay);
      delay.connect(filter);
      filter.connect(wetGain);
      wetGain.connect(masterGain);
      filter.connect(feedback);
      feedback.connect(delay);

      masterGain.connect(ctx.destination);

      return { audio, masterGain, ctx, targetVolume: volume };
    }

    function fadeGain(node, alvo, duracao = 1600){
      if (!node || !node.masterGain || !node.ctx) return;
      const now = node.ctx.currentTime;
      node.masterGain.gain.cancelScheduledValues(now);
      node.masterGain.gain.setValueAtTime(node.masterGain.gain.value, now);
      node.masterGain.gain.linearRampToValueAtTime(alvo, now + duracao / 1000);
    }

    async function iniciarSomAmbiente(){
      if (ambientStarted) return;
      ambientStarted = true;

      const ctx = await garantirAudioAmbienteAtivo();
      if (!ctx) return;

      ambientNodes.vento = criarFonteComEco(
        AMBIENT_WIND_AUDIO_SRC,
        AMBIENT_VOLUME.vento,
        AMBIENT_REVERB.vento,
        true
      );

      ambientNodes.vela = criarFonteComEco(
        AMBIENT_CANDLE_CRACKLE_AUDIO_SRC,
        AMBIENT_VOLUME.vela,
        AMBIENT_REVERB.vela,
        true
      );

      Object.values(ambientNodes).forEach((node) => {
        if (!node) return;
        node.audio.currentTime = 0;
        node.audio.play().then(() => {
          fadeGain(node, node.targetVolume, 2400);
        }).catch(() => {});
      });
    }

    async function tocarMadeiraAntiga(volumeExtra = 1){
      const ctx = await garantirAudioAmbienteAtivo();
      if (!ctx || !AMBIENT_WOOD_CREAK_AUDIO_SRC) return;

      const madeira = criarFonteComEco(
        AMBIENT_WOOD_CREAK_AUDIO_SRC,
        AMBIENT_VOLUME.madeira * volumeExtra,
        AMBIENT_REVERB.madeira,
        false
      );

      if (!madeira) return;
      madeira.audio.currentTime = 0;
      madeira.audio.play().then(() => {
        fadeGain(madeira, madeira.targetVolume, 90);
        setTimeout(() => fadeGain(madeira, 0, 900), 950);
        setTimeout(() => {
          try { madeira.audio.pause(); madeira.audio.currentTime = 0; } catch(e){}
        }, 2300);
      }).catch(() => {});
    }

    function tocarSomAsasMorcegos(){
      if (!BAT_WINGS_AUDIO_SRC) return;

      const somAsas = new Audio(BAT_WINGS_AUDIO_SRC);
      somAsas.preload = 'auto';
      somAsas.volume = BAT_WINGS_VOLUME;
      somAsas.currentTime = 0;

      somAsas.play().catch(() => {});

      const inicioFade = Math.max(900, BAT_ANIMATION_TIME_MS - 1500);

      setTimeout(() => {
        let volumeAtual = BAT_WINGS_VOLUME;
        const fade = setInterval(() => {
          volumeAtual -= BAT_WINGS_VOLUME / 18;
          somAsas.volume = Math.max(0, volumeAtual);

          if (volumeAtual <= 0) {
            clearInterval(fade);
            somAsas.pause();
            somAsas.currentTime = 0;
          }
        }, 70);
      }, inicioFade);

      setTimeout(() => {
        somAsas.pause();
        somAsas.currentTime = 0;
      }, BAT_ANIMATION_TIME_MS + 250);
    }

    async function iniciarTrilhaComFade() {
      if (!trilha || trilhaStarted) return;
      trilhaStarted = true;
      try {
        trilha.volume = 0.01;
        await trilha.play();
        let volume = 0.01;
        const alvo = 0.34;
        const intervalo = setInterval(() => {
          volume += 0.02;
          trilha.volume = Math.min(alvo, volume);
          if (volume >= alvo) clearInterval(intervalo);
        }, 180);
      } catch(e){}
    }

    function coletarVela() {
      if (velaColetada) return;
      velaColetada = true;
      pickupCandle.classList.add('collected');
      if (window.innerWidth > 760) candleCursor.classList.add('active');
      tocarAudio(somVela, 0.55);
      tocarSomCurto(CANDLE_PICKUP_SOUND_SRC, CANDLE_PICKUP_SOUND_VOLUME, CANDLE_PICKUP_SOUND_MAX_MS);
      mostrarMensagem('A luz agora te pertence. Toque no relógio para seguir.');
    }

    pickupCandle.addEventListener('click', coletarVela);

    function calcularTempoDecorrido(dataInicial, dataAtual) {
      let anos = dataAtual.getFullYear() - dataInicial.getFullYear();
      const aniversarioAindaNaoChegou =
        dataAtual.getMonth() < dataInicial.getMonth() ||
        (dataAtual.getMonth() === dataInicial.getMonth() && dataAtual.getDate() < dataInicial.getDate());

      if (aniversarioAindaNaoChegou) anos--;

      const inicioAnoAtual = new Date(dataInicial);
      inicioAnoAtual.setFullYear(dataInicial.getFullYear() + anos);
      const diferencaMs = Math.max(0, dataAtual - inicioAnoAtual);

      return {
        anos,
        dias: Math.floor(diferencaMs / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diferencaMs / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((diferencaMs / (1000 * 60)) % 60),
        segundos: Math.floor((diferencaMs / 1000) % 60)
      };
    }

    function atualizarRelogioEterno() {
      const agora = new Date();
      const tempo = calcularTempoDecorrido(marcoTemporal, agora);
      const labels = { anos:'Anos', dias:'Dias', horas:'Horas', minutos:'Min', segundos:'Seg' };
      const keys = Object.keys(tempo);

      if (!contador.children.length) {
        keys.forEach(chave => {
          const box = document.createElement('div');
          box.className = 'digito-box';
          box.innerHTML = `<strong>${tempo[chave]}</strong><span>${labels[chave]}</span>`;
          contador.appendChild(box);
        });
        return;
      }

      [...contador.children].forEach((box, i) => {
        const strong = box.querySelector('strong');
        const valor = tempo[keys[i]];
        if (strong.textContent !== String(valor)) {
          strong.textContent = valor;
          box.classList.add('pulse');
          setTimeout(() => box.classList.remove('pulse'), 380);
        }
      });
    }

    function tocarPapel() {
      if (!somPapel) return;
      somPapel.pause();
      somPapel.currentTime = 0;
      somPapel.volume = 0.42;
      somPapel.play().catch(() => {});
    }

    function revelarElementos() {
      document.querySelectorAll('.reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), 140 + i * 170);
      });
    }

    function iniciarMonitoramentoApagao() {
      const resetar = () => {
        clearTimeout(timerInatividade);
        apagao.classList.remove('ativo');
        timerInatividade = setTimeout(() => apagao.classList.add('ativo'), 18000);
      };

      ['mousemove','click','keydown','touchstart'].forEach(evt => {
        document.addEventListener(evt, resetar, { passive:true });
      });

      resetar();
    }

    function transformarCapaSemEfeito() {
      if (capaTransformada) return;
      capaTransformada = true;
      frontCoverImage.src = CAPA_MAGICA;
      frontCoverSuptitle.textContent = 'Eternidade';
      frontCoverMainTitle.innerHTML = 'Essa é a nossa<br>história';
      mostrarMensagem('A história revelou sua forma verdadeira.');
    }

    function verificarMagiaDaCapa() {
      if (visitouFinal && currentStep === 0 && !capaTransformada) {
        transformarCapaSemEfeito();
      }
    }

    function prepararEscritaFinal(){
      if (!finalWritingText) return;
      const length = finalWritingText.getComputedTextLength();
      finalWritingText.style.setProperty('--signature-length', `${length}px`);
      finalWritingText.style.strokeDasharray = `${length}px`;
      finalWritingText.style.strokeDashoffset = `${length}px`;
    }

    function resetarAssinatura(){
      if (!finalWriting || !finalWritingText) return;
      finalWriting.classList.remove('visible', 'animate');
      assinaturaAnimada = false;
      prepararEscritaFinal();
    }

    function animarAssinaturaFinal(){
      if (assinaturaAnimada || !finalWriting) return;
      assinaturaAnimada = true;
      finalWriting.classList.add('visible');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          finalWriting.classList.add('animate');
        });
      });
    }

    function fecharLivroDevagar() {
      if (finalBookClosed) return;
      finalBookClosed = true;
      setTimeout(() => {
        book.classList.add('book-finished');
      }, 1400);
    }

    function abrirLivroNovamente() {
      finalBookClosed = false;
      book.classList.remove('book-finished');
    }

    function verificarAssinaturaFinal(){
      if (currentStep === TOTAL_STEPS) {
        animarAssinaturaFinal();
        fecharLivroDevagar();
      } else {
        resetarAssinatura();
        abrirLivroNovamente();
      }
    }

    function iniciarExperiencia() {
      if (!velaColetada) {
        mostrarMensagem('Você precisa da luz para guiá-la entre as páginas.');
        return;
      }

      if (relogioTempo.classList.contains('relogio-queimando')) return;

      relogioTempo.classList.add('relogio-queimando');
      tocarAudio(somFogoRelogio, 0.72);
      startFire();
      startSmoke();

      setTimeout(() => {
        stopFire();
        stopSmoke();
        introScreen.style.opacity = '0';
        introScreen.style.visibility = 'hidden';
        bookStage.classList.add('active');
        body.classList.add('fog-active');
        revelarElementos();

        atualizarRelogioEterno();
        if (!intervaloRelogio) intervaloRelogio = setInterval(atualizarRelogioEterno, 1000);

        iniciarTrilhaComFade();
        iniciarSomAmbiente();
        iniciarMonitoramentoApagao();
        startDust();
        otimizarVideosVisiveis();
      }, 2100);
    }

    relogioTempo.addEventListener('click', iniciarExperiencia);
    relogioTempo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        iniciarExperiencia();
      }
    });

    async function toggleFullscreen(){
      try{
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      }catch(e){}
      atualizarIconeFullscreen();
    }

    function atualizarIconeFullscreen(){
      fullscreenBtn.classList.toggle('is-full', !!document.fullscreenElement);
    }

    fullscreenBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', atualizarIconeFullscreen);

    function prepareTurn(sheet, z = 999) {
      sheet.classList.add('lifting', 'turning');
      sheet.style.zIndex = z;
    }

    function finishTurn(sheet, z) {
      sheet.classList.remove('lifting', 'turning');
      sheet.style.zIndex = z;
    }

    function syncBookState() {
      sheets.forEach((sheet, index) => {
        sheet.style.zIndex = sheet.classList.contains('flipped') ? 10 + index : 50 - index;
      });
    }

    function atualizarIndicador() {
      if (currentStep === 0) indicator.textContent = 'Capa fechada';
      else if (currentStep < TOTAL_STEPS) indicator.textContent = `Página ${currentStep} de ${TOTAL_PAGINAS}`;
      else indicator.textContent = 'Livro fechado';

      btnPrev.disabled = bloqueado || currentStep === 0;
      btnNext.disabled = bloqueado || currentStep === TOTAL_STEPS;
    }

    function soltarMorcegosDoLivro(){
      if (morcegosJaSaíram || !batBurst || !book) return;
      morcegosJaSaíram = true;
      batBurst.innerHTML = '';
      batBurst.classList.add('active');
      tocarSomAsasMorcegos();

      const bookRect = book.getBoundingClientRect();
      const origemX = bookRect.left + bookRect.width / 2;
      const origemY = bookRect.top + bookRect.height * 0.52;

      const pontosEscuros = [
        { x: -180, y: -160 },
        { x: window.innerWidth + 180, y: -170 },
        { x: -220, y: window.innerHeight * 0.18 },
        { x: window.innerWidth + 220, y: window.innerHeight * 0.20 },
        { x: window.innerWidth * 0.08, y: -220 },
        { x: window.innerWidth * 0.92, y: -220 }
      ];

      for (let i = 0; i < BAT_TOTAL; i++) {
        const bat = document.createElement('img');
        bat.src = BAT_IMAGE;
        bat.alt = '';
        bat.setAttribute('aria-hidden', 'true');
        bat.draggable = false;

        const alvo = pontosEscuros[i % pontosEscuros.length];
        const lado = alvo.x < origemX ? -1 : 1;
        const variacaoX = (-120 + Math.random() * 240);
        const variacaoY = (-80 + Math.random() * 160);

        const finalX = alvo.x + variacaoX - origemX;
        const finalY = alvo.y + variacaoY - origemY;

        const midX = finalX * (0.24 + Math.random() * 0.18) + lado * (40 + Math.random() * 120);
        const midY = -120 - Math.random() * 260;
        const burstX = lado * (24 + Math.random() * 72);
        const burstY = -18 - Math.random() * 80;

        const size = 118 + Math.random() * 128;
        const scale = 1.05 + Math.random() * .55;
        const rot = -24 + Math.random() * 48;
        const spin = lado * (90 + Math.random() * 190);
        const delay = Math.random() * .34 + i * .018;
        const duration = 3.25 + Math.random() * 1.7;
        const flap = .12 + Math.random() * .10;

        bat.style.setProperty('--bat-x', `${finalX.toFixed(1)}px`);
        bat.style.setProperty('--bat-y', `${finalY.toFixed(1)}px`);
        bat.style.setProperty('--bat-mid-x', `${midX.toFixed(1)}px`);
        bat.style.setProperty('--bat-mid-y', `${midY.toFixed(1)}px`);
        bat.style.setProperty('--bat-burst-x', `${burstX.toFixed(1)}px`);
        bat.style.setProperty('--bat-burst-y', `${burstY.toFixed(1)}px`);
        bat.style.setProperty('--bat-size', `${size.toFixed(1)}px`);
        bat.style.setProperty('--bat-scale', scale.toFixed(2));
        bat.style.setProperty('--bat-rot', `${rot.toFixed(1)}deg`);
        bat.style.setProperty('--bat-spin', `${spin.toFixed(1)}deg`);
        bat.style.setProperty('--bat-delay', `${delay.toFixed(2)}s`);
        bat.style.setProperty('--bat-duration', `${duration.toFixed(2)}s`);
        bat.style.setProperty('--bat-flap', `${flap.toFixed(2)}s`);

        batBurst.appendChild(bat);
      }

      setTimeout(() => {
        if (batBurst) {
          batBurst.innerHTML = '';
          batBurst.classList.remove('active');
        }
      }, BAT_ANIMATION_TIME_MS);
    }



    function soltarAranhaDoVideoFalso(){
      if (aranhaJaSaiuDoVideo) return;
      if (!secretStage || !draggablePhoto) return;

      aranhaJaSaiuDoVideo = true;

      const stageRect = secretStage.getBoundingClientRect();
      const videoRect = draggablePhoto.getBoundingClientRect();

      const aranha = document.createElement('img');
      aranha.src = SPIDER_IMAGE;
      aranha.alt = 'Aranha saindo do fundo falso';
      aranha.className = 'spider-false-bottom';
      aranha.draggable = false;
      document.body.appendChild(aranha);

      const spiderSize = Math.max(70, Math.min(118, videoRect.width * 0.28));
      aranha.style.width = `${spiderSize}px`;

      const centerX = videoRect.left + videoRect.width / 2;
      const centerY = videoRect.top + videoRect.height / 2;

      const insetX = videoRect.width * 0.42;
      const insetY = videoRect.height * 0.42;
      const points = [];
      const turns = 2;
      const stepsPerTurn = 48;

      for (let i = 0; i <= turns * stepsPerTurn; i++) {
        const t = i / stepsPerTurn;
        const angle = (Math.PI * 2 * t) - Math.PI / 2;
        const wobble = Math.sin(t * Math.PI * 4) * 10;
        const x = centerX + Math.cos(angle) * (insetX + wobble) - spiderSize / 2;
        const y = centerY + Math.sin(angle) * (insetY + wobble * 0.6) - spiderSize / 2;
        points.push({ x, y, angle });
      }

      // Começa atrás do vídeo, como se tivesse saído de um fundo falso.
      aranha.style.left = `${centerX - spiderSize / 2}px`;
      aranha.style.top = `${centerY - spiderSize / 2}px`;
      aranha.style.opacity = '0';
      aranha.style.transform = 'translateY(18px) scale(.72) rotate(-18deg)';

      requestAnimationFrame(() => {
        aranha.classList.add('visible');
        aranha.style.opacity = '1';
        aranha.style.transform = 'translateY(0) scale(1) rotate(0deg)';
      });

      let index = 0;
      const totalDuration = 6200;
      const start = performance.now();

      function frame(now){
        const progress = Math.min(1, (now - start) / totalDuration);
        index = Math.min(points.length - 1, Math.floor(progress * (points.length - 1)));
        const point = points[index];
        const next = points[Math.min(points.length - 1, index + 1)];
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const rot = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        const legPulse = Math.sin(progress * Math.PI * 38) * 3;

        aranha.style.left = `${point.x}px`;
        aranha.style.top = `${point.y}px`;
        aranha.style.transform = `rotate(${rot + legPulse}deg) scale(${1 + Math.sin(progress * Math.PI * 10) * 0.035})`;

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          aranha.classList.add('settle');
          setTimeout(() => {
            aranha.style.opacity = '0';
            aranha.style.transform += ' scale(.86)';
          }, 900);
          setTimeout(() => aranha.remove(), 1800);
        }
      }

      setTimeout(() => requestAnimationFrame(frame), 520);
    }

    function virarProxima() {
      if (bloqueado || currentStep >= TOTAL_STEPS) return;
      bloqueado = true;
      atualizarIndicador();

      const sheet = sheets[currentStep];
      prepareTurn(sheet, 1000);
      tocarPapel();
      tocarMadeiraAntiga(currentStep === 0 ? 1.28 : 0.82);
      if (currentStep === 0) soltarMorcegosDoLivro();

      requestAnimationFrame(() => sheet.classList.add('flipped'));

      setTimeout(() => {
        currentStep++;
        if (currentStep === SPIDER_TRIGGER_STEP) soltarAranhaDoVideoFalso();
        if (currentStep === TOTAL_STEPS) {
          visitouFinal = true;
        }
        finishTurn(sheet, 10 + currentStep);
        syncBookState();
        verificarAssinaturaFinal();
        bloqueado = false;
        atualizarIndicador();
        otimizarVideosVisiveis();
      }, 1000);
    }

    function voltarAnterior() {
      if (bloqueado || currentStep <= 0) return;
      bloqueado = true;
      atualizarIndicador();

      const sheet = sheets[currentStep - 1];
      prepareTurn(sheet, 1000);
      tocarPapel();
      tocarMadeiraAntiga(0.74);

      requestAnimationFrame(() => sheet.classList.remove('flipped'));

      setTimeout(() => {
        currentStep--;
        finishTurn(sheet, 50 - currentStep);
        syncBookState();
        verificarMagiaDaCapa();
        verificarAssinaturaFinal();
        if (currentStep < 2) resetarImagemSecreta();
        bloqueado = false;
        atualizarIndicador();
        otimizarVideosVisiveis();
      }, 1000);
    }

    btnNext.addEventListener('click', virarProxima);
    btnPrev.addEventListener('click', voltarAnterior);

    document.addEventListener('keydown', (e) => {
      if (!bookStage.classList.contains('active')) return;
      if (e.key === 'ArrowRight') virarProxima();
      if (e.key === 'ArrowLeft') voltarAnterior();
    });

    let dragActive = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let stageRect = null;

    function limitar(valor, min, max) {
      return Math.max(min, Math.min(max, valor));
    }

    function atualizarRevelacaoBotao() {
      if (!draggablePhoto || !secretButton) return;
      const photoRect = draggablePhoto.getBoundingClientRect();
      const buttonRect = secretButton.getBoundingClientRect();

      const overlap =
        !(photoRect.right < buttonRect.left ||
          photoRect.left > buttonRect.right ||
          photoRect.bottom < buttonRect.top ||
          photoRect.top > buttonRect.bottom);

      if (!overlap) secretButton.classList.add('revealed');
      else secretButton.classList.remove('revealed');
    }

    function iniciarDrag(clientX, clientY) {
      if (!secretStage || !draggablePhoto) return;
      stageRect = secretStage.getBoundingClientRect();
      const photoRect = draggablePhoto.getBoundingClientRect();

      dragActive = true;
      draggablePhoto.classList.add('dragging');

      dragOffsetX = clientX - photoRect.left;
      dragOffsetY = clientY - photoRect.top;
    }

    function aplicarDrag(clientX, clientY) {
      if (!dragActive || !stageRect) return;

      const photoW = draggablePhoto.offsetWidth;
      const photoH = draggablePhoto.offsetHeight;

      const minLeft = -photoW * 0.78;
      const maxLeft = stageRect.width - photoW * 0.22;
      const minTop = -photoH * 0.78;
      const maxTop = stageRect.height - photoH * 0.22;

      const novoLeft = limitar(clientX - stageRect.left - dragOffsetX, minLeft, maxLeft);
      const novoTop = limitar(clientY - stageRect.top - dragOffsetY, minTop, maxTop);

      draggablePhoto.style.left = `${novoLeft}px`;
      draggablePhoto.style.top = `${novoTop}px`;

      atualizarRevelacaoBotao();
    }

    function moverDrag(clientX, clientY) {
      PERF.dragX = clientX;
      PERF.dragY = clientY;

      if (PERF.dragRAF) return;
      PERF.dragRAF = requestAnimationFrame(() => {
        aplicarDrag(PERF.dragX, PERF.dragY);
        PERF.dragRAF = 0;
      });
    }

    function finalizarDrag() {
      if (!dragActive) return;
      dragActive = false;
      draggablePhoto.classList.remove('dragging');
      atualizarRevelacaoBotao();
    }

    if (draggablePhoto) {
      draggablePhoto.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        iniciarDrag(e.clientX, e.clientY);
        try { draggablePhoto.setPointerCapture(e.pointerId); } catch(err){}
      });

      draggablePhoto.addEventListener('pointermove', (e) => {
        if (!dragActive) return;
        e.preventDefault();
        moverDrag(e.clientX, e.clientY);
      });

      draggablePhoto.addEventListener('pointerup', (e) => {
        finalizarDrag();
        try { draggablePhoto.releasePointerCapture(e.pointerId); } catch(err){}
      });

      draggablePhoto.addEventListener('pointercancel', finalizarDrag);
    }

    if (secretButton) {
      secretButton.addEventListener('click', () => {
        window.location.href = 'segredoVic.html';
      });
    }

    function resetarImagemSecreta() {
      if (!draggablePhoto || !secretButton) return;
      draggablePhoto.style.left = '0px';
      draggablePhoto.style.top = '0px';
      draggablePhoto.classList.remove('dragging');
      secretButton.classList.remove('revealed');
    }

    let dustCtx, dustW, dustH, dustRAF;
    const dustParticles = [];
    const DUST_COUNT = 30;

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
    }

    function seedDust() {
      dustParticles.length = 0;
      for (let i = 0; i < DUST_COUNT; i++) {
        dustParticles.push({
          x: Math.random()*dustW,
          y: Math.random()*dustH,
          r: .4 + Math.random()*1.4,
          vx: -.10 + Math.random()*.20,
          vy: -.05 + Math.random()*.10,
          a: .04 + Math.random()*.10
        });
      }
    }

    function stopDust(){
      if (dustRAF) cancelAnimationFrame(dustRAF);
      dustRAF = null;
      if (dustCtx) dustCtx.clearRect(0,0,dustW || 0,dustH || 0);
    }

    function startDust() {
      if (dustRAF || !dustCanvas || !paginaVisivel || !relicarioAtivo()) return;
      resizeDust();
      if (!dustParticles.length) seedDust();

      let lastTime = 0;
      const frameDelay = 1000 / 24;

      const animate = (time = 0) => {
        if (!paginaVisivel || !relicarioAtivo()) {
          stopDust();
          return;
        }

        if (time - lastTime >= frameDelay) {
          lastTime = time;
          dustCtx.clearRect(0,0,dustW,dustH);

          for (let i = 0; i < dustParticles.length; i++) {
            const p = dustParticles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -10) p.x = dustW + 10;
            if (p.x > dustW + 10) p.x = -10;
            if (p.y < -10) p.y = dustH + 10;
            if (p.y > dustH + 10) p.y = -10;

            dustCtx.fillStyle = `rgba(235,216,188,${p.a})`;
            dustCtx.beginPath();
            dustCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
            dustCtx.fill();
          }
        }

        dustRAF = requestAnimationFrame(animate);
      };

      dustRAF = requestAnimationFrame(animate);
    }

    let fireRunning = false, smokeRunning = false;
    let fireParticles = [], fireEmbers = [], smokeParticles = [];
    let fireCtx, fireW, fireH, fireRAF;
    let smokeCtx, smokeW, smokeH, smokeRAF;

    function sizeCanvasToElement(canvas) {
      const rect = canvas.getBoundingClientRect();
      const ratio = 1;
      const w = Math.max(220, rect.width);
      const h = Math.max(220, rect.height);
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d', { alpha: true });
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      return { ctx, w, h };
    }

    function resizeFireAndSmokeCanvases() {
      const r1 = sizeCanvasToElement(fireCanvas);
      fireCtx = r1.ctx; fireW = r1.w; fireH = r1.h;

      const r2 = sizeCanvasToElement(smokeCanvas);
      smokeCtx = r2.ctx; smokeW = r2.w; smokeH = r2.h;
    }

    function spawnFlameParticle() {
      const baseX = fireW * (0.22 + Math.random() * 0.56);
      const baseY = fireH * (0.72 + Math.random() * 0.08);
      return {
        x: baseX,
        y: baseY,
        vx: (Math.random() - 0.5) * 0.55,
        vy: -(1.0 + Math.random() * 1.7),
        r: 8 + Math.random() * 14,
        life: 30 + Math.random() * 22,
        maxLife: 52 + Math.random() * 18,
        hue: 14 + Math.random() * 22,
        alpha: 0.16 + Math.random() * 0.26
      };
    }

    function spawnEmber() {
      return {
        x: fireW * (0.28 + Math.random() * 0.44),
        y: fireH * (0.62 + Math.random() * 0.08),
        vx: (Math.random() - 0.5) * 0.85,
        vy: -(0.7 + Math.random() * 1.0),
        r: .8 + Math.random() * 1.8,
        life: 22 + Math.random() * 16,
        maxLife: 38 + Math.random() * 18,
        alpha: 0.30 + Math.random() * 0.28
      };
    }

    function spawnSmoke() {
      return {
        x: smokeW * (0.30 + Math.random() * 0.40),
        y: smokeH * (0.45 + Math.random() * 0.16),
        vx: (Math.random() - 0.5) * 0.44,
        vy: -(0.18 + Math.random() * 0.34),
        r: 14 + Math.random() * 26,
        life: 34 + Math.random() * 28,
        maxLife: 54 + Math.random() * 28,
        alpha: 0.03 + Math.random() * 0.08
      };
    }

    function drawFire() {
      if (!fireRunning || !fireCtx || !paginaVisivel) return;

      let lastTime = 0;
      const frameDelay = 1000 / 22;

      const animate = (time = 0) => {
        if (!fireRunning || !fireCtx || !paginaVisivel) return;

        if (time - lastTime >= frameDelay) {
          lastTime = time;
          fireCtx.clearRect(0, 0, fireW, fireH);

          const grd = fireCtx.createRadialGradient(fireW * 0.5, fireH * 0.78, 10, fireW * 0.5, fireH * 0.78, fireW * 0.22);
          grd.addColorStop(0, 'rgba(255,240,180,0.16)');
          grd.addColorStop(0.35, 'rgba(255,140,60,0.11)');
          grd.addColorStop(1, 'rgba(120,0,0,0)');
          fireCtx.fillStyle = grd;
          fireCtx.beginPath();
          fireCtx.ellipse(fireW * 0.5, fireH * 0.78, fireW * 0.18, fireH * 0.07, 0, 0, Math.PI * 2);
          fireCtx.fill();

          for (let i = 0; i < 3; i++) fireParticles.push(spawnFlameParticle());
          if (Math.random() > 0.35) fireEmbers.push(spawnEmber());

          for (let i = fireParticles.length - 1; i >= 0; i--) {
            const p = fireParticles[i];
            p.x += p.vx + Math.sin((p.maxLife - p.life) * 0.18) * 0.30;
            p.y += p.vy;
            p.life -= 1;
            const lifeRatio = Math.max(0, p.life / p.maxLife);
            const radius = p.r * (0.42 + lifeRatio * 0.8);

            const grad = fireCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
            grad.addColorStop(0, `rgba(255,252,225,${0.16 * lifeRatio})`);
            grad.addColorStop(0.16, `rgba(255,214,120,${0.28 * lifeRatio + p.alpha * 0.18})`);
            grad.addColorStop(0.42, `hsla(${p.hue}, 100%, 55%, ${0.24 * lifeRatio + p.alpha * 0.34})`);
            grad.addColorStop(0.72, `hsla(${p.hue + 8}, 100%, 42%, ${0.09 * lifeRatio})`);
            grad.addColorStop(1, 'rgba(120,0,0,0)');

            fireCtx.globalCompositeOperation = 'screen';
            fireCtx.fillStyle = grad;
            fireCtx.beginPath();
            fireCtx.ellipse(p.x, p.y, radius * 0.54, radius * 1.05, Math.sin(p.life * 0.08) * 0.14, 0, Math.PI * 2);
            fireCtx.fill();

            if (p.life <= 0) fireParticles.splice(i, 1);
          }

          for (let i = fireEmbers.length - 1; i >= 0; i--) {
            const e = fireEmbers[i];
            e.x += e.vx;
            e.y += e.vy;
            e.life -= 1;
            const lr = Math.max(0, e.life / e.maxLife);

            fireCtx.globalCompositeOperation = 'screen';
            fireCtx.fillStyle = `rgba(255,190,90,${e.alpha * lr})`;
            fireCtx.beginPath();
            fireCtx.arc(e.x, e.y, e.r * (0.3 + lr), 0, Math.PI * 2);
            fireCtx.fill();

            if (e.life <= 0) fireEmbers.splice(i, 1);
          }

          fireCtx.globalCompositeOperation = 'source-over';
        }

        fireRAF = requestAnimationFrame(animate);
      };

      fireRAF = requestAnimationFrame(animate);
    }

    function drawSmoke() {
      if (!smokeRunning || !smokeCtx || !paginaVisivel) return;

      let lastTime = 0;
      const frameDelay = 1000 / 28;

      const animate = (time = 0) => {
        if (!smokeRunning || !smokeCtx || !paginaVisivel) return;

        if (time - lastTime >= frameDelay) {
          lastTime = time;
          smokeCtx.clearRect(0,0,smokeW,smokeH);

          if (smokeParticles.length < 42) smokeParticles.push(spawnSmoke());

          for (let i = smokeParticles.length - 1; i >= 0; i--) {
            const p = smokeParticles[i];
            p.x += p.vx + Math.sin((p.maxLife - p.life) * 0.04) * 0.22;
            p.y += p.vy;
            p.life--;

            const lr = Math.max(0, p.life / p.maxLife);
            const grad = smokeCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            grad.addColorStop(0, `rgba(120,120,120,${p.alpha * lr})`);
            grad.addColorStop(0.5, `rgba(70,70,70,${p.alpha * .55 * lr})`);
            grad.addColorStop(1, 'rgba(30,30,30,0)');
            smokeCtx.fillStyle = grad;
            smokeCtx.beginPath();
            smokeCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
            smokeCtx.fill();

            if (p.life <= 0) smokeParticles.splice(i,1);
          }
        }

        smokeRAF = requestAnimationFrame(animate);
      };

      smokeRAF = requestAnimationFrame(animate);
    }

    function stopFire(){
      fireRunning = false;
      if (fireRAF) cancelAnimationFrame(fireRAF);
      fireRAF = null;
      fireParticles.length = 0;
      fireEmbers.length = 0;
      if (fireCtx) fireCtx.clearRect(0, 0, fireW || 0, fireH || 0);
    }

    function stopSmoke(){
      smokeRunning = false;
      if (smokeRAF) cancelAnimationFrame(smokeRAF);
      smokeRAF = null;
      smokeParticles.length = 0;
      if (smokeCtx) smokeCtx.clearRect(0, 0, smokeW || 0, smokeH || 0);
    }

    function startFire() {
      if (fireRunning) return;
      resizeFireAndSmokeCanvases();
      fireRunning = true;
      drawFire();
    }

    function startSmoke() {
      if (smokeRunning) return;
      resizeFireAndSmokeCanvases();
      smokeRunning = true;
      drawSmoke();
    }

    function onResizeOptimized() {
      if (PERF.resizeRAF) return;
      PERF.resizeRAF = requestAnimationFrame(() => {
        if (relogioTempo && relogioTempo.classList.contains('relogio-queimando')) resizeFireAndSmokeCanvases();
        if (relicarioAtivo()) resizeDust();
        atualizarRevelacaoBotao();
        prepararEscritaFinal();
        PERF.resizeRAF = 0;
      });
    }

    window.addEventListener('resize', onResizeOptimized);

    document.addEventListener('visibilitychange', () => {
      paginaVisivel = !document.hidden;
      if (!paginaVisivel) {
        stopDust();
        stopFire();
        stopSmoke();
        otimizarVideosVisiveis();
      } else {
        if (relicarioAtivo()) startDust();
        if (relogioTempo && relogioTempo.classList.contains('relogio-queimando') && introScreen && introScreen.style.visibility !== 'hidden') {
          startFire();
          startSmoke();
        }
        otimizarVideosVisiveis();
      }
    });

    frontCoverImage.src = CAPA_NORMAL;
    atualizarMouseLuz(window.innerWidth / 2, window.innerHeight / 2);
    syncBookState();
    atualizarIndicador();
    resizeFireAndSmokeCanvases();
    resizeDust();
    resetarImagemSecreta();
    prepararEscritaFinal();
    iniciarFlickerDaVela();
    atualizarIconeFullscreen();


/* =========================================================
   ADAPTAÇÃO MOBILE — PRINCIPAL
   Controles por toque sem remover a experiência desktop.
========================================================= */
(function(){
  const isTouchLike = () => window.matchMedia('(hover: none), (pointer: coarse), (max-width: 820px)').matches;

  function setMobileLightFromTouch(e){
    if (!isTouchLike()) return;
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    if (!t) return;
    try { atualizarMouseLuz(t.clientX, t.clientY); } catch(err) {}
  }

  document.addEventListener('touchstart', setMobileLightFromTouch, { passive:true });
  document.addEventListener('touchmove', setMobileLightFromTouch, { passive:true });

  let startX = 0;
  let startY = 0;
  let startTime = 0;

  const stage = document.getElementById('book-stage');
  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      if (!isTouchLike()) return;
      if (!stage.classList.contains('active')) return;
      if (e.target.closest('button, video, a, input, textarea, .draggable-photo')) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
    }, { passive:true });

    stage.addEventListener('touchend', (e) => {
      if (!isTouchLike()) return;
      if (!stage.classList.contains('active')) return;
      if (e.target.closest('button, video, a, input, textarea, .draggable-photo')) return;
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startTime;
      if (dt > 700 || Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
      if (dx < 0) virarProxima();
      else voltarAnterior();
    }, { passive:true });
  }

  // No mobile, tocar duas vezes no vídeo falso também revela o botão, caso arrastar seja difícil.
  const secretStageEl = document.getElementById('secret-stage');
  const draggable = document.getElementById('draggable-photo');
  const secretBtn = document.getElementById('secret-button');
  let lastTap = 0;

  if (draggable && secretBtn) {
    draggable.addEventListener('touchend', () => {
      if (!isTouchLike()) return;
      const now = Date.now();
      if (now - lastTap < 430) {
        draggable.classList.add('mobile-secret-revealed');
        draggable.style.left = '-120px';
        draggable.style.top = '-90px';
        secretBtn.classList.add('revealed');
        try { mostrarMensagem('O fundo falso cedeu ao toque.'); } catch(err) {}
      }
      lastTap = now;
    }, { passive:true });
  }

  // Ajuste de autoplay em vídeos quando o relicário começa.
  document.addEventListener('click', () => {
    if (!isTouchLike()) return;
    try { otimizarVideosVisiveis(); } catch(err) {}
  }, { once:false, passive:true });
})();
