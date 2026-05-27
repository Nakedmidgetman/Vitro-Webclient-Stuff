/*
Alias
Pattern: gvitals
Type: Javascript

Trigger(s) Required:
 - Gvitals Output

Optional Trigger(s):
 - Auto Restore

Commands:
 - gvitals
 - gvitals show
 - gvitals hide
 - gvitals unlock
 - gvitals lock
 - gvitals snap
 - gvitals reset
 - gvitals status
 - gvitals help

 
*/

try {
  (function () {
    var VERSION = "125.0.0-resize-help-hide-native";
    var STORAGE_KEY = "GenesisGVitalsGMCPOnlyV120";

    var HEALTH_PHRASES = {
      "at death's door": 1,
      "barely alive": 2,
      "terribly hurt": 3,
      "in a very bad shape": 4,
      "in agony": 5,
      "in a bad shape": 6,
      "very hurt": 7,
      "suffering": 8,
      "hurt": 9,
      "aching": 10,
      "somewhat hurt": 11,
      "slightly hurt": 12,
      "sore": 13,
      "feeling well": 14,
      "feeling very well": 15
    };

    /*
      Conservative defaults for non-health vitals.
      These may be adjusted later if you provide exact Genesis level lists for them.
    */
    var FATIGUE_PHRASES = {
      "extremely exhausted": 1,
      "very exhausted": 2,
      "exhausted": 3,
      "somewhat exhausted": 4,
      "slightly exhausted": 5,
      "extremely tired": 6,
      "very tired": 7,
      "tired": 8,
      "somewhat tired": 9,
      "slightly tired": 10,
      "extremely weary": 11,
      "very weary": 12,
      "weary": 13,
      "somewhat weary": 14,
      "slightly weary": 15,
      "slightly alert": 16,
      "somewhat alert": 17,
      "alert": 18,
      "very alert": 19,
      "extremely alert": 20
    };

    var MANA_PHRASES = {
      "devoid of vigour": 1,
      "almost devoid of vigour": 2,
      "very low on vigour": 3,
      "low on vigour": 4,
      "somewhat low on vigour": 5,
      "half full of vigour": 6,
      "somewhat full of vigour": 7,
      "full of vigour": 8,
      "in full vigour": 9
    };

    function out(msg, color) {
      try {
        gwc.output.append("[GVitals] " + String(msg), color || "#88ccff");
      } catch (e) {
        try { console.log("[GVitals] " + msg); } catch (ignore) {}
      }
    }

    function clean(text) {
      return String(text || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/\s+/g, " ")
        .replace(/^\s+|\s+$/g, "");
    }

    function lower(text) {
      return clean(text).toLowerCase();
    }

    function clampPct(n) {
      n = Number(n);
      if (!isFinite(n)) return null;
      if (n < 0) n = 0;
      if (n > 100) n = 100;
      return Math.round(n);
    }

    function getArgs() {
      var raw = "";
      var parts = [];
      var i;

      try {
        if (typeof args !== "undefined") {
          if (typeof args[1] !== "undefined" && String(args[1]).length) {
            for (i = 1; i < 20; i++) {
              if (typeof args[i] !== "undefined" && args[i] !== null && String(args[i]).length) {
                parts.push(String(args[i]));
              }
            }
            return parts;
          }

          if (typeof args["*"] !== "undefined" && String(args["*"]).length) raw = String(args["*"]);
          else if (typeof args[0] !== "undefined" && String(args[0]).length) raw = String(args[0]);
        }
      } catch (e) {}

      raw = String(raw || "").replace(/^gvitals\b/i, "").trim();
      return raw ? raw.split(/\s+/) : [];
    }

    function state() {
      window.GenesisVitals = window.GenesisVitals || {};
      var s = window.GenesisVitals;

      s.version = VERSION;
      s.enabled = s.enabled !== false;
      s.visible = s.visible !== false;
      s.lastPayload = s.lastPayload || {};
      s.refreshTimer = s.refreshTimer || null;
      s.lastUpdate = s.lastUpdate || 0;
      s.last = s.last || {
        healthPct: 100,
        fatiguePct: 100,
        manaPct: 100,
        foodPct: 100,
        drinkPct: 100,
        intoxicationPct: 0
      };
      s.drag = s.drag || {
        active: false,
        resize: false,
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
        startWidth: 0
      };
      s.raw = s.raw || {
        health: "",
        fatigue: "",
        mana: "",
        food: "",
        drink: "",
        intoxication: ""
      };

      return s;
    }

    function readSaved() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return {};
    }

    function writeSaved(obj) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj || {}));
      } catch (e) {}
    }

    function percentFromBracket(text, maxDefault) {
      var matches;
      var i;
      var m;
      var n;
      var d;

      text = clean(text);
      matches = text.match(/\[(\d+)\s*\/\s*(\d+)\]/g);

      if (!matches || !matches.length) return null;

      /*
        Use the last bracket marker. Genesis examples can show translated helpers
        like "very hurt [9/15] [7/15]"; the last value is the corrected/real one.
      */
      for (i = matches.length - 1; i >= 0; i--) {
        m = matches[i].match(/\[(\d+)\s*\/\s*(\d+)\]/);
        if (!m) continue;

        n = parseInt(m[1], 10);
        d = parseInt(m[2], 10);

        if (isFinite(n) && isFinite(d) && d > 0) {
          return clampPct((n / d) * 100);
        }
      }

      return null;
    }

    function percentFromMap(text, map, maxLevel) {
      var t = lower(text);
      var keys = [];
      var key;
      var i;

      for (key in map) {
        if (map.hasOwnProperty(key)) keys.push(key);
      }

      keys.sort(function (a, b) {
        return b.length - a.length;
      });

      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        if (t.indexOf(key) !== -1) {
          return clampPct((map[key] / maxLevel) * 100);
        }
      }

      return null;
    }

    function percentFromText(kind, value) {
      var text = clean(value);
      var pct;

      if (!text) return null;

      pct = percentFromBracket(text);
      if (pct !== null) return pct;

      if (kind === "health") return percentFromMap(text, HEALTH_PHRASES, 15);
      if (kind === "fatigue") return percentFromMap(text, FATIGUE_PHRASES, 20);
      if (kind === "mana") return percentFromMap(text, MANA_PHRASES, 9);

      /*
        Food/drink/intoxication level lists are not fully known here.
        If Genesis gives [x/y], the bracket parser above handles it.
        Otherwise use simple text fallbacks.
      */
      if (kind === "food") {
        if (/starving|famished|hungry/.test(lower(text))) return 10;
        if (/could eat|some more|a little more/.test(lower(text))) return 50;
        if (/full|too full|barely eat|cannot eat|no more/.test(lower(text))) return 100;
      }

      if (kind === "drink") {
        if (/parched|dehydrated|thirsty/.test(lower(text))) return 10;
        if (/could drink|some more|a little more/.test(lower(text))) return 50;
        if (/full|drunk your fill|barely drink|cannot drink|no more/.test(lower(text))) return 100;
      }

      if (kind === "intoxication") {
        if (/sober|not intoxicated|clear headed/.test(lower(text))) return 0;
        if (/slightly|tipsy/.test(lower(text))) return 25;
        if (/drunk|intoxicated/.test(lower(text))) return 65;
        if (/wasted|plastered|unconscious/.test(lower(text))) return 100;
      }

      return null;
    }

    function mergePayload(payload) {
      var s = state();
      var keys = ["health", "fatigue", "mana", "food", "drink", "intoxication"];
      var i;
      var key;
      var val;
      var pct;

      if (!payload || typeof payload !== "object") return false;

      for (i = 0; i < keys.length; i++) {
        key = keys[i];

        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          val = clean(payload[key]);
          s.raw[key] = val;
          s.lastPayload[key] = val;

          pct = percentFromText(key, val);
          if (pct !== null) {
            if (key === "health") s.last.healthPct = pct;
            if (key === "fatigue") s.last.fatiguePct = pct;
            if (key === "mana") s.last.manaPct = pct;
            if (key === "food") s.last.foodPct = pct;
            if (key === "drink") s.last.drinkPct = pct;
            if (key === "intoxication") s.last.intoxicationPct = pct;
          }
        }
      }

      s.lastUpdate = Date.now();
      return true;
    }

    function gmcpVitals() {
      var obj;

      try {
        obj = mud.gmcp["char.vitals"];
        if (obj && typeof obj === "object") return obj;
      } catch (e1) {}

      try {
        obj = mud.gmcp["Char.Vitals"];
        if (obj && typeof obj === "object") return obj;
      } catch (e2) {}

      try {
        obj = gwc.gmcp.data.char.vitals;
        if (obj && typeof obj === "object") return obj;
      } catch (e3) {}

      try {
        obj = gwc.gmcp.data.character.vitals;
        if (obj && typeof obj === "object") return obj;
      } catch (e4) {}

      return {};
    }

    function sendGMCPCommand(command) {
      /*
        IMPORTANT:
        Do NOT fall back to gwc.connection.send(command).
        That sends the GMCP command as normal game text and Genesis replies:
          What?
      */

      try {
        if (typeof sendGMCP === "function") {
          sendGMCP(command);
          return true;
        }
      } catch (e1) {}

      try {
        if (gwc && gwc.connection && typeof gwc.connection.sendGMCP === "function") {
          gwc.connection.sendGMCP(command);
          return true;
        }
      } catch (e2) {}

      try {
        if (mud && typeof mud.sendGMCP === "function") {
          mud.sendGMCP(command);
          return true;
        }
      } catch (e3) {}

      return false;
    }

    function subscribeAndRequest() {
      var sentSubscribe = sendGMCPCommand('Core.Supports.Add ["Char 1"]');
      var sentRequest;

      setTimeout(function () {
        sentRequest = sendGMCPCommand('Char.Vitals.Get "All"');

        if (!sentSubscribe && !sentRequest) {
          out("No real GMCP sender function was available. Using existing webclient GMCP cache/trigger only.", "#ffcc66");
        }
      }, 250);

      setTimeout(function () {
        mergePayload(gmcpVitals());
        render();
      }, 750);

      setTimeout(function () {
        sendGMCPCommand('Char.Vitals.Get "All"');
      }, 1500);
    }


    function readPosition() {
      var saved;

      try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      } catch (e) {
        saved = {};
      }

      if (!isFinite(saved.left)) saved.left = 8;
      if (!isFinite(saved.top)) saved.top = Math.max(0, window.innerHeight - 48);
      if (!isFinite(saved.width)) saved.width = Math.max(420, window.innerWidth - 16);
      if (saved.locked === undefined) saved.locked = true;

      return saved;
    }

    function savePosition(pos) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pos || readPosition()));
      } catch (e) {}
    }

    function currentPosition() {
      var bar = document.getElementById("genesisGvitalsGMCP");
      var rect;
      var pos;

      if (!bar) return readPosition();

      rect = bar.getBoundingClientRect();
      pos = readPosition();
      pos.left = Math.round(rect.left);
      pos.top = Math.round(rect.top);
      pos.width = Math.round(rect.width);

      return pos;
    }

    function applyPosition(bar) {
      var pos = readPosition();

      bar.style.left = Math.round(pos.left) + "px";
      bar.style.top = Math.round(pos.top) + "px";
      bar.style.width = Math.round(pos.width) + "px";
      bar.style.right = "auto";
      bar.style.bottom = "auto";

      if (pos.locked) {
        bar.classList.add("gv-locked");
        bar.classList.remove("gv-unlocked");
      } else {
        bar.classList.remove("gv-locked");
        bar.classList.add("gv-unlocked");
      }
    }

    function setLocked(locked) {
      var pos = currentPosition();
      var bar = document.getElementById("genesisGvitalsGMCP");

      pos.locked = locked !== false;
      savePosition(pos);

      if (bar) applyPosition(bar);
    }

    function snapToBottom(saveIt) {
      var bar = ensureBar();
      var pos = readPosition();

      pos.left = 8;
      pos.top = Math.max(0, window.innerHeight - 48);
      pos.width = Math.max(420, window.innerWidth - 16);

      if (saveIt !== false) savePosition(pos);

      applyPosition(bar);
      render();
    }

    function bindDragResize(bar) {
      if (!bar || bar.dataset.gvDragResizeBound === "1") return;
      bar.dataset.gvDragResizeBound = "1";

      bar.addEventListener("mousedown", function (event) {
        var s = state();
        var pos = readPosition();
        var rect;

        if (pos.locked) return;

        if (event.target && (
          event.target.id === "gvitalsLockBtn" ||
          event.target.id === "gvitalsSnapBtn" ||
          event.target.id === "gvitalsResizeHandle"
        )) {
          if (event.target.id !== "gvitalsResizeHandle") return;
        }

        rect = bar.getBoundingClientRect();

        s.drag.resize = event.target && event.target.id === "gvitalsResizeHandle";
        s.drag.active = !s.drag.resize;
        s.drag.startX = event.clientX;
        s.drag.startY = event.clientY;
        s.drag.startLeft = rect.left;
        s.drag.startTop = rect.top;
        s.drag.startWidth = rect.width;

        if (s.drag.resize) {
          bar.classList.add("gv-resizing");
        }

        event.preventDefault();
        event.stopPropagation();
      });

      document.addEventListener("mousemove", function (event) {
        var s = state();
        var left;
        var top;
        var width;

        if (!s.drag.active && !s.drag.resize) return;

        if (s.drag.resize) {
          width = s.drag.startWidth + (event.clientX - s.drag.startX);
          if (width < 360) width = 360;
          if (width > window.innerWidth) width = window.innerWidth;
          bar.style.width = Math.round(width) + "px";

          /*
            Save during resize so the 250ms render loop does not re-apply
            the old full-width saved position and snap the bar back.
          */
          var resizePos = readPosition();
          resizePos.left = Math.round(bar.getBoundingClientRect().left);
          resizePos.top = Math.round(bar.getBoundingClientRect().top);
          resizePos.width = Math.round(width);
          savePosition(resizePos);

          event.preventDefault();
          return;
        }

        left = s.drag.startLeft + (event.clientX - s.drag.startX);
        top = s.drag.startTop + (event.clientY - s.drag.startY);

        if (left < 0) left = 0;
        if (top < 0) top = 0;
        if (left > window.innerWidth - 160) left = window.innerWidth - 160;
        if (top > window.innerHeight - 36) top = window.innerHeight - 36;

        bar.style.left = Math.round(left) + "px";
        bar.style.top = Math.round(top) + "px";
        bar.style.right = "auto";
        bar.style.bottom = "auto";

        event.preventDefault();
      });

      document.addEventListener("mouseup", function () {
        var s = state();
        var pos;

        if (!s.drag.active && !s.drag.resize) return;

        s.drag.active = false;
        s.drag.resize = false;
        bar.classList.remove("gv-resizing");

        pos = currentPosition();
        pos.locked = readPosition().locked === true;
        savePosition(pos);
      });
    }

    function installStyles() {
      var old = document.getElementById("genesis-gvitals-gmcp-only-style");
      var style;

      if (old) old.remove();

      style = document.createElement("style");
      style.id = "genesis-gvitals-gmcp-only-style";
      style.textContent =
        "#genesisGvitalsGMCP {" +
        " position: fixed;" +
        " left: 8px;" +
        " top: calc(100vh - 48px);" +
        " right: auto;" +
        " bottom: auto;" +
        " width: calc(100vw - 16px);" +
        " z-index: 20;" +
        " box-sizing: border-box;" +
        " min-height: 38px;" +
        " padding: 3px 6px;" +
        " display: flex;" +
        " gap: 6px;" +
        " align-items: center;" +
        " background: rgba(4, 7, 10, 0.96);" +
        " border-top: 1px solid rgba(136,204,255,0.55);" +
        " font-family: monospace;" +
        " font-size: 10px;" +
        " color: #eee;" +
        "}" +

"#genesisGvitalsGMCP.gv-unlocked {" +
        " outline: 2px dashed #88ccff;" +
        " cursor: move;" +
        " z-index: 900;" +
        "}" +

        "#genesisGvitalsGMCP.gv-locked {" +
        " pointer-events: none;" +
        "}" +

        "#genesisGvitalsGMCP.gv-unlocked {" +
        " pointer-events: auto;" +
        "}" +

        "#genesisGvitalsGMCP .gv-control {" +
        " display: none;" +
        " position: absolute;" +
        " top: -24px;" +
        " height: 20px;" +
        " padding: 1px 8px;" +
        " font-family: monospace;" +
        " font-size: 11px;" +
        " color: #fff;" +
        " background: rgba(20,35,50,0.96);" +
        " border: 1px solid #88ccff;" +
        " border-radius: 4px;" +
        " cursor: pointer;" +
        " pointer-events: auto;" +
        "}" +
        "#genesisGvitalsGMCP.gv-unlocked .gv-control { display: block; }" +
        "#gvitalsLockBtn { right: 6px; }" +
        "#gvitalsSnapBtn { right: 58px; }" +
        "#gvitalsResizeHandle {" +
        " display: none;" +
        " position: absolute;" +
        " right: -8px;" +
        " top: 0;" +
        " width: 22px;" +
        " height: 100%;" +
        " min-height: 38px;" +
        " cursor: ew-resize;" +
        " background: rgba(136,204,255,0.18);" +
        " border-left: 1px solid #88ccff;" +
        " pointer-events: auto;" +
        "}" +
        "#genesisGvitalsGMCP.gv-unlocked #gvitalsResizeHandle { display: block; }" +

        "#statusbars.gvitals-native-hidden {" +
        " display: none !important;" +
        " visibility: hidden !important;" +
        " opacity: 0 !important;" +
        " height: 0 !important;" +
        " min-height: 0 !important;" +
        " max-height: 0 !important;" +
        " overflow: hidden !important;" +
        "}" +

        "#genesisGvitalsGMCP.gv-resizing {" +
        " transition: none !important;" +
        "}" +

        "#genesisGvitalsGMCP .gv-card {" +
        " flex: 1 1 0;" +
        " min-width: 0;" +
        " height: 31px;" +
        " box-sizing: border-box;" +
        " display: grid;" +
        " grid-template-columns: 25px 54px minmax(70px,1fr);" +
        " align-items: center;" +
        " gap: 4px;" +
        " padding: 2px 5px;" +
        " border: 1px solid var(--gv-color);" +
        " border-radius: 5px;" +
        " background: rgba(0,0,0,0.48);" +
        " overflow: hidden;" +
        "}" +

        "#genesisGvitalsGMCP .gv-icon {" +
        " width: 21px;" +
        " height: 21px;" +
        " border-radius: 50%;" +
        " border: 2px solid var(--gv-color);" +
        " display: flex;" +
        " align-items: center;" +
        " justify-content: center;" +
        " color: var(--gv-color);" +
        " text-shadow: 0 0 5px var(--gv-color);" +
        " font-size: 12px;" +
        "}" +

        "#genesisGvitalsGMCP .gv-name {" +
        " font-weight: bold;" +
        " color: #fff;" +
        " white-space: nowrap;" +
        "}" +

        "#genesisGvitalsGMCP .gv-pct {" +
        " font-size: 9px;" +
        " color: var(--gv-color);" +
        " white-space: nowrap;" +
        "}" +

        "#genesisGvitalsGMCP .gv-bar {" +
        " display: flex;" +
        " gap: 3px;" +
        " width: 100%;" +
        " overflow: hidden;" +
        "}" +

        "#genesisGvitalsGMCP .gv-seg {" +
        " flex: 1 1 0;" +
        " min-width: 3px;" +
        " height: 19px;" +
        " border-radius: 3px;" +
        " background: rgba(80,80,80,0.35);" +
        "}" +

        "#genesisGvitalsGMCP .gv-seg.on {" +
        " background: var(--gv-color);" +
        " box-shadow: 0 0 5px var(--gv-color);" +
        "}" +

        "#genesisGvitalsGMCP .gv-health { --gv-color: #ff2d55; }" +
        "#genesisGvitalsGMCP .gv-fatigue { --gv-color: #ffd83d; }" +
        "#genesisGvitalsGMCP .gv-mana { --gv-color: #b56bff; }" +
        "#genesisGvitalsGMCP .gv-food { --gv-color: #ff9f1a; }" +
        "#genesisGvitalsGMCP .gv-drink { --gv-color: #28c7ff; }";
      document.head.appendChild(style);
    }

    function segments(percent) {
      var total = 15;
      var on = Math.round((Number(percent || 0) / 100) * total);
      var html = "";
      var i;

      if (on < 0) on = 0;
      if (on > total) on = total;

      for (i = 1; i <= total; i++) {
        html += '<span class="gv-seg' + (i <= on ? " on" : "") + '"></span>';
      }

      return html;
    }

    function card(kind, icon, name, pct) {
      pct = clampPct(pct);
      if (pct === null) pct = 0;

      return (
        '<div class="gv-card gv-' + kind + '">' +
          '<div class="gv-icon">' + icon + '</div>' +
          '<div>' +
            '<div class="gv-name">' + name + '</div>' +
            '<div class="gv-pct">' + pct + '%</div>' +
          '</div>' +
          '<div class="gv-bar">' + segments(pct) + '</div>' +
        '</div>'
      );
    }

    function ensureBar() {
      var bar = document.getElementById("genesisGvitalsGMCP");

      installStyles();

      if (!bar) {
        bar = document.createElement("div");
        bar.id = "genesisGvitalsGMCP";
        document.body.appendChild(bar);
      }

      if (!(state().drag && (state().drag.active || state().drag.resize))) {
        applyPosition(bar);
      }
      bindDragResize(bar);

      return bar;
    }

    function render() {
      var s = state();
      var bar;

      if (s.enabled === false || s.visible === false) return;

      bar = ensureBar();

      bar.innerHTML =
        '<button id="gvitalsSnapBtn" class="gv-control" type="button">snap</button>' +
        '<button id="gvitalsLockBtn" class="gv-control" type="button">lock</button>' +
        '<div id="gvitalsResizeHandle" title="Drag to resize"></div>' +
        card("health", "♥", "Health", s.last.healthPct) +
        card("fatigue", "⚡", "Fatigue", s.last.fatiguePct) +
        card("mana", "✦", "Mana", s.last.manaPct) +
        card("food", "🍖", "Food", s.last.foodPct) +
        card("drink", "💧", "Drink", s.last.drinkPct);

      $("#gvitalsLockBtn").off("click.gvitals").on("click.gvitals", function (event) {
        event.preventDefault();
        event.stopPropagation();
        setLocked(true);
        out("Locked and saved.", "#80ff80");
      });

      $("#gvitalsSnapBtn").off("click.gvitals").on("click.gvitals", function (event) {
        event.preventDefault();
        event.stopPropagation();
        snapToBottom(true);
        out("Snapped to bottom and saved.", "#80ff80");
      });
    }


    function startAutoRefresh() {
      var s = state();

      if (s.refreshTimer) clearInterval(s.refreshTimer);

      s.refreshTimer = setInterval(function () {
        /*
          Do not send commands here. Just re-read the Genesis webclient's
          existing GMCP cache and redraw from it.
        */
        mergePayload(gmcpVitals());
        render();
      }, 250);
    }

    function stopAutoRefresh() {
      var s = state();

      if (s.refreshTimer) {
        clearInterval(s.refreshTimer);
        s.refreshTimer = null;
      }
    }

    function install() {
      var s = state();

      s.enabled = true;
      s.visible = true;

      mergePayload(gmcpVitals());
      var nativeBars = document.getElementById("statusbars");
      if (nativeBars) nativeBars.classList.add("gvitals-native-hidden");

      ensureBar();
      render();
      startAutoRefresh();
      subscribeAndRequest();

      window.GenesisVitals = window.GenesisVitals || {};
      window.GenesisVitals.version = VERSION;
      window.GenesisVitals.onGMCPVitals = function (payload) {
        /*
          Instant path: this is called by the Gvitals Output GMCP trigger.
          The 250ms cache loop is only backup.
        */
        mergePayload(payload || gmcpVitals() || {});
        render();
      };
      window.GenesisVitals.applyVitalsPayload = window.GenesisVitals.onGMCPVitals;
      window.GenesisVitals.render = render;
      window.GenesisVitals.subscribeAndRequest = subscribeAndRequest;

      out("Installed GMCP-only gvitals. It will use Char.Vitals GMCP if available.", "#80ff80");
    }

    function hide() {
      var s = state();
      var bar = document.getElementById("genesisGvitalsGMCP");

      s.visible = false;
      stopAutoRefresh();
      if (bar) bar.style.display = "none";

      var nativeBars = document.getElementById("statusbars");
      if (nativeBars) nativeBars.classList.remove("gvitals-native-hidden");

      out("Hidden.", "#ffcc66");
    }

    function show() {
      state().visible = true;

      var nativeBars = document.getElementById("statusbars");
      if (nativeBars) nativeBars.classList.add("gvitals-native-hidden");

      ensureBar().style.display = "flex";
      startAutoRefresh();
      subscribeAndRequest();
      mergePayload(gmcpVitals());
      render();
      out("Shown and requested fresh Char.Vitals.", "#80ff80");
    }

    function reset() {
      var bar = document.getElementById("genesisGvitalsGMCP");
      if (bar) bar.remove();

      var nativeBars = document.getElementById("statusbars");
      if (nativeBars) nativeBars.classList.remove("gvitals-native-hidden");

      state().last = {
        healthPct: 100,
        fatiguePct: 100,
        manaPct: 100,
        foodPct: 100,
        drinkPct: 100,
        intoxicationPct: 0
      };

      show();
      out("Reset.", "#80ff80");
    }

    function unlock() {
      install();
      setLocked(false);
      out("Unlocked. Drag the bar to move it; drag the right edge to resize.", "#ffcc66");
    }

    function lock() {
      setLocked(true);
      out("Locked and saved.", "#80ff80");
    }

    function snap() {
      install();
      snapToBottom(true);
      out("Snapped to bottom and saved.", "#80ff80");
    }

    function status() {
      var s = state();
      var pos = readPosition();
      var age = s.lastUpdate ? Math.round((Date.now() - s.lastUpdate) / 1000) + "s ago" : "never";

      out("Version: " + VERSION);
      out("Bar found: " + !!document.getElementById("genesisGvitalsGMCP"));
      out("Position: left=" + pos.left + " top=" + pos.top + " width=" + pos.width + " locked=" + pos.locked);
      out("Auto refresh running: " + !!s.refreshTimer);
      out("Instant GMCP trigger installed: " + !!(window.GenesisVitals && window.GenesisVitals.onGMCPVitals));
      out("Last GMCP update: " + age);
      out("Pct: H " + s.last.healthPct + " | F " + s.last.fatiguePct + " | M " + s.last.manaPct + " | Food " + s.last.foodPct + " | Drink " + s.last.drinkPct);
      out("Raw health: " + (s.raw.health || "(none)"));
      out("Raw fatigue: " + (s.raw.fatigue || "(none)"));
      out("Raw mana: " + (s.raw.mana || "(none)"));
      out("Raw food/drink: " + (s.raw.food || "(none)") + " / " + (s.raw.drink || "(none)"));
      out("Trying fresh GMCP request now, only if a real GMCP sender exists...");
      subscribeAndRequest();
    }

    function help() {
      out("Commands:");
      out("gvitals          install/show and request fresh GMCP vitals");
      out("gvitals show     show bar and request fresh GMCP vitals");
      out("gvitals hide     hide bar");
      out("gvitals unlock   enable drag/resize controls");
      out("gvitals lock     lock and save the current position");
      out("gvitals snap     snap to bottom and save");
      out("Native Genesis vitals are hidden while custom gvitals is shown.");
      out("gvitals reset    remove/recreate bar");
      out("gvitals status   show debug and request fresh GMCP vitals");
      out("gvitals help     show this help");
    }

    function dispatch() {
      var cmd = lower(getArgs()[0] || "");

      if (!cmd || cmd === "on" || cmd === "install" || cmd === "refresh") {
        install();
        if (!cmd) help();
        return;
      }

      if (cmd === "show") {
        show();
        return;
      }

      if (cmd === "hide" || cmd === "off") {
        hide();
        return;
      }

      if (cmd === "unlock" || cmd === "drag" || cmd === "resize") {
        unlock();
        return;
      }

      if (cmd === "lock" || cmd === "save") {
        lock();
        return;
      }

      if (cmd === "snap") {
        snap();
        return;
      }

      if (cmd === "reset") {
        reset();
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
} catch (e) {
  try {
    gwc.output.append("[GVitals ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
