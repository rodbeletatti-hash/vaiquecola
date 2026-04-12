// ─── Módulo de Câmera e OCR ───────────────────────────────────────────────────

const camera = (() => {
  let stream       = null;
  let ocrWorker    = null;
  let scanInterval = null;
  let isScanning   = false;

  // Canvas oculto para captura e pré-processamento
  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d', { willReadFrequently: true });

  // ── Câmera ────────────────────────────────────────────────────────────────

  async function start(videoEl) {
    if (stream) stop();
    // Tenta forçar câmera traseira; se não existir (desktop), usa qualquer câmera
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 } },
        audio: false,
      });
    }
    videoEl.srcObject = stream;
    await videoEl.play();
  }

  function stop() {
    stopScan();
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }

  // ── OCR ───────────────────────────────────────────────────────────────────

  async function initWorker() {
    if (ocrWorker) return;
    ocrWorker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
    await ocrWorker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      tessedit_pageseg_mode:   '6',   // single uniform block
    });
  }

  async function terminateWorker() {
    if (ocrWorker) {
      await ocrWorker.terminate();
      ocrWorker = null;
    }
  }

  // Captura o frame atual e extrai texto via OCR
  async function recognizeFrame(videoEl) {
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (!vw || !vh) return '';

    // Crop: faixa central horizontal (60% largura × 40% altura)
    const sx = Math.round(vw * 0.2);
    const sy = Math.round(vh * 0.3);
    const sw = Math.round(vw * 0.6);
    const sh = Math.round(vh * 0.4);

    // Escala 2× para melhorar precisão do OCR
    canvas.width  = sw * 2;
    canvas.height = sh * 2;
    ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Pré-processamento: grayscale + aumento de contraste
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d   = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray     = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.6 + 128));
      d[i] = d[i + 1] = d[i + 2] = enhanced;
    }
    ctx.putImageData(img, 0, 0);

    const { data: { text } } = await ocrWorker.recognize(canvas);
    return text.toUpperCase();
  }

  // Extrai o primeiro código válido de um texto OCR
  function extractCode(text) {
    const pattern = /\b([A-Z]{2,4})(\d{1,2})\b/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const code = match[1] + match[2];
      if (isValidStickerCode(code)) return code;
    }
    return null;
  }

  // ── Scan contínuo ─────────────────────────────────────────────────────────

  // onResult(code) é chamado quando um código válido é detectado.
  // O scan pausa automaticamente após detectar; chame resumeScan() para continuar.
  async function startScan(videoEl, onResult) {
    if (isScanning) return;
    await initWorker();
    isScanning = true;

    let processing = false;
    scanInterval = setInterval(async () => {
      if (!isScanning || processing) return;
      processing = true;
      try {
        const text = await recognizeFrame(videoEl);
        const code = extractCode(text);
        if (code) {
          isScanning = false;
          onResult(code);
        }
      } catch (e) {
        // ignora erros de frame (ex: câmera sendo fechada)
      } finally {
        processing = false;
      }
    }, 1000);
  }

  function resumeScan() {
    isScanning = true;
  }

  function stopScan() {
    isScanning = false;
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
    terminateWorker();
  }

  // Captura manual: reconhece um único frame sob demanda
  async function captureOnce(videoEl) {
    await initWorker();
    const text = await recognizeFrame(videoEl);
    return extractCode(text);
  }

  return { start, stop, startScan, stopScan, resumeScan, captureOnce };
})();
