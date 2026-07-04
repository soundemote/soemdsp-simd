function renderAudioPosition() {
  const audio = document.getElementById("audioPlayer");
  const position = document.getElementById("audioPosition");
  const time = Number(audio.currentTime);
  const duration = Number(audio.duration);
  const positionText = `audio ${formatSeconds(Number.isFinite(time) ? time : 0)} / ${formatAudioDuration(duration)}`;
  labelWaveformHeaderPill(
    position,
    "primary audio position",
    positionText,
    Boolean(audio.getAttribute("src")),
  );
  setInspectionCursorAudio(time, duration);
  setInspectionCursorPlayback(audio);
  renderWaveformPlayControl(audio);
}

function renderWaveformPlayControl(audio = document.getElementById("audioPlayer")) {
  const button = document.getElementById("waveformPlayButton");
  const ready = Boolean(audio?.getAttribute("src"));
  const playing = ready && !audio.paused && !audio.ended;
  const ended = ready && audio.ended;
  const value = playing ? "Pause Audio" : ended ? "Replay Audio" : "Play Audio";
  const actionValue = playing
    ? "Pause primary audio"
    : ended
      ? "Replay primary audio from start"
      : "Play primary audio";
  const stateName = !ready ? "disabled" : playing ? "playing" : ended ? "ended" : "idle";
  button.disabled = !ready;
  button.textContent = value;
  button.setAttribute("aria-pressed", String(playing));
  button.classList.toggle("active", playing);
  labelWaveformControlButton(button, "waveform playback", actionValue, stateName);
}

async function togglePrimaryAudioPlayback() {
  const audio = document.getElementById("audioPlayer");
  if (!audio.getAttribute("src")) {
    renderWaveformPlayControl(audio);
    return;
  }

  try {
    if (audio.paused || audio.ended) {
      if (audio.ended) {
        audio.currentTime = 0;
        if (state.followAudio && state.waveform) {
          setPlayheadFrame(0);
        }
      }
      await audio.play();
    } else {
      audio.pause();
    }
  } catch (error) {
    console.error(error);
  }

  renderAudioPosition();
}

function setFollowAudio(enabled, syncNow) {
  state.followAudio = enabled;
  renderFollowAudioControl();
  if (enabled && syncNow) {
    syncWaveformToAudio();
  } else {
    renderWaveformPosition();
  }
}

function renderFollowAudioControl() {
  const button = document.getElementById("followAudioButton");
  const value = state.followAudio ? "Follow Audio" : "Free View";
  const actionValue = state.followAudio
    ? "Waveform view follows primary audio"
    : "Waveform view is independent of primary audio";
  const stateName = state.followAudio ? "follow" : "free";
  button.textContent = value;
  button.setAttribute("aria-pressed", String(state.followAudio));
  button.classList.toggle("active", state.followAudio);
  labelWaveformControlButton(button, "waveform view mode", actionValue, stateName);
  setInspectionCursorView(state.followAudio);
}

function updateActivePhaseButtons(activeRegion) {
  for (const button of document.querySelectorAll("#waveformPhaseControls button")) {
    button.classList.toggle("active", button.textContent === activeRegion?.name);
    button.classList.toggle(
      "preview",
      button.dataset.phaseIndex === String(state.phaseJumpPreviewIndex),
    );
  }
  renderPhaseJumpTarget();
}

function syncWaveformToAudio() {
  const audio = document.getElementById("audioPlayer");
  renderAudioPosition();
  if (
    !state.followAudio ||
    !state.waveform ||
    state.scrubberPointerActive ||
    Number.isNaN(audio.currentTime)
  ) {
    return;
  }

  setPlayheadFrame(Math.round(audio.currentTime * state.waveform.sampleRate));
}

function syncWaveformToAudioEnd() {
  const audio = document.getElementById("audioPlayer");
  renderAudioPosition();
  if (!state.followAudio || !state.waveform || Number.isNaN(audio.duration)) {
    return;
  }

  setPlayheadFrame(state.waveform.frames);
}

function seekPrimaryAudioToFrame(frame, source = inspectionSources.waveform) {
  const waveform = state.waveform;
  if (!waveform) {
    return;
  }

  const targetFrame = clampFrame(frame, waveform);
  state.lastSeekSource = source;
  state.lastSeekFrame = targetFrame;
  state.lastSeekFollowAudio = state.followAudio;
  if (state.followAudio) {
    const audio = document.getElementById("audioPlayer");
    const targetTime = targetFrame / waveform.sampleRate;
    if (Number.isFinite(targetTime)) {
      audio.currentTime = targetTime;
      renderAudioPosition();
    }
  }

  setPlayheadFrame(targetFrame);
}
