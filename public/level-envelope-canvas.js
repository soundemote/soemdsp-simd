function drawLevelEnvelope() {
  const canvas = document.getElementById("levelEnvelopeCanvas");
  const waveform = state.waveform;
  const envelope = waveform?.envelope;
  if (!waveform || !envelope) {
    return;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(canvas.clientWidth * pixelRatio));
  const height = Math.max(100, Math.floor(canvas.clientHeight * pixelRatio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#111418";
  context.fillRect(0, 0, width, height);

  const regions = waveform.regions || [];
  for (const [index, region] of regions.entries()) {
    const startX = Math.round((region.startFrame / waveform.frames) * width);
    const endX = Math.round((region.endFrame / waveform.frames) * width);
    context.fillStyle =
      index % 2 === 0 ? "rgba(127,199,217,0.09)" : "rgba(226,168,109,0.10)";
    context.fillRect(startX, 0, Math.max(1, endX - startX), height);
  }

  const pad = 12 * pixelRatio;
  const top = pad;
  const bottom = height - pad;
  const graphHeight = Math.max(1, bottom - top);
  context.strokeStyle = "rgba(243,241,236,0.16)";
  context.lineWidth = Math.max(1, pixelRatio);
  for (const level of [0, 0.5, 1]) {
    const y = bottom - level * graphHeight;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const windows = envelope.windows;
  if (windows.length) {
    const columnWidth = Math.max(1, width / windows.length);
    context.fillStyle = "rgba(127,199,217,0.30)";
    for (const [index, entry] of windows.entries()) {
      const x = Math.floor(index * columnWidth);
      const y = bottom - Math.min(1, entry.rms) * graphHeight;
      context.fillRect(x, y, Math.ceil(columnWidth), bottom - y);
    }

    context.strokeStyle = "#e2a86d";
    context.lineWidth = Math.max(1.5, 1.5 * pixelRatio);
    context.beginPath();
    for (const [index, entry] of windows.entries()) {
      const x = index * columnWidth + columnWidth / 2;
      const y = bottom - Math.min(1, entry.peak) * graphHeight;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();
  }

  const playheadRatio = waveform.frames > 0 ? state.playheadFrame / waveform.frames : 0;
  const playheadX = Math.max(0, Math.min(width, playheadRatio * width));
  context.strokeStyle = "#f3f1ec";
  context.lineWidth = Math.max(1, pixelRatio);
  context.beginPath();
  context.moveTo(playheadX, 0);
  context.lineTo(playheadX, height);
  context.stroke();

  if (state.waveformProbeFrame !== null) {
    const probeFrame = clampFrame(state.waveformProbeFrame, waveform);
    const probeRatio = waveform.frames > 0 ? probeFrame / waveform.frames : 0;
    const probeX = Math.max(0, Math.min(width, probeRatio * width));
    const probeWindow = levelEnvelopeWindowAtFrame(probeFrame);
    const probeY = probeWindow
      ? bottom - Math.min(1, probeWindow.rms) * graphHeight
      : centerYForEnvelope(top, bottom);
    context.strokeStyle = "#f6c96d";
    context.lineWidth = Math.max(2, 2 * pixelRatio);
    context.beginPath();
    context.moveTo(probeX, 0);
    context.lineTo(probeX, height);
    context.stroke();
    context.fillStyle = "#f6c96d";
    context.beginPath();
    context.arc(probeX, probeY, Math.max(4, 4 * pixelRatio), 0, Math.PI * 2);
    context.fill();
  }
}

function centerYForEnvelope(top, bottom) {
  return top + (bottom - top) / 2;
}
