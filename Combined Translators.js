/*
  Genesis Webclient Combined Translator
  Contains: 1 trigger

  Trigger type: regexp
  Trigger pattern: ^(.*)$

  Combines:
    - Alignment
    - Durability
    - Health
    - Imbuements
    - Krynn Months
    - Progress
    - Resistances
    - Wargems
    - Stat numbers from Exellinor's stat translator

  Skill-level translations are ENABLED.
  Note: this may translate skill-rank words such as master, expert, guru, etc.
  if they appear in normal speech or comms.
*/

(function () {
  var ENABLE_SKILL_LEVELS = true;

  var IMBUE_MAP = {
  "smell of musk": "[+str/ogrestone]",
  "smell of vanilla": "[+dis/steelstone]",
  "smell of alcohol": "[+con/dwarfstone]",
  "smell of lavender": "[+int/gnomestone]",
  "smell of sage": "[+wis/elfstone]",
  "smell of cinnamon": "[+dex/hobbitstone]",
  "opalesque tint": "[water spells/surfstone]",
  "grey tint": "[death spells/corpsestone]",
  "brown tint": "[earth spells/soilstone]",
  "blue tint": "[life spells/ankhstone]",
  "azure tint": "[air spells/guststone]",
  "rose tint": "[fire spells/emberstone]",
  "aura of a stallion": "[polearm/skewerstone]",
  "aura of a lion": "[sword/edgestone]",
  "aura of a spider": "[knife/needlestone]",
  "aura of a boar": "[club/crushstone]",
  "aura of a badger": "[axe/cleavestone]",
  "aura of a monkey": "[unarmed combat/palmstone]",
  "Beryl formations": "[fire-slay elf/charstone]",
  "Bone formations": "[fire-slay undead/lifestone]",
  "Diamond formations": "[fire-slay dragon/heavenstone]",
  "Granite formations": "[fire-slay ogre/doomstone]",
  "Ivory formations": "[fire-slay minotaur/hoofstone]",
  "Mithril formations": "[fire-slay dwarf/gallstone]",
  "Onyx formations": "[fire-slay goblin/darkstone]",
  "Peridot formations": "[fire-slay gnome/gearstone]",
  "Quartz formations": "[fire-slay halfling/piestone]",
  "Sapphire formations": "[fire-slay human/fellstone]",
  "Topaz formations": "[fire-slay troll/firestone]",
  "aura of light surrounds": "[+light/morningstone]",
  "aura of darkness surrounds": "[darkness/nightstone]",
  "aura of crimson energy": "[spellcraft/lodestone]",
  "aura of well-being": "[extra AC/wardstone]",
  "aura of viciousness": "[increased weapon-acc/guidestone]",
  "aura of malevolence": "[increased damage/stingstone]",
  "feeling of unease": "[resist life/mummystone]",
  "goosebumps being around": "[resist cold/woolstone]",
  "urge to sneeze": "[resist poison/sweatstone]",
  "dull feeling comes over you": "[resist magic/quietstone]",
  "tickle in your throat": "[resist water/duckstone]",
  "feeling of calm": "[resist fire/powderstone]",
  "ringing in your ears": "[resist air/tarpstone]",
  "itching sensation": "[resist acid/salvestone]",
  "hair-raising sensation grips you": "[resist electricity/rubberstone]",
  "feeling of nausea": "[resist death/larsstone]",
  "feeling of drowsiness": "[resist earth/riverstone]",
  "clusters of frost cling": "[cold damage/snapstone]",
  "disturbance in the air surrounding": "[air-bolts damage/blowstone]",
  "hissing sound": "[heat damage/bluestone]",
  "colour seems to be occuring": "[earth damage/sinkstone]",
  "acid sheen": "[acid damage/ruststone]",
  "green moisture": "[poison damage/aspstone]",
  "odor of decay": "[death damage/blackstone]",
  "white flames": "[elemental damage/orangestone]",
  "ripples of blue electricity": "[electricity damage/ampstone]",
  "feeling of security emanates": "[heals the user/balmstone]",
  "sparkle bewitches your senses": "[darkvision/torchstone]",
  "orange glow surrounds": "[awareness/eyestone]",
  "gleam of mithril": "[increased durability/ironstone]",
  "whine is coming": "[speed/mercurystone]",
  "drone issues from this": "[slow opponent/grogstone]",
  "clicking sound": "[blindfighting/molestone]",
  "purring sound": "[hide+sneak/rodentstone]",
  "silvery aura": "[two handed combat/twinstone]",
  "purple gleam": "[parry/deftstone]",
  "swirling bands of yellow energy": "[defence/shieldstone]",
  "twisting pattern": "[acrobat/leapstone]",
  "aura of arcana": "[enhancer/enigmastone]",
  "aura of a falcon": "[missile/arrowstone]"
};
  var WARGEM_MAP = {
  "ellipse-shaped azure diamond": "[+hit, +damage (W)]",
  "ellipse-shaped black tourmaline": "[death magic (W)]",
  "ellipse-shaped blue diamond": "[+damage (W)]",
  "ellipse-shaped blue tourmaline": "[water magic (W)]",
  "ellipse-shaped brown tourmaline": "[earth magic (W)]",
  "ellipse-shaped red tourmaline": "[fire magic (W)]",
  "ellipse-shaped violet tourmaline": "[life magic (W)]",
  "ellipse-shaped white diamond": "[increased hit (W)]",
  "ellipse-shaped yellow tourmaline": "[air magic (W)]",
  "glowing teardrop-shaped beryl": "[cold magic protection (A)]",
  "oval-shaped azure sapphire": "[2h combat (A)]",
  "oval-shaped black sapphire": "[hide (A)]",
  "oval-shaped blue sapphire": "[defence (A)]",
  "oval-shaped brown agate": "[abjuration (A)]",
  "oval-shaped green sapphire": "[parry (A)]",
  "oval-shaped magenta sapphire": "[remove traps skill (A)]",
  "oval-shaped mauve sapphire": "[open lock (A)]",
  "oval-shaped milky quartz": "[illusion (A)]",
  "oval-shaped moonstone": "[armours weight reduction (A)]",
  "oval-shaped purple amethyst": "[conjuration (A)]",
  "oval-shaped rose quartz": "[transmutation (A)]",
  "oval-shaped smoky quartz": "[divination (A)]",
  "oval-shaped striped chalcedony": "[enchantment (A)]",
  "oval-shaped violet sapphire": "[sneak (A)]",
  "oval-shaped amber aragonite": "[hunting (A)]",
  "teardrop-shaped bloodstone": "[death magic protection (A)]",
  "teardrop-shaped blue spinel": "[air magic protection (A)]",
  "teardrop-shaped blue topaz": "[water magic protection (A)]",
  "teardrop-shaped carnelian": "[fire magic protection (A)]",
  "teardrop-shaped pyrite": "[earth magic protection (A)]",
  "teardrop-shaped colourless beryl": "[cold magic protection (A)]",
  "teardrop-shaped diamond": "[Extra AC (A)]",
  "teardrop-shaped golden pyrite": "[earth magic protection  (A)]",
  "teardrop-shaped green jade": "[poison magic protection (A)]",
  "teardrop-shaped opal": "[life magic protection (A)]",
  "triangular-shaped blue agate": "[waterbreath on press (A)]",
  "triangular-shaped green peridot": "[see invisible on press (A)]",
  "triangular-shaped orange garnet": "[enhanced reflexes  (A)]",
  "triangular-shaped yellow amber": "[Darkvision (A)]",
  "triangular-shaped yellow topaz": "[Protection from scry on press (A)]"
};
  var PROGRESS_MAP = {
  "no measurable progress": "[0/18]",
  "insignificant progress": "[0/18]",
  "a tiny amount of progress": "[1/18]",
  "minimal progress": "[2/18]",
  "slight progress": "[3/18]",
  "low progress": "[4/18]",
  "a little progress": "[5/18]",
  "some progress": "[6/18]",
  "modest progress": "[7/18]",
  "decent progress": "[8/18]",
  "nice progress": "[9/18]",
  "good progress": "[10/18]",
  "very good progress": "[11/18]",
  "major progress": "[12/18]",
  "great progress": "[13/18]",
  "extremely good progress": "[14/18]",
  "awesome progress": "[15/18]",
  "immense progress": "[16/18]",
  "tremendous progress": "[17/18]",
  "fantastic progress": "[18/18]"
};
  var RESISTANCE_MAP = {
  "skin is covered with a glossy substance": "Acid",
  "flesh is radiating a strange heat": "Cold",
  "countenance exhudes a mystical sense of well-being": "Death",
  "skin is coated with a smooth springy substance": "Electricity",
  "flesh is covered with tiny ice crystals": "Fire",
  "eyes vibrate strangely": "Illusion",
  "body is cast in a dark pall of gloom": "Life",
  "skin has taken on an unusual texture": "Water",
  "veins pulse with unnatural verve": "Poison",
  "aura is of calm and stillness": "Air",
  "body is unnaturally stiff and rigid": "Earth"
};
  var MONTH_MAP = {
  "Aelmont": "(January)",
  "Rannmont": "(February)",
  "Mishamont": "(March)",
  "Chislmont": "(April)",
  "Bran": "(May)",
  "Corij": "(June)",
  "Argon": "(July)",
  "Sirrimont": "(August)",
  "Reorxmont": "(September)",
  "Hiddumont": "(October)",
  "rarmont": "(November)",
  "Phoenix": "(December)"
};
  var DURABILITY_MAP = {
  "It looks like it is in prime condition.": "[7/7]",
  "It looks like it is in a fine condition.": "[6/7]",
  "It looks like it is touched by battle.": "[5/7]",
  "It looks like it is scarred by battle.": "[4/7]",
  "It looks like it is very scarred by battle.": "[3/7]",
  "It looks like it is in big need of a smith.": "[2/7]",
  "It looks like it is going to break any second.": "[1/7]",
  "It looks like it is a little worn down.": "[4/5]",
  "It looks like it is in a very bad shape.": "[3/5]",
  "It looks like it is in urgent need of repair.": "[2/5]"
};
  var ALIGNMENT_MAP = {
  "neutral": "[-12/0/10]",
  "agreeable": "[1/10]",
  "trustworthy": "[2/10]",
  "sympathetic": "[3/10]",
  "nice": "[4/10]",
  "sweet": "[5/10]",
  "good": "[6/10]",
  "devout": "[7/10]",
  "blessed": "[8/10]",
  "saintly": "[9/10]",
  "holy": "[10/10]",
  "disagreeable": "[1/12]",
  "untrustworthy": "[2/12]",
  "unsympathetic": "[3/12]",
  "sinister": "[4/12]",
  "wicked": "[5/12]",
  "nasty": "[6/12]",
  "foul": "[7/12]",
  "evil": "[8/12]",
  "malevolent": "[9/12]",
  "beastly": "[10/12]",
  "demonic": "[11/12]",
  "damned": "[12/12]"
};
  var HEALTH_MAP = {
  "at death's door": "[1/15]",
  "barely alive": "[2/15]",
  "terribly hurt": "[3/15]",
  "in a very bad shape": "[4/15]",
  "in agony": "[5/15]",
  "in a bad shape": "[6/15]",
  "very hurt": "[7/15]",
  "suffering": "[8/15]",
  "hurt": "[9/15]",
  "aching": "[10/15]",
  "somewhat hurt": "[11/15]",
  "slightly hurt": "[12/15]",
  "sore": "[13/15]",
  "feeling well": "[14/15]",
  "feeling very well": "[15/15]"
};
  var HEALTH_COLOR_MAP = {
  "at death's door": "#DE3535",
  "barely alive": "#DE3535",
  "terribly hurt": "#DE3535",
  "in a very bad shape": "#DE3535",
  "in agony": "#FF8F1F",
  "in a bad shape": "#FF8F1F",
  "very hurt": "#FF8F1F",
  "suffering": "#FF8F1F",
  "hurt": "#FFF63D",
  "aching": "#FFF63D",
  "somewhat hurt": "#FFF63D",
  "slightly hurt": "#FFF63D",
  "sore": "#55C248",
  "feeling well": "#55C248",
  "feeling very well": "#55C248"
};
  var STAT_MAP = {
  "sickly": "(1/23)",
  "fragile": "(2/23)",
  "frail": "(3/23)",
  "skinny": "(4/23)",
  "lean": "(5/23)",
  "healthy": "(6/23)",
  "firm": "(7/23)",
  "hearty": "(8/23)",
  "hardy": "(9/23)",
  "hale": "(10/23)",
  "robust": "(11/23)",
  "staunch": "(12/23)",
  "tough": "(13/23)",
  "sturdy": "(14/23)",
  "vigorous": "(15/23)",
  "epic constitution": "(16/23)",
  "immortal constitution": "(17/23)",
  "supreme constitution": "(18/23)",
  "extraordinary constitution": "(19/23)",
  "incredible constitution": "(20/23)",
  "unbelievable constitution": "(21/23)",
  "miraculous constitution": "(22/23)",
  "impossible constitution": "(23/23)",
  "stiff": "(1/23)",
  "lumbering": "(2/23)",
  "clumsy": "(3/23)",
  "deft": "(4/23)",
  "flexible": "(5/23)",
  "nimble": "(6/23)",
  "lithe": "(7/23)",
  "supple": "(8/23)",
  "agile": "(9/23)",
  "swift": "(10/23)",
  "quick": "(11/23)",
  "graceful": "(12/23)",
  "athletic": "(13/23)",
  "gymnastic": "(14/23)",
  "acrobatic": "(15/23)",
  "epic dexterity": "(16/23)",
  "immortal dexterity": "(17/23)",
  "supreme dexterity": "(18/23)",
  "extraordinary dexterity": "(19/23)",
  "incredible dexterity": "(20/23)",
  "unbelievable dexterity": "(21/23)",
  "miraculous dexterity": "(22/23)",
  "impossible dexterity": "(23/23)",
  "gutless": "(1/23)",
  "frightened": "(2/23)",
  "spineless": "(3/23)",
  "fearful": "(4/23)",
  "cowardly": "(5/23)",
  "insecure": "(6/23)",
  "timid": "(7/23)",
  "sound": "(8/23)",
  "bold": "(9/23)",
  "brave": "(10/23)",
  "courageous": "(11/23)",
  "fearless": "(12/23)",
  "valiant": "(13/23)",
  "heroic": "(14/23)",
  "lionhearted": "(15/23)",
  "epic discipline": "(16/23)",
  "immortal discipline": "(17/23)",
  "supreme discipline": "(18/23)",
  "extraordinary discipline": "(19/23)",
  "incredible discipline": "(20/23)",
  "unbelievable discipline": "(21/23)",
  "miraculous discipline": "(22/23)",
  "impossible discipline": "(23/23)",
  "moronic": "(1/23)",
  "dimwitted": "(2/23)",
  "simple": "(3/23)",
  "dense": "(4/23)",
  "slow": "(5/23)",
  "limited": "(6/23)",
  "keen": "(7/23)",
  "clever": "(8/23)",
  "quick minded": "(9/23)",
  "intelligent": "(10/23)",
  "sharp": "(11/23)",
  "bright": "(12/23)",
  "inventive": "(13/23)",
  "ingenious": "(14/23)",
  "brilliant": "(15/23)",
  "epic intelligence": "(16/23)",
  "immortal intelligence": "(17/23)",
  "supreme intelligence": "(18/23)",
  "extraordinary intelligence": "(19/23)",
  "incredible intelligence": "(20/23)",
  "unbelievable intelligence": "(21/23)",
  "miraculous intelligence": "(22/23)",
  "impossible intelligence": "(23/23)",
  "puny": "(1/23)",
  "feeble": "(2/23)",
  "flimsy": "(3/23)",
  "weak": "(4/23)",
  "well built": "(5/23)",
  "muscular": "(6/23)",
  "hefty": "(7/23)",
  "strong": "(8/23)",
  "powerful": "(9/23)",
  "musclebound": "(10/23)",
  "ironlike": "(11/23)",
  "forceful": "(12/23)",
  "crushing": "(13/23)",
  "mighty": "(14/23)",
  "titanic": "(15/23)",
  "epic strength": "(16/23)",
  "immortal strength": "(17/23)",
  "supreme strength": "(18/23)",
  "extraordinary strength": "(19/23)",
  "incredible strength": "(20/23)",
  "unbelievable strength": "(21/23)",
  "miraculous strength": "(22/23)",
  "impossible strength": "(23/23)",
  "inane": "(1/23)",
  "stupid": "(2/23)",
  "idiotic": "(3/23)",
  "foolish": "(4/23)",
  "uneducated": "(5/23)",
  "literate": "(6/23)",
  "educated": "(7/23)",
  "learned": "(8/23)",
  "scholarly": "(9/23)",
  "cultivated": "(10/23)",
  "knowledgeable": "(11/23)",
  "erudite": "(12/23)",
  "wise": "(13/23)",
  "sage": "(14/23)",
  "enlightened": "(15/23)",
  "epic wisdom": "(16/23)",
  "immortal wisdom": "(17/23)",
  "supreme wisdom": "(18/23)",
  "extraordinary wisdom": "(19/23)",
  "incredible wisdom": "(20/23)",
  "unbelievable wisdom": "(21/23)",
  "miraculous wisdom": "(22/23)",
  "impossible wisdom": "(23/23)"
};

  var GOOD_ALIGNMENTS = ["agreeable","trustworthy","sympathetic","nice","sweet","good","devout","blessed","saintly","holy"];
  var EVIL_ALIGNMENTS = ["disagreeable","untrustworthy","unsympathetic","sinister","wicked","nasty","foul","evil","malevolent","beastly","demonic","damned"];
  var SKILL_MAIN_LEVELS = ["student", "amateur", "layman", "acolyte", "journeyman", "craftsman", "professional", "veteran", "master", "guru"];
  var SKILL_SUB_LEVELS = ["novice", "junior", "apprentice", "", "confident", "seasoned", "expert", "eminent", "brilliant", "superior"];

  function getLineText() {
    if (typeof args !== "undefined") {
      if (typeof args[1] !== "undefined") return String(args[1]);
      if (typeof args[0] !== "undefined") return String(args[0]);
      if (typeof args["*"] !== "undefined") return String(args["*"]);
    }
    return "";
  }

  function getLastHtml() {
    var el = $("#mudoutput .line").last();
    if (!el.length) return "";
    return el.html();
  }

  function setLastHtml(html) {
    var el = $("#mudoutput .line").last();
    if (el.length) el.html(html);
  }

  function escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function replaceOutsideTags(str, regex, replacer) {
    return String(str)
      .split(/(<[^>]+>)/g)
      .map(function (part) {
        if (part.charAt(0) === "<") return part;
        return part.replace(regex, replacer);
      })
      .join("");
  }

  function containsArray(arr, value) {
    var i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i] === value) return true;
    }
    return false;
  }

  function sortedKeysByLength(map) {
    var keys = [];
    var k;
    for (k in map) {
      if (map.hasOwnProperty(k)) keys.push(k);
    }
    keys.sort(function (a, b) { return b.length - a.length; });
    return keys;
  }

  function applyPhraseMap(html, map, color, labelPrefix, exactCase) {
    var keys = sortedKeysByLength(map);
    var i;
    var key;
    var regex;
    var label;
    var replacement;

    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      label = (labelPrefix || "") + map[key];

      if (html.indexOf(map[key]) !== -1) continue;

      regex = new RegExp(escapeRegex(key), exactCase ? "g" : "gi");
      replacement = "<span style='color:" + color + ";'>$& " + label + "</span>";
      html = replaceOutsideTags(html, regex, replacement);
    }

    return html;
  }

  function translateAlignment(line, html) {
    var m = line.match(/^You are (neutral|agreeable|trustworthy|sympathetic|nice|sweet|good|devout|blessed|saintly|holy|disagreeable|untrustworthy|unsympathetic|sinister|wicked|nasty|foul|evil|malevolent|beastly|demonic|damned)\.$/);
    var word;
    var color;
    var regex;

    if (!m) return html;

    word = m[1];
    color = "#878787";

    if (containsArray(GOOD_ALIGNMENTS, word)) color = "#78b9ff";
    if (containsArray(EVIL_ALIGNMENTS, word)) color = "#ff6363";

    regex = new RegExp("\\b" + escapeRegex(word) + "\\b", "g");
    return replaceOutsideTags(html, regex, "<span style='color:" + color + ";'>" + word + " " + ALIGNMENT_MAP[word] + "</span>");
  }

  function translateDurability(line, html) {
    if (!DURABILITY_MAP[line]) return html;
    if (html.indexOf(DURABILITY_MAP[line]) !== -1) return html;
    return "<span style='color:tan'>" + line + " " + DURABILITY_MAP[line] + "</span>";
  }

  function translateProgress(line, html) {
    var key;
    var keys = sortedKeysByLength(PROGRESS_MAP);
    var i;
    var regex;

    if (!/^You have made /.test(line)) return html;

    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      if (line.indexOf(key) !== -1) {
        if (html.indexOf(PROGRESS_MAP[key]) !== -1) return html;
        regex = new RegExp(escapeRegex(key), "g");
        return replaceOutsideTags(html, regex, "<span style='color:skyblue'>" + key + " " + PROGRESS_MAP[key] + "</span>");
      }
    }

    return html;
  }

  function translateResistance(line, html) {
    var m = line.match(/^(?:Your|His|Her|Its) (skin is covered with a glossy substance|flesh is radiating a strange heat|countenance exhudes a mystical sense of well-being|skin is coated with a smooth springy substance|flesh is covered with tiny ice crystals|eyes vibrate strangely|body is cast in a dark pall of gloom|skin has taken on an unusual texture|veins pulse with unnatural verve|aura is of calm and stillness|body is unnaturally stiff and rigid)\.$/);
    var phrase;
    var label;
    var regex;

    if (!m) return html;

    phrase = m[1];
    label = "[" + RESISTANCE_MAP[phrase] + " resistance]";
    if (html.indexOf(label) !== -1) return html;

    regex = new RegExp(escapeRegex(phrase), "g");
    return replaceOutsideTags(html, regex, phrase + " <span style='color:#9cfaff'>" + label + "</span>");
  }

  function translateHealth(html) {
    var keys = sortedKeysByLength(HEALTH_MAP);
    var i;
    var key;
    var regex;
    var color;
    var replacement;

    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      if (html.indexOf(HEALTH_MAP[key]) !== -1) continue;
      color = HEALTH_COLOR_MAP[key] || "#ffffff";
      regex = new RegExp(escapeRegex(key).replace(/'/g, "(?:'|&#39;)"), "gi");
      replacement = "<span style='color:" + color + ";'>$&</span> " + HEALTH_MAP[key];
      html = replaceOutsideTags(html, regex, replacement);
    }

    return html;
  }

  function translateMonths(html) {
    return applyPhraseMap(html, MONTH_MAP, "#919191", "", true);
  }

  function translateImbuements(html) {
    return applyPhraseMap(html, IMBUE_MAP, "skyblue", "", true);
  }

  function translateWargems(html) {
    return applyPhraseMap(html, WARGEM_MAP, "skyblue", "", true);
  }

  function translateStats(line, html) {
    var keys;
    var i;
    var key;
    var regex;

    if (line.indexOf("You are ") !== 0) return html;

    keys = sortedKeysByLength(STAT_MAP);

    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      if (html.indexOf(STAT_MAP[key]) !== -1) continue;
      regex = new RegExp("\\b" + escapeRegex(key) + "\\b", "g");
      html = replaceOutsideTags(html, regex, "<span style='font-weight:bold'>" + key + STAT_MAP[key] + "</span>");
    }

    return html;
  }

  function translateSkillLevels(html) {
    var skillRegex = new RegExp("\\b(novice|junior|apprentice|confident|seasoned|expert|eminent|brilliant|superior)?\\s*(student|amateur|layman|acolyte|journeyman|craftsman|professional|veteran|master|guru)\\b", "g");

    return replaceOutsideTags(html, skillRegex, function (match, sub, main) {
      var mainIndex;
      var subIndex;
      var i;

      if (/\[\d+\]/.test(match)) return match;

      mainIndex = -1;
      subIndex = -1;

      for (i = 0; i < SKILL_MAIN_LEVELS.length; i++) {
        if (SKILL_MAIN_LEVELS[i] === main) mainIndex = i;
      }

      sub = sub || "";
      for (i = 0; i < SKILL_SUB_LEVELS.length; i++) {
        if (SKILL_SUB_LEVELS[i] === sub) subIndex = i;
      }

      if (mainIndex === -1 || subIndex === -1) return match;

      return match + " [" + (mainIndex * 10 + subIndex + 1) + "]";
    });
  }

  function main() {
    var line = getLineText();
    var html = getLastHtml();

    if (!html) return;

    html = translateDurability(line, html);
    html = translateAlignment(line, html);
    html = translateProgress(line, html);
    html = translateResistance(line, html);
    html = translateHealth(html);
    html = translateStats(line, html);
    html = translateMonths(html);
    html = translateImbuements(html);
    html = translateWargems(html);

    if (ENABLE_SKILL_LEVELS) {
      html = translateSkillLevels(html);
    }

    setLastHtml(html);
  }

  main();
})();
