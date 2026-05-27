

/*
Alias
Pattern: ghunt
Type: Javascript

Trigger(s) Required:
 - ghunt Look Line
 - ghunt Kill
 - ghunt No Creature

Optional Trigger(s):
 - Auto Restore

Guild Skill Behavior:
 - If no guild skill is set:
     kill <target>
     kill second <target>
     kill third <target>
 - If a guild skill is set, the first attack becomes:
     <skill> <target>
     kill second <target>
     kill third <target>
 - Example with cdonk:
     cdonk dewar
     kill second dewar
     kill third dewar

Updated:
 - Full rewrite from current ghunt source.
 - Guild skill now replaces only the first kill command.
 - Guild skill is no longer sent separately before the kill sequence.
 - Extra guild skills are preserved in storage/listing, but only the first one is used as the opener.
*/


(function () {
  var aliasName = "ghunt";
  var msgColor = "#ffb347";
  var warnColor = "#ff5555";
  var goodColor = "#80ff80";
  var recorderColor = "#fcba03";

  var reverseMapping = {
    "n": "s",
    "s": "n",
    "e": "w",
    "w": "e",
    "ne": "sw",
    "nw": "se",
    "se": "nw",
    "sw": "ne",
    "u": "d",
    "d": "u",
    "up": "down",
    "down": "up",
    "out": "in",
    "in": "out",
    "enter": "out",
    "climb up": "climb down",
    "climb down": "climb up"
  };

  var numberWords = {
    "a": 1,
    "an": 1,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10
  };

  var ordinals = {
    1: "",
    2: "second ",
    3: "third ",
    4: "fourth ",
    5: "fifth ",
    6: "sixth ",
    7: "seventh ",
    8: "eighth ",
    9: "ninth ",
    10: "tenth "
  };

  function append(text, color) {
    gwc.output.append(String(text), color || msgColor);
  }

  function lower(text) {
    return String(text || "").toLowerCase().replace(/^\s+|\s+$/g, "");
  }

  function ensureData() {
    gwc.userdata.gwhunt = gwc.userdata.gwhunt || {};

    var d = gwc.userdata.gwhunt;

    d.paths = d.paths || {};
    d.targets = d.targets || [];
    d.activePath = d.activePath || "";
    d.guildSkills = d.guildSkills || [];

    d.killMode = d.killMode || "all";

    d.loop = d.loop === true;
    d.returnHome = d.returnHome !== false;
    d.respawnMinutes = d.respawnMinutes || 10;

    d.delay = d.delay || {};
    d.delay.scan = d.delay.scan || 1000;
    d.delay.attack = d.delay.attack || 700;
    d.delay.guildskill = d.delay.guildskill || 700;
    d.delay.move = d.delay.move || 1800;
    d.delay.returnMove = d.delay.returnMove || 1800;
    d.delay.killwait = d.delay.killwait || 18000;
    d.delay.afterkill = d.delay.afterkill || 900;

    d.kills = d.kills || 0;
    d.runs = d.runs || 0;

    d.hud = d.hud || {};
    d.hud.left = d.hud.left || "40px";
    d.hud.top = d.hud.top || "120px";
    d.hud.width = d.hud.width || "315px";
    d.hud.height = d.hud.height || "280px";

    return d;
  }

  function getState() {
    window.GWHuntState = window.GWHuntState || {};

    var s = window.GWHuntState;

    s.enabled = s.enabled || false;
    s.paused = s.paused || false;
    s.mode = s.mode || "idle";
    s.pathIndex = s.pathIndex || 0;
    s.returnIndex = s.returnIndex || 0;
    s.pendingKills = s.pendingKills || 0;
    s.roomMobs = s.roomMobs || {};
    s.scanOpen = s.scanOpen || false;
    s.seenExitLine = s.seenExitLine || false;
    s.activeTimers = s.activeTimers || [];
    s.currentPath = s.currentPath || [];
    s.returnPath = s.returnPath || [];
    s.respawnEnd = s.respawnEnd || null;

    return s;
  }

  function saveBackup() {
    try {
      localStorage.setItem("GWHuntBackup", JSON.stringify(gwc.userdata.gwhunt || {}));
    } catch (err) {
      /* ignore */
    }
  }

  function restoreBackup() {
    try {
      var raw = localStorage.getItem("GWHuntBackup");

      if (!raw) {
        append("No GWHunt backup found.", warnColor);
        return;
      }

      gwc.userdata.gwhunt = JSON.parse(raw);
      append("GWHunt restored from browser backup.", goodColor);
      updateHUD();
    } catch (err) {
      append("Restore failed: " + err.message, warnColor);
    }
  }

  function addTimer(id) {
    var s = getState();
    s.activeTimers.push(id);
  }

  function clearTimers() {
    var s = getState();
    var i;

    for (i = 0; i < s.activeTimers.length; i++) {
      clearTimeout(s.activeTimers[i]);
    }

    s.activeTimers = [];
  }

  function splitTargets(text) {
    var result = [];
    var parts = String(text || "").split(",");
    var i;
    var t;

    for (i = 0; i < parts.length; i++) {
      t = lower(parts[i]);

      if (t) {
        result.push(t);
      }
    }

    return result;
  }

  function expandPath(text) {
    var finalPath = [];
    var tokens = String(text || "").split(/\s*,\s*/);
    var i;
    var j;
    var token;
    var m;
    var count;
    var cmd;

    for (i = 0; i < tokens.length; i++) {
      token = lower(tokens[i]);

      if (!token) {
        continue;
      }

      m = token.match(/^(\d+)(.*)$/);

      if (m) {
        count = parseInt(m[1], 10);
        cmd = lower(m[2]);

        for (j = 0; j < count; j++) {
          if (cmd) {
            finalPath.push(cmd);
          }
        }
      } else {
        finalPath.push(token);
      }
    }

    return finalPath;
  }

  function compactPath(pathArray) {
    var compacted = [];
    var last = null;
    var count = 0;
    var i;
    var step;

    for (i = 0; i < pathArray.length; i++) {
      step = pathArray[i];

      if (step === last) {
        count++;
      } else {
        if (last !== null) {
          compacted.push(count > 1 ? String(count) + last : last);
        }

        last = step;
        count = 1;
      }
    }

    if (last !== null) {
      compacted.push(count > 1 ? String(count) + last : last);
    }

    return compacted.join(", ");
  }

  function reversePath(pathArray) {
    var reversed = [];
    var i;
    var cmd;

    for (i = pathArray.length - 1; i >= 0; i--) {
      cmd = lower(pathArray[i]);
      reversed.push(reverseMapping[cmd] || cmd);
    }

    return reversed;
  }

  function sendCommand(cmd) {
    gwc.connection.send(cmd, true);
  }

  function normalizeMob(text) {
    text = lower(text);
    text = text.replace(/\.$/, "");
    text = text.replace(/^a /, "");
    text = text.replace(/^an /, "");
    text = text.replace(/^the /, "");

    text = text.replace(/bunnies$/, "bunny");
    text = text.replace(/rabbits$/, "rabbit");
    text = text.replace(/jackrabbits$/, "jackrabbit");
    text = text.replace(/wolves$/, "wolf");
    text = text.replace(/spiders$/, "spider");
    text = text.replace(/goblins$/, "goblin");
    text = text.replace(/orcs$/, "orc");
    text = text.replace(/rats$/, "rat");
    text = text.replace(/dwarves$/, "dwarf");
    text = text.replace(/ies$/, "y");

    if (/s$/.test(text) && !/ss$/.test(text)) {
      text = text.replace(/s$/, "");
    }

    return text;
  }

  function mobMatchesTarget(mobName, targetName) {
    var mob = normalizeMob(mobName);
    var target = normalizeMob(targetName);

    if (!mob || !target) {
      return false;
    }

    if (mob === target) {
      return true;
    }

    if (mob.indexOf(target) !== -1) {
      return true;
    }

    if (target.indexOf(mob) !== -1) {
      return true;
    }

    return false;
  }

  function shouldIgnoreLine(line) {
    var raw = String(line || "").replace(/^\s+|\s+$/g, "");
    var l = lower(raw);

    if (!raw) return true;
    if (raw.charAt(raw.length - 1) !== ".") return true;

    if (l.indexOf("you are ") === 0) return true;
    if (l.indexOf("you feel ") === 0) return true;
    if (l.indexOf("you have ") === 0) return true;
    if (l.indexOf("there is ") === 0) return true;
    if (l.indexOf("there are ") === 0) return true;
    if (l.indexOf("obvious exit") !== -1) return true;

    if (l.indexOf("the ") === 0) return true;

    if (l.indexOf("corpse") !== -1) return true;
    if (l.indexOf("corpses") !== -1) return true;
    if (l.indexOf("coin") !== -1) return true;
    if (l.indexOf("coins") !== -1) return true;
    if (l.indexOf("gem") !== -1) return true;
    if (l.indexOf("gems") !== -1) return true;
    if (l.indexOf("sword") !== -1) return true;
    if (l.indexOf("knife") !== -1) return true;
    if (l.indexOf("poster") !== -1) return true;
    if (l.indexOf("plate of") !== -1) return true;

    return false;
  }

  function splitMobLineIntoParts(raw) {
    var text = lower(raw).replace(/\.$/, "");
    var parts;
    var result = [];
    var i;
    var part;

    /*
      Convert:
        a dewar, a dewar and a dewar
      into:
        a dewar, a dewar, a dewar
    */
    text = text.replace(/\s+and\s+/g, ", ");

    parts = text.split(/\s*,\s*/);

    for (i = 0; i < parts.length; i++) {
      part = lower(parts[i]);

      if (part) {
        result.push(part);
      }
    }

    return result;
  }

  function parseSingleMobPart(part) {
    var m;
    var first;
    var rest;
    var count;
    var name;

    part = lower(part);

    if (!/^(a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s+/.test(part)) {
      return null;
    }

    m = part.match(/^(\S+)\s+(.+)$/);

    if (!m) {
      return null;
    }

    first = m[1];
    rest = m[2];
    count = numberWords[first];

    if (count) {
      name = rest;
    } else {
      count = 1;
      name = part;
    }

    name = normalizeMob(name);

    if (!name) {
      return null;
    }

    return {
      name: name,
      count: count,
      raw: part
    };
  }

  function parseMobLine(line) {
    var parts;
    var parsed;
    var results = [];
    var i;

    if (shouldIgnoreLine(line)) {
      return [];
    }

    parts = splitMobLineIntoParts(line);

    for (i = 0; i < parts.length; i++) {
      parsed = parseSingleMobPart(parts[i]);

      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }

  function findTargetInRoom() {
    var d = ensureData();
    var s = getState();
    var i;
    var target;
    var mobName;
    var total;

    for (i = 0; i < d.targets.length; i++) {
      target = normalizeMob(d.targets[i]);
      total = 0;

      for (mobName in s.roomMobs) {
        if (!s.roomMobs.hasOwnProperty(mobName)) {
          continue;
        }

        if (mobMatchesTarget(mobName, target)) {
          total += s.roomMobs[mobName];
        }
      }

      if (total > 0) {
        return {
          target: target,
          count: total
        };
      }
    }

    return null;
  }

  function killCommand(target, index) {
    var prefix = ordinals[index] || "";
    return "kill " + prefix + target;
  }

  function createHUD() {
    var bottom = document.getElementById("bottomsidebar");
    var tabs;
    var tabLi;
    var tabLink;
    var box;
    var body;
    var oldStyle;
    var style;
    var oldFloating;
    var communication;

    oldStyle = document.getElementById("gwhuntHudDockStyle");
    if (oldStyle) {
      oldStyle.remove();
    }

    style = document.createElement("style");
    style.id = "gwhuntHudDockStyle";
    style.textContent =
      "#bottomsidebar #autohunt.content {" +
      "  box-sizing: border-box;" +
      "  position: static !important;" +
      "  z-index: auto !important;" +
      "  height: 100%;" +
      "  overflow-y: auto;" +
      "  padding: 8px 10px;" +
      "  color: #eeeeee;" +
      "  background: transparent;" +
      "}" +
      "#gwhuntHud { position: static !important; z-index: auto !important; }" +
      "#gwhuntHudInner {" +
      "  font-family: monospace;" +
      "  font-size: 12px;" +
      "  line-height: 1.35;" +
      "}" +
      "#gwhuntHudInner .gh-title {" +
      "  color: #ffb347;" +
      "  font-weight: bold;" +
      "  text-align: center;" +
      "  margin: 0 0 8px 0;" +
      "  font-size: 13px;" +
      "}" +
      "#gwhuntHudInner .gh-grid {" +
      "  display: grid;" +
      "  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));" +
      "  gap: 7px;" +
      "}" +
      "#gwhuntHudInner .gh-card {" +
      "  border: 1px solid rgba(255,179,71,0.65);" +
      "  border-radius: 8px;" +
      "  padding: 7px 9px;" +
      "  background: rgba(8,12,16,0.58);" +
      "}" +
      "#gwhuntHudInner .gh-label {" +
      "  color: #ffb347;" +
      "  font-weight: bold;" +
      "  margin-bottom: 3px;" +
      "}" +
      "#gwhuntHudInner .gh-value {" +
      "  color: #ffffff;" +
      "  word-break: break-word;" +
      "}" +
      "#gwhuntHudInner .gh-footer {" +
      "  margin-top: 8px;" +
      "  text-align: center;" +
      "  color: #88ccff;" +
      "}";
    document.head.appendChild(style);

    if (!bottom) {
      append("Could not find #bottomsidebar. AutoHunter tab was not created.", warnColor);
      return;
    }

    tabs = bottom.querySelector("ul.idTabs");
    if (!tabs) {
      tabs = document.createElement("ul");
      tabs.className = "idTabs";
      bottom.insertBefore(tabs, bottom.firstChild);
    }

    /* Remove old floating HUD if it was created by a previous version. */
    oldFloating = document.getElementById("gwhuntHud");
    if (oldFloating && oldFloating.parentNode !== bottom) {
      oldFloating.remove();
    }

    box = document.getElementById("gwhuntHud");
    if (!box) {
      box = document.createElement("div");
      box.id = "gwhuntHud";
      box.className = "content";
      box.style.display = "none";
      box.style.overflow = "auto";
      box.style.height = "100%";
      bottom.appendChild(box);
    } else {
      box.className = "content";
      box.style.position = "";
      box.style.left = "";
      box.style.top = "";
      box.style.width = "";
      box.style.height = "100%";
      box.style.zIndex = "";
      box.style.background = "";
      box.style.border = "";
      box.style.borderRadius = "";
      box.style.resize = "";
      box.style.overflow = "auto";
      box.style.display = box.style.display || "none";
      if (box.parentNode !== bottom) {
        bottom.appendChild(box);
      }
    }

    if (!document.getElementById("gwhuntTabLink")) {
      tabLi = document.createElement("li");
      tabLink = document.createElement("a");
      tabLink.id = "gwhuntTabLink";
      tabLink.href = "#gwhuntHud";
      tabLink.textContent = "autohunt";
      tabLi.appendChild(tabLink);
      tabs.appendChild(tabLi);
    }

    tabLink = document.getElementById("gwhuntTabLink");
    if (tabLink && !tabLink.dataset.gwhuntBound) {
      tabLink.dataset.gwhuntBound = "1";
      tabLink.addEventListener("click", function (event) {
        var links = tabs.querySelectorAll("a");
        var contents = bottom.querySelectorAll("div.content");
        var i;

        event.preventDefault();

        for (i = 0; i < links.length; i++) {
          links[i].classList.remove("selected");
        }

        for (i = 0; i < contents.length; i++) {
          contents[i].style.display = "none";
        }

        tabLink.classList.add("selected");
        box.style.display = "";
      });
    }

    if (!document.getElementById("gwhuntHudBody")) {
      box.innerHTML = '<div id="gwhuntHudInner"><div id="gwhuntHudBody">AutoHunter tracker loading...</div></div>';
    }

    communication = document.getElementById("communication");
    if (communication && !communication.style.display && !document.querySelector("#bottomsidebar ul.idTabs a.selected")) {
      communication.style.display = "";
    }

    updateHUD();
  }

  function updateHUD() {
    var d = ensureData();
    var s = getState();
    var box = document.getElementById("gwhuntHud");
    var body;
    var respawnText;
    var rem;
    var mins;
    var secs;
    var pathLen;
    var html;

    if (!box) {
      return;
    }

    respawnText = "none";

    if (s.respawnEnd) {
      rem = Math.max(0, Math.floor((s.respawnEnd - Date.now()) / 1000));
      mins = Math.floor(rem / 60);
      secs = rem % 60;

      respawnText =
        (mins < 10 ? "0" + mins : String(mins)) +
        ":" +
        (secs < 10 ? "0" + secs : String(secs));
    }

    pathLen = 0;

    if (d.activePath && d.paths[d.activePath]) {
      pathLen = d.paths[d.activePath].length;
    }

    html = "";
    html += "Targets: <span style='color:#ffe080;'>" + (d.targets.length ? d.targets.join(", ") : "none") + "</span><br>";
    html += "Path: <span style='color:#ffe080;'>" + (d.activePath || "none") + "</span><br>";
    html += "Step: " + s.pathIndex + " / " + pathLen + "<br>";
    html += "Kills: <span style='color:#80ff80;'>" + d.kills + "</span><br>";
    html += "Runs: <span style='color:#80ff80;'>" + d.runs + "</span><br>";
    html += "Pending: " + s.pendingKills + "<br>";
    html += "Mode: <span style='color:#80d0ff;'>" + s.mode + "</span><br>";
    html += "Kill mode: <span style='color:#ffe080;'>" + d.killMode + "</span><br>";
    html += "Guild skills: <span style='color:#ffe080;'>" + (d.guildSkills.length ? d.guildSkills.join(", ") : "none") + "</span><br>";
    html += "Loop: " + (d.loop ? "ON / " + d.respawnMinutes + "m" : "OFF") + "<br>";
    html += "Return: " + (d.returnHome ? "ON" : "OFF") + "<br>";
    html += "Respawn: <span style='color:#ffe080;'>" + respawnText + "</span><br>";
    html += "Status: " + (s.enabled ? "ON" : "OFF");

    body = document.getElementById("gwhuntHudBody");

    if (body) {
      body.innerHTML = html;
    }
  }

  function startHudTicker() {
    if (window.GWHuntHudTicker) {
      clearInterval(window.GWHuntHudTicker);
    }

    window.GWHuntHudTicker = setInterval(function () {
      updateHUD();
    }, 1000);
  }

  function setTargets(text) {
    var d = ensureData();
    var targets = splitTargets(text);

    if (!targets.length) {
      append("Usage: ghunt target rabbit,bunny", warnColor);
      return;
    }

    d.targets = targets;
    saveBackup();

    append("Targets set to: " + targets.join(", "), goodColor);
    updateHUD();
  }

  function setKillMode(value) {
    var d = ensureData();

    value = lower(value);

    if (value !== "single" && value !== "all") {
      append("Usage: ghunt killmode single/all", warnColor);
      return;
    }

    d.killMode = value;
    saveBackup();

    append("Kill mode set to: " + value, goodColor);
    updateHUD();
  }

  function guildSkillAdd(skill) {
    var d = ensureData();
    var i;

    skill = lower(skill);

    if (!skill) {
      append("Usage: ghunt guildskill add cdonk", warnColor);
      return;
    }

    for (i = 0; i < d.guildSkills.length; i++) {
      if (d.guildSkills[i] === skill) {
        append("Guild skill already added: " + skill, warnColor);
        return;
      }
    }

    d.guildSkills.push(skill);
    saveBackup();

    append("Guild skill added: " + skill, goodColor);
    updateHUD();
  }

  function guildSkillRemove(skill) {
    var d = ensureData();
    var result = [];
    var i;

    skill = lower(skill);

    if (!skill) {
      append("Usage: ghunt guildskill remove cdonk", warnColor);
      return;
    }

    for (i = 0; i < d.guildSkills.length; i++) {
      if (d.guildSkills[i] !== skill) {
        result.push(d.guildSkills[i]);
      }
    }

    d.guildSkills = result;
    saveBackup();

    append("Guild skill removed: " + skill, goodColor);
    updateHUD();
  }

  function guildSkillClear() {
    var d = ensureData();

    d.guildSkills = [];
    saveBackup();

    append("Guild skills cleared.", goodColor);
    updateHUD();
  }

  function guildSkillList() {
    var d = ensureData();

    append("Guild skills: " + (d.guildSkills.length ? d.guildSkills.join(", ") : "none"));
  }

  function openerCommand(target) {
    var d = ensureData();
    var skill;

    if (!d.guildSkills.length) {
      return killCommand(target, 1);
    }

    /*
      Guild skill replaces the first kill command only.
      Example:
        cdonk dewar
        kill second dewar
        kill third dewar
    */
    skill = lower(d.guildSkills[0]);

    if (!skill) {
      return killCommand(target, 1);
    }

    return skill + " " + target;
  }

  function pathAdd(name, steps) {
    var d = ensureData();
    var path;

    name = lower(name);

    if (!name || !steps) {
      append("Usage: ghunt path add <name> <steps>", warnColor);
      return;
    }

    path = expandPath(steps);

    if (!path.length) {
      append("No valid path steps found.", warnColor);
      return;
    }

    d.paths[name] = path;
    saveBackup();

    append("Path '" + name + "' saved: " + compactPath(path), goodColor);
    updateHUD();
  }

  function pathRemove(name) {
    var d = ensureData();

    name = lower(name);

    if (!name) {
      append("Usage: ghunt path remove <name>", warnColor);
      return;
    }

    if (!d.paths[name]) {
      append("Path not found: " + name, warnColor);
      return;
    }

    delete d.paths[name];

    if (d.activePath === name) {
      d.activePath = "";
    }

    saveBackup();

    append("Path removed: " + name, goodColor);
    updateHUD();
  }

  function pathList() {
    var d = ensureData();
    var names = Object.keys(d.paths).sort();
    var output;
    var i;

    if (!names.length) {
      append("No GWHunt paths saved.");
      return;
    }

    output = "GWHunt paths:\n";

    for (i = 0; i < names.length; i++) {
      output += " - " + names[i] + ": " + compactPath(d.paths[names[i]]) + "\n";
    }

    append(output);
  }

  function pathShow(name) {
    var d = ensureData();

    name = lower(name);

    if (!name || !d.paths[name]) {
      append("Path not found. Usage: ghunt path show <name>", warnColor);
      return;
    }

    append("Path '" + name + "': " + compactPath(d.paths[name]));
  }

  function setActivePath(name) {
    var d = ensureData();

    name = lower(name);

    if (!name || !d.paths[name]) {
      append("Path not found. Use: ghunt path list", warnColor);
      return;
    }

    d.activePath = name;
    saveBackup();

    append("Active hunt path set to: " + name, goodColor);
    updateHUD();
  }

  function scanRoom() {
    var d = ensureData();
    var s = getState();

    if (!s.enabled || s.paused) {
      return;
    }

    s.mode = "scanning";
    s.roomMobs = {};
    s.scanOpen = true;
    s.seenExitLine = false;
    s.pendingKills = 0;

    updateHUD();

    sendCommand("look");

    addTimer(setTimeout(function () {
      var st = getState();

      st.scanOpen = false;
      afterScan();
    }, d.delay.scan));
  }

  function afterScan() {
    var s = getState();
    var found;

    if (!s.enabled || s.paused) {
      return;
    }

    found = findTargetInRoom();

    if (found && found.count > 0) {
      attackTarget(found.target, found.count);
    } else {
      moveNext();
    }
  }

  function sendNextKill(target, count, index, delay) {
    var st = getState();
    var cmd;

    if (!st.enabled || st.paused) {
      return;
    }

    if (index > count) {
      return;
    }

    if (index === 1) {
      cmd = openerCommand(target);
    } else {
      cmd = killCommand(target, index);
    }

    sendCommand(cmd);

    if (index < count) {
      addTimer(setTimeout(function () {
        sendNextKill(target, count, index + 1, delay);
      }, delay));
    }
  }

  function attackTarget(target, count) {
    var d = ensureData();
    var s = getState();
    var actualCount;

    count = parseInt(count, 10) || 0;

    if (!s.enabled || s.paused) {
      return;
    }

    if (count <= 0) {
      moveNext();
      return;
    }

    if (d.killMode === "single") {
      actualCount = 1;
    } else {
      actualCount = count;
    }

    s.mode = "attacking " + target;
    s.pendingKills = actualCount;

    updateHUD();

    append(
      "Attacking " +
      actualCount +
      " tracked " +
      target +
      " with kill mode " +
      d.killMode +
      (d.guildSkills.length ? ". Opener: " + d.guildSkills[0] + " " + target + "." : ".")
    );

    sendNextKill(target, actualCount, 1, d.delay.attack);

    addTimer(setTimeout(function () {
      var st = getState();

      if (!st.enabled || st.paused) {
        return;
      }

      if (st.pendingKills > 0) {
        append("Kill wait finished. Re-scanning room.");
        st.pendingKills = 0;
        scanRoom();
      }
    }, d.delay.killwait));
  }

  function moveNext() {
    var d = ensureData();
    var s = getState();
    var cmd;

    if (!s.enabled || s.paused) {
      return;
    }

    if (!s.currentPath.length) {
      append("No active path loaded.", warnColor);
      stopHunt();
      return;
    }

    if (s.pathIndex >= s.currentPath.length) {
      completePath();
      return;
    }

    cmd = s.currentPath[s.pathIndex];
    s.pathIndex += 1;
    s.mode = "moving";

    updateHUD();

    sendCommand(cmd);

    addTimer(setTimeout(function () {
      scanRoom();
    }, d.delay.move));
  }

  function completePath() {
    var d = ensureData();

    d.runs += 1;
    saveBackup();

    append("Hunt path complete. Runs: " + d.runs, goodColor);

    if (d.returnHome) {
      beginReturn();
    } else {
      beginRespawnOrStop();
    }
  }

  function beginReturn() {
    var d = ensureData();
    var s = getState();
    var customReverseName = d.activePath + "_rev";

    if (d.paths[customReverseName]) {
      s.returnPath = d.paths[customReverseName].slice(0);
    } else {
      s.returnPath = reversePath(s.currentPath);
    }

    s.returnIndex = 0;
    s.mode = "returning";

    updateHUD();
    moveReturnStep();
  }

  function moveReturnStep() {
    var d = ensureData();
    var s = getState();
    var cmd;

    if (!s.enabled || s.paused) {
      return;
    }

    if (s.returnIndex >= s.returnPath.length) {
      append("Returned to start.", goodColor);
      beginRespawnOrStop();
      return;
    }

    cmd = s.returnPath[s.returnIndex];
    s.returnIndex += 1;
    s.mode = "returning";

    updateHUD();

    sendCommand(cmd);

    addTimer(setTimeout(function () {
      moveReturnStep();
    }, d.delay.returnMove));
  }

  function beginRespawnOrStop() {
    var d = ensureData();
    var s = getState();
    var waitMs;

    if (!d.loop) {
      append("Loop is off. Stopping.", goodColor);
      stopHunt();
      return;
    }

    waitMs = Math.max(1, parseFloat(d.respawnMinutes || 10)) * 60 * 1000;

    s.mode = "waiting respawn";
    s.respawnEnd = Date.now() + waitMs;

    updateHUD();

    append("Waiting " + d.respawnMinutes + " minute(s) for respawn.");

    addTimer(setTimeout(function () {
      var st = getState();

      if (!st.enabled) {
        return;
      }

      st.pathIndex = 0;
      st.returnIndex = 0;
      st.respawnEnd = null;
      st.mode = "restarting";

      updateHUD();
      scanRoom();
    }, waitMs));
  }

  function startHunt() {
    var d = ensureData();
    var s = getState();

    if (!d.targets.length) {
      append("Set a target first: ghunt target rabbit,bunny", warnColor);
      return;
    }

    if (!d.activePath || !d.paths[d.activePath]) {
      append("Set an active path first: ghunt path use <name>", warnColor);
      return;
    }

    clearTimers();

    s.enabled = true;
    s.paused = false;
    s.mode = "starting";
    s.pathIndex = 0;
    s.returnIndex = 0;
    s.pendingKills = 0;
    s.roomMobs = {};
    s.scanOpen = false;
    s.seenExitLine = false;
    s.currentPath = d.paths[d.activePath].slice(0);
    s.returnPath = [];
    s.respawnEnd = null;

    createHUD();
    startHudTicker();
    updateHUD();

    append("AutoHunter started. Path: " + d.activePath + ", targets: " + d.targets.join(", "), goodColor);

    scanRoom();
  }

  function stopHunt() {
    var s = getState();

    clearTimers();

    s.enabled = false;
    s.paused = false;
    s.mode = "stopped";
    s.pendingKills = 0;
    s.scanOpen = false;
    s.seenExitLine = false;
    s.respawnEnd = null;

    updateHUD();

    append("AutoHunter stopped.");
  }

  function pauseHunt() {
    var s = getState();

    if (!s.enabled) {
      append("AutoHunter is not running.", warnColor);
      return;
    }

    s.paused = true;
    s.mode = "paused";

    updateHUD();

    append("AutoHunter paused.");
  }

  function resumeHunt() {
    var s = getState();

    if (!s.enabled) {
      append("AutoHunter is not running.", warnColor);
      return;
    }

    if (!s.paused) {
      append("AutoHunter is not paused.", warnColor);
      return;
    }

    s.paused = false;
    s.mode = "resuming";

    updateHUD();

    append("AutoHunter resumed.");

    scanRoom();
  }

  function resetHunt() {
    var d = ensureData();
    var s = getState();

    clearTimers();

    d.kills = 0;
    d.runs = 0;

    s.enabled = false;
    s.paused = false;
    s.mode = "idle";
    s.pathIndex = 0;
    s.returnIndex = 0;
    s.pendingKills = 0;
    s.roomMobs = {};
    s.scanOpen = false;
    s.seenExitLine = false;
    s.currentPath = [];
    s.returnPath = [];
    s.respawnEnd = null;

    saveBackup();
    updateHUD();

    append("AutoHunter reset.", goodColor);
  }

  function setLoop(value) {
    var d = ensureData();

    value = lower(value);

    if (value === "on" || value === "true" || value === "yes") {
      d.loop = true;
      append("Loop enabled.", goodColor);
    } else if (value === "off" || value === "false" || value === "no") {
      d.loop = false;
      append("Loop disabled.", goodColor);
    } else {
      append("Usage: ghunt loop on/off", warnColor);
      return;
    }

    saveBackup();
    updateHUD();
  }

  function setReturn(value) {
    var d = ensureData();

    value = lower(value);

    if (value === "on" || value === "true" || value === "yes") {
      d.returnHome = true;
      append("Return-home enabled.", goodColor);
    } else if (value === "off" || value === "false" || value === "no") {
      d.returnHome = false;
      append("Return-home disabled.", goodColor);
    } else {
      append("Usage: ghunt return on/off", warnColor);
      return;
    }

    saveBackup();
    updateHUD();
  }

  function setRespawn(minutes) {
    var d = ensureData();
    var n = parseFloat(minutes);

    if (!n || n <= 0) {
      append("Usage: ghunt respawn <minutes>", warnColor);
      return;
    }

    d.respawnMinutes = n;
    saveBackup();

    append("Respawn wait set to " + n + " minute(s).", goodColor);
    updateHUD();
  }

  function setDelay(kind, value) {
    var d = ensureData();
    var n;

    kind = lower(kind);
    n = parseInt(value, 10);

    if (!kind || !n || n <= 0) {
      append("Usage: ghunt delay scan|attack|guildskill|move|return|killwait|afterkill <ms>", warnColor);
      return;
    }

    if (kind === "return") {
      kind = "returnMove";
    }

    if (!d.delay.hasOwnProperty(kind)) {
      append("Unknown delay type: " + kind, warnColor);
      return;
    }

    d.delay[kind] = n;
    saveBackup();

    append("Delay " + kind + " set to " + n + " ms.", goodColor);
    updateHUD();
  }

  function status() {
    var d = ensureData();
    var s = getState();
    var output = "";

    output += "GWHunt status\n";
    output += "Targets: " + (d.targets.length ? d.targets.join(", ") : "none") + "\n";
    output += "Active path: " + (d.activePath || "none") + "\n";
    output += "Enabled: " + s.enabled + "\n";
    output += "Paused: " + s.paused + "\n";
    output += "Mode: " + s.mode + "\n";
    output += "Kills: " + d.kills + "\n";
    output += "Runs: " + d.runs + "\n";
    output += "Kill mode: " + d.killMode + "\n";
    output += "Opener skill: " + (d.guildSkills.length ? d.guildSkills[0] : "none") + "\n";
    output += "Loop: " + d.loop + "\n";
    output += "Return: " + d.returnHome + "\n";
    output += "Respawn minutes: " + d.respawnMinutes + "\n";
    output += "Delays: " + JSON.stringify(d.delay);

    append(output);
    updateHUD();
  }

  function help() {
    var output = "";

    output += "Genesis Web AutoHunter Help\n";
    output += "----------------------------------------\n";
    output += "ghunt help                         Show this help.\n";
    output += "ghunt hud                          Show HUD.\n";
    output += "ghunt status                       Show status.\n";
    output += "ghunt target rabbit,bunny          Set hunt targets.\n";
    output += "ghunt killmode single              Kill one mob at a time.\n";
    output += "ghunt killmode all                 Attack all counted mobs at once.\n";
    output += "ghunt guildskill add cdonk         Set opener skill used instead of first kill.\n";
    output += "ghunt guildskill remove cdonk      Remove guild skill.\n";
    output += "ghunt guildskill clear             Clear guild skills.\n";
    output += "ghunt guildskill list              List guild skills.\n";
    output += "ghunt path list                    List paths.\n";
    output += "ghunt path add <name> <steps>      Add path. Example: ghunt path add rabbits n, 2e, sw\n";
    output += "ghunt path show <name>             Show a path.\n";
    output += "ghunt path remove <name>           Remove a path.\n";
    output += "ghunt path use <name>              Set active hunt path.\n";
    output += "ghunt record start                 Start path recording.\n";
    output += "ghunt record save <name>           Save recorded path.\n";
    output += "ghunt record stop                  Stop/discard recording.\n";
    output += "ghunt start                        Start hunting.\n";
    output += "ghunt stop                         Stop hunting.\n";
    output += "ghunt pause                        Pause hunting.\n";
    output += "ghunt resume                       Resume hunting.\n";
    output += "ghunt reset                        Reset state/kills/runs.\n";
    output += "ghunt loop on/off                  Toggle respawn loop.\n";
    output += "ghunt return on/off                Toggle return-home reverse walk.\n";
    output += "ghunt respawn 10                   Set respawn wait in minutes.\n";
    output += "ghunt delay scan 1000              Set scan delay in ms.\n";
    output += "ghunt delay attack 700             Set attack command delay in ms.\n";
    output += "ghunt delay guildskill 700         Legacy setting; opener now uses attack delay.\n";
    output += "ghunt delay move 1800              Set movement delay in ms.\n";
    output += "ghunt delay return 1800            Set return movement delay in ms.\n";
    output += "ghunt delay killwait 18000         Set kill timeout in ms.\n";
    output += "ghunt backup                       Save browser backup.\n";
    output += "ghunt restore                      Restore browser backup.\n";
    output += "----------------------------------------\n";
    output += "Example:\n";
    output += "ghunt target dewar\n";
    output += "ghunt killmode all\n";
    output += "ghunt guildskill add cdonk         Then attacks as: cdonk target, kill second target, etc.\n";
    output += "ghunt path add dewarpath s, w, n\n";
    output += "ghunt path use dewarpath\n";
    output += "ghunt loop off\n";
    output += "ghunt start\n";

    append(output);
  }

  function startRecording() {
    if (window.GWHuntRecording) {
      append("Already recording.", warnColor);
      return;
    }

    window.GWHuntRecording = true;
    window.GWHuntRecordedPath = [];

    append("GWHunt path recording started. Walk normally, then use: ghunt record save <name>", goodColor);

    $("#input").off("keydown.gwhuntRecorder").on("keydown.gwhuntRecorder", function (event) {
      var step;
      var l;

      if (event.key !== "Enter") {
        return;
      }

      step = $("#input").val().replace(/^\s+|\s+$/g, "");
      l = lower(step);

      if (!step) {
        return;
      }

      if (l.indexOf("ghunt") === 0) {
        return;
      }

      window.GWHuntRecordedPath.push(step);
      append("Recorded: " + step, recorderColor);
    });
  }

  function stopRecording() {
    if (!window.GWHuntRecording) {
      append("Not recording.", warnColor);
      return;
    }

    window.GWHuntRecording = false;
    $("#input").off("keydown.gwhuntRecorder");

    append("GWHunt recording stopped.");
  }

  function saveRecording(name) {
    var d = ensureData();

    name = lower(name);

    if (!window.GWHuntRecording) {
      append("Recorder is not running.", warnColor);
      return;
    }

    if (!name) {
      append("Usage: ghunt record save <name>", warnColor);
      return;
    }

    if (!window.GWHuntRecordedPath || !window.GWHuntRecordedPath.length) {
      append("No recorded steps to save.", warnColor);
      return;
    }

    d.paths[name] = window.GWHuntRecordedPath.slice(0);

    saveBackup();

    append("Recorded path '" + name + "' saved: " + compactPath(d.paths[name]), goodColor);

    stopRecording();
    updateHUD();
  }

  function onOutputLine(line) {
    var s = getState();
    var l = lower(line);
    var parsedList;
    var i;
    var parsed;

    if (!s.scanOpen) {
      return;
    }

    if (l.indexOf("obvious exit") !== -1) {
      s.seenExitLine = true;
      return;
    }

    if (!s.seenExitLine) {
      return;
    }

    parsedList = parseMobLine(line);

    for (i = 0; i < parsedList.length; i++) {
      parsed = parsedList[i];

      if (!s.roomMobs[parsed.name]) {
        s.roomMobs[parsed.name] = 0;
      }

      s.roomMobs[parsed.name] += parsed.count;
    }
  }

  function onKill() {
    var d = ensureData();
    var s = getState();

    if (!s.enabled) {
      return;
    }

    d.kills += 1;

    if (s.pendingKills > 0) {
      s.pendingKills -= 1;
    }

    saveBackup();
    updateHUD();

    if (s.pendingKills <= 0) {
      addTimer(setTimeout(function () {
        scanRoom();
      }, d.delay.afterkill));
    }
  }

  function onNoCreature() {
    var d = ensureData();
    var s = getState();

    if (!s.enabled) {
      return;
    }

    if (s.pendingKills > 0) {
      s.pendingKills -= 1;
    }

    updateHUD();

    if (s.pendingKills <= 0) {
      addTimer(setTimeout(function () {
        scanRoom();
      }, d.delay.afterkill));
    }
  }

  function dispatch() {
    var action;
    var a2;
    var a3;
    var full;
    var sub;
    var name;
    var steps;
    var targetText;
    var recAction;

    ensureData();
    createHUD();
    startHudTicker();

    action = args[1];
    a2 = args[2];
    a3 = args[3];
    full = args["*"] || "";

    action = lower(action);

    if (!action || action === "help") {
      help();
      return;
    }

    if (action === "hud") {
      createHUD();
      updateHUD();
      append("GWHunt HUD shown.");
      return;
    }

    if (action === "status") {
      status();
      return;
    }

    if (action === "target" || action === "targets") {
      targetText = full.replace(/^targets?\s+/i, "");
      setTargets(targetText);
      return;
    }

    if (action === "killmode" || action === "kill") {
      setKillMode(a2);
      return;
    }

    if (action === "guildskill" || action === "guildskills") {
      sub = lower(a2);

      if (!sub || sub === "list") {
        guildSkillList();
        return;
      }

      if (sub === "add") {
        guildSkillAdd(a3);
        return;
      }

      if (sub === "remove" || sub === "delete") {
        guildSkillRemove(a3);
        return;
      }

      if (sub === "clear" || sub === "reset") {
        guildSkillClear();
        return;
      }

      append("Usage: ghunt guildskill add/remove/list/clear", warnColor);
      return;
    }

    if (action === "path") {
      sub = lower(a2);

      if (!sub || sub === "list" || sub === "showall") {
        pathList();
        return;
      }

      if (sub === "add") {
        name = a3;
        steps = full.replace(/^path\s+add\s+\S+\s*/i, "");
        pathAdd(name, steps);
        return;
      }

      if (sub === "remove" || sub === "delete") {
        pathRemove(a3);
        return;
      }

      if (sub === "show") {
        pathShow(a3);
        return;
      }

      if (sub === "use" || sub === "set") {
        setActivePath(a3);
        return;
      }

      setActivePath(a2);
      return;
    }

    if (action === "record") {
      recAction = lower(a2);

      if (!recAction || recAction === "start") {
        startRecording();
        return;
      }

      if (recAction === "save") {
        saveRecording(a3);
        return;
      }

      if (recAction === "stop") {
        stopRecording();
        return;
      }

      append("Usage: ghunt record start/save/stop", warnColor);
      return;
    }

    if (action === "start") {
      startHunt();
      return;
    }

    if (action === "stop") {
      stopHunt();
      return;
    }

    if (action === "pause") {
      pauseHunt();
      return;
    }

    if (action === "resume") {
      resumeHunt();
      return;
    }

    if (action === "reset") {
      resetHunt();
      return;
    }

    if (action === "loop") {
      setLoop(a2);
      return;
    }

    if (action === "return") {
      setReturn(a2);
      return;
    }

    if (action === "respawn") {
      setRespawn(a2);
      return;
    }

    if (action === "delay") {
      setDelay(a2, a3);
      return;
    }

    if (action === "backup") {
      saveBackup();
      append("GWHunt browser backup saved.", goodColor);
      return;
    }

    if (action === "restore") {
      restoreBackup();
      return;
    }

    append("Unknown command. Use: ghunt help", warnColor);
  }

  window.GenesisWebHunter = window.GenesisWebHunter || {};
  window.GenesisWebHunter.onOutputLine = onOutputLine;
  window.GenesisWebHunter.onKill = onKill;
  window.GenesisWebHunter.onNoCreature = onNoCreature;
  window.GenesisWebHunter.updateHUD = updateHUD;
  window.GenesisWebHunter.stop = stopHunt;

  dispatch();
})();
