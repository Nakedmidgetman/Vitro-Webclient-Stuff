/*
Name: Ghunt Look Line
Type: regexp
Pattern: ^(.+)\.$

Execute the following javascript:
*/

  var line = "";
  
  if (typeof args !== "undefined") {
    if (args["*"]) line = args["*"];
    else if (args[0]) line = args[0];
    else if (args[1]) line = args[1];
  }
  
  if (window.GenesisWebHunter && window.GenesisWebHunter.onOutputLine) {
    window.GenesisWebHunter.onOutputLine(line);
  }
