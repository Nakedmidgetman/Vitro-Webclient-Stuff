/*
Genesis Webclient Inventory Tab v72


Alias pattern: ginv
Script Type: javascript

REQUIRED TRIGGER(S): Inventory Capture Trigger 

Commands:
  ginv
  ginv refresh
  ginv blacklist <full item name>
  ginv unblacklist <full item name>
  ginv blacklist list
  ginv blacklist clear

Examples:
  ginv blacklist green-topped orange carrot
  ginv unblacklist green-topped orange carrot
  ginv blacklist list

Notes:
- Blacklist removes exact normalized item names.
- Leading articles are ignored, so:
    green-topped orange carrot
  will hide:
    a green-topped orange carrot
- It will NOT hide every carrot unless you specifically blacklist a generic item name and the parser sees that exact name.
*/

(function () {
  var VERSION = "72.0.0";

  function out(msg, color) {
    try {
      gwc.output.append("[GInv] " + String(msg), color || "#88ccff");
    } catch (e) {
      try { console.log("[GInv] " + msg); } catch (e2) {}
    }
  }

  function clean(text) {
    return String(text || "")
      .replace(/\x1b\[[0-9;]*m/g, "")
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "");
  }

  function htmlEscape(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function lower(text) {
    return clean(text).toLowerCase();
  }

  function getArgs() {
    var raw = "";
    var parts = [];
    var i;

    try {
      if (typeof args !== "undefined") {
        if (typeof args[1] !== "undefined" && String(args[1]).length) {
          for (i = 1; i < 50; i++) {
            if (typeof args[i] !== "undefined" && args[i] !== null && String(args[i]).length) {
              parts.push(String(args[i]));
            }
          }
          return parts;
        }

        if (typeof args["*"] !== "undefined" && String(args["*"]).length) {
          raw = String(args["*"]);
        } else if (typeof args[0] !== "undefined" && String(args[0]).length) {
          raw = String(args[0]);
        }
      }
    } catch (e) {}

    raw = String(raw || "").replace(/^ginv\b/i, "").trim();
    return raw ? raw.split(/\s+/) : [];
  }

  function sendCommand(cmd) {
    try {
      gwc.connection.send(cmd, true);
    } catch (e1) {
      try { gwc.connection.send(cmd); } catch (e2) {}
    }
  }

  function normalizeItemName(text) {
    text = lower(text);
    text = text.replace(/\.\s*$/, "");
    text = text.replace(/^a\s+/, "");
    text = text.replace(/^an\s+/, "");
    text = text.replace(/^the\s+/, "");
    text = text.replace(/^one\s+/, "");
    text = text.replace(/^two\s+/, "");
    text = text.replace(/^three\s+/, "");
    text = text.replace(/^four\s+/, "");
    text = text.replace(/^five\s+/, "");
    text = text.replace(/^six\s+/, "");
    text = text.replace(/^seven\s+/, "");
    text = text.replace(/^eight\s+/, "");
    text = text.replace(/^nine\s+/, "");
    text = text.replace(/^ten\s+/, "");
    return clean(text);
  }

  function ensureUserdata() {
    gwc.userdata.ginv = gwc.userdata.ginv || {};
    gwc.userdata.ginv.blacklist = gwc.userdata.ginv.blacklist || [];
    return gwc.userdata.ginv;
  }

  function state() {
    window.GenesisInventoryTab = window.GenesisInventoryTab || {};
    var s = window.GenesisInventoryTab;

    s.version = VERSION;
    s.visible = s.visible !== false;
    s.capturing = s.capturing || false;
    s.currentSection = s.currentSection || null;
    s.currentBuffer = s.currentBuffer || "";
    s.captureTimer = s.captureTimer || null;
    s.autoRefreshTimer = s.autoRefreshTimer || null;
    s.data = s.data || {
      wielding: "unknown",
      wearing: "unknown",
      carrying: "unknown"
    };

    s.defaultBlacklist = [
      "tutorial journal",
      "magic map",
      "glowing magic map",
      "black signature book",
      "pair of combat boots",
      "combat boots",
      "newbie pin",
      "gold coin",
      "gold coins",
      "platinum coin",
      "platinum coins",
      "silver coin",
      "silver coins",
      "copper coin",
      "copper coins"
    ];

    s.captureLine = captureLine;
    s.refresh = refresh;
    s.show = show;
    s.hide = hide;
    s.toggle = toggle;
    s.render = render;
    s.scheduleRefresh = scheduleRefresh;

    ensureUserdata();

    return s;
  }

  function getCombinedBlacklist() {
    var s = state();
    var ud = ensureUserdata();
    var combined = [];
    var i;

    for (i = 0; i < s.defaultBlacklist.length; i++) {
      combined.push(normalizeItemName(s.defaultBlacklist[i]));
    }

    for (i = 0; i < ud.blacklist.length; i++) {
      combined.push(normalizeItemName(ud.blacklist[i]));
    }

    return combined;
  }

  function isBlacklisted(item) {
    var normalized = normalizeItemName(item);
    var list = getCombinedBlacklist();
    var i;

    if (!normalized) return true;

    for (i = 0; i < list.length; i++) {
      if (normalized === list[i]) {
        return true;
      }
    }

    if (/coin/.test(normalized)) return true;
    if (/money/.test(normalized)) return true;

    return false;
  }

  function addBlacklist(item) {
    var ud = ensureUserdata();
    var normalized = normalizeItemName(item);
    var i;

    if (!normalized) {
      out("Usage: ginv blacklist <full item name>", "#ffcc66");
      return;
    }

    for (i = 0; i < ud.blacklist.length; i++) {
      if (normalizeItemName(ud.blacklist[i]) === normalized) {
        out("Already blacklisted: " + normalized, "#ffcc66");
        return;
      }
    }

    ud.blacklist.push(normalized);
    out("Blacklisted: " + normalized, "#80ff80");
    render();
  }

  function removeBlacklist(item) {
    var ud = ensureUserdata();
    var normalized = normalizeItemName(item);
    var kept = [];
    var removed = false;
    var i;

    if (!normalized) {
      out("Usage: ginv unblacklist <full item name>", "#ffcc66");
      return;
    }

    for (i = 0; i < ud.blacklist.length; i++) {
      if (normalizeItemName(ud.blacklist[i]) === normalized) {
        removed = true;
      } else {
        kept.push(ud.blacklist[i]);
      }
    }

    ud.blacklist = kept;

    if (removed) {
      out("Removed from blacklist: " + normalized, "#80ff80");
      render();
    } else {
      out("Not found in blacklist: " + normalized, "#ffcc66");
    }
  }

  function listBlacklist() {
    var ud = ensureUserdata();
    var i;

    if (!ud.blacklist.length) {
      out("Custom blacklist is empty.", "#ffcc66");
      return;
    }

    out("Custom blacklist:", "#88ccff");
    for (i = 0; i < ud.blacklist.length; i++) {
      out("- " + ud.blacklist[i], "#88ccff");
    }
  }

  function clearBlacklist() {
    var ud = ensureUserdata();
    ud.blacklist = [];
    out("Custom blacklist cleared.", "#80ff80");
    render();
  }

  function toDisplayList(text) {
    var kept = [];
    var pieces;
    var i;
    var item;

    text = clean(text);

    if (!text || text === "unknown") return "unknown";
    if (text === "none") return "none";

    text = text.replace(/\.\s*$/, "");
    text = text.replace(/\s+and\s+/g, ", ");
    pieces = text.split(/\s*,\s*/);

    for (i = 0; i < pieces.length; i++) {
      item = clean(pieces[i]);
      if (item && !isBlacklisted(item)) {
        kept.push(item);
      }
    }

    if (!kept.length) return "none";

    return kept.map(function (x) {
      return "• " + htmlEscape(x);
    }).join("<br>");
  }

  function installStyles() {
    var old = document.getElementById("genesis-inventory-tab-style-v72");
    if (old) old.remove();

    var old71 = document.getElementById("genesis-inventory-tab-style-v71");
    if (old71) old71.remove();

    var style = document.createElement("style");
    style.id = "genesis-inventory-tab-style-v72";
    style.textContent =
      "#bottomsidebar #inventory.content {" +
      "  box-sizing: border-box;" +
      "  height: 100%;" +
      "  overflow-y: auto;" +
      "  padding: 8px 10px;" +
      "  color: #eeeeee;" +
      "  background: transparent;" +
      "}" +
      "#genesisInventoryTabInner {" +
      "  font-family: monospace;" +
      "  font-size: 12px;" +
      "  line-height: 1.35;" +
      "}" +
      "#genesisInventoryTabInner .ginv-title {" +
      "  color: rgb(210, 90, 255);" +
      "  font-weight: bold;" +
      "  text-align: center;" +
      "  margin: 0 0 8px 0;" +
      "  font-size: 13px;" +
      "}" +
      "#genesisInventoryTabInner .ginv-section {" +
      "  border: 1px solid rgba(210, 90, 255, 0.65);" +
      "  border-radius: 8px;" +
      "  margin: 7px 0;" +
      "  padding: 7px 9px;" +
      "  background: rgba(8, 12, 16, 0.58);" +
      "}" +
      "#genesisInventoryTabInner .ginv-heading {" +
      "  color: rgb(210, 90, 255);" +
      "  font-weight: bold;" +
      "  margin-bottom: 5px;" +
      "}" +
      "#genesisInventoryTabInner .ginv-body {" +
      "  color: #ffffff;" +
      "  white-space: normal;" +
      "}";
    document.head.appendChild(style);
  }

  function ensureTab() {
    var bottom = document.getElementById("bottomsidebar");
    var tabs;
    var tabLink;
    var tabLi;
    var content;

    installStyles();

    if (!bottom) {
      out("Could not find #bottomsidebar.", "#ff6666");
      return false;
    }

    tabs = bottom.querySelector("ul.idTabs");

    if (!tabs) {
      tabs = document.createElement("ul");
      tabs.className = "idTabs";
      bottom.insertBefore(tabs, bottom.firstChild);
    }

    content = document.getElementById("inventory");
    if (!content) {
      content = document.createElement("div");
      content.id = "inventory";
      content.className = "content";
      content.style.display = "none";
      bottom.appendChild(content);
    }

    if (!document.getElementById("genesisInventoryTabLink")) {
      tabLi = document.createElement("li");
      tabLink = document.createElement("a");
      tabLink.id = "genesisInventoryTabLink";
      tabLink.href = "#inventory";
      tabLink.textContent = "inventory";
      tabLi.appendChild(tabLink);
      tabs.appendChild(tabLi);
    }

    tabLink = document.getElementById("genesisInventoryTabLink");
    if (tabLink && !tabLink.dataset.ginvBound) {
      tabLink.dataset.ginvBound = "1";
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
        content.style.display = "";
      });
    }

    if (!content.innerHTML) {
      content.innerHTML = '<div id="genesisInventoryTabInner"><div class="ginv-title">Inventory</div></div>';
    }

    return true;
  }

  function selectInventoryTab() {
    var link = document.getElementById("genesisInventoryTabLink");
    if (link) {
      try { link.click(); } catch (e) {}
    }
  }

  function render() {
    var s = state();
    var content;

    ensureTab();
    content = document.getElementById("inventory");
    if (!content) return;

    content.innerHTML =
      '<div id="genesisInventoryTabInner">' +
      '<div class="ginv-title">Inventory</div>' +
      '<div class="ginv-section"><div class="ginv-heading">⚔ Wielding ⚔</div><div class="ginv-body">' + toDisplayList(s.data.wielding) + '</div></div>' +
      '<div class="ginv-section"><div class="ginv-heading">🛡 Wearing 🛡</div><div class="ginv-body">' + toDisplayList(s.data.wearing) + '</div></div>' +
      '<div class="ginv-section"><div class="ginv-heading">🎒 Carrying 🎒</div><div class="ginv-body">' + toDisplayList(s.data.carrying) + '</div></div>' +
      '</div>';
  }

  function resetCaptureData() {
    var s = state();
    s.data.wielding = "none";
    s.data.wearing = "none";
    s.data.carrying = "none";
    s.currentSection = null;
    s.currentBuffer = "";
  }

  function finishSection() {
    var s = state();
    var section = s.currentSection;
    var text = clean(s.currentBuffer);

    if (section && text) {
      s.data[section] = text;
    }

    s.currentSection = null;
    s.currentBuffer = "";
  }

  function startSection(section, text) {
    var s = state();

    finishSection();

    s.currentSection = section;
    s.currentBuffer = text || "";

    if (String(text || "").match(/\.\s*$/)) {
      finishSection();
    }
  }

  function appendSection(text) {
    var s = state();

    if (!s.currentSection) return;

    s.currentBuffer = clean(s.currentBuffer + " " + String(text || ""));

    if (String(text || "").match(/\.\s*$/)) {
      finishSection();
    }
  }

  function captureLine(lineText) {
    var s = state();
    var text;
    var m;

    if (s.capturing !== true) return;

    text = clean(lineText);
    if (!text || text === ">") return;

    if (/^You are in possession of\s+.+$/i.test(text)) {
      finishSection();
      return;
    }

    m = text.match(/^You are wearing\s+(.+)$/i);
    if (m) {
      startSection("wearing", m[1]);
      return;
    }

    m = text.match(/^You are wielding\s+(.+)$/i);
    if (m) {
      startSection("wielding", m[1]);
      return;
    }

    m = text.match(/^You are holding\s+(.+)$/i);
    if (m) {
      startSection("wielding", m[1]);
      return;
    }

    m = text.match(/^You are carrying\s+(.+)$/i);
    if (m) {
      startSection("carrying", m[1]);
      return;
    }

    if (s.currentSection) {
      appendSection(text);
    }
  }

  function finishCapture() {
    var s = state();

    finishSection();
    s.capturing = false;
    render();
  }

  function refresh() {
    var s = state();

    show();
    resetCaptureData();
    s.capturing = true;

    if (s.captureTimer) clearTimeout(s.captureTimer);

    s.captureTimer = setTimeout(function () {
      finishCapture();
    }, 2500);

    sendCommand("i");
  }

  function scheduleRefresh(delay) {
    var s = state();

    delay = delay || 1100;

    if (s.autoRefreshTimer) clearTimeout(s.autoRefreshTimer);

    s.autoRefreshTimer = setTimeout(function () {
      if (s.visible !== false) {
        refresh();
      }
    }, delay);
  }

  function show() {
    var s = state();
    var content;

    s.visible = true;
    ensureTab();
    render();

    content = document.getElementById("inventory");
    if (content) content.style.display = "";
    selectInventoryTab();
  }

  function hide() {
    var s = state();
    var content = document.getElementById("inventory");
    var link = document.getElementById("genesisInventoryTabLink");
    var communicationLink = document.querySelector('#bottomsidebar ul.idTabs a[href="#communication"]');
    var communication = document.getElementById("communication");

    s.visible = false;

    if (content) content.style.display = "none";
    if (link) link.classList.remove("selected");

    if (communication) communication.style.display = "";
    if (communicationLink) communicationLink.classList.add("selected");
  }

  function toggle() {
    var s = state();
    var content = document.getElementById("inventory");

    if (s.visible && content && content.style.display !== "none") {
      hide();
    } else {
      show();
    }
  }

  function status() {
    var s = state();

    out("Version: " + VERSION);
    out("Visible: " + (s.visible !== false));
    out("Capturing: " + (s.capturing === true));
    out("Wielding: " + s.data.wielding);
    out("Wearing: " + s.data.wearing);
    out("Carrying: " + s.data.carrying);
  }

  function help() {
    out("Commands:");
    out("ginv              show/refresh inventory");
    out("ginv blacklist <full item name>");
    out("ginv unblacklist <full item name>");
    out("ginv blacklist list");
    out("ginv blacklist clear");
  }

  function dispatch() {
    var parts = getArgs();
    var cmd = lower(parts[0] || "");
    var sub = lower(parts[1] || "");
    var item;

    state();
    ensureTab();

    if (cmd === "blacklist") {
      if (sub === "list") {
        listBlacklist();
        return;
      }

      if (sub === "clear") {
        clearBlacklist();
        return;
      }

      item = parts.slice(1).join(" ");
      addBlacklist(item);
      return;
    }

    if (cmd === "unblacklist" || cmd === "whitelist") {
      item = parts.slice(1).join(" ");
      removeBlacklist(item);
      return;
    }

    if (!cmd || cmd === "refresh" || cmd === "r") {
      refresh();
      return;
    }

    if (cmd === "show") {
      show();
      return;
    }

    if (cmd === "hide") {
      hide();
      return;
    }

    if (cmd === "toggle") {
      toggle();
      return;
    }

    if (cmd === "status") {
      status();
      return;
    }

    if (cmd === "help") {
      help();
      return;
    }

    out("Unknown command: " + cmd, "#ffcc66");
    help();
  }

  dispatch();
})();
