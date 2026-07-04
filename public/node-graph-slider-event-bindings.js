function bindNodeGraphSliderDragEvents() {
  document.addEventListener("pointermove", dragNodeSlider);
  document.addEventListener("pointerup", endNodeSliderDrag);
  document.addEventListener("pointercancel", endNodeSliderDrag);
  document.addEventListener("mousemove", dragNodeSlider);
  document.addEventListener("mouseup", endNodeSliderDrag);
}
