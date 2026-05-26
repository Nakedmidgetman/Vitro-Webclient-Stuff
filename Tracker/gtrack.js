/*
Genesis Webclient Simple Tracker Tab v2
Alias value: gtrack
Required Trigger(s):
  -Room Capture
  -Event capture

Commands:
  gtrack
  gtrack refresh
  gtrack reset confirm
*/

try {
  (function () {
    function out(msg, color) {
      gwc.output.append("[GTrack] " + String(msg), color || "#88ccff");
    }

    function clean(text) {
      return String(text || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
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
            for (i = 1; i < 40; i++) {
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

      raw = String(raw || "").replace(/^gtrack\b/i, "").trim();
      return raw ? raw.split(/\s+/) : [];
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
        imbuesSession: 0,
        imbuesTotal: 0
      };
    }

    function data() {
      gwc.userdata.gtrack = gwc.userdata.gtrack || defaultData();
      return gwc.userdata.gtrack;
    }

    function installStyles() {
      var old = document.getElementById("genesis-simple-tracker-style");
      if (old) old.remove();

      var style = document.createElement("style");
      style.id = "genesis-simple-tracker-style";
      style.textContent =
        "#bottomsidebar #tracker.content {" +
        " box-sizing:border-box;" +
        " height:100%;" +
        " overflow-y:auto;" +
        " padding:8px 10px;" +
        " color:#eeeeee;" +
        " background:transparent;" +
        "}" +
        "#genesisTrackerInner {" +
        " font-family:monospace;" +
        " font-size:12px;" +
        " line-height:1.35;" +
        "}" +
        "#genesisTrackerInner .gt-title {" +
        " color:rgb(210,90,255);" +
        " font-weight:bold;" +
        " text-align:center;" +
        " margin:0 0 8px 0;" +
        " font-size:13px;" +
        "}" +
        "#genesisTrackerInner .gt-section {" +
        " border:1px solid rgba(210,90,255,0.65);" +
        " border-radius:8px;" +
        " margin:7px 0;" +
        " padding:7px 9px;" +
        " background:rgba(8,12,16,0.58);" +
        "}" +
        "#genesisTrackerInner .gt-heading {" +
        " color:rgb(210,90,255);" +
        " font-weight:bold;" +
        " margin-bottom:5px;" +
        "}" +
        "#genesisTrackerInner .gt-line {" +
        " color:#ffffff;" +
        " margin:2px 0;" +
        "}" +
        "#genesisTrackerInner .gt-good {" +
        " color:#80ff80;" +
        "}";

      document.head.appendChild(style);
    }

    function ensureTab() {
      var bottom = document.getElementById("bottomsidebar");
      var tabs;
      var tabLi;
      var tabLink;
      var content;

      installStyles();

      if (!bottom) {
        out("Could not find #bottomsidebar.", "#ff6666");
        return false;
      }

      tabs = bottom.querySelector("ul.idTabs");

      if (!tabs) {
        out("Could not find bottom tab bar: ul.idTabs", "#ff6666");
        return false;
      }

      content = document.getElementById("tracker");
      if (!content) {
        content = document.createElement("div");
        content.id = "tracker";
        content.className = "content";
        content.style.display = "none";
        bottom.appendChild(content);
      }

      tabLink = document.getElementById("genesisTrackerTabLink");

      if (!tabLink) {
        tabLi = document.createElement("li");
        tabLink = document.createElement("a");
        tabLink.id = "genesisTrackerTabLink";
        tabLink.href = "#tracker";
        tabLink.textContent = "tracker";
        tabLi.appendChild(tabLink);
        tabs.appendChild(tabLi);
      }

      if (!tabLink.dataset.gtrackBound) {
        tabLink.dataset.gtrackBound = "1";

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

      return true;
    }

    function selectTab() {
      var link = document.getElementById("genesisTrackerTabLink");
      if (link) {
        link.click();
      }
    }

    function render() {
      var d = data();
      var content;

      if (!ensureTab()) return;

      content = document.getElementById("tracker");
      if (!content) return;

      content.innerHTML =
        '<div id="genesisTrackerInner">' +
        '<div class="gt-title">Activity Tracker</div>' +

        '<div class="gt-section">' +
        '<div class="gt-heading">Combat</div>' +
        '<div class="gt-line">Kills today: <span class="gt-good">' + d.killsToday + '</span></div>' +
        '<div class="gt-line">Kills total: <span class="gt-good">' + d.killsTotal + '</span></div>' +
        '</div>' +

        '<div class="gt-section">' +
        '<div class="gt-heading">Activity</div>' +
        '<div class="gt-line">Rooms today: <span class="gt-good">' + d.roomsToday + '</span></div>' +
        '<div class="gt-line">Rooms total: <span class="gt-good">' + d.roomsTotal + '</span></div>' +
        '<div class="gt-line">Herbs today: <span class="gt-good">' + d.herbsToday + '</span></div>' +
        '<div class="gt-line">Herbs total: <span class="gt-good">' + d.herbsTotal + '</span></div>' +
        '</div>' +

        '<div class="gt-section">' +
        '<div class="gt-heading">Loot</div>' +
        '<div class="gt-line">Coins total: <span class="gt-good">' + d.coinsTotal + '</span></div>' +
        '<div class="gt-line">Imbues session: <span class="gt-good">' + d.imbuesSession + '</span></div>' +
        '<div class="gt-line">Imbues total: <span class="gt-good">' + d.imbuesTotal + '</span></div>' +
        '</div>' +

        '</div>';

      selectTab();
    }

    function reset() {
      gwc.userdata.gtrack = defaultData();
      out("Tracker reset.", "#80ff80");
      render();
    }

    function help() {
      out("gtrack refresh - create/update tracker tab", "#88ccff");
      out("gtrack reset confirm - reset tracker data", "#88ccff");
    }

    var parts = getArgs();
    var cmd = lower(parts[0] || "");
    var sub = lower(parts[1] || "");

    window.GenesisActivityTracker = window.GenesisActivityTracker || {};
    window.GenesisActivityTracker.render = render;

    if (!cmd || cmd === "help") {
      help();
      render();
      return;
    }

    if (cmd === "refresh" || cmd === "r") {
      render();
      return;
    }

    if (cmd === "reset") {
      if (sub === "confirm") {
        reset();
      } else {
        out("Type: gtrack reset confirm", "#ffcc66");
      }
      return;
    }

    out("Unknown command: " + cmd, "#ffcc66");
    help();
  })();
} catch (e) {
  try {
    gwc.output.append("[GTrack ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {
    console.log("[GTrack ERROR]", e);
  }
}
