/*
Updated/Improved by Vitro
Original Author: Faery


Alias
Pattern: package
Type: Javascript

Commands:
 - package create
 - package install
 - package help
 - package debug

Purpose:
 - package create: fetches real Genesis aliases.json/triggers.json, lets you select items, and downloads a package.
 - package install: installs aliases/triggers from a selected package JSON.
 - package debug: shows detected character/token/source information.

Required Trigger(s):
 - None

Required Alias(s):
 - None
*/

try {
  (function () {
    var VERSION = "Genesis Package Manager v4 STRICT";
    var MSG = "#B3EBF2";
    var OK = "#80ff80";
    var ERR = "#ff6666";
    var WARN = "#ffcc66";

    function out(msg, color) {
      try {
        gwc.output.append("[Package] " + String(msg), color || MSG);
      } catch (e) {
        try { console.log("[Package] " + msg); } catch (ignore) {}
      }
    }

    function clean(text) {
      return String(text || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    }

    function escapeHtml(text) {
      return $("<div>").text(String(text || "")).html();
    }

    function getArgText() {
      try {
        if (typeof args !== "undefined") {
          if (typeof args["*"] !== "undefined") {
            return clean(String(args["*"]).replace(/^package\s*/i, ""));
          }
          if (typeof args[1] !== "undefined") {
            return clean(args[1]);
          }
          if (typeof args[0] !== "undefined") {
            return clean(String(args[0]).replace(/^package\s*/i, ""));
          }
        }
      } catch (e) {}
      return "";
    }

    function getLoginName() {
      try {
        if (mud && mud.gmcp && mud.gmcp["char.login"] && mud.gmcp["char.login"].name) {
          return clean(mud.gmcp["char.login"].name);
        }
      } catch (e1) {}

      try {
        if (gwc && gwc.gmcp && gwc.gmcp.data && gwc.gmcp.data.char && gwc.gmcp.data.char.login && gwc.gmcp.data.char.login.name) {
          return clean(gwc.gmcp.data.char.login.name);
        }
      } catch (e2) {}

      try {
        if (gwc && gwc.gmcp && gwc.gmcp.data && gwc.gmcp.data.character && gwc.gmcp.data.character.login && gwc.gmcp.data.character.login.name) {
          return clean(gwc.gmcp.data.character.login.name);
        }
      } catch (e3) {}

      return "";
    }

    function getToken() {
      var token = "";

      /*
        This intentionally mirrors the older working package alias:
        mud.gmcp["core.token"][0] + ... + [7]
      */
      try {
        if (mud && mud.gmcp && mud.gmcp["core.token"]) {
          token =
            String(mud.gmcp["core.token"][0] || "") +
            String(mud.gmcp["core.token"][1] || "") +
            String(mud.gmcp["core.token"][2] || "") +
            String(mud.gmcp["core.token"][3] || "") +
            String(mud.gmcp["core.token"][4] || "") +
            String(mud.gmcp["core.token"][5] || "") +
            String(mud.gmcp["core.token"][6] || "") +
            String(mud.gmcp["core.token"][7] || "");
        }
      } catch (e1) {}

      if (!token) {
        try {
          if (gwc && gwc.gmcp && gwc.gmcp.data && gwc.gmcp.data.core && gwc.gmcp.data.core.token) {
            var raw = gwc.gmcp.data.core.token;
            if (Array.isArray(raw)) token = raw.slice(0, 8).join("");
            else token = String(raw).substring(0, 8);
          }
        } catch (e2) {}
      }

      return clean(token).substring(0, 8);
    }

    function timestamp() {
      var d = new Date();
      return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0") + "_" +
        String(d.getHours()).padStart(2, "0") +
        String(d.getMinutes()).padStart(2, "0") +
        String(d.getSeconds()).padStart(2, "0");
    }

    function getUrl(type) {
      var login = getLoginName();
      return "https://www.genesismud.org/player_file/" + encodeURIComponent(login) + "/" + type + ".json";
    }

    function fetchGenesisJson(type) {
      var login = getLoginName();
      var token = getToken();

      if (!login) {
        return Promise.reject(new Error("Could not detect character name from GMCP. Reconnect and try again."));
      }

      if (!token || token.length < 8) {
        return Promise.reject(new Error("Could not detect 8-character GMCP token. Reconnect and try again."));
      }

      return new Promise(function (resolve, reject) {
        $.ajax({
          type: "GET",
          url: getUrl(type),
          cache: false,
          beforeSend: function (request) {
            request.setRequestHeader("GMCP-Token", token);
          },
          success: function (data) {
            try {
              if (typeof data === "string") {
                data = JSON.parse(data);
              }
              if (!Array.isArray(data)) {
                reject(new Error(type + ".json did not return an array."));
                return;
              }
              resolve(data);
            } catch (e) {
              reject(new Error("Could not parse " + type + ".json: " + e.message));
            }
          },
          error: function (jqXHR, textStatus, errorThrown) {
            var status = jqXHR && jqXHR.status ? "HTTP " + jqXHR.status : "no HTTP status";
            reject(new Error("Could not fetch " + type + ".json (" + status + ", " + (textStatus || "error") + (errorThrown ? ", " + errorThrown : "") + ")."));
          }
        });
      });
    }

    function debug() {
      var login = getLoginName();
      var token = getToken();

      out(VERSION, MSG);
      out("Detected character: " + (login || "(none)"), login ? OK : ERR);
      out("Detected token length: " + token.length, token.length === 8 ? OK : ERR);

      if (login) {
        out("Aliases URL: " + getUrl("aliases"), MSG);
        out("Triggers URL: " + getUrl("triggers"), MSG);
      }

      out("If package create fails, type package debug and send me the output.", WARN);
    }

    function removePopup() {
      try { $("#genesis-package-popup").remove(); } catch (e) {}
    }

    function buttonHtml(id, label) {
      return "<button id='" + id + "' type='button' style='" +
        "padding:5px 10px;" +
        "background:rgba(255,255,255,0.10);" +
        "border:1px solid #888;" +
        "color:#ddd;" +
        "cursor:pointer;" +
        "font-family:monospace;" +
        "border-radius:4px;" +
      "'>" + escapeHtml(label) + "</button>";
    }

    function normalizeAlias(item) {
      item = item || {};
      item.enabled = item.enabled !== false;
      item.value = item.value || "";
      item.script = item.script || {};
      item.script.language = item.script.language || "javascript";
      item.script.data = item.script.data || "";
      item.script.user_function = item.script.user_function || {};
      return item;
    }

    function normalizeTrigger(item) {
      item = item || {};
      item.enabled = item.enabled !== false;
      item.name = item.name || "";
      item.type = item.type || "regexp";
      item.value = item.value || "";
      item.script = item.script || {};
      item.script.language = item.script.language || "javascript";
      item.script.data = item.script.data || "";
      item.script.user_function = item.script.user_function || {};
      return item;
    }

    function downloadPackage(packageData) {
      var filename = "Genesis_Selected_Package_" + timestamp() + ".json";
      var blob = new Blob([JSON.stringify(packageData, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(function () {
        try { URL.revokeObjectURL(url); } catch (e) {}
        try { document.body.removeChild(a); } catch (e2) {}
      }, 500);

      out("Downloaded: " + filename, OK);
      out("Aliases included: " + (packageData.aliases.length ? packageData.aliases.map(function (a) { return a.value; }).join(", ") : "None"), MSG);
      out("Triggers included: " + (packageData.triggers.length ? packageData.triggers.map(function (t) { return t.name; }).join(", ") : "None"), MSG);
    }

    function showCreatePopup(aliases, triggers) {
      removePopup();

      aliases = (aliases || []).map(normalizeAlias).filter(function (a) { return !!a.value; });
      triggers = (triggers || []).map(normalizeTrigger).filter(function (t) { return !!t.name; });

      aliases.sort(function (a, b) { return String(a.value).localeCompare(String(b.value)); });
      triggers.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });

      var popup = document.createElement("div");
      popup.id = "genesis-package-popup";
      popup.style.cssText = [
        "position:fixed",
        "top:8%",
        "left:50%",
        "transform:translateX(-50%)",
        "width:760px",
        "max-width:94vw",
        "height:72vh",
        "background:rgba(0,0,0,0.94)",
        "color:#ddd",
        "border:1px solid #777",
        "box-shadow:0 8px 30px rgba(0,0,0,0.5)",
        "z-index:90",
        "font-family:monospace",
        "display:flex",
        "flex-direction:column",
        "border-radius:6px",
        "overflow:hidden"
      ].join(";");

      var aliasRows = aliases.map(function (a, i) {
        return "<label class='pkg-row' data-search='" + escapeHtml(String(a.value).toLowerCase()) + "' style='display:block;padding:3px 0;'>" +
          "<input type='checkbox' class='pkg-alias' data-index='" + i + "'> " + escapeHtml(a.value) +
        "</label>";
      }).join("");

      var triggerRows = triggers.map(function (t, i) {
        return "<label class='pkg-row' data-search='" + escapeHtml(String(t.name).toLowerCase()) + "' style='display:block;padding:3px 0;'>" +
          "<input type='checkbox' class='pkg-trigger' data-index='" + i + "'> " + escapeHtml(t.name) +
        "</label>";
      }).join("");

      popup.innerHTML =
        "<div style='padding:10px;border-bottom:1px solid #555;display:flex;align-items:center;gap:8px;'>" +
          "<div style='font-weight:bold;flex:1;'>" + escapeHtml(VERSION) + " - Create Package</div>" +
          "<button id='pkg-close' type='button' style='background:#330000;color:#eee;border:1px solid #777;padding:3px 8px;cursor:pointer;'>X</button>" +
        "</div>" +
        "<div style='padding:8px;border-bottom:1px solid #333;color:" + OK + ";'>" +
          "Loaded real Genesis JSON: " + aliases.length + " aliases, " + triggers.length + " triggers. No placeholders will be exported." +
        "</div>" +
        "<div style='padding:8px;border-bottom:1px solid #333;display:flex;gap:8px;align-items:center;'>" +
          "<input id='pkg-search' type='text' placeholder='Search aliases/triggers...' style='flex:1;background:#111;color:#ddd;border:1px solid #555;padding:6px;font-family:monospace;'>" +
          buttonHtml("pkg-select-visible", "Select Visible") +
          buttonHtml("pkg-clear-visible", "Clear Visible") +
        "</div>" +
        "<div style='display:flex;flex:1;min-height:0;'>" +
          "<div style='width:50%;border-right:1px solid #333;display:flex;flex-direction:column;min-height:0;'>" +
            "<div style='padding:8px;border-bottom:1px solid #333;font-weight:bold;'>Aliases (" + aliases.length + ")</div>" +
            "<div style='padding:8px;overflow:auto;flex:1;'>" + (aliasRows || "<div style='color:#888;'>No aliases found.</div>") + "</div>" +
          "</div>" +
          "<div style='width:50%;display:flex;flex-direction:column;min-height:0;'>" +
            "<div style='padding:8px;border-bottom:1px solid #333;font-weight:bold;'>Triggers (" + triggers.length + ")</div>" +
            "<div style='padding:8px;overflow:auto;flex:1;'>" + (triggerRows || "<div style='color:#888;'>No triggers found.</div>") + "</div>" +
          "</div>" +
        "</div>" +
        "<div style='padding:10px;border-top:1px solid #555;display:flex;align-items:center;gap:8px;'>" +
          "<div id='pkg-status' style='flex:1;color:#aaa;'>Selected: 0 aliases, 0 triggers.</div>" +
          buttonHtml("pkg-download", "Download Selected Package") +
        "</div>";

      document.body.appendChild(popup);

      $("#pkg-close").on("click", removePopup);

      function updateStatus() {
        $("#pkg-status").text("Selected: " + $(".pkg-alias:checked").length + " aliases, " + $(".pkg-trigger:checked").length + " triggers.");
      }

      $("#pkg-search").on("input", function () {
        var q = clean($(this).val()).toLowerCase();
        $(".pkg-row").each(function () {
          var hay = String($(this).attr("data-search") || "");
          $(this).toggle(!q || hay.indexOf(q) !== -1);
        });
      });

      $(document).off("change.genesisPackage").on("change.genesisPackage", ".pkg-alias,.pkg-trigger", updateStatus);

      $("#pkg-select-visible").on("click", function () {
        $(".pkg-row:visible input[type='checkbox']").prop("checked", true);
        updateStatus();
      });

      $("#pkg-clear-visible").on("click", function () {
        $(".pkg-row:visible input[type='checkbox']").prop("checked", false);
        updateStatus();
      });

      $("#pkg-download").on("click", function () {
        var selectedAliases = [];
        var selectedTriggers = [];

        $(".pkg-alias:checked").each(function () {
          var idx = parseInt($(this).attr("data-index"), 10);
          if (!isNaN(idx) && aliases[idx]) selectedAliases.push(aliases[idx]);
        });

        $(".pkg-trigger:checked").each(function () {
          var idx = parseInt($(this).attr("data-index"), 10);
          if (!isNaN(idx) && triggers[idx]) selectedTriggers.push(triggers[idx]);
        });

        if (!selectedAliases.length && !selectedTriggers.length) {
          out("No aliases/triggers selected.", WARN);
          return;
        }

        downloadPackage({
          packageName: "Genesis Selected Package",
          createdBy: VERSION,
          createdAt: new Date().toISOString(),
          aliases: selectedAliases,
          triggers: selectedTriggers
        });
      });
    }

    function createPackage() {
      out("Fetching real Genesis aliases.json and triggers.json...", MSG);

      Promise.all([
        fetchGenesisJson("aliases"),
        fetchGenesisJson("triggers")
      ]).then(function (result) {
        out("Fetch successful. Opening package creator.", OK);
        showCreatePopup(result[0], result[1]);
      }).catch(function (e) {
        out(e.message, ERR);
        out("Package creation stopped. No placeholder package was created.", WARN);
        out("Run: package debug", WARN);
      });
    }

    function wait(ms) {
      return new Promise(function (resolve) {
        setTimeout(resolve, ms);
      });
    }

    function clickButtonByText(text) {
      var wanted = clean(text).toLowerCase();
      var found = false;

      $("button").each(function () {
        if (clean($(this).text()).toLowerCase() === wanted) {
          $(this).click();
          found = true;
          return false;
        }
      });

      return found;
    }

    function setInput(selector, value) {
      var el = $(selector).first();
      if (!el.length) return false;
      el.val(value);
      el.trigger("input");
      el.trigger("change");
      return true;
    }

    function setCode(text) {
      try {
        var cm = $(".CodeMirror")[0].CodeMirror;
        cm.setValue(String(text || ""));
        return true;
      } catch (e) {
        return false;
      }
    }

    function openSettingsTab(type) {
      try { $("#opensettings").click(); } catch (e) {}
      return wait(350).then(function () {
        try { $("#" + type).click(); } catch (e) {}
        return wait(250);
      });
    }

    function findEntry(type, name) {
      var found = false;

      $("#" + type + " .enabled, #" + type + " .disabled").each(function () {
        if (clean($(this).text()) === clean(name)) {
          $(this).click();
          found = true;
          return false;
        }
      });

      return found;
    }

    function setLanguage(language) {
      var lang = String(language || "javascript").toLowerCase();
      clickButtonByText(lang === "javascript" ? "Javascript" : "Commands");
    }

    function saveAndSetEnabled(enabled) {
      clickButtonByText("Save");

      return wait(300).then(function () {
        if (enabled === false) {
          clickButtonByText("Disable");
        }
      });
    }

    function installAlias(item) {
      item = normalizeAlias(item);
      if (!item.value) return Promise.resolve();

      return openSettingsTab("aliases")
        .then(function () {
          if (findEntry("aliases", item.value)) {
            clickButtonByText("Edit");
          } else {
            $("#aliases .addentry").click();
          }
          return wait(400);
        })
        .then(function () {
          setInput(".data input[type='text']", item.value);
          setLanguage(item.script.language);
          return wait(150);
        })
        .then(function () {
          if (!setCode(item.script.data)) {
            throw new Error("Could not write CodeMirror content for alias " + item.value);
          }
          return saveAndSetEnabled(item.enabled);
        })
        .then(function () {
          out("Installed alias: " + item.value, OK);
        });
    }

    function installTrigger(item) {
      item = normalizeTrigger(item);
      if (!item.name) return Promise.resolve();

      return openSettingsTab("triggers")
        .then(function () {
          if (findEntry("triggers", item.name)) {
            clickButtonByText("Edit");
          } else {
            $("#triggers .addentry").click();
          }
          return wait(400);
        })
        .then(function () {
          setInput(".data input.trigger-name", item.name);
          setInput(".data input.trigger-pattern", item.value || "");

          try { $("button[data-type='" + item.type + "']").click(); } catch (e) {}

          setLanguage(item.script.language);
          return wait(150);
        })
        .then(function () {
          if (!setCode(item.script.data)) {
            throw new Error("Could not write CodeMirror content for trigger " + item.name);
          }
          return saveAndSetEnabled(item.enabled);
        })
        .then(function () {
          out("Installed trigger: " + item.name, OK);
        });
    }

    function readPackage(file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();

        reader.onload = function (e) {
          try {
            var data = JSON.parse(e.target.result);
            data.aliases = Array.isArray(data.aliases) ? data.aliases : [];
            data.triggers = Array.isArray(data.triggers) ? data.triggers : [];
            resolve(data);
          } catch (err) {
            reject(err);
          }
        };

        reader.onerror = function () {
          reject(new Error("Could not read selected file."));
        };

        reader.readAsText(file);
      });
    }

    function installData(data) {
      var aliases = data.aliases || [];
      var triggers = data.triggers || [];
      var p = Promise.resolve();

      out("Package includes:", MSG);
      out("Aliases: " + (aliases.length ? aliases.map(function (a) { return a.value || "(unnamed alias)"; }).join(", ") : "None"), MSG);
      out("Triggers: " + (triggers.length ? triggers.map(function (t) { return t.name || "(unnamed trigger)"; }).join(", ") : "None"), MSG);

      aliases.forEach(function (a) {
        p = p.then(function () {
          return installAlias(a);
        });
      });

      triggers.forEach(function (t) {
        p = p.then(function () {
          return installTrigger(t);
        });
      });

      p.then(function () {
        try { $("#closesettings").click(); } catch (e) {}
        out("Install complete.", OK);
      }).catch(function (e) {
        out("Install stopped: " + e.message, ERR);
      });
    }

    function installPackage() {
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";

      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) return;

        out("Reading package: " + file.name, MSG);

        readPackage(file)
          .then(installData)
          .catch(function (e) {
            out("Could not read package: " + e.message, ERR);
          });
      });

      input.click();
    }

    function help() {
      out(VERSION, MSG);
      out("package create  - create a real package from Genesis aliases.json/triggers.json", MSG);
      out("package install  - install a selected package JSON", MSG);
      out("package debug    - show detected character/token/source URLs", MSG);
      out("package help     - show this help", MSG);
    }

    var command = getArgText().toLowerCase();

    if (!command || command === "help") {
      help();
      return;
    }

    if (command === "create") {
      createPackage();
      return;
    }

    if (command === "install" || command === "download") {
      installPackage();
      return;
    }

    if (command === "debug") {
      debug();
      return;
    }

    out("Unknown command: " + command, ERR);
    help();
  })();
} catch (e) {
  try {
    gwc.output.append("[Package ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
