/*
Genesis Webclient Activity Tracker Event Trigger v2
Name: Event tracker
Type: regexp
Pattern:
^(You (?:killed|defeated) .+\.|You find .+[.!]|You (?:get|take|pick up|pick) .+ (?:copper|silver|gold|platinum) coins? from .+|You (?:get|take|pick up|pick) .*\b(?:unusual|peculiar|exotic)\b.* from .+|You are (?:just beginning on the path to|very far from|a long distance from|a fair distance from|just under halfway to|just over halfway to|getting closer to|fairly close to|very close to|on the verge of) .+ (?:novice|greenhorne|beginner|apprentice|wanderer|adventurer|adept|great adventurer|veteran|expert|rising hero|hero|titan|champion|legend|myth)\.)$

Trigger(s) Required:
Room Capture

Alias(s) Required:
gtrack
*/

try {
  (function () {
    function clean(text) {
      return String(text || "")
        .replace(/\x1b\[[0-9;]*m/g, "")
        .replace(/\s+/g, " ")
        .replace(/^\s+|\s+$/g, "");
    }

    function lower(text) {
      return clean(text).toLowerCase();
    }

    function getLine() {
      try {
        if (typeof args !== "undefined") {
          if (typeof args["*"] !== "undefined") return String(args["*"]);
          if (typeof args[1] !== "undefined") return String(args[1]);
          if (typeof args[0] !== "undefined") return String(args[0]);
        }
      } catch (e) {}
      return "";
    }

    function nowDate() {
      var d = new Date();
      return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
    }

    function defaultData() {
      return {
        currentDate: nowDate(),
        killsToday: 0,
        killsTotal: 0,
        roomsToday: 0,
        roomsTotal: 0,
        herbsToday: 0,
        herbsTotal: 0,
        coinsTotal: 0,
        copper: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
        imbuesSession: 0,
        imbuesTotal: 0,
        unusual: 0,
        peculiar: 0,
        exotic: 0,
        nextRank: "unknown",
        nextPercent: 0,
        lastKill: "",
        lastHerb: "",
        lastImbue: "",
        lastCoin: ""
      };
    }

    function ensureData() {
      gwc.userdata.gtrack = gwc.userdata.gtrack || defaultData();

      var d = gwc.userdata.gtrack;

      if (typeof d.killsToday === "undefined") d.killsToday = 0;
      if (typeof d.killsTotal === "undefined") d.killsTotal = 0;
      if (typeof d.roomsToday === "undefined") d.roomsToday = 0;
      if (typeof d.roomsTotal === "undefined") d.roomsTotal = 0;
      if (typeof d.herbsToday === "undefined") d.herbsToday = 0;
      if (typeof d.herbsTotal === "undefined") d.herbsTotal = 0;
      if (typeof d.coinsTotal === "undefined") d.coinsTotal = 0;
      if (typeof d.copper === "undefined") d.copper = 0;
      if (typeof d.silver === "undefined") d.silver = 0;
      if (typeof d.gold === "undefined") d.gold = 0;
      if (typeof d.platinum === "undefined") d.platinum = 0;
      if (typeof d.imbuesSession === "undefined") d.imbuesSession = 0;
      if (typeof d.imbuesTotal === "undefined") d.imbuesTotal = 0;
      if (typeof d.unusual === "undefined") d.unusual = 0;
      if (typeof d.peculiar === "undefined") d.peculiar = 0;
      if (typeof d.exotic === "undefined") d.exotic = 0;
      if (typeof d.nextRank === "undefined") d.nextRank = "unknown";
      if (typeof d.nextPercent === "undefined") d.nextPercent = 0;

      if (!d.currentDate) d.currentDate = nowDate();

      if (d.currentDate !== nowDate()) {
        d.currentDate = nowDate();
        d.killsToday = 0;
        d.roomsToday = 0;
        d.herbsToday = 0;
        d.imbuesSession = 0;
      }

      return d;
    }

    function textToNumber(text) {
      text = lower(text);

      if (!text) return 0;
      if (text === "a" || text === "an" || text === "one") return 1;
      if (text === "many") return 0;

      var direct = parseInt(text, 10);
      if (!isNaN(direct)) return direct;

      var ones = {
        zero: 0, one: 1, two: 2, three: 3, four: 4,
        five: 5, six: 6, seven: 7, eight: 8, nine: 9,
        ten: 10, eleven: 11, twelve: 12, thirteen: 13,
        fourteen: 14, fifteen: 15, sixteen: 16,
        seventeen: 17, eighteen: 18, nineteen: 19
      };

      var tens = {
        twenty: 20, thirty: 30, forty: 40, fifty: 50,
        sixty: 60, seventy: 70, eighty: 80, ninety: 90
      };

      var words = text.split(/\s+/);
      var total = 0;
      var i;

      for (i = 0; i < words.length; i++) {
        if (ones[words[i]] !== undefined) total += ones[words[i]];
        else if (tens[words[i]] !== undefined) total += tens[words[i]];
      }

      return total;
    }

    function renderIfAvailable() {
      try {
        if (window.GenesisActivityTracker && window.GenesisActivityTracker.render) {
          window.GenesisActivityTracker.render();
        }
      } catch (e) {}
    }

    var line = clean(getLine());
    var d = ensureData();
    var m;
    var amount;
    var type;
    var progressMap;

    if (!line) return;

    m = line.match(/^You (?:killed|defeated) (?:a |an |the )?(.+)\.$/i);
    if (m) {
      d.killsToday += 1;
      d.killsTotal += 1;
      d.lastKill = m[1];
      renderIfAvailable();
      return;
    }

    m = line.match(/^You find (?:a |an |some )?(.+?)[.!]$/i);
    if (m) {
      d.herbsToday += 1;
      d.herbsTotal += 1;
      d.lastHerb = m[1];
      renderIfAvailable();
      return;
    }

    m = line.match(/^You (?:get|take|pick up|pick) (.+?) (copper|silver|gold|platinum) coins? from .+$/i);
    if (m) {
      amount = textToNumber(m[1]);
      type = lower(m[2]);

      d.coinsTotal += amount;
      d[type] += amount;
      d.lastCoin = amount + " " + type;

      renderIfAvailable();
      return;
    }

    m = line.match(/^You (?:get|take|pick up|pick) .*\b(unusual|peculiar|exotic)\b.* from .+$/i);
    if (m) {
      type = lower(m[1]);

      d[type] += 1;
      d.imbuesTotal += 1;
      d.imbuesSession += 1;
      d.lastImbue = type;

      renderIfAvailable();
      return;
    }

    m = line.match(/^You are (just beginning on the path to|very far from|a long distance from|a fair distance from|just under halfway to|just over halfway to|getting closer to|fairly close to|very close to|on the verge of) .+ (novice|greenhorne|beginner|apprentice|wanderer|adventurer|adept|great adventurer|veteran|expert|rising hero|hero|titan|champion|legend|myth)\.$/i);
    if (m) {
      progressMap = {
        "just beginning on the path to": 5,
        "very far from": 10,
        "a long distance from": 20,
        "a fair distance from": 30,
        "just under halfway to": 45,
        "just over halfway to": 55,
        "getting closer to": 65,
        "fairly close to": 75,
        "very close to": 85,
        "on the verge of": 95
      };

      d.nextPercent = progressMap[lower(m[1])] || 0;
      d.nextRank = lower(m[2]);

      renderIfAvailable();
    }
  })();
} catch (e) {
  try {
    gwc.output.append("[GTrack Events ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
