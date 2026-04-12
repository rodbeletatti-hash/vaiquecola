// ─── Módulo de Câmera e OCR ───────────────────────────────────────────────────

const camera = (() => {
  let stream       = null;
  let ocrWorker    = null;
  let scanInterval = null;
  let isScanning   = false;

  const canvas  = document.createElement('canvas');
  const ctx     = canvas.getContext('2d', { willReadFrequently: true });
  const canvas2 = document.createElement('canvas');
  const ctx2    = canvas2.getContext('2d', { willReadFrequently: true });

  // ── Câmera ────────────────────────────────────────────────────────────────

  async function start(videoEl) {
    if (stream) stop();
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
      tessedit_pageseg_mode:   '7',   // single text line — mais rápido para códigos curtos
    });
  }

  async function terminateWorker() {
    if (ocrWorker) {
      await ocrWorker.terminate();
      ocrWorker = null;
    }
  }

  // Calcula threshold de Otsu para binarização ótima
  function otsuThreshold(pixels) {
    const hist = new Int32Array(256);
    for (const p of pixels) hist[p]++;
    const total = pixels.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, max = 0, thresh = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (!wB) continue;
      const wF = total - wB;
      if (!wF) break;
      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) ** 2;
      if (between > max) { max = between; thresh = t; }
    }
    return thresh;
  }

  // Pré-processa o frame: crop central, escala 3×, binarização Otsu
  function preprocessFrame(videoEl, targetCanvas, targetCtx) {
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (!vw || !vh) return false;

    // Faixa horizontal central onde costuma ficar o código (80% × 28%)
    const sx = Math.round(vw * 0.10);
    const sy = Math.round(vh * 0.36);
    const sw = Math.round(vw * 0.80);
    const sh = Math.round(vh * 0.28);

    // Escala 3× para melhor precisão
    targetCanvas.width  = sw * 3;
    targetCanvas.height = sh * 3;
    targetCtx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, targetCanvas.width, targetCanvas.height);

    // Grayscale
    const img   = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
    const d     = img.data;
    const grays = new Uint8Array(targetCanvas.width * targetCanvas.height);
    for (let i = 0; i < d.length; i += 4) {
      grays[i >> 2] = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    }

    // Binarização Otsu
    const thresh = otsuThreshold(grays);
    for (let i = 0; i < d.length; i += 4) {
      const val = grays[i >> 2] > thresh ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = val;
    }
    targetCtx.putImageData(img, 0, 0);
    return true;
  }

  // Reconhece frame: tenta normal e invertido para cobrir texto claro/escuro
  async function recognizeFrame(videoEl) {
    if (!preprocessFrame(videoEl, canvas, ctx)) return '';

    // Tentativa 1: imagem normal
    const { data: { text: t1 } } = await ocrWorker.recognize(canvas);
    const code1 = extractCode(t1.toUpperCase());
    if (code1) return code1;

    // Tentativa 2: imagem invertida (texto claro em fundo escuro)
    canvas2.width  = canvas.width;
    canvas2.height = canvas.height;
    ctx2.drawImage(canvas, 0, 0);
    const img2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
    const d2   = img2.data;
    for (let i = 0; i < d2.length; i += 4) {
      d2[i] = d2[i + 1] = d2[i + 2] = 255 - d2[i];
    }
    ctx2.putImageData(img2, 0, 0);
    const { data: { text: t2 } } = await ocrWorker.recognize(canvas2);
    return extractCode(t2.toUpperCase()) || '';
  }

  // Extrai o primeiro código válido do texto OCR
  function extractCode(text) {
    const pattern = /([A-Z]{2,4})(\d{1,2})/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const code = match[1] + match[2];
      if (isValidStickerCode(code)) return code;
    }
    return null;
  }

  // ── Scan contínuo ─────────────────────────────────────────────────────────

  async function startScan(videoEl, onResult) {
    if (isScanning) return;
    await initWorker();
    isScanning = true;

    let processing = false;
    scanInterval = setInterval(async () => {
      if (!isScanning || processing) return;
      processing = true;
      try {
        const code = await recognizeFrame(videoEl);
        if (code) {
          isScanning = false;
          onResult(code);
        }
      } catch (e) {
        // ignora erros de frame
      } finally {
        processing = false;
      }
    }, 1000);
  }

  function resumeScan() { isScanning = true; }

  function stopScan() {
    isScanning = false;
    if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
    terminateWorker();
  }

  async function captureOnce(videoEl) {
    await initWorker();
    return await recognizeFrame(videoEl);
  }

  return { start, stop, startScan, stopScan, resumeScan, captureOnce };
})();
