/*
Trigger
Name: Gvitals Output
Type: gmcp
Pattern: Char.Vitals

Alias(s) Required:
 - gvitals
*/

try {
  (function () {
    var payload = null;

    function cleanObj(obj) {
      if (obj && typeof obj === "object") return obj;
      return null;
    }

    if (typeof args !== "undefined") {
      payload = cleanObj(args[0]) || cleanObj(args[1]) || cleanObj(args["*"]);

      if (!payload && typeof args["*"] === "string") {
        try { payload = JSON.parse(args["*"]); } catch (e1) {}
      }

      if (!payload && typeof args[1] === "string") {
        try { payload = JSON.parse(args[1]); } catch (e2) {}
      }

      if (!payload && typeof args[0] === "string") {
        try { payload = JSON.parse(args[0]); } catch (e3) {}
      }
    }

    if (!payload) {
      try {
        if (mud && mud.gmcp && mud.gmcp["char.vitals"]) payload = mud.gmcp["char.vitals"];
      } catch (e4) {}
    }

    if (!payload) {
      try {
        if (mud && mud.gmcp && mud.gmcp["Char.Vitals"]) payload = mud.gmcp["Char.Vitals"];
      } catch (e5) {}
    }

    if (!payload) {
      try {
        if (gwc && gwc.gmcp && gwc.gmcp.data && gwc.gmcp.data.char && gwc.gmcp.data.char.vitals) {
          payload = gwc.gmcp.data.char.vitals;
        }
      } catch (e6) {}
    }

    if (!payload) {
      try {
        if (gwc && gwc.gmcp && gwc.gmcp.data && gwc.gmcp.data.character && gwc.gmcp.data.character.vitals) {
          payload = gwc.gmcp.data.character.vitals;
        }
      } catch (e7) {}
    }

    if (window.GenesisVitals && window.GenesisVitals.onGMCPVitals) {
      window.GenesisVitals.onGMCPVitals(payload || {});
    }
  })();
} catch (e) {
  try {
    gwc.output.append("[GVitals Output ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
