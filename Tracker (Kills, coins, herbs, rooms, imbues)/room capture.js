/*
Genesis Webclient Room tracker Trigger v3
Name: Room Tracker
Type: gmcp
Trigger Pattern: room.info

Required Alias(s):
gtrack

Tracks room movement through GMCP room.info updates.
*/

try {
  (function () {
    function out(msg, color) {
      try {
        gwc.output.append("[GTrack] " + String(msg), color || "#88ccff");
      } catch (e) {}
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
        lastCoin: "",
        lastRoom: ""
      };
    }

    function ensureData() {
      gwc.userdata.gtrack = gwc.userdata.gtrack || defaultData();

      var d = gwc.userdata.gtrack;

      if (typeof d.roomsToday === "undefined") d.roomsToday = 0;
      if (typeof d.roomsTotal === "undefined") d.roomsTotal = 0;
      if (typeof d.lastRoom === "undefined") d.lastRoom = "";

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

    function getRoomName() {
      try {
        if (
          gwc.gmcp &&
          gwc.gmcp.data &&
          gwc.gmcp.data.room &&
          gwc.gmcp.data.room.info
        ) {
          return (
            gwc.gmcp.data.room.info.name ||
            gwc.gmcp.data.room.info.title ||
            gwc.gmcp.data.room.info.id ||
            ""
          );
        }
      } catch (e) {}

      return "";
    }

    var d = ensureData();
    var roomName = getRoomName();

    /*
      Prevent double-counting if the exact same room.info packet fires twice.
      If Genesis sends no room name/id, it still counts the movement.
    */
    if (roomName && d.lastRoom === roomName) {
      return;
    }

    d.roomsToday += 1;
    d.roomsTotal += 1;

    if (roomName) {
      d.lastRoom = roomName;
    }

    try {
      if (window.GenesisActivityTracker && window.GenesisActivityTracker.render) {
        window.GenesisActivityTracker.render();
      }
    } catch (e2) {}

  })();
} catch (e) {
  try {
    gwc.output.append("[GTrack Room Move ERROR] " + e.name + ": " + e.message, "#ff6666");
  } catch (ignore) {}
}
