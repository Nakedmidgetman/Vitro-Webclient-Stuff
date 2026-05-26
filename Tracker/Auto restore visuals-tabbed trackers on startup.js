/*
Genesis Runtime Restore v2
Type: regexp
Pattern:
/*
Genesis Runtime Restore v2
Type: regexp
Pattern:
^(?!/\*|var |if |try |function |const |let ).+

Purpose:
Restores  UI after browser reload otherwise you'll need to type them manuall. Anytime you mess with website UI stuff like the webclient layout anytime you refresh your browser it doesn't get saved
So this trigger works around that so it'll autoload all your visual stuff thats attached to the webclient and not a popup window or something.


Restores:
  gvitals
  ginv refresh
  gtrack refresh
*/

try {
  (function () {
    if (window.GenesisRuntimeRestoreStarted) {
      return;
    }

    window.GenesisRuntimeRestoreStarted = true;

    function sendClientCommand(cmd) {
      try {
        gwc.connection.send(cmd, true);
        return true;
      } catch (e1) {
        try {
          gwc.connection.send(cmd);
          return true;
        } catch (e2) {
          return false;
        }
      }
    }

    /*
      Wait a little so aliases and user data have time to finish loading.
      This trigger fires on the first normal game-output line it sees.
    */
    setTimeout(function () {
      sendClientCommand("gvitals");

      setTimeout(function () {
        sendClientCommand("ginv refresh");

        setTimeout(function () {
          sendClientCommand("gtrack refresh");
        }, 700);
      }, 700);
    }, 1800);
  })();
} catch (e) {
  try {
    gwc.output.append("[RuntimeRestore ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
Purpose:
Restores  UI after browser reload otherwise you'll need to type them manuall. Anytime you mess with website UI stuff like the webclient layout anytime you refresh your browser it doesn't get saved
So this trigger works around that so it'll autoload all your visual stuff thats attached to the webclient and not a popup window or something.


Restores:
  gvitals
  ginv refresh
  gtrack refresh
*/

try {
  (function () {
    if (window.GenesisRuntimeRestoreStarted) {
      return;
    }

    window.GenesisRuntimeRestoreStarted = true;

    function sendClientCommand(cmd) {
      try {
        gwc.connection.send(cmd, true);
        return true;
      } catch (e1) {
        try {
          gwc.connection.send(cmd);
          return true;
        } catch (e2) {
          return false;
        }
      }
    }

    /*
      Wait a little so aliases and user data have time to finish loading.
      This trigger fires on the first normal game-output line it sees.
    */
    setTimeout(function () {
      sendClientCommand("gvitals");

      setTimeout(function () {
        sendClientCommand("ginv refresh");

        setTimeout(function () {
          sendClientCommand("gtrack refresh");
        }, 700);
      }, 700);
    }, 1800);
  })();
} catch (e) {
  try {
    gwc.output.append("[RuntimeRestore ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
