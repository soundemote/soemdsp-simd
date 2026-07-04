function drawNodeRenderedAudio() {
  drawNodeRenderedWaveform();
  drawNodeRenderedSignalPlot();
  drawNodeRenderedVisualOutput();
}

function drawNodeRenderedWaveform() {
  const canvas = document.getElementById("nodeWaveformCanvas");
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#101214";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(243, 241, 236, 0.18)";
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();

  const samples = nodeGraphMvp.rendered?.samples;
  if (!samples?.length) {
    return;
  }

  context.strokeStyle = "#71d49b";
  context.beginPath();
  for (let x = 0; x < width; x += 1) {
    const start = Math.floor((x / width) * samples.length);
    const end = Math.max(start + 1, Math.floor(((x + 1) / width) * samples.length));
    let min = 1;
    let max = -1;
    for (let frame = start; frame < end; frame += 1) {
      const sample = samples[frame] || 0;
      min = Math.min(min, sample);
      max = Math.max(max, sample);
    }
    const yMin = height / 2 - min * (height * 0.42);
    const yMax = height / 2 - max * (height * 0.42);
    context.moveTo(x, yMin);
    context.lineTo(x, yMax);
  }
  context.stroke();
}

function drawNodeRenderedSignalPlot() {
  const canvas = document.getElementById("nodeSignalPlotCanvas");
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#101214";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(243, 241, 236, 0.16)";
  context.beginPath();
  context.moveTo(width / 2, 0);
  context.lineTo(width / 2, height);
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();

  const samples = nodeGraphMvp.rendered?.samples;
  if (!samples?.length) {
    return;
  }

  const lag = Math.max(1, Math.floor(nodeGraphMvp.sampleRate * 0.001));
  context.strokeStyle = "#7fc7d9";
  context.beginPath();
  for (let frame = lag; frame < samples.length; frame += 8) {
    const x = width / 2 + samples[frame - lag] * (width * 0.42);
    const y = height / 2 - samples[frame] * (height * 0.42);
    if (frame === lag) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.stroke();
}
