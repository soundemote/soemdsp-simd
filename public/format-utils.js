function boolText(value) {
  return value ? "true" : "false";
}

function statusText(ok) {
  return ok ? "OK" : "Check";
}

function formatHttpStatus(status, text = "") {
  const code = Number(status);
  if (!Number.isFinite(code) || code <= 0) {
    return "Unavailable";
  }

  return text ? `${code} ${text}` : String(code);
}

function formatSeconds(seconds) {
  return `${seconds.toFixed(3)}s`;
}

function formatAudioDuration(duration) {
  return Number.isFinite(duration) && duration > 0 ? formatSeconds(duration) : "unknown";
}

function formatPercent(value) {
  return `${Number(value.toFixed(1)).toString()}%`;
}

function manifestValueText(value) {
  const number = Number(value);
  return Number.isFinite(number) ? formatCompactNumber(number) : "";
}

function parseSummaryNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isPositiveFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

function isPositiveNumber(value) {
  return value !== null && value > 0;
}

function isUpwardChange(first, second) {
  return first !== null && second !== null && second > first;
}

function formatSummaryChange(first, second) {
  if (first === null || second === null) {
    return "";
  }

  const delta = second - first;
  const ratio = first === 0 ? null : second / first;
  if (ratio === null) {
    return `${formatSignedNumber(delta)} / ratio unavailable`;
  }

  return `${formatSignedNumber(delta)} / x${formatCompactNumber(ratio)}`;
}

function formatSignedNumber(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatCompactNumber(value)}`;
}

function formatCompactNumber(value) {
  return Number(value.toFixed(3)).toString();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${formatCompactNumber(bytes / 1024)} KB`;
}

function manifestNumberText(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? String(number) : "missing";
}

function manifestBytesText(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? formatBytes(number) : "missing";
}

function formatTimestamp(value) {
  if (!value) {
    return "missing";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "invalid";
  }

  return date.toLocaleString();
}

Object.assign(window, {
  boolText,
  formatAudioDuration,
  formatBytes,
  formatCompactNumber,
  formatHttpStatus,
  formatPercent,
  formatSeconds,
  formatSignedNumber,
  formatSummaryChange,
  formatTimestamp,
  isPositiveFiniteNumber,
  isPositiveNumber,
  isUpwardChange,
  manifestBytesText,
  manifestNumberText,
  manifestValueText,
  parseSummaryNumber,
  statusText,
});
