// soemdsp-native-module: shooting_star_explosion
// soemdsp-native-label: Shooting Star Explosion
// soemdsp-native-target: shootingStarExplosion
// soemdsp-native-kind: game trigger

namespace {

static const char kMetadataJson[] =
  "{"
    "\"module\":\"shooting_star_explosion\","
    "\"label\":\"Shooting Star Explosion\","
    "\"targetType\":\"shootingStarExplosion\","
    "\"kind\":\"game trigger\","
    "\"inputs\":[],"
    "\"outputs\":[\"Pulse\"],"
    "\"parameters\":["
      "{"
        "\"key\":\"lowRange\","
        "\"label\":\"Low Range\","
        "\"defaultValue\":0,"
        "\"min\":0,"
        "\"mid\":0.5,"
        "\"max\":1,"
        "\"step\":\"any\","
        "\"tooltip\":\"Minimum explosion pulse amplitude (0-1 speed sends this).\""
      "},"
      "{"
        "\"key\":\"highRange\","
        "\"label\":\"High Range\","
        "\"defaultValue\":1,"
        "\"min\":0,"
        "\"mid\":0.5,"
        "\"max\":1,"
        "\"step\":\"any\","
        "\"tooltip\":\"Maximum explosion pulse amplitude (1 speed, or no speed data, sends this).\""
      "}"
    "]"
  "}";

}  // namespace

extern "C" double soemdsp_shooting_star_explosion_power(
  double speed,
  double lowRange,
  double highRange
) {
  const double lo = lowRange < highRange ? lowRange : highRange;
  const double hi = lowRange < highRange ? highRange : lowRange;
  // Negative speed is the "no speed data" sentinel (site didn't send one) --
  // keep the pulse at max amplitude rather than guessing an intensity.
  if (speed < 0.0) {
    return hi;
  }
  // speed is expected 0-1 (the site's trigger intensity), interpolated
  // linearly into [lowRange, highRange] to get the actual pulse amplitude.
  double normalizedSpeed = speed;
  if (normalizedSpeed < 0.0) normalizedSpeed = 0.0;
  if (normalizedSpeed > 1.0) normalizedSpeed = 1.0;
  return lo + normalizedSpeed * (hi - lo);
}

extern "C" int soemdsp_shooting_star_explosion_version() {
  return 1;
}

extern "C" const char* soemdsp_shooting_star_explosion_metadata_json() {
  return kMetadataJson;
}

extern "C" int soemdsp_shooting_star_explosion_metadata_json_size() {
  return sizeof(kMetadataJson) - 1;
}
