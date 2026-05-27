/*
Alias
Pattern: ka
Type: Javascript

Trigger(s) Required:
 -Target Counter



Kill All
Alias: ka

Final setup:
  Alias:
    ka

  Required Trigger(s):
    Target Counter

You can delete/disable old aliases:
  target
  kaskill

Commands:
  ka help
  ka target <target>
  ka skill <skill>
  ka clear
  ka clear target
  ka clear skill
  ka
  ka <target>
  ka <target> <skill>

Examples:
  ka target bunny
  ka skill cdonk
  ka

  ka bunny
  ka bunny cdonk

Behavior:
  If skill is set:
    cdonk first bunny
    kill second bunny
    kill third bunny

  If no skill:
    kill first bunny
    kill second bunny
    kill third bunny
*/

try {
  (function () {
    function out(msg, color) {
      try {
        gwc.output.append(String(msg), color || "#88ccff");
      } catch (e) {
        try { console.log(String(msg)); } catch (e2) {}
      }
    }

    function kaout(msg, color) {
      out("[KA] " + String(msg), color || "#88ccff");
    }

    function clean(text) {
      return String(text || "").replace(/^\s+|\s+$/g, "");
    }

    function lower(text) {
      return clean(text).toLowerCase();
    }

    function send(cmd) {
      try {
        gwc.connection.send(cmd);
      } catch (e) {
        kaout("Send failed: " + cmd + " | " + e.name + ": " + e.message, "#ff6666");
      }
    }

    function pluralize(word) {
      word = lower(word);

      if (!word) return word;

      /*
        Special cases.
      */
      if (word === "drow") return "drow";

      /*
        elf -> elves
        dwarf -> dwarves
      */
      if (word.endsWith("f")) {
        return word.replace(/f$/g, "ves");
      }

      /*
        bunny -> bunnies
      */
      if (word.endsWith("y")) {
        return word.replace(/y$/g, "ies");
      }

      /*
        phrynos -> phrynoses style fallback from original script.
      */
      if (word.endsWith("s")) {
        return word + "es";
      }

      return word + "s";
    }

    function savedTarget() {
      return clean(
        (gwc.userdata.ka && gwc.userdata.ka.target) ||
        gwc.userdata.target ||
        gwc.userdata.enemy ||
        ""
      );
    }

    function savedSkill() {
      return clean(
        (gwc.userdata.ka && gwc.userdata.ka.skill) ||
        gwc.userdata.kaskill ||
        ""
      );
    }

    function showHelp() {
      var t = savedTarget();
      var s = savedSkill();

      out("------------------------------------------------------------", "#88ccff");
      out("KA / Kill-All Help", "#80ff80");
      out("------------------------------------------------------------", "#88ccff");
      out("Purpose:", "#ffcc66");
      out("  Counts a target in the room, then attacks first/second/third/etc.", "#cccccc");
      out("  Optional skill is used on the FIRST target only.", "#cccccc");
      out("", "#cccccc");
      out("Current saved target: " + (t || "(none)"), "#ffcc66");
      out("Current saved first-target skill: " + (s || "(none)"), "#ffcc66");
      out("", "#cccccc");
      out("Commands:", "#ffcc66");
      out("  ka help                  shows this help", "#cccccc");
      out("  ka target <target>        saves target only", "#cccccc");
      out("  ka skill <skill>          saves first-target skill only", "#cccccc");
      out("  ka                        counts/attacks saved target", "#cccccc");
      out("  ka <target>               counts/attacks target", "#cccccc");
      out("  ka <target> <skill>       counts/attacks target; skill on first target", "#cccccc");
      out("  ka clear                  clears saved target and skill", "#cccccc");
      out("  ka clear target           clears saved target", "#cccccc");
      out("  ka clear skill            clears saved skill", "#cccccc");
      out("", "#cccccc");
      out("Examples:", "#ffcc66");
      out("  ka target bunny", "#cccccc");
      out("  ka skill cdonk", "#cccccc");
      out("  ka", "#cccccc");
      out("    -> cdonk first bunny; kill second bunny; kill third bunny...", "#cccccc");
      out("", "#cccccc");
      out("  ka bunny cdonk", "#cccccc");
      out("    -> count bunnies; cdonk first bunny; kill second bunny...", "#cccccc");
      out("", "#cccccc");
      out("Notes:", "#ffcc66");
      out("  Requires trigger named exactly: Target Counter", "#cccccc");
      out("  You can delete old aliases: target and kaskill", "#cccccc");
      out("------------------------------------------------------------", "#88ccff");
    }

    var raw = clean(args["*"] || "");
    var words = raw ? raw.split(/\s+/) : [];
    var sub = lower(words[0] || "");

    gwc.userdata.ka = gwc.userdata.ka || {};

    if (sub === "help" || sub === "?") {
      showHelp();
      return;
    }

    if (sub === "target") {
      var newTarget = clean(words.slice(1).join(" "));

      if (!newTarget) {
        kaout("Current target: " + (savedTarget() || "(none)"), "#ffcc66");
        return;
      }

      gwc.userdata.ka.target = newTarget;

      /*
        Compatibility with old user data names.
      */
      gwc.userdata.target = newTarget;
      gwc.userdata.enemy = newTarget;

      kaout("Target saved: " + newTarget, "#80ff80");
      return;
    }

    if (sub === "skill" || sub === "kaskill") {
      var newSkill = clean(words.slice(1).join(" "));

      if (!newSkill) {
        kaout("Current first-target skill: " + (savedSkill() || "(none)"), "#ffcc66");
        return;
      }

      gwc.userdata.ka.skill = newSkill;

      /*
        Compatibility with old user data name.
      */
      gwc.userdata.kaskill = newSkill;

      kaout("First-target skill saved: " + newSkill, "#80ff80");
      return;
    }

    if (sub === "clear") {
      var clearWhat = lower(words[1] || "");

      if (!clearWhat || clearWhat === "all") {
        gwc.userdata.ka.target = "";
        gwc.userdata.ka.skill = "";
        gwc.userdata.target = "";
        gwc.userdata.enemy = "";
        gwc.userdata.kaskill = "";
        kaout("Saved target and skill cleared.", "#80ff80");
        return;
      }

      if (clearWhat === "target") {
        gwc.userdata.ka.target = "";
        gwc.userdata.target = "";
        gwc.userdata.enemy = "";
        kaout("Saved target cleared.", "#80ff80");
        return;
      }

      if (clearWhat === "skill" || clearWhat === "kaskill") {
        gwc.userdata.ka.skill = "";
        gwc.userdata.kaskill = "";
        kaout("Saved first-target skill cleared.", "#80ff80");
        return;
      }

      kaout("Unknown clear option. Use: ka clear | ka clear target | ka clear skill", "#ff6666");
      return;
    }

    /*
      Attack mode:
        ka
        ka bunny
        ka bunny cdonk

      For simplicity, first word is target and the rest is skill.
      If you want to save without attacking, use:
        ka target <target>
        ka skill <skill>
    */

    var target = "";
    var skill = "";

    if (words.length >= 1) {
      target = clean(words[0]);
      skill = clean(words.slice(1).join(" "));
    }

    if (!target) {
      target = savedTarget();
    }

    if (!skill) {
      skill = savedSkill();
    }

    if (!target) {
      kaout("No target set. Use: ka help, ka target bunny, or ka bunny", "#ffcc66");
      return;
    }

    gwc.userdata.ka.target = target;
    gwc.userdata.ka.skill = skill;

    /*
      Compatibility with older scripts/userdata names.
    */
    gwc.userdata.target = target;
    gwc.userdata.enemy = target;
    gwc.userdata.kaskill = skill;

    /*
      Runtime values used by the Target Counter trigger.
    */
    gwc.userdata.ka.pendingTarget = target;
    gwc.userdata.ka.pendingSkill = skill;

    try {
      gwc.trigger.enable("Target Counter");
    } catch (e) {
      kaout("Could not enable trigger named Target Counter. Make sure it exists and is named exactly: Target Counter", "#ff6666");
    }

    var plural = pluralize(target);

    kaout(
      "Counting " + plural + (skill ? " | first-target skill: " + skill : " | no first-target skill"),
      "#88ccff"
    );

    if (lower(target) === "drow") {
      send("count all drow");
    } else {
      send("count " + plural);
    }
  })();
} catch (e) {
  try {
    gwc.output.append("[KA ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
