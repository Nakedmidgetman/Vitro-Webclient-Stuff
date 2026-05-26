/*
Genesis GVitals 
Alias value/pattern: gvitals

Required Trigger(s):
Gvitals Output

Commands:
  gvitals
  gvitals unlock
  gvitals lock
  gvitals snap
  gvitals reset
  gvitals off
  gvitals status
*/

try {
  (function () {
    var VERSION = "93.0.0";

    function out(msg, color) {
      try {
        gwc.output.append("[GVitals] " + String(msg), color || "#88ccff");
      } catch (e) {
        try { console.log("[GVitals] " + msg); } catch (e2) {}
      }
    }

    function clean(text) {
      return String(text || "")
        .replace(/\x1b\[[0-9;]*m/g, "")
        .replace(/\s+/g, " ")
        .replace(/^\s+|\s+$/g, "");
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
            for (i = 1; i < 20; i++) {
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

      raw = String(raw || "").replace(/^gvitals\b/i, "").trim();
      return raw ? raw.split(/\s+/) : [];
    }

    function ensureUserdata() {
      gwc.userdata.gvitals = gwc.userdata.gvitals || {};
      return gwc.userdata.gvitals;
    }

    function state() {
      window.GenesisVitals = window.GenesisVitals || {};
      var s = window.GenesisVitals;

      s.version = VERSION;
      s.enabled = s.enabled !== false;
      s.timer = s.timer || null;

      s.drag = s.drag || {
        active: false,
        resize: false,
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
        startWidth: 0
      };

      s.last = s.last || {
        healthPct: 100,
        fatiguePct: 100,
        manaPct: 100,
        foodPct: 100,
        drinkPct: 100
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

    function subscribeGMCP() {
      try {
        if (typeof sendGMCP === "function") {
          sendGMCP('Core.Supports.Add ["Char 1"]');
          return;
        }
      } catch (e1) {}

      try {
        if (gwc && gwc.connection && typeof gwc.connection.sendGMCP === "function") {
          gwc.connection.sendGMCP('Core.Supports.Add ["Char 1"]');
          return;
        }
      } catch (e2) {}

      try {
        if (gwc && typeof gwc.sendGMCP === "function") {
          gwc.sendGMCP('Core.Supports.Add ["Char 1"]');
        }
      } catch (e3) {}
    }

    function removeOldAttempts() {
      var ids = [
        "genesisVitalsBar",
        "genesis-gvitals-floating-style-v93",
        "genesis-gvitals-floating-style-v92",
        "genesis-gvitals-floating-style-v91",
        "genesis-gvitals-floating-style-v90",
        "genesis-gvitals-floating-style-v89",
        "genesis-gvitals-floating-style-v88",
        "genesis-gvitals-floating-style-v87",
        "genesis-gvitals-overlay-style-v86",
        "genesis-gvitals-overlay-style-v85",
        "genesis-gvitals-native-style-v84",
        "genesis-gvitals-style-v83",
        "genesis-gvitals-style-v82",
        "genesis-gvitals-style-v81",
        "genesis-simple-vitals-style-v80"
      ];

      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });

      document.body.classList.remove("genesis-simple-vitals-enabled");
      document.body.classList.remove("genesis-vitals-below-input");
      document.body.classList.remove("genesis-vitals-custom-active");

      var host = document.getElementById("statusbars");
      if (host) {
        host.classList.remove("gvitals-host");
        host.classList.remove("gvitals-native-skin");
        host.classList.remove("gvitals-overlay-host");

        host.style.display = "";
        host.style.visibility = "";
        host.style.height = "";
        host.style.minHeight = "";
        host.style.maxHeight = "";
        host.style.margin = "";
        host.style.padding = "";
        host.style.overflow = "";
        host.style.position = "";
        host.style.opacity = "";
        host.style.pointerEvents = "";

        Array.prototype.slice.call(host.children).forEach(function (child) {
          child.style.opacity = "";
          child.style.pointerEvents = "";
        });
      }
    }

    function hideNativeVitals() {
      var host = document.getElementById("statusbars");
      if (!host) return;

      host.style.opacity = "0";
      host.style.pointerEvents = "none";
    }

    function showNativeVitals() {
      var host = document.getElementById("statusbars");
      if (!host) return;

      host.style.opacity = "";
      host.style.pointerEvents = "";
    }

    function getNativeSection(id) {
      var host = document.getElementById("statusbars");
      if (!host) return null;
      return host.querySelector("#" + id);
    }

    function getNativeText(id) {
      var el = getNativeSection(id);
      var textEl;

      if (!el) return "";

      textEl = el.querySelector(".text");
      if (textEl) return clean(textEl.textContent || "");

      return clean(el.textContent || "");
    }

    function getNativePercent(id) {
      var el = getNativeSection(id);
      var text = "";
      var m;
      var fill;
      var styleWidth;

      if (!el) return null;

      text = clean(el.textContent || "");
      m = text.match(/(\d+)\s*%/);
      if (m) return Math.max(0, Math.min(100, parseInt(m[1], 10)));

      fill = el.querySelector(".bar, .fill, .progress, div[style*='width']");
      if (fill) {
        styleWidth = fill.style && fill.style.width ? fill.style.width : "";
        m = String(styleWidth).match(/(\d+)\s*%/);
        if (m) return Math.max(0, Math.min(100, parseInt(m[1], 10)));
      }

      return null;
    }

    function findVitalsObject(obj, depth) {
      var key;
      var child;
      var lowerKey;

      if (!obj || typeof obj !== "object" || depth > 5) return null;

      if (
        Object.prototype.hasOwnProperty.call(obj, "health") ||
        Object.prototype.hasOwnProperty.call(obj, "mana") ||
        Object.prototype.hasOwnProperty.call(obj, "fatigue") ||
        Object.prototype.hasOwnProperty.call(obj, "food") ||
        Object.prototype.hasOwnProperty.call(obj, "drink")
      ) {
        return obj;
      }

      for (key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        lowerKey = String(key).toLowerCase();

        if (lowerKey === "vitals") {
          child = obj[key];
          if (child && typeof child === "object") return child;
        }

        child = findVitalsObject(obj[key], depth + 1);
        if (child) return child;
      }

      return null;
    }

    function gmcpVitals() {
      try {
        if (
          gwc.gmcp &&
          gwc.gmcp.data &&
          gwc.gmcp.data.character &&
          gwc.gmcp.data.character.vitals
        ) {
          return gwc.gmcp.data.character.vitals;
        }
      } catch (e1) {}

      try {
        if (
          gwc.gmcp &&
          gwc.gmcp.data &&
          gwc.gmcp.data.char &&
          gwc.gmcp.data.char.vitals
        ) {
          return gwc.gmcp.data.char.vitals;
        }
      } catch (e2) {}

      try {
        if (gwc.gmcp && gwc.gmcp.data) {
          return findVitalsObject(gwc.gmcp.data, 0) || {};
        }
      } catch (e3) {}

      return {};
    }

    function pctFromNumbers(text) {
      var m;
      text = clean(text);

      m = text.match(/\[(\d+)\s*\/\s*(\d+)\]/);
      if (m) {
        return Math.max(0, Math.min(100, Math.round((parseInt(m[1], 10) / parseInt(m[2], 10)) * 100)));
      }

      return null;
    }

    function pct(current, max) {
      current = Number(current);
      max = Number(max);

      if (!isFinite(current) || !isFinite(max) || max <= 0) return null;

      return Math.max(0, Math.min(100, Math.round((current / max) * 100)));
    }

    function directPct(value) {
      value = Number(value);
      if (!isFinite(value)) return null;
      return Math.max(0, Math.min(100, Math.round(value)));
    }

    function phrasePct(kind, text) {
      text = lower(text);

      if (!text) return null;

      var numeric = pctFromNumbers(text);
      if (numeric !== null) return numeric;

      if (kind === "health") {
        if (text.indexOf("death's door") !== -1) return 5;
        if (text.indexOf("barely alive") !== -1) return 10;
        if (text.indexOf("terribly hurt") !== -1) return 20;
        if (text.indexOf("very bad shape") !== -1) return 25;
        if (text.indexOf("in agony") !== -1) return 35;
        if (text.indexOf("bad shape") !== -1) return 40;
        if (text.indexOf("very hurt") !== -1) return 50;
        if (text.indexOf("suffering") !== -1) return 55;
        if (text.indexOf("somewhat hurt") !== -1) return 75;
        if (text.indexOf("slightly hurt") !== -1) return 85;
        if (text.indexOf("hurt") !== -1) return 60;
        if (text.indexOf("aching") !== -1) return 70;
        if (text.indexOf("sore") !== -1) return 90;
        if (text.indexOf("feeling very well") !== -1) return 100;
        if (text.indexOf("feeling well") !== -1) return 95;
      }

      if (kind === "fatigue") {
        if (text.indexOf("extremely alert") !== -1) return 100;
        if (text.indexOf("very alert") !== -1) return 95;
        if (text.indexOf("alert") !== -1) return 85;
        if (text.indexOf("slightly tired") !== -1) return 65;
        if (text.indexOf("somewhat tired") !== -1) return 50;
        if (text.indexOf("very tired") !== -1) return 20;
        if (text.indexOf("tired") !== -1) return 35;
        if (text.indexOf("exhausted") !== -1) return 5;
      }

      if (kind === "mana") {
        if (text.indexOf("full vigour") !== -1) return 100;
        if (text.indexOf("full vigor") !== -1) return 100;
        if (text.indexOf("vigour") !== -1) return 100;
        if (text.indexOf("vigor") !== -1) return 100;
        if (text.indexOf("half") !== -1) return 50;
        if (text.indexOf("very low") !== -1) return 20;
        if (text.indexOf("low") !== -1) return 35;
        if (text.indexOf("drained") !== -1) return 5;
      }

      if (kind === "food") {
        if (text.indexOf("starving") !== -1) return 0;
        if (text.indexOf("eat a lot more") !== -1) return 15;
        if (text.indexOf("eat quite a lot more") !== -1) return 25;
        if (text.indexOf("eat some more") !== -1) return 45;
        if (text.indexOf("eat a little more") !== -1) return 65;
        if (text.indexOf("eat a little") !== -1) return 75;
        if (text.indexOf("barely eat more") !== -1) return 100;
        if (text.indexOf("barely eat") !== -1) return 100;
        if (text.indexOf("eat no more") !== -1) return 100;
        if (text.indexOf("too full to eat") !== -1) return 100;
        if (text.indexOf("full") !== -1) return 100;
      }

      if (kind === "drink") {
        if (text.indexOf("dehydrated") !== -1) return 0;
        if (text.indexOf("drink a lot more") !== -1) return 15;
        if (text.indexOf("drink quite a lot more") !== -1) return 25;
        if (text.indexOf("drink some more") !== -1) return 45;
        if (text.indexOf("drink a little more") !== -1) return 65;
        if (text.indexOf("drink a little") !== -1) return 75;
        if (text.indexOf("barely drink more") !== -1) return 100;
        if (text.indexOf("barely drink") !== -1) return 100;
        if (text.indexOf("drink no more") !== -1) return 100;
        if (text.indexOf("too full to drink") !== -1) return 100;
        if (text.indexOf("full") !== -1) return 100;
      }

      return null;
    }

    function applyVitalsPayload(payload) {
      var s = state();
      var p;

      if (!payload || typeof payload !== "object") return false;

      if (payload.health !== undefined) {
        s.raw.health = clean(payload.health);
        p = phrasePct("health", s.raw.health);
        if (p !== null) s.last.healthPct = p;
      }

      if (payload.fatigue !== undefined) {
        s.raw.fatigue = clean(payload.fatigue);
        p = phrasePct("fatigue", s.raw.fatigue);
        if (p !== null) s.last.fatiguePct = p;
      }

      if (payload.mana !== undefined) {
        s.raw.mana = clean(payload.mana);
        p = phrasePct("mana", s.raw.mana);
        if (p !== null) s.last.manaPct = p;
      }

      if (payload.food !== undefined) {
        s.raw.food = clean(payload.food);
        p = phrasePct("food", s.raw.food);
        if (p !== null) s.last.foodPct = p;
      }

      if (payload.drink !== undefined) {
        s.raw.drink = clean(payload.drink);
        p = phrasePct("drink", s.raw.drink);
        if (p !== null) s.last.drinkPct = p;
      }

      if (payload.intoxication !== undefined) {
        s.raw.intoxication = clean(payload.intoxication);
      }

      return true;
    }

    function parseOutputLine(line) {
      var s = state();
      var text = lower(line);
      var p;

      if (!text) return false;

      if (text.indexOf("you are physically ") !== -1) {
        p = phrasePct("health", text);
        if (p !== null) s.last.healthPct = p;

        p = phrasePct("mana", text);
        if (p !== null) s.last.manaPct = p;
      }

      if (text.indexOf("you feel ") !== -1) {
        p = phrasePct("fatigue", text);
        if (p !== null) s.last.fatiguePct = p;
      }

      if (text.indexOf("eat") !== -1) {
        p = phrasePct("food", text);
        if (p !== null) s.last.foodPct = p;
      }

      if (text.indexOf("drink") !== -1) {
        p = phrasePct("drink", text);
        if (p !== null) s.last.drinkPct = p;
      }

      return true;
    }

    function updateFromSources() {
      var s = state();
      var v = gmcpVitals();
      var p;
      var text;

      applyVitalsPayload(v);

      p = getNativePercent("health");
      if (p !== null) s.last.healthPct = p;
      else {
        text = getNativeText("health");
        p = phrasePct("health", text);
        if (p !== null) s.last.healthPct = p;
      }

      p = getNativePercent("fatigue");
      if (p !== null) s.last.fatiguePct = p;
      else {
        text = getNativeText("fatigue");
        p = phrasePct("fatigue", text);
        if (p !== null) s.last.fatiguePct = p;
      }

      p = getNativePercent("mana");
      if (p !== null) s.last.manaPct = p;
      else {
        text = getNativeText("mana");
        p = phrasePct("mana", text);
        if (p !== null) s.last.manaPct = p;
      }

      /*
        For food/drink, prefer GMCP/raw text over native percent.
        Native #statusbars can be stale after we hide it.
      */
      if (s.raw.food) {
        p = phrasePct("food", s.raw.food);
        if (p !== null) s.last.foodPct = p;
      } else {
        text = getNativeText("food");
        p = phrasePct("food", text);
        if (p !== null) s.last.foodPct = p;
        else {
          p = directPct(v.hunger || v.food);
          if (p !== null) s.last.foodPct = p;
        }
      }

      if (s.raw.drink) {
        p = phrasePct("drink", s.raw.drink);
        if (p !== null) s.last.drinkPct = p;
      } else {
        text = getNativeText("drink");
        p = phrasePct("drink", text);
        if (p !== null) s.last.drinkPct = p;
        else {
          p = directPct(v.thirst || v.drink);
          if (p !== null) s.last.drinkPct = p;
        }
      }

      return s.last;
    }

    function defaultPosition() {
      var ud = ensureUserdata();
      var status = document.getElementById("statusbars");
      var main = document.getElementById("main");
      var rect;

      if (ud.left !== undefined && ud.top !== undefined && ud.width !== undefined) {
        return {
          left: Number(ud.left),
          top: Number(ud.top),
          width: Number(ud.width)
        };
      }

      if (status) {
        rect = status.getBoundingClientRect();
        return {
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          width: Math.round(rect.width)
        };
      }

      if (main) {
        rect = main.getBoundingClientRect();
        return {
          left: Math.round(rect.left),
          top: Math.round(rect.bottom - 42),
          width: Math.round(rect.width)
        };
      }

      return {
        left: 0,
        top: window.innerHeight - 80,
        width: window.innerWidth
      };
    }

    function setLockedVisual(locked) {
      var bar = document.getElementById("genesisVitalsBar");
      if (!bar) return;

      if (locked) {
        bar.classList.add("gv-locked");
        bar.classList.remove("gv-unlocked");
      } else {
        bar.classList.remove("gv-locked");
        bar.classList.add("gv-unlocked");
      }
    }

    function savePosition() {
      var bar = document.getElementById("genesisVitalsBar");
      var ud = ensureUserdata();
      var rect;

      if (!bar) return;

      rect = bar.getBoundingClientRect();

      ud.left = Math.round(rect.left);
      ud.top = Math.round(rect.top);
      ud.width = Math.round(rect.width);
      ud.locked = true;

      setLockedVisual(true);
      out("Vitals position saved and locked.", "#80ff80");
    }

    function snapPosition(saveIt) {
      var bar = document.getElementById("genesisVitalsBar");
      var status = document.getElementById("statusbars");
      var main = document.getElementById("main");
      var rect;

      if (!bar) return;

      if (status) rect = status.getBoundingClientRect();
      else if (main) rect = main.getBoundingClientRect();
      else {
        rect = {
          left: 0,
          top: window.innerHeight - 80,
          width: window.innerWidth
        };
      }

      bar.style.left = Math.round(rect.left) + "px";
      bar.style.top = Math.round(rect.top) + "px";
      bar.style.width = Math.round(rect.width) + "px";

      if (saveIt) savePosition();
    }

    function installStyles() {
      var old = document.getElementById("genesis-gvitals-floating-style-v93");
      if (old) old.remove();

      var style = document.createElement("style");
      style.id = "genesis-gvitals-floating-style-v93";

      style.textContent =
        "#genesisVitalsBar {" +
        "  box-sizing: border-box !important;" +
        "  position: fixed !important;" +
        "  height: 36px !important;" +
        "  margin: 0 !important;" +
        "  padding: 2px 4px !important;" +
        "  display: flex !important;" +
        "  gap: 6px !important;" +
        "  align-items: center !important;" +
        "  overflow: visible !important;" +
        "  font-family: monospace !important;" +
        "  font-size: 10px !important;" +
        "  line-height: 1 !important;" +
        "  user-select: none !important;" +
        "}" +

        "#genesisVitalsBar.gv-locked {" +
        "  z-index: 5 !important;" +
        "  pointer-events: none !important;" +
        "  outline: none !important;" +
        "  cursor: default !important;" +
        "}" +

        "#genesisVitalsBar.gv-unlocked {" +
        "  z-index: 900 !important;" +
        "  pointer-events: auto !important;" +
        "  outline: 2px dashed #88ccff !important;" +
        "  cursor: move !important;" +
        "}" +

        "#genesisVitalsBar .gv-tool {" +
        "  display: none;" +
        "  position: absolute;" +
        "  top: -24px;" +
        "  height: 20px;" +
        "  padding: 1px 8px;" +
        "  font-family: monospace;" +
        "  font-size: 11px;" +
        "  color: #ffffff;" +
        "  background: rgba(20, 35, 50, 0.95);" +
        "  border: 1px solid #88ccff;" +
        "  border-radius: 4px;" +
        "  cursor: pointer;" +
        "  z-index: 1000;" +
        "  pointer-events: auto !important;" +
        "}" +

        "#genesisVitalsBar .gv-lock { right: 6px; }" +
        "#genesisVitalsBar .gv-snap { right: 58px; }" +

        "#genesisVitalsBar.gv-unlocked .gv-tool {" +
        "  display: block;" +
        "}" +

        "#genesisVitalsBar .gv-resize {" +
        "  display: none;" +
        "  position: absolute;" +
        "  right: -8px;" +
        "  top: 0;" +
        "  width: 22px;" +
        "  height: 36px;" +
        "  cursor: ew-resize;" +
        "  background: rgba(136, 204, 255, 0.18);" +
        "  border-left: 1px solid #88ccff;" +
        "  pointer-events: auto !important;" +
        "}" +

        "#genesisVitalsBar.gv-unlocked .gv-resize {" +
        "  display: block;" +
        "}" +

        "#genesisVitalsBar .gv-card {" +
        "  box-sizing: border-box !important;" +
        "  flex: 1 1 0 !important;" +
        "  min-width: 0 !important;" +
        "  height: 31px !important;" +
        "  display: grid !important;" +
        "  grid-template-columns: 28px 48px minmax(100px, 1fr) !important;" +
        "  align-items: center !important;" +
        "  gap: 3px !important;" +
        "  padding: 2px 5px !important;" +
        "  background: rgba(4, 7, 10, 0.96) !important;" +
        "  border: 1px solid var(--gv-color) !important;" +
        "  border-radius: 5px !important;" +
        "  color: #eeeeee !important;" +
        "  overflow: hidden !important;" +
        "  pointer-events: auto;" +
        "}" +

        "#genesisVitalsBar.gv-locked .gv-card {" +
        "  pointer-events: none !important;" +
        "}" +

        "#genesisVitalsBar .gv-icon {" +
        "  box-sizing: border-box !important;" +
        "  width: 22px !important;" +
        "  height: 22px !important;" +
        "  border-radius: 50% !important;" +
        "  border: 2px solid var(--gv-color) !important;" +
        "  display: flex !important;" +
        "  align-items: center !important;" +
        "  justify-content: center !important;" +
        "  color: var(--gv-color) !important;" +
        "  font-size: 12px !important;" +
        "  text-shadow: 0 0 5px var(--gv-color) !important;" +
        "}" +

        "#genesisVitalsBar .gv-label {" +
        "  min-width: 0 !important;" +
        "  overflow: hidden !important;" +
        "}" +

        "#genesisVitalsBar .gv-name {" +
        "  color: #ffffff !important;" +
        "  font-weight: bold !important;" +
        "  font-size: 10px !important;" +
        "  white-space: nowrap !important;" +
        "}" +

        "#genesisVitalsBar .gv-pct {" +
        "  color: var(--gv-color) !important;" +
        "  font-weight: bold !important;" +
        "  font-size: 9px !important;" +
        "  white-space: nowrap !important;" +
        "}" +

        "#genesisVitalsBar .gv-bar {" +
        "  display: flex !important;" +
        "  gap: 3px !important;" +
        "  min-width: 0 !important;" +
        "  width: 100% !important;" +
        "  overflow: hidden !important;" +
        "  align-items: center !important;" +
        "}" +

        "#genesisVitalsBar .gv-seg {" +
        "  flex: 1 1 0 !important;" +
        "  min-width: 3px !important;" +
        "  max-width: none !important;" +
        "  height: 19px !important;" +
        "  border-radius: 3px !important;" +
        "  background: rgba(60, 90, 70, 0.28) !important;" +
        "}" +

        "#genesisVitalsBar .gv-seg.on {" +
        "  background: var(--gv-color) !important;" +
        "  box-shadow: 0 0 5px var(--gv-color) !important;" +
        "}" +

        "#genesisVitalsBar .gv-health { --gv-color: #ff2d55; }" +
        "#genesisVitalsBar .gv-fatigue { --gv-color: #ffd83d; }" +
        "#genesisVitalsBar .gv-mana { --gv-color: #b56bff; }" +
        "#genesisVitalsBar .gv-food { --gv-color: #ff9f1a; }" +
        "#genesisVitalsBar .gv-drink { --gv-color: #28c7ff; }" +

        "@media (max-width: 1450px) {" +
        "  #genesisVitalsBar .gv-card {" +
        "    grid-template-columns: 24px 44px minmax(60px, 1fr) !important;" +
        "    gap: 3px !important;" +
        "    padding: 2px 4px !important;" +
        "  }" +
        "}" +

        "@media (max-width: 1000px) {" +
        "  #genesisVitalsBar .gv-name {" +
        "    font-size: 9px !important;" +
        "  }" +
        "  #genesisVitalsBar .gv-pct {" +
        "    font-size: 8px !important;" +
        "  }" +
        "}";

      document.head.appendChild(style);
    }

    function segments(percent) {
      var total = 18;
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

    function cardHtml(kind, icon, name, percent) {
      percent = Math.max(0, Math.min(100, Number(percent || 0)));

      return (
        '<div class="gv-card gv-' + kind + '">' +
          '<div class="gv-icon">' + icon + '</div>' +
          '<div class="gv-label">' +
            '<div class="gv-name">' + name + '</div>' +
            '<div class="gv-pct">' + percent + '%</div>' +
          '</div>' +
          '<div class="gv-bar">' + segments(percent) + '</div>' +
        '</div>'
      );
    }

    function bindDragAndResize(bar) {
      if (bar.dataset.gvDragBound === "1") return;
      bar.dataset.gvDragBound = "1";

      function isUnlocked() {
        return ensureUserdata().locked === false;
      }

      function isResizeZone(event, rect) {
        return event.clientX >= rect.right - 22;
      }

      bar.addEventListener("mousedown", function (event) {
        var s = state();
        var rect;
        var resizeZone;

        if (!isUnlocked()) return;

        if (
          event.target &&
          event.target.classList &&
          (event.target.classList.contains("gv-lock") || event.target.classList.contains("gv-snap"))
        ) {
          return;
        }

        rect = bar.getBoundingClientRect();
        resizeZone = isResizeZone(event, rect);

        s.drag.active = !resizeZone;
        s.drag.resize = resizeZone;
        s.drag.startX = event.clientX;
        s.drag.startY = event.clientY;
        s.drag.startLeft = rect.left;
        s.drag.startTop = rect.top;
        s.drag.startWidth = rect.width;

        event.preventDefault();
        event.stopPropagation();
      });

      document.addEventListener("mousemove", function (event) {
        var s = state();
        var nextLeft;
        var nextTop;
        var nextWidth;
        var minWidth = 420;
        var maxWidth = window.innerWidth;

        if (!s.drag.active && !s.drag.resize) return;

        if (s.drag.resize) {
          nextWidth = s.drag.startWidth + (event.clientX - s.drag.startX);

          if (nextWidth < minWidth) nextWidth = minWidth;
          if (nextWidth > maxWidth) nextWidth = maxWidth;

          bar.style.width = Math.round(nextWidth) + "px";
          event.preventDefault();
          return;
        }

        nextLeft = s.drag.startLeft + (event.clientX - s.drag.startX);
        nextTop = s.drag.startTop + (event.clientY - s.drag.startY);

        if (nextLeft < 0) nextLeft = 0;
        if (nextTop < 0) nextTop = 0;
        if (nextLeft > window.innerWidth - 120) nextLeft = window.innerWidth - 120;
        if (nextTop > window.innerHeight - 36) nextTop = window.innerHeight - 36;

        bar.style.left = Math.round(nextLeft) + "px";
        bar.style.top = Math.round(nextTop) + "px";

        event.preventDefault();
      });

      document.addEventListener("mouseup", function () {
        var s = state();
        if (s.drag.active || s.drag.resize) {
          s.drag.active = false;
          s.drag.resize = false;
        }
      });
    }

    function ensureBar() {
      var bar = document.getElementById("genesisVitalsBar");
      var pos;

      installStyles();
      hideNativeVitals();

      if (!bar) {
        bar = document.createElement("div");
        bar.id = "genesisVitalsBar";
        document.body.appendChild(bar);
      }

      pos = defaultPosition();

      if (!bar.style.left) bar.style.left = pos.left + "px";
      if (!bar.style.top) bar.style.top = pos.top + "px";
      if (!bar.style.width) bar.style.width = pos.width + "px";

      bindDragAndResize(bar);
      setLockedVisual(ensureUserdata().locked !== false);

      return bar;
    }

    function render() {
      var s = state();
      var bar;
      var d;
      var lockButton;
      var snapButton;

      if (s.enabled === false) return;
      if (s.drag.active || s.drag.resize) return;

      d = updateFromSources();
      bar = ensureBar();

      bar.innerHTML =
        '<button class="gv-tool gv-snap" type="button">snap</button>' +
        '<button class="gv-tool gv-lock" type="button">lock</button>' +
        '<div class="gv-resize" title="Drag right edge to resize"></div>' +
        cardHtml("health", "♥", "Health", d.healthPct) +
        cardHtml("fatigue", "⚡", "Fatigue", d.fatiguePct) +
        cardHtml("mana", "✦", "Mana", d.manaPct) +
        cardHtml("food", "🍖", "Food", d.foodPct) +
        cardHtml("drink", "💧", "Drink", d.drinkPct);

      lockButton = bar.querySelector(".gv-lock");
      snapButton = bar.querySelector(".gv-snap");

      if (lockButton) {
        lockButton.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          savePosition();
        });
      }

      if (snapButton) {
        snapButton.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          snapPosition(false);
        });
      }
    }

    function startTimer() {
      var s = state();

      if (s.timer) {
        clearInterval(s.timer);
      }

      s.timer = setInterval(function () {
        var current = state();
        if (current.enabled !== false && !current.drag.active && !current.drag.resize) {
          render();
        }
      }, 1000);
    }

    function install() {
      var s = state();
      s.enabled = true;

      window.GenesisVitals = window.GenesisVitals || {};
      window.GenesisVitals.onOutputLine = function (line) {
        parseOutputLine(line);
        render();
      };
      window.GenesisVitals.onGMCPVitals = function (payload) {
        applyVitalsPayload(payload);
        render();
      };
      window.GenesisVitals.render = render;
      window.GenesisVitals.applyVitalsPayload = applyVitalsPayload;

      subscribeGMCP();
      applyVitalsPayload(gmcpVitals());

      render();
      startTimer();

      out("Vitals installed. GMCP Char subscribed. Use gvitals unlock to drag/resize, then lock.", "#80ff80");
    }

    function unlock() {
      var ud = ensureUserdata();
      ud.locked = false;
      render();
      setLockedVisual(false);
      out("Vitals unlocked. Drag to move. Drag right edge to resize. Click lock when done.", "#ffcc66");
    }

    function lock() {
      savePosition();
    }

    function resetPosition() {
      var ud = ensureUserdata();
      var bar = document.getElementById("genesisVitalsBar");

      delete ud.left;
      delete ud.top;
      delete ud.width;
      ud.locked = true;

      if (bar) {
        bar.style.left = "";
        bar.style.top = "";
        bar.style.width = "";
      }

      render();
      snapPosition(true);
      out("Vitals position reset and snapped.", "#80ff80");
    }

    function removeVitals() {
      var s = state();

      s.enabled = false;

      if (s.timer) {
        clearInterval(s.timer);
        s.timer = null;
      }

      removeOldAttempts();
      showNativeVitals();

      out("GVitals removed. Native vitals restored.", "#ffcc66");
    }

    function status() {
      var ud = ensureUserdata();
      var s = state();

      out("Version: " + VERSION);
      out("Native #statusbars found: " + !!document.getElementById("statusbars"));
      out("Custom #genesisVitalsBar found: " + !!document.getElementById("genesisVitalsBar"));
      out("Locked: " + (ud.locked !== false));
      out("Saved left/top/width: " + [ud.left, ud.top, ud.width].join(" / "));
      out("Current pct: H " + s.last.healthPct + " | F " + s.last.fatiguePct + " | M " + s.last.manaPct + " | Food " + s.last.foodPct + " | Drink " + s.last.drinkPct);
      out("Raw GMCP/text: food='" + s.raw.food + "' drink='" + s.raw.drink + "'");
    }

    function help() {
      out("Commands:");
      out("gvitals          install/restore saved position");
      out("gvitals unlock   drag/resize mode");
      out("gvitals lock     save current position");
      out("gvitals snap     snap to native statusbar area and save");
      out("gvitals reset    clear saved position and snap again");
      out("gvitals off      remove custom vitals");
      out("gvitals status   show status");
    }

    function dispatch() {
      var parts = getArgs();
      var cmd = lower(parts[0] || "");

      state();
      ensureUserdata();

      if (!cmd || cmd === "on" || cmd === "setup" || cmd === "install" || cmd === "refresh") {
        install();
        return;
      }

      if (cmd === "unlock" || cmd === "drag" || cmd === "resize") {
        install();
        unlock();
        return;
      }

      if (cmd === "lock" || cmd === "save") {
        lock();
        return;
      }

      if (cmd === "snap") {
        install();
        snapPosition(true);
        return;
      }

      if (cmd === "reset") {
        resetPosition();
        return;
      }

      if (cmd === "off" || cmd === "remove" || cmd === "disable") {
        removeVitals();
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
  } catch (ignore) {
    console.log("[GVitals ERROR]", e);
  }
}
