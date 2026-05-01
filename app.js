import { GEN3_DATA } from "./gen3-data.js";

const NATURES = [
  "Hardy",
  "Lonely",
  "Brave",
  "Adamant",
  "Naughty",
  "Bold",
  "Docile",
  "Relaxed",
  "Impish",
  "Lax",
  "Timid",
  "Hasty",
  "Serious",
  "Jolly",
  "Naive",
  "Modest",
  "Mild",
  "Quiet",
  "Bashful",
  "Rash",
  "Calm",
  "Gentle",
  "Sassy",
  "Careful",
  "Quirky",
];

const DEFAULT_CONFIG = {
  backendUrl: "https://ai-pokemon-model-backend-bfg2abbtambqb0h0.westus3-01.azurewebsites.net",
  apiKey: "key",
};

const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"];
const STAT_LABELS = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

const GEN3_SPECIES_BY_ID = Object.fromEntries(GEN3_DATA.species.map((species) => [species.id, species]));

const DEMO_SETS = [
  {
    species: "Tyranitar",
    item: "Leftovers",
    ability: "Sand Stream",
    nature: "Adamant",
    evs: "252 Atk / 4 Def / 252 Spe",
    moves: ["Rock Slide", "Earthquake", "Dragon Dance", "Hidden Power Flying"],
  },
  {
    species: "Skarmory",
    item: "Leftovers",
    ability: "Keen Eye",
    nature: "Impish",
    evs: "252 HP / 64 Atk / 176 Def / 16 Spe",
    moves: ["Spikes", "Drill Peck", "Toxic", "Roar"],
  },
  {
    species: "Swampert",
    item: "Leftovers",
    ability: "Torrent",
    nature: "Relaxed",
    evs: "240 HP / 216 Def / 52 SpA",
    moves: ["Earthquake", "Surf", "Ice Beam", "Protect"],
  },
  {
    species: "Blissey",
    item: "Leftovers",
    ability: "Natural Cure",
    nature: "Calm",
    evs: "252 Def / 252 SpD / 4 Spe",
    moves: ["Seismic Toss", "Soft-Boiled", "Thunder Wave", "Aromatherapy"],
  },
  {
    species: "Gengar",
    item: "Leftovers",
    ability: "Levitate",
    nature: "Timid",
    evs: "80 HP / 176 SpA / 252 Spe",
    moves: ["Thunderbolt", "Ice Punch", "Will-O-Wisp", "Explosion"],
  },
  {
    species: "Metagross",
    item: "Choice Band",
    ability: "Clear Body",
    nature: "Adamant",
    evs: "252 HP / 252 Atk / 4 Spe",
    moves: ["Meteor Mash", "Earthquake", "Explosion", "Rock Slide"],
  },
  {
    species: "Salamence",
    item: "Leftovers",
    ability: "Intimidate",
    nature: "Naive",
    evs: "116 Atk / 216 SpA / 176 Spe",
    moves: ["Dragon Claw", "Fire Blast", "Brick Break", "Hidden Power Grass"],
  },
  {
    species: "Zapdos",
    item: "Leftovers",
    ability: "Pressure",
    nature: "Timid",
    evs: "252 HP / 40 SpA / 216 Spe",
    moves: ["Thunderbolt", "Hidden Power Grass", "Thunder Wave", "Baton Pass"],
  },
  {
    species: "Dugtrio",
    item: "Choice Band",
    ability: "Arena Trap",
    nature: "Jolly",
    evs: "252 Atk / 4 SpD / 252 Spe",
    moves: ["Earthquake", "Rock Slide", "Hidden Power Bug", "Aerial Ace"],
  },
  {
    species: "Starmie",
    item: "Leftovers",
    ability: "Natural Cure",
    nature: "Timid",
    evs: "136 HP / 156 SpA / 216 Spe",
    moves: ["Surf", "Thunderbolt", "Rapid Spin", "Recover"],
  },
  {
    species: "Celebi",
    item: "Leftovers",
    ability: "Natural Cure",
    nature: "Bold",
    evs: "252 HP / 220 Def / 36 Spe",
    moves: ["Psychic", "Leech Seed", "Recover", "Baton Pass"],
  },
  {
    species: "Jirachi",
    item: "Leftovers",
    ability: "Serene Grace",
    nature: "Careful",
    evs: "252 HP / 40 Def / 216 SpD",
    moves: ["Wish", "Protect", "Body Slam", "Fire Punch"],
  },
];

const state = {
  mode: "complete",
  selectedSlot: 0,
  slots: Array.from({ length: 6 }, () => emptySlot()),
  candidates: [],
};

const els = {
  modeButtons: document.querySelectorAll("[data-mode]"),
  runButton: document.querySelector("#runButton"),
  backendUrl: document.querySelector("#backendUrl"),
  apiKey: document.querySelector("#apiKey"),
  numCandidates: document.querySelector("#numCandidates"),
  numSamples: document.querySelector("#numSamples"),
  connectionState: document.querySelector("#connectionState"),
  showdownText: document.querySelector("#showdownText"),
  importButton: document.querySelector("#importButton"),
  exportButton: document.querySelector("#exportButton"),
  sampleButton: document.querySelector("#sampleButton"),
  clearButton: document.querySelector("#clearButton"),
  teambar: document.querySelector("#teambar"),
  teamChart: document.querySelector("#teamChart"),
  modeTitle: document.querySelector("#modeTitle"),
  modeSubtitle: document.querySelector("#modeSubtitle"),
  candidateList: document.querySelector("#candidateList"),
  resultCount: document.querySelector("#resultCount"),
  messageCard: document.querySelector("#messageCard"),
};

function emptySlot() {
  return {
    nickname: "",
    species: "",
    item: "",
    ability: "",
    nature: "Hardy",
    evs: "",
    moves: ["", "", "", ""],
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalize(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleCase(value) {
  return value
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function slotIsFilled(slot) {
  return Boolean(
    (slot.species || "").trim() ||
      (slot.nickname || "").trim() ||
      (slot.item || "").trim() ||
      (slot.ability || "").trim() ||
      (slot.evs || "").trim() ||
      (slot.moves || []).some((move) => move.trim()),
  );
}

function speciesKey(species) {
  return normalize(species);
}

function getSpeciesData(species) {
  return GEN3_SPECIES_BY_ID[speciesKey(species)];
}

function spriteUrl(species) {
  const key = getSpeciesData(species)?.id || speciesKey(species);
  return key ? `https://play.pokemonshowdown.com/sprites/home-centered/${key}.png` : "";
}

function iconPosition(species) {
  const num = getSpeciesData(species)?.num || 0;
  const x = -40 * (num % 12);
  const y = -30 * Math.floor(num / 12);
  return `${x}px ${y}px`;
}

function parseEvs(evs) {
  const out = { HP: "", Atk: "", Def: "", SpA: "", SpD: "", Spe: "" };
  evs.split("/").forEach((chunk) => {
    const match = chunk.trim().match(/^(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)$/i);
    if (match) {
      const stat = Object.keys(out).find((key) => key.toLowerCase() === match[2].toLowerCase());
      if (stat) out[stat] = match[1];
    }
  });
  return out;
}

function natureMarks(nature) {
  const marks = {
    Adamant: ["Atk", "SpA"],
    Modest: ["SpA", "Atk"],
    Timid: ["Spe", "Atk"],
    Jolly: ["Spe", "SpA"],
    Bold: ["Def", "Atk"],
    Impish: ["Def", "SpA"],
    Calm: ["SpD", "Atk"],
    Careful: ["SpD", "SpA"],
    Relaxed: ["Def", "Spe"],
    Sassy: ["SpD", "Spe"],
    Brave: ["Atk", "Spe"],
    Naive: ["Spe", "SpD"],
  };
  return marks[nature] || [];
}

function calculateStat(stat, base, ev, nature) {
  const iv = 31;
  const level = 100;
  const evBonus = Math.floor(clampNumber(ev || 0, 0, 252, 0) / 4);

  if (stat === "hp") {
    if (base === 1) return 1;
    return Math.floor(((2 * base + iv + evBonus) * level) / 100) + level + 10;
  }

  const raw = Math.floor(((2 * base + iv + evBonus) * level) / 100) + 5;
  const [boost, drop] = natureMarks(nature);
  const label = STAT_LABELS[stat];
  const multiplier = label === boost ? 1.1 : label === drop ? 0.9 : 1;
  return Math.floor(raw * multiplier);
}

function statRows(slot) {
  const species = getSpeciesData(slot.species);
  if (!species) {
    return `<span class="statrow statnote">Choose a Gen 3 Pokemon</span>`;
  }

  const evs = parseEvs(slot.evs);
  const [boost, drop] = natureMarks(slot.nature);
  return STAT_KEYS.map((stat) => {
    const label = STAT_LABELS[stat];
    const base = species.baseStats[stat];
    const ev = evs[label];
    const value = calculateStat(stat, base, Number(ev || 0), slot.nature);
    const width = 10 + (base / 255) * 86;
    const hue = Math.min(120, 28 + base * 0.58);
    const mark = label === boost ? "+" : label === drop ? "-" : "";
    return `<span class="statrow">
        <label>${label}</label>
        <span class="statgraph"><span style="width:${width}px;background:hsl(${hue},40%,75%);"></span></span>
        <em>${base}</em>
        <strong>${escapeHtml(ev)}</strong>
        <b>${value}</b>
        <small>${mark}</small>
      </span>`;
    })
    .join("");
}

function typeIcons(species) {
  const types = getSpeciesData(species)?.types || [];
  return types
    .map((type) => `<span class="typeicon type-${type.toLowerCase()}">${escapeHtml(type)}</span>`)
    .join("");
}

function slotToShowdown(slot) {
  if (!slotIsFilled(slot)) return "";

  const lines = [];
  const species = (slot.species || "").trim() || "Unknown";
  const nickname = (slot.nickname || "").trim();
  const displayName = nickname && normalize(nickname) !== normalize(species) ? `${nickname} (${species})` : species;
  const item = (slot.item || "").trim();
  lines.push(item ? `${displayName} @ ${item}` : displayName);

  if ((slot.ability || "").trim()) lines.push(`Ability: ${slot.ability.trim()}`);
  if ((slot.evs || "").trim()) lines.push(`EVs: ${slot.evs.trim()}`);
  if (slot.nature && slot.nature !== "Hardy") lines.push(`${slot.nature} Nature`);
  (slot.moves || [])
    .map((move) => move.trim())
    .filter(Boolean)
    .forEach((move) => lines.push(`- ${move}`));

  return lines.join("\n");
}

function slotsToShowdown(slots) {
  return slots.map(slotToShowdown).filter(Boolean).join("\n\n");
}

function parseShowdown(text) {
  const chunks = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.slice(0, 6).map((chunk) => {
    const slot = emptySlot();
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    const first = lines.shift() || "";
    const [namePart, itemPart] = first.split(/\s+@\s+/);
    const parsedName = cleanSpeciesName(namePart || "");
    slot.species = parsedName.species;
    slot.nickname = parsedName.nickname;
    slot.item = itemPart || "";

    lines.forEach((line) => {
      if (line.startsWith("Ability:")) {
        slot.ability = line.replace("Ability:", "").trim();
      } else if (line.startsWith("EVs:")) {
        slot.evs = line.replace("EVs:", "").trim();
      } else if (/Nature$/i.test(line)) {
        const nature = line.replace(/Nature$/i, "").trim();
        slot.nature = NATURES.find((known) => normalize(known) === normalize(nature)) || titleCase(nature);
      } else if (line.startsWith("-")) {
        const index = slot.moves.findIndex((move) => !move);
        if (index >= 0) slot.moves[index] = line.replace(/^-+\s*/, "").trim();
      }
    });

    return slot;
  });
}

function cleanSpeciesName(value) {
  let next = value.trim().replace(/\s+\((M|F)\)$/i, "");
  const nicknameMatch = next.match(/^(.+?)\s+\(([^)]+)\)$/);
  if (nicknameMatch) {
    return { nickname: nicknameMatch[1].trim(), species: nicknameMatch[2].trim() };
  }
  return { nickname: "", species: next };
}

function setStatus(kind, text) {
  els.connectionState.className = `status-chip ${kind}`;
  els.connectionState.textContent = text;
}

function refreshConnectionStatus() {
  const live = Boolean(els.backendUrl.value.trim() && els.apiKey.value.trim());
  setStatus(live ? "live" : "demo", live ? "Live" : "Demo");
}

function initConfig() {
  const config = window.APP_CONFIG || {};
  els.backendUrl.value =
    localStorage.getItem("pokemonBuilder.backendUrl") || config.backendUrl || DEFAULT_CONFIG.backendUrl;
  els.apiKey.value = localStorage.getItem("pokemonBuilder.apiKey") || config.apiKey || DEFAULT_CONFIG.apiKey;
  refreshConnectionStatus();
}

function setMessage(message, isError = false) {
  els.messageCard.textContent = message;
  els.messageCard.className = `result message-result${isError ? " error" : ""}`;
  els.messageCard.hidden = false;
}

function clearMessage() {
  els.messageCard.hidden = true;
}

function populateDatalist(id, values) {
  const datalist = document.querySelector(id);
  datalist.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    datalist.append(option);
  });
}

function initReferenceData() {
  populateDatalist("#speciesList", GEN3_DATA.species.map((species) => species.name));
  populateDatalist("#itemList", GEN3_DATA.items.map((item) => item.name));
  populateDatalist("#abilityList", GEN3_DATA.abilities.map((ability) => ability.name));
  populateDatalist("#moveList", GEN3_DATA.moves.map((move) => move.name));
}

function renderTeambar() {
  els.teambar.innerHTML = "";
  state.slots.forEach((slot, index) => {
    const filled = slotIsFilled(slot);
    const button = document.createElement("button");
    button.type = "button";
    button.name = "selectPokemon";
    button.value = String(index);
    button.className = `pokemon${state.selectedSlot === index ? " active" : ""}${filled ? "" : " masked"}`;
    const species = getSpeciesData(slot.species);
    button.innerHTML = `<span class="picon${species ? "" : " empty"}" style="background-position:${iconPosition(
      slot.species,
    )}"></span>${escapeHtml(
      slot.species || "Add Pokemon",
    )}`;
    button.addEventListener("click", () => {
      state.selectedSlot = index;
      renderAll();
    });
    els.teambar.append(button);
  });
}

function renderSelectedSet() {
  const slot = state.slots[state.selectedSlot];
  const sprite = spriteUrl(slot.species);
  const natureOptions = NATURES.map(
    (nature) => `<option value="${nature}"${nature === slot.nature ? " selected" : ""}>${nature}</option>`,
  ).join("");

  els.teamChart.innerHTML = `<li value="${state.selectedSlot + 1}">
    <div class="setmenu">
      <button name="copySet" type="button">Copy</button>
      <button name="importSet" type="button">Import/Export</button>
      <button name="moveSet" type="button">Move</button>
      <button name="deleteSet" type="button">Delete</button>
    </div>
    <div class="setchart-nickname">
      <label>Nickname</label>
      <input type="text" name="nickname" class="textbox chartinput" value="${escapeHtml(slot.nickname)}" placeholder="${escapeHtml(
        slot.species || "Nickname",
      )}" autocomplete="off">
    </div>
    <div class="setchart" style="${sprite ? `background-image:url(${sprite})` : ""}">
      <div class="setcol setcol-icon">
        <div class="setcell setcell-pokemon">
          <label>Pokemon</label>
          <input type="text" name="species" class="textbox chartinput" list="speciesList" value="${escapeHtml(
            slot.species,
          )}" autocomplete="off">
        </div>
      </div>
      <div class="setcol setcol-details">
        <div class="setrow">
          <div class="setcell setcell-details">
            <label>Details</label>
            <button class="textbox setdetails" tabindex="-1" name="details" type="button">
              <span class="detailcell detailcell-first"><label>Level</label>100</span>
              <span class="detailcell"><label>Gender</label>-</span>
              <span class="detailcell"><label>Shiny</label>No</span>
            </button>
          </div>
        </div>
        <div class="setrow-icons">
          <span class="itemicon"></span>
          <span class="setcell-typeicons">${typeIcons(slot.species)}</span>
        </div>
        <div class="setrow two">
          <div class="setcell setcell-item">
            <label>Item</label>
            <input type="text" name="item" class="textbox chartinput" list="itemList" value="${escapeHtml(
              slot.item,
            )}" autocomplete="off">
          </div>
          <div class="setcell setcell-ability">
            <label>Ability</label>
            <input type="text" name="ability" class="textbox chartinput" list="abilityList" value="${escapeHtml(
              slot.ability,
            )}" autocomplete="off">
          </div>
        </div>
        <div class="setrow two">
          <div class="setcell">
            <label>Nature</label>
            <select name="nature" class="textbox chartinput">${natureOptions}</select>
          </div>
          <div class="setcell">
            <label>EVs</label>
            <input type="text" name="evs" class="textbox chartinput" value="${escapeHtml(
              slot.evs,
            )}" placeholder="252 Atk / 4 Def / 252 Spe" autocomplete="off">
          </div>
        </div>
      </div>
      <div class="setcol setcol-moves">
        <div class="setcell">
          <label>Moves</label>
          <input type="text" name="move0" class="textbox chartinput" list="moveList" value="${escapeHtml(
            slot.moves[0] || "",
          )}" autocomplete="off">
        </div>
        ${[1, 2, 3]
          .map(
            (moveIndex) => `<div class="setcell">
              <input type="text" name="move${moveIndex}" class="textbox chartinput" list="moveList" value="${escapeHtml(
                slot.moves[moveIndex] || "",
              )}" autocomplete="off">
            </div>`,
          )
          .join("")}
      </div>
      <div class="setcol setcol-stats">
        <div class="setrow">
          <label>Stats</label>
          <button class="textbox setstats" name="stats" type="button">
            <span class="statrow statrow-head"><label></label><span></span><em>Base</em><strong>EV</strong><b>Stat</b><small></small></span>
            ${statRows(slot)}
          </button>
        </div>
      </div>
    </div>
  </li>`;

  els.teamChart.querySelectorAll(".chartinput").forEach((input) => {
    input.addEventListener("input", () => updateSlotFromInput(input));
  });
  els.teamChart.querySelector("[name='copySet']").addEventListener("click", () => copyText(slotToShowdown(slot)));
  els.teamChart.querySelector("[name='importSet']").addEventListener("click", () => els.showdownText.focus());
  els.teamChart.querySelector("[name='moveSet']").addEventListener("click", moveSelectedSlot);
  els.teamChart.querySelector("[name='deleteSet']").addEventListener("click", () => {
    state.slots[state.selectedSlot] = emptySlot();
    syncExportQuietly();
    renderAll();
  });
}

function updateSlotFromInput(input) {
  const slot = state.slots[state.selectedSlot];
  const name = input.name;
  if (name.startsWith("move")) {
    slot.moves[Number(name.replace("move", ""))] = input.value;
  } else {
    slot[name] = input.value;
  }
  syncExportQuietly();
  renderTeambar();
  if (["species", "nature", "evs"].includes(name)) renderSelectedSet();
}

function moveSelectedSlot() {
  const next = (state.selectedSlot + 1) % state.slots.length;
  [state.slots[state.selectedSlot], state.slots[next]] = [state.slots[next], state.slots[state.selectedSlot]];
  state.selectedSlot = next;
  syncExportQuietly();
  renderAll();
}

function renderMode() {
  els.modeButtons.forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  const isGenerate = state.mode === "generate";
  els.runButton.textContent = isGenerate ? "Generate Team" : "Complete Team";
  els.modeTitle.textContent = isGenerate ? "Team Generator" : "Mask Fill";
  els.modeSubtitle.textContent = isGenerate
    ? "The model starts from an empty shell."
    : "Empty team slots are treated as masked positions.";
  els.numSamples.value = isGenerate ? "256" : "64";
}

function renderCandidates(candidates) {
  const heading = els.candidateList.querySelector(".result-heading");
  els.candidateList.innerHTML = "";
  els.candidateList.append(heading);
  els.resultCount.textContent = `${candidates.length} candidate${candidates.length === 1 ? "" : "s"}`;

  if (!candidates.length) {
    els.candidateList.append(els.messageCard);
    setMessage("No candidates returned.");
    return;
  }

  clearMessage();
  candidates.forEach((candidate, index) => {
    const li = document.createElement("li");
    li.className = `result candidate-entry${index === 0 ? " cur" : ""}`;
    const score = Number.isFinite(candidate.rank_score) ? candidate.rank_score.toFixed(3) : "demo";
    li.innerHTML = `<div class="candidate-body">
      <div class="candidate-head">
        <h3>Candidate ${index + 1}</h3>
        <span class="result-actions">
          <button class="button" type="button" data-load="${index}">Load</button>
          <button class="button" type="button" data-copy="${index}">Copy</button>
        </span>
      </div>
      <div class="candidate-meta">Score ${score}${candidate.set_ids ? ` | Set IDs ${candidate.set_ids.join(", ")}` : ""}</div>
      <pre>${escapeHtml(candidate.showdown || JSON.stringify(candidate, null, 2))}</pre>
    </div>`;
    li.querySelector("[data-load]").addEventListener("click", () => loadCandidate(candidate));
    li.querySelector("[data-copy]").addEventListener("click", () => copyText(candidate.showdown || ""));
    els.candidateList.append(li);
  });
}

function renderAll() {
  renderTeambar();
  renderSelectedSet();
}

function loadCandidate(candidate) {
  const parsed = parseShowdown(candidate.showdown || "");
  state.slots = Array.from({ length: 6 }, (_, index) => parsed[index] || emptySlot());
  state.selectedSlot = 0;
  els.showdownText.value = slotsToShowdown(state.slots);
  renderAll();
}

async function copyText(text) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
}

function syncExportQuietly() {
  els.showdownText.value = slotsToShowdown(state.slots);
}

function importFromText() {
  const parsed = parseShowdown(els.showdownText.value);
  state.slots = Array.from({ length: 6 }, (_, index) => parsed[index] || emptySlot());
  state.selectedSlot = 0;
  renderAll();
}

function exportToText() {
  els.showdownText.value = slotsToShowdown(state.slots);
}

function buildPayload() {
  const base = {
    format: "gen3ou",
    num_candidates: clampNumber(els.numCandidates.value, 1, 20, 10),
    num_samples: clampNumber(els.numSamples.value, 1, 512, state.mode === "generate" ? 256 : 64),
  };

  if (state.mode === "complete") {
    const showdown = slotsToShowdown(state.slots);
    if (!showdown.trim()) throw new Error("Add at least one team slot before completing.");
    return { ...base, showdown };
  }

  return base;
}

function clampNumber(value, min, max, fallback) {
  const next = Number.parseInt(value, 10);
  if (Number.isNaN(next)) return fallback;
  return Math.min(max, Math.max(min, next));
}

async function callBackend(payload) {
  const backendUrl = els.backendUrl.value.trim().replace(/\/$/, "");
  const apiKey = els.apiKey.value.trim();
  if (!backendUrl || !apiKey) return demoResponse(payload);

  const endpoint = state.mode === "generate" ? "/api/generate-team" : "/api/complete-team";
  setStatus("live", "Live");

  const response = await fetch(`${backendUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.detail?.message || data?.error?.message || `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function demoResponse(payload) {
  setStatus("demo", "Demo");
  const locked = state.mode === "complete" ? state.slots.filter(slotIsFilled) : [];
  const lockedSpecies = new Set(locked.map((slot) => normalize(slot.species)).filter(Boolean));
  const pool = DEMO_SETS.filter((set) => !lockedSpecies.has(normalize(set.species)));
  const count = Math.min(payload.num_candidates || 3, 4);

  const candidates = Array.from({ length: count }, (_, candidateIndex) => {
    const rotated = rotate(pool, candidateIndex * 2);
    const team = [...locked, ...rotated].slice(0, 6);
    return {
      set_ids: team.map((slot) => DEMO_SETS.findIndex((set) => normalize(set.species) === normalize(slot.species))),
      showdown: slotsToShowdown(team),
      rank_score: 1 - candidateIndex * 0.07,
      score_components: { source: "local-demo" },
    };
  });

  return {
    mode: state.mode === "generate" ? "generate_team" : "complete_team",
    format: "gen3ou",
    candidate_count: candidates.length,
    candidates,
    warnings: ["Using local demo sets because backend URL or API key is empty."],
  };
}

function rotate(items, offset) {
  if (!items.length) return [];
  return items.map((_, index) => items[(index + offset) % items.length]);
}

async function run() {
  els.runButton.disabled = true;
  els.runButton.textContent = state.mode === "generate" ? "Generating..." : "Completing...";
  setMessage("Working...");

  try {
    const payload = buildPayload();
    const data = await callBackend(payload);
    state.candidates = data.candidates || [];
    renderCandidates(state.candidates);
    if (data.warnings?.length) setMessage(data.warnings.join(" "));
  } catch (error) {
    setStatus("error", "Error");
    renderCandidates([]);
    setMessage(error.message || "Something went wrong.", true);
  } finally {
    els.runButton.disabled = false;
    els.runButton.textContent = state.mode === "generate" ? "Generate Team" : "Complete Team";
  }
}

function loadSample() {
  state.slots = [DEMO_SETS[0], DEMO_SETS[2], emptySlot(), emptySlot(), emptySlot(), emptySlot()].map((slot) => ({
    ...emptySlot(),
    ...slot,
    nickname: slot.species || "",
    moves: [...(slot.moves || ["", "", "", ""])],
  }));
  state.selectedSlot = 0;
  syncExportQuietly();
  renderAll();
}

function clearAll() {
  state.slots = Array.from({ length: 6 }, () => emptySlot());
  state.selectedSlot = 0;
  state.candidates = [];
  els.showdownText.value = "";
  renderAll();
  renderCandidates([]);
  setMessage("Add a partial team or generate from scratch.");
}

function bindEvents() {
  els.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      renderMode();
    });
  });

  els.runButton.addEventListener("click", run);
  els.importButton.addEventListener("click", importFromText);
  els.exportButton.addEventListener("click", exportToText);
  els.sampleButton.addEventListener("click", loadSample);
  els.clearButton.addEventListener("click", clearAll);

  [els.backendUrl, els.apiKey].forEach((input) => {
    input.addEventListener("input", () => {
      const key = input === els.backendUrl ? "pokemonBuilder.backendUrl" : "pokemonBuilder.apiKey";
      localStorage.setItem(key, input.value.trim());
      refreshConnectionStatus();
    });
  });
}

initReferenceData();
initConfig();
bindEvents();
renderMode();
renderAll();
