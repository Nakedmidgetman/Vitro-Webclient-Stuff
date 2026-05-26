/*
trigger name: Ghunt look line
Trigger type: regexp
Script type: Javascript

Pattern:^(.+)\.$

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
