(function seedDefenseTrainingLibrary() {
  "use strict";

  var STORAGE_KEY = "archmere_exercise_library";
  var SEED_VERSION_KEY = "wpl_defense_library_seed_v1";
  var seeded = [
    ["lib-def-rc-1", "Active defense focus: stop the first attack", "roll_call"],
    ["lib-def-rc-2", "Defense to offense mindset cue", "roll_call"],
    ["lib-def-rc-3", "Position, pressure, hands, hips, re-attack", "roll_call"],
    ["lib-def-wu-1", "Jogging", "warm_up"],
    ["lib-def-wu-2", "High knees", "warm_up"],
    ["lib-def-wu-3", "Butt kicks", "warm_up"],
    ["lib-def-wu-4", "Side shuffles", "warm_up"],
    ["lib-def-wu-5", "Carioca", "warm_up"],
    ["lib-def-wu-6", "Sprawls on whistle", "warm_up"],
    ["lib-def-wu-7", "Stance and motion", "warm_up"],
    ["lib-def-wu-8", "Level change", "warm_up"],
    ["lib-def-wu-9", "Down block", "warm_up"],
    ["lib-def-wu-10", "Circle out", "warm_up"],
    ["lib-def-wu-11", "Sprawl and recover", "warm_up"],
    ["lib-def-wu-12", "Sprawl, circle, face", "warm_up"],
    ["lib-def-wu-13", "Light hand fighting", "warm_up"],
    ["lib-def-wu-14", "Inside control pummeling", "warm_up"],
    ["lib-def-wu-15", "Push-pull reaction", "warm_up"],
    ["lib-def-wu-16", "Ankle touch reaction", "warm_up"],
    ["lib-def-wu-17", "Down block reaction", "warm_up"],
    ["lib-def-tc-1", "Heavy hands", "techniques"],
    ["lib-def-tc-2", "Hips back", "techniques"],
    ["lib-def-tc-3", "Head pressure", "techniques"],
    ["lib-def-tc-4", "Wrist control", "techniques"],
    ["lib-def-tc-5", "Far ankle control", "techniques"],
    ["lib-def-tc-6", "Circle to face", "techniques"],
    ["lib-def-tc-7", "Go-behind", "techniques"],
    ["lib-def-tc-8", "Re-attack", "techniques"],
    ["lib-def-tc-9", "Slow single leg defense", "techniques"],
    ["lib-def-tc-10", "Single leg stop to go-behind", "techniques"],
    ["lib-def-tc-11", "Single leg stop to front headlock", "techniques"],
    ["lib-def-tc-12", "Head and arm control", "techniques"],
    ["lib-def-tc-13", "Snap down", "techniques"],
    ["lib-def-tc-14", "Chest pressure", "techniques"],
    ["lib-def-tc-15", "Elbow control", "techniques"],
    ["lib-def-tc-16", "Spin behind", "techniques"],
    ["lib-def-tc-17", "Go-behind finish", "techniques"],
    ["lib-def-tc-18", "Sprawl to front headlock", "techniques"],
    ["lib-def-tc-19", "Front headlock to spin behind", "techniques"],
    ["lib-def-tc-20", "Front headlock pressure drill", "techniques"],
    ["lib-def-tc-21", "Front headlock live finish", "techniques"],
    ["lib-def-tc-22", "Hard whizzer", "techniques"],
    ["lib-def-tc-23", "Hip pressure", "techniques"],
    ["lib-def-tc-24", "Leg back", "techniques"],
    ["lib-def-tc-25", "Push the head down", "techniques"],
    ["lib-def-tc-26", "Square up", "techniques"],
    ["lib-def-tc-27", "Counter attack", "techniques"],
    ["lib-def-tc-28", "Whizzer from single leg", "techniques"],
    ["lib-def-tc-29", "Whizzer from high crotch", "techniques"],
    ["lib-def-tc-30", "Whizzer, hip pressure, square up", "techniques"],
    ["lib-def-tc-31", "Whizzer to counter position", "techniques"],
    ["lib-def-lw-1", "15-second shot defense", "live_wrestling"],
    ["lib-def-lw-2", "First attack stop", "live_wrestling"],
    ["lib-def-lw-3", "Defense to re-attack", "live_wrestling"],
    ["lib-def-lw-4", "Neutral defense live", "live_wrestling"],
    ["lib-def-lw-5", "Start from single leg", "live_wrestling"],
    ["lib-def-lw-6", "Start from high crotch", "live_wrestling"],
    ["lib-def-lw-7", "Recover from opponent on leg", "live_wrestling"],
    ["lib-def-lw-8", "Bad position live", "live_wrestling"],
    ["lib-def-lw-9", "Front headlock live", "live_wrestling"],
    ["lib-def-lw-10", "45-second score drill", "live_wrestling"],
    ["lib-def-lw-11", "Defender starts with front headlock", "live_wrestling"],
    ["lib-def-lw-12", "Attacker tries to recover", "live_wrestling"],
    ["lib-def-lw-13", "Winning by 1 with 20 seconds left", "live_wrestling"],
    ["lib-def-lw-14", "Protect the lead", "live_wrestling"],
    ["lib-def-lw-15", "Opponent needs a takedown", "live_wrestling"],
    ["lib-def-lw-16", "End-of-match defense", "live_wrestling"],
    ["lib-def-lw-17", "Hold center", "live_wrestling"],
    ["lib-def-lw-18", "Hands low", "live_wrestling"],
    ["lib-def-lw-19", "Avoid reaching", "live_wrestling"],
    ["lib-def-lw-20", "Hips back defense", "live_wrestling"],
    ["lib-def-st-1", "Sprawl jumps", "strength"],
    ["lib-def-st-2", "Bear crawl forward", "strength"],
    ["lib-def-st-3", "Bear crawl backward", "strength"],
    ["lib-def-st-4", "Partner push resistance", "strength"],
    ["lib-def-st-5", "Plank shoulder taps", "strength"],
    ["lib-def-st-6", "Shot defense reaction", "strength"],
    ["lib-def-st-7", "Hip pop reaction", "strength"],
    ["lib-def-st-8", "Core stabilization", "strength"],
    ["lib-def-st-9", "Short explosive sprawls", "strength"],
    ["lib-def-cd-1", "Light jog", "cool_down"],
    ["lib-def-cd-2", "Hip flexor stretch", "cool_down"],
    ["lib-def-cd-3", "Hamstring stretch", "cool_down"],
    ["lib-def-cd-4", "Shoulder mobility", "cool_down"],
    ["lib-def-cd-5", "Neck mobility", "cool_down"],
    ["lib-def-cd-6", "Deep breathing", "cool_down"],
    ["lib-def-cd-7", "Opponent shoots visualization", "cool_down"],
    ["lib-def-cd-8", "Hands stop the attack visualization", "cool_down"],
    ["lib-def-cd-9", "Circle and face visualization", "cool_down"],
    ["lib-def-cd-10", "Score after defending visualization", "cool_down"],
    ["lib-def-an-1", "Defense starts before the shot", "announcements"],
    ["lib-def-an-2", "Stance and motion are defense", "announcements"],
    ["lib-def-an-3", "Hands low and hips ready", "announcements"],
    ["lib-def-an-4", "No lazy reaching", "announcements"],
    ["lib-def-an-5", "Re-attack after every stop", "announcements"],
    ["lib-def-an-6", "Stop the attack. Win the position. Score next.", "announcements"]
  ].map(function(entry) {
    return { id: entry[0], name: entry[1], categoryId: entry[2] };
  });

  function readLibrary() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeLibrary(library) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
      localStorage.setItem(SEED_VERSION_KEY, "20260922-defense-library1");
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(library) }));
      window.dispatchEvent(new CustomEvent("wpl:defense-library-seeded", { detail: { count: seeded.length } }));
    } catch (_) {}
  }

  var existing = readLibrary();
  var seen = new Set(existing.map(function(item) { return String(item && item.id || "").trim(); }));
  var next = existing.slice();
  seeded.forEach(function(item) {
    if (!seen.has(item.id)) next.push(item);
  });
  writeLibrary(next);
}());
