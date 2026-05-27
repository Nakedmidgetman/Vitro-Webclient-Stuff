/*
Genesis Inventory Capture Trigger v78
Type: regexp
Pattern:
^(You are (?:wearing|wielding|holding|carrying|in possession of).*)$

Purpose:
- Backup capture for direct inventory output lines.
- The main auto-refresh watcher is installed by the ginv alias itself.
- This avoids relying on a broad ^(.*)$ trigger.
*/

try {
  var line = "";

  if (typeof args !== "undefined") {
    if (typeof args["*"] !== "undefined") {
      line = String(args["*"]);
    } else if (typeof args[1] !== "undefined") {
      line = String(args[1]);
    } else if (typeof args[0] !== "undefined") {
      line = String(args[0]);
    }
  }

  if (window.GenesisInventoryTab && window.GenesisInventoryTab.captureLine) {
    window.GenesisInventoryTab.captureLine(line);
  }
} catch (e) {
  try {
    gwc.output.append("[GInv Capture ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
