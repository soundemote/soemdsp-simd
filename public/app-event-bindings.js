document
  .getElementById("refreshButton")
  ?.addEventListener("click", loadManifest);

document
  .getElementById("waveformCanvas")
  .addEventListener("click", seekWaveform);

document
  .getElementById("waveformCanvas")
  .addEventListener("pointerdown", beginWaveformDrag);

document
  .getElementById("waveformCanvas")
  .addEventListener("pointermove", dragWaveform);

document
  .getElementById("waveformCanvas")
  .addEventListener("pointerleave", clearWaveformProbe);

document
  .getElementById("waveformCanvas")
  .addEventListener("pointerup", endWaveformDrag);

document
  .getElementById("waveformCanvas")
  .addEventListener("pointercancel", endWaveformDrag);

document
  .getElementById("waveformScrubber")
  .addEventListener("input", scrubWaveform);

document
  .getElementById("waveformScrubber")
  .addEventListener("pointerdown", beginScrubberDrag);

document
  .getElementById("waveformScrubber")
  .addEventListener("pointerup", endScrubberDrag);

document
  .getElementById("waveformScrubber")
  .addEventListener("pointercancel", endScrubberDrag);

document
  .getElementById("waveformScrubber")
  .addEventListener("lostpointercapture", endScrubberDrag);

document
  .getElementById("levelEnvelopeCanvas")
  .addEventListener("pointermove", (event) => probeLevelEnvelopeAtClientX(event.clientX));

document
  .getElementById("levelEnvelopeCanvas")
  .addEventListener("pointerleave", clearLevelEnvelopeProbe);

document
  .getElementById("signalPlotCanvas")
  .addEventListener("pointermove", probeSignalPlot);

document
  .getElementById("signalPlotCanvas")
  .addEventListener("pointerleave", clearSignalPlotProbe);

document.addEventListener("pointermove", clearPhaseButtonProbeFromOutside);

document
  .getElementById("followAudioButton")
  .addEventListener("click", toggleFollowAudio);

document
  .getElementById("waveformPlayButton")
  .addEventListener("click", togglePrimaryAudioPlayback);

document
  .getElementById("audioPlayer")
  .addEventListener("timeupdate", syncWaveformToAudio);

document
  .getElementById("audioPlayer")
  .addEventListener("seeked", syncWaveformToAudio);

document
  .getElementById("audioPlayer")
  .addEventListener("loadedmetadata", renderAudioPosition);

document
  .getElementById("audioPlayer")
  .addEventListener("play", renderAudioPosition);

document
  .getElementById("audioPlayer")
  .addEventListener("pause", renderAudioPosition);

document
  .getElementById("audioPlayer")
  .addEventListener("ended", syncWaveformToAudioEnd);

window.addEventListener("resize", () => {
  drawWaveform();
  drawLevelEnvelope();
  drawSignalPlot();
  updateParameterTimelinePlayhead(activeWaveformRegion());
  drawNodeGraphWires();
  drawNodeRenderedAudio();
});
