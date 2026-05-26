/*
Name: Ghunt No Creature
Type: regexp
Pattern: ^You find no such living creature\.?$
Script type: Javascript
*/

if (window.GenesisWebHunter && window.GenesisWebHunter.onNoCreature) {
    window.GenesisWebHunter.onNoCreature();
  }
