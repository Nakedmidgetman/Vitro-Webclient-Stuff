/*
Genesis Runtime Restore v6 SAFE
Trigger name: Genesis Restore
Type: regexp
Pattern:
^(?!/\*|var |if |try |function |const |let ).+

Purpose:
Restores gvitals, tabbed stuff like trackers and quest. So you dont have to type anything when logging in.
GUI stuff isn't saved by webclient automatically sometimes.

Restores:
  gvitals
  ginv refresh
  gtrack refresh
  quest
  ghunt

Important:
- No MutationObserver.
- No repeated DOM scanning.
- No modal/layer watcher.
- Runs only once per browser page load.
*/

try {
  (function () {
    if (window.GenesisRuntimeRestoreStarted === true) {
      return;
    }

    window.GenesisRuntimeRestoreStarted = true;

    function out(msg, color) {
      try {
        gwc.output.append("[RuntimeRestore] " + String(msg), color || "#88ccff");
      } catch (e) {
        try { console.log("[RuntimeRestore] " + msg); } catch (e2) {}
      }
    }

    function sendClientCommand(cmd) {
      try {
        if (gwc && gwc.connection && typeof gwc.connection.send === "function") {
          gwc.connection.send(cmd, true);
          return true;
        }
      } catch (e1) {}

      try {
        if (gwc && gwc.connection && typeof gwc.connection.send === "function") {
          gwc.connection.send(cmd);
          return true;
        }
      } catch (e2) {}

      return false;
    }

    function restore(cmd, delayMs) {
      setTimeout(function () {
        try {
          sendClientCommand(cmd);
        } catch (e) {
          try {
            gwc.output.append(
              "[RuntimeRestore ERROR] " + cmd + " failed: " + e.name + ": " + e.message,
              "#ff6666"
            );
          } catch (ignore) {}
        }
      }, delayMs);
    }

    /*
      Give aliases/userdata time to load.
      Keep spacing slow enough that each UI script can finish before the next starts.
    */

    restore("gvitals", 2500);
    restore("ginv refresh", 4000);
    restore("gtrack refresh", 5500);
    restore("quest", 7000);
    restore("ghunt", 8500);

    setTimeout(function () {
      out("Restore queued: gvitals, inventory, tracker, quests, autohunt.", "#80ff80");
    }, 9000);
  })();
} catch (e) {
  try {
    gwc.output.append("[RuntimeRestore ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
