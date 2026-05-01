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
  teamGrid: document.querySelector("#teamGrid"),
  slotTemplate: document.querySelector("#slotTemplate"),
  modeTitle: document.querySelector("#modeTitle"),
  modeSubtitle: document.querySelector("#modeSubtitle"),
  candidateList: document.querySelector("#candidateList"),
  resultCount: document.querySelector("#resultCount"),
  messageCard: document.querySelector("#messageCard"),
};

function emptySlot() {
  return {
    species: "",
    item: "",
    ability: "",
    nature: "Hardy",
    evs: "",
    moves: ["", "", "", ""],
  };
}

function titleCase(value) {
  return value
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalize(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function slotIsFilled(slot) {
  return Boolean(
    slot.species.trim() ||
      slot.item.trim() ||
      slot.ability.trim() ||
      slot.evs.trim() ||
      slot.moves.some((move) => move.trim()),
  );
}

function slotToShowdown(slot) {
  if (!slotIsFilled(slot)) return "";

  const lines = [];
  const species = slot.species.trim() || "Unknown";
  const item = slot.item.trim();
  lines.push(item ? `${species} @ ${item}` : species);

  if (slot.ability.trim()) lines.push(`Ability: ${slot.ability.trim()}`);
  if (slot.evs.trim()) lines.push(`EVs: ${slot.evs.trim()}`);
  if (slot.nature && slot.nature !== "Hardy") lines.push(`${slot.nature} Nature`);

  slot.moves
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
    slot.species = cleanSpeciesName(namePart || "");
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
  let next = value.trim();
  const nicknameMatch = next.match(/\(([^)]+)\)/);
  if (nicknameMatch) next = nicknameMatch[1];
  return next.replace(/\s+\((M|F)\)$/i, "").trim();
}

function setStatus(kind, text) {
  els.connectionState.className = `status-chip ${kind}`;
  els.connectionState.textContent = text;
}

function setMessage(message, isError = false) {
  els.messageCard.textContent = message;
  els.messageCard.className = `message-card${isError ? " error" : ""}`;
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
  const species = [...new Set(DEMO_SETS.map((set) => set.species))].sort();
  const items = [...new Set(DEMO_SETS.map((set) => set.item))].sort();
  const abilities = [...new Set(DEMO_SETS.map((set) => set.ability))].sort();
  const moves = [...new Set(DEMO_SETS.flatMap((set) => set.moves))].sort();

  populateDatalist("#speciesList", species);
  populateDatalist("#itemList", items);
  populateDatalist("#abilityList", abilities);
  populateDatalist("#moveList", moves);
}

function renderTeam() {
  els.teamGrid.innerHTML = "";

  state.slots.forEach((slot, index) => {
    const node = els.slotTemplate.content.firstElementChild.cloneNode(true);
    const filled = slotIsFilled(slot);
    node.classList.toggle("filled", filled);
    node.querySelector(".slot-label").textContent = `Slot ${index + 1}`;
    node.querySelector(".slot-name").textContent = filled ? slot.species || "Partial Set" : "Masked Slot";

    const species = node.querySelector(".species-input");
    const item = node.querySelector(".item-input");
    const ability = node.querySelector(".ability-input");
    const nature = node.querySelector(".nature-input");
    const evs = node.querySelector(".evs-input");
    const moves = node.querySelectorAll(".move-input");

    species.value = slot.species;
    item.value = slot.item;
    ability.value = slot.ability;
    evs.value = slot.evs;

    nature.innerHTML = "";
    NATURES.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      nature.append(option);
    });
    nature.value = slot.nature || "Hardy";

    moves.forEach((input, moveIndex) => {
      input.value = slot.moves[moveIndex] || "";
      input.addEventListener("input", () => {
        state.slots[index].moves[moveIndex] = input.value;
        syncExportQuietly();
        renderSlotHeader(node, state.slots[index]);
      });
    });

    [
      [species, "species"],
      [item, "item"],
      [ability, "ability"],
      [nature, "nature"],
      [evs, "evs"],
    ].forEach(([input, key]) => {
      input.addEventListener("input", () => {
        state.slots[index][key] = input.value;
        syncExportQuietly();
        renderSlotHeader(node, state.slots[index]);
      });
    });

    node.querySelector(".clear-slot").addEventListener("click", () => {
      state.slots[index] = emptySlot();
      syncExportQuietly();
      renderTeam();
    });

    els.teamGrid.append(node);
  });
}

function renderSlotHeader(node, slot) {
  const filled = slotIsFilled(slot);
  node.classList.toggle("filled", filled);
  node.querySelector(".slot-name").textContent = filled ? slot.species || "Partial Set" : "Masked Slot";
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
    : "Empty slots are treated as masked team positions.";
  els.numSamples.value = isGenerate ? "256" : "64";
}

function renderCandidates(candidates) {
  els.candidateList.innerHTML = "";
  els.resultCount.textContent = `${candidates.length} candidate${candidates.length === 1 ? "" : "s"}`;

  if (!candidates.length) {
    setMessage("No candidates returned.");
    return;
  }

  clearMessage();
  candidates.forEach((candidate, index) => {
    const card = document.createElement("article");
    card.className = "candidate-card";

    const title = document.createElement("div");
    title.className = "panel-title-row";
    title.innerHTML = `<h3>Candidate ${index + 1}</h3>`;

    const actions = document.createElement("div");
    actions.className = "candidate-actions";

    const load = document.createElement("button");
    load.className = "ghost-button";
    load.type = "button";
    load.textContent = "Load";
    load.addEventListener("click", () => loadCandidate(candidate));

    const copy = document.createElement("button");
    copy.className = "ghost-button";
    copy.type = "button";
    copy.textContent = "Copy";
    copy.addEventListener("click", () => copyText(candidate.showdown || ""));

    actions.append(load, copy);
    title.append(actions);

    const meta = document.createElement("div");
    meta.className = "candidate-meta";
    const score = Number.isFinite(candidate.rank_score) ? candidate.rank_score.toFixed(3) : "demo";
    meta.textContent = `Score ${score}${candidate.set_ids ? ` | Set IDs ${candidate.set_ids.join(", ")}` : ""}`;

    const pre = document.createElement("pre");
    pre.textContent = candidate.showdown || JSON.stringify(candidate, null, 2);

    card.append(title, meta, pre);
    els.candidateList.append(card);
  });
}

function loadCandidate(candidate) {
  const parsed = parseShowdown(candidate.showdown || "");
  state.slots = Array.from({ length: 6 }, (_, index) => parsed[index] || emptySlot());
  els.showdownText.value = slotsToShowdown(state.slots);
  renderTeam();
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
  renderTeam();
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
    if (!showdown.trim()) {
      throw new Error("Add at least one team slot before completing.");
    }
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
    if (data.warnings?.length) {
      setMessage(data.warnings.join(" "));
    }
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
    moves: [...(slot.moves || ["", "", "", ""])],
  }));
  syncExportQuietly();
  renderTeam();
}

function clearAll() {
  state.slots = Array.from({ length: 6 }, () => emptySlot());
  state.candidates = [];
  els.showdownText.value = "";
  renderTeam();
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
      setStatus(els.backendUrl.value.trim() && els.apiKey.value.trim() ? "live" : "demo", els.backendUrl.value.trim() && els.apiKey.value.trim() ? "Live" : "Demo");
    });
  });
}

initReferenceData();
bindEvents();
renderMode();
renderTeam();
renderCandidates([]);
