function setNodeGraphSettingsField(id, value) {
  const field = document.getElementById(id);
  if (field && document.activeElement !== field) {
    field.value = value;
  }
}

function nodeGraphSyncedFieldValue(ids) {
  const activeId = document.activeElement?.id || "";
  if (ids.includes(activeId)) {
    return document.getElementById(activeId)?.value;
  }
  for (const id of ids) {
    const field = document.getElementById(id);
    if (field) {
      return field.value;
    }
  }
  return "";
}
