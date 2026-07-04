function setNodeGraphLiveStatus(text, state = "") {
  const status = document.getElementById("nodeLiveStatus");
  if (!status) {
    return;
  }
  status.textContent = text;
  status.className = `pill ${state}`.trim();
}

function clearNodeGraphLiveStatusTitle() {
  document.getElementById("nodeLiveStatus")?.removeAttribute("title");
}

function setNodeGraphLiveEngineStatus(text = "engine idle", state = "") {
  const status = document.getElementById("nodeLiveEngineStatus");
  if (!status) {
    return;
  }
  status.textContent = text;
  status.className = `pill ${state}`.trim();
}

function setNodeGraphLiveEngineTitle(text = "") {
  const status = document.getElementById("nodeLiveEngineStatus");
  if (!status) {
    return;
  }
  if (text) {
    status.title = text;
  } else {
    status.removeAttribute("title");
  }
}

function setNodeGraphLivePlanStatus(text = "plan idle", state = "") {
  const status = document.getElementById("nodeLivePlanStatus");
  if (!status) {
    return;
  }
  status.textContent = text;
  status.className = `pill ${state}`.trim();
}

function setNodeGraphLivePlanTitle(text = "") {
  const status = document.getElementById("nodeLivePlanStatus");
  if (!status) {
    return;
  }
  if (text) {
    status.title = text;
  } else {
    status.removeAttribute("title");
  }
}
