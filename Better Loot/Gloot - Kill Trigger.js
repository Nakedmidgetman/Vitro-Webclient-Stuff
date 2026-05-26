/*

Trigger Name Gloot Kill Trigger
Trigger type: regexp

Trigger Pattern: ^You killed .+\.$
script type: Javascript

*\

if (window.GenesisWebHunter && window.GenesisWebHunter.onKill) {
  window.GenesisWebHunter.onKill();
}

