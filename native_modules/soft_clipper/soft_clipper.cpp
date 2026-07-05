// soemdsp-native-module: soft_clipper
// soemdsp-native-label: Soft Clipper
// soemdsp-native-target: softClipper
// soemdsp-native-kind: dynamics
// soemdsp-native-path: Dynamics/Saturation/Soft Clipper
// soemdsp-native-construction: false

namespace {

static const char kMetadataJson[] =
  "{"
    "\"module\":\"soft_clipper\","
    "\"label\":\"Soft Clipper\","
    "\"targetType\":\"softClipper\","
    "\"kind\":\"dynamics\","
    "\"inputs\":[\"In\"],"
    "\"outputs\":[\"Out\"],"
    "\"parameters\":["
      "{"
        "\"key\":\"center\","
        "\"label\":\"Center\","
        "\"defaultValue\":0,"
        "\"min\":-1,"
        "\"mid\":0,"
        "\"max\":1,"
        "\"step\":\"any\","
        "\"tooltip\":\"Moves the soft clipping curve left or right before shaping.\""
      "},"
      "{"
        "\"key\":\"width\","
        "\"label\":\"Width\","
        "\"defaultValue\":2,"
        "\"min\":0.0001,"
        "\"mid\":2,"
        "\"max\":8,"
        "\"step\":\"any\","
        "\"skew\":\"mid skew\","
        "\"tooltip\":\"Sets the width of the smooth tanh transition before the signal saturates.\""
      "}"
    "]"
  "}";

double absValue(double value) {
  return value < 0.0 ? -value : value;
}

double tanhApprox(double value) {
  // Cheap, smooth odd sigmoid for the wasm32 no-stdlib build.
  const double x = value;
  const double x2 = x * x;
  const double denominator = 27.0 + 9.0 * x2;
  return (denominator <= 0.0) ? 0.0 : (x * (27.0 + x2)) / denominator;
}

double softClipperSample(double input, double center, double width) {
  const double safeWidth = absValue(width) > 0.000001 ? absValue(width) : 2.0;
  const double scaleX = 2.0 / safeWidth;
  const double shiftX = -1.0 - (scaleX * (center - 0.5 * safeWidth));
  const double scaleY = 1.0 / scaleX;
  const double shiftY = -shiftX * scaleY;
  return shiftY + scaleY * tanhApprox(scaleX * input + shiftX);
}

}  // namespace

extern "C" double soemdsp_soft_clipper_sample(
  double input,
  double center,
  double width
) {
  return softClipperSample(input, center, width);
}

extern "C" int soemdsp_soft_clipper_version() {
  return 1;
}

extern "C" const char* soemdsp_soft_clipper_metadata_json() {
  return kMetadataJson;
}

extern "C" int soemdsp_soft_clipper_metadata_json_size() {
  return sizeof(kMetadataJson) - 1;
}
