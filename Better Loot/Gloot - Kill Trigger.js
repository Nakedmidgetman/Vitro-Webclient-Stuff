/*
Trigger
Name: Gloot Kill Trigger
Type: regexp
Pattern: ^You killed .+\.$

Alias(s) Required:
- gloot

*/

try {
  (function () {
    if (window.GenesisWebLoot && typeof window.GenesisWebLoot.onKill === "function") {
      window.GenesisWebLoot.onKill();
    } else {
      try {
        gwc.output.append("[GWLoot Trigger] GenesisWebLoot.onKill is not loaded. Type `gloot` once, then try again.", "#ffcc66");
      } catch (ignore) {}
    }
  })();
} catch (e) {
  try {
    gwc.output.append("[GWLoot Trigger ERROR] " + e.name + ": " + e.message, "#ff5555");
  } catch (ignore2) {}
}
