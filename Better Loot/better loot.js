try {
/*
Alias
Pattern: gloot
Type: Javascript

Trigger(s) Required:
 - Gloot Kill Trigger

Optional Alias(s):
 - package

Commands:
 - gloot
 - gloot help
 - gloot on
 - gloot off
 - gloot auto on
 - gloot auto off
 - gloot run
 - gloot delay 300
 - gloot corpse first
 - gloot corpse all
 - gloot status
 - gloot reset
 - gloot add <command>
 - gloot remove <number>
 - gloot list
 - gloot backup
 - gloot restore
*/


(function () {
  var msgColor = "#d8b4ff";
  var warnColor = "#ff5555";
  var goodColor = "#80ff80";

  function append(text, color) {
    gwc.output.append(String(text), color || msgColor);
  }

  function lower(text) {
    return String(text || "").toLowerCase().replace(/^\s+|\s+$/g, "");
  }

  function ensureData() {
    gwc.userdata.gloot = gwc.userdata.gloot || {};

    var d = gwc.userdata.gloot;

    d.enabled = d.enabled !== false;
    d.auto = d.auto !== false;
    d.delay = d.delay || 300;
    d.corpseMode = d.corpseMode || "first";

    d.commands = d.commands || [
      "get all from corpse",
      "get all from first corpse",
      "take imbued things from first corpse",
      "take imbued things",
      "keep imbued things",
      "take gems from first corpse",
      "take gems",
      "take gold coins from first corpse",
      "take gold coins",
      "take platinum coins from first corpse",
      "take platinum coins",
      "put gems in pack",
      "put platinum coins in pack",
      "put gold coins in pack",
      "fillpack"
    ];

    d.runs = d.runs || 0;
    d.lastRun = d.lastRun || "never";

    return d;
  }

  function getState() {
    window.GWLootState = window.GWLootState || {};

    var s = window.GWLootState;

    s.running = s.running || false;
    s.timers = s.timers || [];
    s.queue = s.queue || [];
    s.queueIndex = s.queueIndex || 0;

    return s;
  }

  function saveBackup() {
    try {
      localStorage.setItem("GWLootBackup", JSON.stringify(gwc.userdata.gloot || {}));
    } catch (err) {
      /* ignore */
    }
  }

  function restoreBackup() {
    try {
      var raw = localStorage.getItem("GWLootBackup");

      if (!raw) {
        append("No GWLoot backup found.", warnColor);
        return;
      }

      gwc.userdata.gloot = JSON.parse(raw);
      append("GWLoot restored from browser backup.", goodColor);
    } catch (err) {
      append("Restore failed: " + err.message, warnColor);
    }
  }

  function clearTimers() {
    var s = getState();
    var i;

    for (i = 0; i < s.timers.length; i++) {
      clearTimeout(s.timers[i]);
    }

    s.timers = [];
    s.running = false;
    s.queue = [];
    s.queueIndex = 0;
  }

  function addTimer(id) {
    var s = getState();
    s.timers.push(id);
  }

  function sendCommand(cmd) {
    gwc.connection.send(cmd, true);
  }

  function normalizeLootCommand(command) {
    var d = ensureData();

    command = String(command || "");

    if (d.corpseMode === "first") {
      command = command.replace(/\bfrom corpse\b/g, "from first corpse");
    }

    return command;
  }

  function sendNextLootCommand() {
    var d = ensureData();
    var s = getState();
    var command;

    if (!s.running) {
      return;
    }

    if (s.queueIndex >= s.queue.length) {
      s.running = false;
      s.queue = [];
      s.queueIndex = 0;
      return;
    }

    command = s.queue[s.queueIndex];
    s.queueIndex += 1;

    sendCommand(command);

    if (s.queueIndex >= s.queue.length) {
      s.running = false;
      s.queue = [];
      s.queueIndex = 0;
      return;
    }

    addTimer(setTimeout(function () {
      sendNextLootCommand();
    }, d.delay));
  }

  function runLoot() {
    var d = ensureData();
    var s = getState();
    var i;

    if (!d.enabled) {
      append("GWLoot is disabled.", warnColor);
      return;
    }

    if (s.running) {
      append("GWLoot is already running.", warnColor);
      return;
    }

    if (!d.commands || !d.commands.length) {
      append("No loot commands configured.", warnColor);
      return;
    }

    s.running = true;
    s.queue = [];
    s.queueIndex = 0;

    for (i = 0; i < d.commands.length; i++) {
      s.queue.push(normalizeLootCommand(d.commands[i]));
    }

    d.runs += 1;
    d.lastRun = new Date().toLocaleTimeString();

    saveBackup();

    append("Running auto-loot commands.", goodColor);

    sendNextLootCommand();
  }

  function onKill() {
    var d = ensureData();

    if (!d.enabled || !d.auto) {
      return;
    }

    runLoot();
  }

  function setEnabled(value) {
    var d = ensureData();

    value = lower(value);

    if (value === "on" || value === "true" || value === "yes") {
      d.enabled = true;
      append("GWLoot enabled.", goodColor);
    } else if (value === "off" || value === "false" || value === "no") {
      d.enabled = false;
      clearTimers();
      append("GWLoot disabled.", goodColor);
    } else {
      append("Usage: gloot on/off", warnColor);
      return;
    }

    saveBackup();
  }

  function setAuto(value) {
    var d = ensureData();

    value = lower(value);

    if (value === "on" || value === "true" || value === "yes") {
      d.auto = true;
      append("GWLoot auto mode enabled.", goodColor);
    } else if (value === "off" || value === "false" || value === "no") {
      d.auto = false;
      append("GWLoot auto mode disabled.", goodColor);
    } else {
      append("Usage: gloot auto on/off", warnColor);
      return;
    }

    saveBackup();
  }

  function setDelay(value) {
    var d = ensureData();
    var n = parseInt(value, 10);

    if (!n || n < 50) {
      append("Usage: gloot delay <milliseconds>. Minimum recommended: 50", warnColor);
      return;
    }

    d.delay = n;
    saveBackup();

    append("GWLoot delay set to " + n + " ms.", goodColor);
  }

  function setCorpseMode(value) {
    var d = ensureData();

    value = lower(value);

    if (value !== "first" && value !== "all") {
      append("Usage: gloot corpse first/all", warnColor);
      return;
    }

    d.corpseMode = value;
    saveBackup();

    append("GWLoot corpse mode set to: " + value, goodColor);
  }

  function addCommand(command) {
    var d = ensureData();

    command = String(command || "").replace(/^\s+|\s+$/g, "");

    if (!command) {
      append("Usage: gloot add <command>", warnColor);
      return;
    }

    d.commands.push(command);
    saveBackup();

    append("Added loot command #" + d.commands.length + ": " + command, goodColor);
  }

  function removeCommand(indexText) {
    var d = ensureData();
    var index = parseInt(indexText, 10);
    var removed;

    if (!index || index < 1 || index > d.commands.length) {
      append("Usage: gloot remove <number>", warnColor);
      return;
    }

    removed = d.commands.splice(index - 1, 1);

    saveBackup();

    append("Removed loot command #" + index + ": " + removed[0], goodColor);
  }

  function listCommands() {
    var d = ensureData();
    var output = "";
    var i;

    output += "GWLoot commands:\n";

    if (!d.commands.length) {
      output += "  none";
      append(output);
      return;
    }

    for (i = 0; i < d.commands.length; i++) {
      output += "  " + (i + 1) + ". " + d.commands[i] + "\n";
    }

    append(output);
  }

  function resetDefaults() {
    var d = ensureData();

    clearTimers();

    d.enabled = true;
    d.auto = true;
    d.delay = 300;
    d.corpseMode = "first";
    d.runs = 0;
    d.lastRun = "never";

    d.commands = [
      "get all from corpse",
      "get all from first corpse",
      "take imbued things from first corpse",
      "take imbued things",
      "keep imbued things",
      "take gems from first corpse",
      "take gems",
      "take gold coins from first corpse",
      "take gold coins",
      "take platinum coins from first corpse",
      "take platinum coins",
      "put gems in pack",
      "put platinum coins in pack",
      "put gold coins in pack",
      "fillpack"
    ];

    saveBackup();

    append("GWLoot reset to defaults.", goodColor);
  }

  function status() {
    var d = ensureData();
    var s = getState();
    var output = "";

    output += "GWLoot status\n";
    output += "Enabled: " + d.enabled + "\n";
    output += "Auto: " + d.auto + "\n";
    output += "Running: " + s.running + "\n";
    output += "Delay: " + d.delay + " ms\n";
    output += "Corpse mode: " + d.corpseMode + "\n";
    output += "Commands: " + d.commands.length + "\n";
    output += "Runs: " + d.runs + "\n";
    output += "Last run: " + d.lastRun;

    append(output);
  }

  function help() {
    var output = "";

    output += "Genesis Web Auto-Loot Help\n";
    output += "----------------------------------------\n";
    output += "gloot help                  Show this help.\n";
    output += "gloot on                    Enable GWLoot.\n";
    output += "gloot off                   Disable GWLoot.\n";
    output += "gloot auto on/off           Toggle auto-loot after kills.\n";
    output += "gloot run                   Run loot commands now.\n";
    output += "gloot delay 300             Set command delay in ms.\n";
    output += "gloot corpse first          Convert 'from corpse' to 'from first corpse'.\n";
    output += "gloot corpse all            Leave commands exactly as listed.\n";
    output += "gloot list                  List loot commands.\n";
    output += "gloot add <command>         Add a loot command.\n";
    output += "gloot remove <number>       Remove a loot command.\n";
    output += "gloot status                Show status.\n";
    output += "gloot reset                 Reset defaults.\n";
    output += "gloot backup                Save browser backup.\n";
    output += "gloot restore               Restore browser backup.\n";
    output += "----------------------------------------\n";
    output += "Default auto-loot trigger runs after: You killed ...";

    append(output);
  }

  function dispatch() {
    var action;
    var a2;
    var full;
    var commandText;

    ensureData();

    args = (typeof args !== "undefined" && args) ? args : {};

    action = lower(args[1] || "");
    a2 = args[2] || "";
    full = args["*"] || "";

    if (!action) {
      status();
      append("Use `gloot help` for commands.");
      return;
    }

    if (action === "help") {
      help();
      return;
    }

    if (action === "on") {
      setEnabled("on");
      return;
    }

    if (action === "off") {
      setEnabled("off");
      return;
    }

    if (action === "auto") {
      setAuto(a2);
      return;
    }

    if (action === "run" || action === "loot") {
      runLoot();
      return;
    }

    if (action === "delay") {
      setDelay(a2);
      return;
    }

    if (action === "corpse") {
      setCorpseMode(a2);
      return;
    }

    if (action === "list" || action === "commands") {
      listCommands();
      return;
    }

    if (action === "add") {
      commandText = full.replace(/^add\s+/i, "");
      addCommand(commandText);
      return;
    }

    if (action === "remove" || action === "delete") {
      removeCommand(a2);
      return;
    }

    if (action === "status") {
      status();
      return;
    }

    if (action === "reset") {
      resetDefaults();
      return;
    }

    if (action === "backup") {
      saveBackup();
      append("GWLoot browser backup saved.", goodColor);
      return;
    }

    if (action === "restore") {
      restoreBackup();
      return;
    }

    append("Unknown command. Use: gloot help", warnColor);
  }

  window.GenesisWebLoot = window.GenesisWebLoot || {};
  window.GenesisWebLoot.runLoot = runLoot;
  window.GenesisWebLoot.onKill = onKill;
  window.GenesisWebLoot.status = status;

  dispatch();
})();
} catch (e) {
  try {
    gwc.output.append("[GWLoot ERROR] " + e.name + ": " + e.message, "#ff5555");
  } catch (ignore) {
    console.log("[GWLoot ERROR]", e);
  }
}
