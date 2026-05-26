/*
Genesis Inventory Capture Safe Trigger v72
Pattern:
^(You are (?:wearing|wielding|holding|carrying|in possession of).*)$

REQUIRED ALIAS(s): Inventory Tracker
*/

var line = "";

try {
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
