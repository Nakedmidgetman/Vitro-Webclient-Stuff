/*
GVitals GMCP Vitals
Type: gmcp
Pattern:
Char.Vitals

Purpose:
Updates gvitals from Genesis GMCP Char.Vitals broadcasts.
*/

try {
  var payload = null;

  try {
    if (typeof args !== "undefined") {
      if (args[0] && typeof args[0] === "object") payload = args[0];
      else if (args[1] && typeof args[1] === "object") payload = args[1];
      else if (args["*"] && typeof args["*"] === "object") payload = args["*"];
      else if (args["*"] && typeof args["*"] === "string") payload = JSON.parse(args["*"]);
    }
  } catch (e1) {}

  if (!payload) {
    try {
      if (
        gwc.gmcp &&
        gwc.gmcp.data &&
        gwc.gmcp.data.character &&
        gwc.gmcp.data.character.vitals
      ) {
        payload = gwc.gmcp.data.character.vitals;
      }
    } catch (e2) {}
  }

  if (!payload) {
    try {
      if (
        gwc.gmcp &&
        gwc.gmcp.data &&
        gwc.gmcp.data.char &&
        gwc.gmcp.data.char.vitals
      ) {
        payload = gwc.gmcp.data.char.vitals;
      }
    } catch (e3) {}
  }

  if (window.GenesisVitals && window.GenesisVitals.onGMCPVitals) {
    window.GenesisVitals.onGMCPVitals(payload || {});
  }
} catch (e) {
  try {
    gwc.output.append("[GVitals GMCP ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
