const storageKey = "forgefit-v4";
const appVersion = "V20";
const dataSchemaVersion = 5;
const brandMigrationKey = "aerstrongThemeMigrated";
const todayKey = localDateKey(new Date());

const $ = (selector) => document.querySelector(selector);
const state = loadState();

let activeExercisePlanId = null;
let calendarMode = "week";
let trackingMode = "performance";
let builderMode = "sessions";
let equipmentFilter = "Tous";
let muscleFilter = "Tous";
let installPrompt = null;
let selectedAlternativeName = "";
let swRegistration = null;
let expectingUpdateReload = false;
let togetherMode = false;
let togetherProfileIds = [state.activeProfileId];
let audioContext = null;
let aboutFromWelcome = false;

const sessionUi = {
  phase: "ready",
  restRemaining: 0,
  restTimer: null,
  together: {},
};

const views = {
  home: $("#homeView"),
  training: $("#trainingView"),
  builder: $("#builderView"),
  tracking: $("#trackingView"),
  future: $("#futureView"),
  nutrition: $("#nutritionView"),
  coach: $("#coachView"),
};

function id() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function localDateKey(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function planItem(exerciseId, sets, minReps, maxReps, weight, increment) {
  return {
    id: id(),
    exerciseId,
    sets,
    minReps,
    maxReps,
    weight,
    increment,
    targetReps: Array(sets).fill(minReps),
  };
}

function starterState() {
  const ids = Array.from({ length: 34 }, id);
  const tplPull = id();
  const tplPush = id();
  const tplLegs = id();
  const profileId = id();

  return {
    activeProfileId: profileId,
    profiles: [{ id: profileId, name: "Profil principal", birthDate: "", height: "" }],
    exercises: [
      exercise(ids[0], "Tirage vertical machine poulie", "Dos", "Poulie", 120, ["Tirage vertical machine guidee", "Tractions assistees", "Tirage unilateral poulie"]),
      exercise(ids[1], "Rowing poulie basse", "Dos", "Poulie", 120, ["Rowing machine guidee", "Rowing haltere", "Rowing barre"]),
      exercise(ids[2], "Developpe couche machine", "Pectoraux", "Machine guidee", 150, ["Developpe couche barre", "Developpe couche halteres", "Pompes"]),
      exercise(ids[3], "Developpe militaire halteres", "Epaules", "Halteres", 120, ["Developpe epaules machine", "Developpe militaire barre"]),
      exercise(ids[4], "Presse a cuisses", "Jambes", "Machine guidee", 150, ["Squat barre", "Goblet squat haltere", "Fentes marchees"]),
      exercise(ids[5], "Leg curl", "Jambes", "Machine guidee", 90, ["Souleve de terre roumain", "Leg curl unilateral"]),
      exercise(ids[6], "Curl halteres", "Biceps", "Halteres", 75, ["Curl pupitre machine", "Curl barre EZ", "Curl poulie basse"]),
      exercise(ids[7], "Extension triceps poulie", "Triceps", "Poulie", 75, ["Dips assistes", "Barre au front", "Extension triceps haltere"]),
      exercise(ids[8], "Tractions assistees", "Dos", "Poids du corps", 150, ["Tirage vertical poulie", "Tirage machine guidee"]),
      exercise(ids[9], "Squat barre", "Jambes", "Barre", 180, ["Presse a cuisses", "Hack squat machine", "Goblet squat"]),
      exercise(ids[10], "Tirage horizontal machine", "Dos", "Machine guidee", 120, ["Rowing poulie basse", "Rowing haltere unilateral"]),
      exercise(ids[11], "Pull-over poulie", "Dos", "Poulie", 75, ["Pull-over machine", "Pull-over haltere"]),
      exercise(ids[12], "Rowing T-bar", "Dos", "Barre", 150, ["Rowing barre", "Rowing machine"]),
      exercise(ids[13], "Developpe incline halteres", "Pectoraux", "Halteres", 120, ["Developpe incline machine", "Developpe incline barre"]),
      exercise(ids[14], "Ecarte poulie vis-a-vis", "Pectoraux", "Poulie", 75, ["Pec deck", "Ecarte halteres"]),
      exercise(ids[15], "Dips assistes", "Pectoraux", "Poids du corps", 120, ["Developpe decline machine", "Pompes lestee"]),
      exercise(ids[16], "Elevation laterale halteres", "Epaules", "Halteres", 60, ["Elevation laterale poulie", "Machine lateral raise"]),
      exercise(ids[17], "Oiseau machine", "Epaules", "Machine guidee", 75, ["Face pull", "Oiseau halteres"]),
      exercise(ids[18], "Face pull", "Epaules", "Poulie", 75, ["Oiseau machine", "Oiseau poulie"]),
      exercise(ids[19], "Hack squat", "Jambes", "Machine guidee", 150, ["Presse a cuisses", "Squat barre"]),
      exercise(ids[20], "Fentes bulgares", "Jambes", "Halteres", 120, ["Fentes marchees", "Presse unilaterale"]),
      exercise(ids[21], "Leg extension", "Jambes", "Machine guidee", 75, ["Sissy squat", "Spanish squat"]),
      exercise(ids[22], "Souleve de terre roumain", "Jambes", "Barre", 150, ["RDL halteres", "Leg curl"]),
      exercise(ids[23], "Hip thrust", "Jambes", "Barre", 150, ["Glute bridge machine", "Hip thrust machine"]),
      exercise(ids[24], "Mollets debout machine", "Jambes", "Machine guidee", 75, ["Mollets presse", "Mollets halteres"]),
      exercise(ids[25], "Curl barre EZ", "Biceps", "Barre", 75, ["Curl halteres", "Curl poulie basse"]),
      exercise(ids[26], "Curl incline halteres", "Biceps", "Halteres", 75, ["Curl pupitre", "Curl marteau"]),
      exercise(ids[27], "Curl marteau", "Biceps", "Halteres", 75, ["Curl corde poulie", "Curl halteres neutre"]),
      exercise(ids[28], "Barre au front", "Triceps", "Barre", 90, ["Extension triceps poulie", "Extension haltere nuque"]),
      exercise(ids[29], "Extension triceps corde", "Triceps", "Poulie", 75, ["Dips assistes", "Extension barre poulie"]),
      exercise(ids[30], "Crunch poulie", "Abdos", "Poulie", 60, ["Crunch machine", "Crunch au sol"]),
      exercise(ids[31], "Gainage", "Abdos", "Poids du corps", 45, ["Dead bug", "Planche laterale"]),
      exercise(ids[32], "Releve de jambes suspendu", "Abdos", "Poids du corps", 75, ["Releve de genoux chaise romaine", "Crunch inverse"]),
      exercise(ids[33], "Shrugs halteres", "Trapezes", "Halteres", 90, ["Shrugs barre", "Shrugs machine"]),
    ],
    templates: [
      { id: tplPull, profileId, name: "PULL", items: [planItem(ids[0], 4, 8, 12, 80, 2.5), planItem(ids[1], 3, 10, 12, 55, 2.5), planItem(ids[6], 3, 10, 15, 14, 1)] },
      { id: tplPush, profileId, name: "PUSH", items: [planItem(ids[2], 4, 8, 12, 70, 2.5), planItem(ids[3], 3, 8, 12, 22, 1), planItem(ids[7], 3, 10, 15, 35, 2.5)] },
      { id: tplLegs, profileId, name: "LEGS", items: [planItem(ids[4], 4, 10, 15, 140, 5), planItem(ids[9], 3, 6, 10, 80, 2.5), planItem(ids[5], 3, 10, 15, 45, 2.5)] },
    ],
    schedule: [{ id: id(), profileId, date: todayKey, templateId: tplPull, repeatWeekly: true }],
    logs: [],
    health: [],
    nutrition: [],
    nutritionSettings: [],
    settings: { theme: "gold", mode: "dark", weightUnit: "kg", lengthUnit: "cm", soundMuted: false },
    substitutions: {},
    dataVersion: dataSchemaVersion,
    welcomeAccepted: false,
    onboardingComplete: false,
  };
}

function exercise(idValue, name, family, equipment, rest, alternatives) {
  return { id: idValue, name, family, equipment, rest, alternatives };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && saved.exercises && saved.templates) return normalizeState(saved);
  } catch {
    return starterState();
  }
  return starterState();
}

function normalizeState(saved) {
  const base = starterState();
  const mergedExercises = mergeExercises(saved.exercises || [], base.exercises);
  const fallbackProfileId = saved.activeProfileId || (saved.profiles && saved.profiles[0] && saved.profiles[0].id) || id();
  const profiles = saved.profiles && saved.profiles.length ? saved.profiles : [{
    id: fallbackProfileId,
    name: saved.profile && saved.profile.name ? saved.profile.name : "Profil principal",
    birthDate: saved.profile && saved.profile.birthDate ? saved.profile.birthDate : "",
    height: saved.profile && saved.profile.height ? saved.profile.height : "",
  }];
  const activeProfileId = profiles.some((profile) => profile.id === saved.activeProfileId) ? saved.activeProfileId : profiles[0].id;
  return {
    ...starterState(),
    ...saved,
    activeProfileId,
    profiles: profiles.slice(0, 3),
    exercises: mergedExercises.map((item) => ({ ...item, family: item.family === "Ischios" ? "Jambes" : item.family })),
    templates: (saved.templates || base.templates).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    schedule: (saved.schedule || base.schedule).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    logs: (saved.logs || []).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    health: (saved.health || []).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    nutrition: (saved.nutrition || []).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    nutritionSettings: (saved.nutritionSettings || []).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    settings: migratedSettings(saved),
    substitutions: saved.substitutions || {},
    dataVersion: dataSchemaVersion,
    welcomeAccepted: saved.welcomeAccepted === undefined ? true : saved.welcomeAccepted,
    onboardingComplete: saved.onboardingComplete === undefined ? true : saved.onboardingComplete,
    [brandMigrationKey]: saved[brandMigrationKey] || (saved.settings && saved.settings.theme === "red"),
  };
}

function migratedSettings(saved) {
  const settings = { theme: "gold", mode: "dark", weightUnit: "kg", lengthUnit: "cm", soundMuted: false, ...(saved.settings || {}) };
  if (!saved[brandMigrationKey] && settings.theme === "red") settings.theme = "gold";
  return settings;
}

function mergeExercises(existing, defaults) {
  const byName = new Map(existing.map((item) => [item.name.toLowerCase(), item]));
  defaults.forEach((item) => {
    if (!byName.has(item.name.toLowerCase())) byName.set(item.name.toLowerCase(), item);
  });
  return [...byName.values()];
}

function exerciseByName(name) {
  return state.exercises.find((item) => item.name.toLowerCase() === name.toLowerCase());
}

function goalPreset(goal) {
  const presets = {
    fatloss: { sets: 3, minReps: 12, maxReps: 15, rest: 60, increment: 1 },
    muscle: { sets: 4, minReps: 8, maxReps: 12, rest: 90, increment: 2.5 },
    maintain: { sets: 3, minReps: 8, maxReps: 12, rest: 90, increment: 2.5 },
    strength: { sets: 4, minReps: 5, maxReps: 8, rest: 150, increment: 2.5 },
  };
  return presets[goal] || presets.muscle;
}

function defaultWeightForExercise(name) {
  const weights = {
    "Tirage vertical machine poulie": 50,
    "Rowing poulie basse": 40,
    "Developpe couche machine": 45,
    "Developpe incline halteres": 16,
    "Developpe militaire halteres": 14,
    "Presse a cuisses": 90,
    "Leg curl": 30,
    "Leg extension": 35,
    "Squat barre": 40,
    "Hack squat": 60,
    "Curl halteres": 10,
    "Curl barre EZ": 20,
    "Extension triceps poulie": 25,
    "Extension triceps corde": 25,
    "Elevation laterale halteres": 6,
    "Face pull": 20,
    "Crunch poulie": 20,
    "Gainage": 0,
    "Hip thrust": 50,
    "Souleve de terre roumain": 40,
    "Mollets debout machine": 40,
    "Pull-over poulie": 25,
  };
  return weights[name] == null ? 30 : weights[name];
}

function makeProgramItem(exerciseName, preset) {
  const found = exerciseByName(exerciseName) || state.exercises[0];
  if (found) found.rest = preset.rest;
  return planItem(found.id, preset.sets, preset.minReps, preset.maxReps, defaultWeightForExercise(exerciseName), preset.increment);
}

function onboardingProgramDefinitions(frequency) {
  const definitions = {
    1: [
      { name: "FULL BODY", exercises: ["Presse a cuisses", "Tirage vertical machine poulie", "Developpe couche machine", "Rowing poulie basse", "Leg curl", "Crunch poulie"] },
    ],
    2: [
      { name: "UPPER", exercises: ["Tirage vertical machine poulie", "Developpe couche machine", "Rowing poulie basse", "Developpe militaire halteres", "Curl halteres", "Extension triceps poulie"] },
      { name: "LOWER", exercises: ["Presse a cuisses", "Leg curl", "Leg extension", "Hip thrust", "Mollets debout machine", "Crunch poulie"] },
    ],
    3: [
      { name: "PULL", exercises: ["Tirage vertical machine poulie", "Rowing poulie basse", "Pull-over poulie", "Face pull", "Curl halteres"] },
      { name: "PUSH", exercises: ["Developpe couche machine", "Developpe incline halteres", "Developpe militaire halteres", "Elevation laterale halteres", "Extension triceps poulie"] },
      { name: "LEGS", exercises: ["Presse a cuisses", "Leg curl", "Leg extension", "Souleve de terre roumain", "Mollets debout machine", "Crunch poulie"] },
    ],
    4: [
      { name: "UPPER A", exercises: ["Tirage vertical machine poulie", "Developpe couche machine", "Rowing poulie basse", "Developpe militaire halteres", "Curl halteres"] },
      { name: "LOWER A", exercises: ["Presse a cuisses", "Leg curl", "Leg extension", "Mollets debout machine", "Crunch poulie"] },
      { name: "UPPER B", exercises: ["Developpe incline halteres", "Tirage horizontal machine", "Pull-over poulie", "Face pull", "Extension triceps corde"] },
      { name: "LOWER B", exercises: ["Hack squat", "Souleve de terre roumain", "Hip thrust", "Leg extension", "Mollets debout machine"] },
    ],
    5: [
      { name: "PULL", exercises: ["Tirage vertical machine poulie", "Rowing poulie basse", "Pull-over poulie", "Face pull", "Curl halteres"] },
      { name: "PUSH", exercises: ["Developpe couche machine", "Developpe incline halteres", "Developpe militaire halteres", "Elevation laterale halteres", "Extension triceps poulie"] },
      { name: "LEGS", exercises: ["Presse a cuisses", "Leg curl", "Leg extension", "Souleve de terre roumain", "Mollets debout machine"] },
      { name: "UPPER", exercises: ["Tirage horizontal machine", "Developpe couche machine", "Face pull", "Curl barre EZ", "Extension triceps corde"] },
      { name: "LOWER", exercises: ["Hack squat", "Hip thrust", "Leg curl", "Leg extension", "Crunch poulie"] },
    ],
    6: [
      { name: "PULL A", exercises: ["Tirage vertical machine poulie", "Rowing poulie basse", "Face pull", "Curl halteres"] },
      { name: "PUSH A", exercises: ["Developpe couche machine", "Developpe militaire halteres", "Elevation laterale halteres", "Extension triceps poulie"] },
      { name: "LEGS A", exercises: ["Presse a cuisses", "Leg curl", "Leg extension", "Mollets debout machine"] },
      { name: "PULL B", exercises: ["Tirage horizontal machine", "Pull-over poulie", "Face pull", "Curl barre EZ"] },
      { name: "PUSH B", exercises: ["Developpe incline halteres", "Developpe militaire halteres", "Elevation laterale halteres", "Extension triceps corde"] },
      { name: "LEGS B", exercises: ["Hack squat", "Souleve de terre roumain", "Hip thrust", "Crunch poulie"] },
    ],
  };
  return definitions[Math.max(1, Math.min(6, Number(frequency || 3)))] || definitions[3];
}

function nextDateForWeekday(weekday) {
  const date = new Date(`${todayKey}T12:00:00`);
  const current = date.getDay();
  const delta = (Number(weekday) - current + 7) % 7;
  date.setDate(date.getDate() + delta);
  return localDateKey(date);
}

function defaultWeekdays(frequency) {
  const defaults = {
    1: [1],
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 5],
    5: [1, 2, 3, 5, 6],
    6: [1, 2, 3, 4, 5, 6],
  };
  return defaults[frequency] || defaults[3];
}

function sortedWeekdays(days) {
  const current = new Date(`${todayKey}T12:00:00`).getDay();
  return days.slice().sort((a, b) => ((a - current + 7) % 7) - ((b - current + 7) % 7));
}

function generateOnboardingProgram(goal, frequency, weekdays) {
  const preset = goalPreset(goal);
  const defs = onboardingProgramDefinitions(frequency);
  const profileId = state.activeProfileId;
  const templates = defs.map((definition) => ({
    id: id(),
    profileId,
    name: definition.name,
    items: definition.exercises.map((name) => makeProgramItem(name, preset)),
  }));
  const selectedDays = sortedWeekdays((weekdays && weekdays.length ? weekdays : defaultWeekdays(templates.length)).slice(0, templates.length));
  state.templates = state.templates.filter((template) => template.profileId !== profileId).concat(templates);
  state.schedule = state.schedule.filter((item) => item.profileId !== profileId).concat(templates.map((template, index) => ({
    id: id(),
    profileId,
    date: nextDateForWeekday(selectedDays[index] == null ? defaultWeekdays(templates.length)[index] : selectedDays[index]),
    templateId: template.id,
    repeatWeekly: true,
  })));
}

function saveState() {
  state.dataVersion = dataSchemaVersion;
  state[brandMigrationKey] = true;
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function applySettings() {
  document.documentElement.dataset.theme = (state.settings && state.settings.theme) || "gold";
  document.documentElement.dataset.mode = (state.settings && state.settings.mode) || "dark";
}

function soundButtonHtml() {
  const muted = state.settings && state.settings.soundMuted;
  return `
    <button class="sound-toggle ${muted ? "muted" : ""}" data-sound-toggle type="button" aria-label="${muted ? "Activer le son" : "Couper le son"}" title="${muted ? "Activer le son" : "Couper le son"}">
      <span aria-hidden="true">${muted ? "🔇" : "🔊"}</span>
    </button>
  `;
}

function ensureAudioContext() {
  if (state.settings && state.settings.soundMuted) return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTimerBeep(kind) {
  const context = ensureAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const final = kind === "done";
  const now = context.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(final ? 1120 : 760, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(final ? 0.22 : 0.11, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (final ? 0.32 : 0.12));
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + (final ? 0.34 : 0.14));
}

function handleTimerSound(remaining) {
  if (remaining > 0 && remaining <= 3) playTimerBeep("tick");
  if (remaining === 0) playTimerBeep("done");
}

function activeProfile() {
  let profile = state.profiles.find((item) => item.id === state.activeProfileId);
  if (!profile) {
    profile = state.profiles[0];
    state.activeProfileId = profile.id;
  }
  return profile;
}

function profileTemplates() {
  return state.templates.filter((item) => item.profileId === state.activeProfileId);
}

function profileSchedule() {
  return state.schedule.filter((item) => item.profileId === state.activeProfileId);
}

function profileLogs() {
  return state.logs.filter((item) => item.profileId === state.activeProfileId);
}

function profileHealth() {
  return state.health.filter((item) => item.profileId === state.activeProfileId);
}

function profileNutrition() {
  return state.nutrition.filter((item) => item.profileId === state.activeProfileId);
}

function nutritionSettings() {
  let settings = state.nutritionSettings.find((item) => item.profileId === state.activeProfileId);
  if (!settings) {
    const latestHealth = profileHealth()[0] || {};
    settings = {
      id: id(),
      profileId: state.activeProfileId,
      goal: "muscle",
      currentWeight: latestHealth.weight || "",
      targetWeight: "",
      caloriesTarget: "",
      proteinTarget: "",
      waterTarget: 2,
    };
    state.nutritionSettings.push(settings);
  }
  return settings;
}

const i18n = {
  training: "Training",
  builder: "Builder",
  tracking: "Suivi",
  more: "Plus",
  exercise: "Exercice",
  rest: "Repos",
  currentSet: "Serie en cours",
  unavailable: "Machine indisponible",
  nextExercise: "Exercice suivant",
  finishSession: "Fin seance",
  skip: "PASSER",
  options: "Options",
  confirmAlternative: "Valider l'alternative",
  usedWeight: "Charge utilisee",
  noAlternative: "Aucune alternative configuree.",
};

function t(key) {
  return i18n[key] || key;
}

function exerciseById(exerciseId) {
  return state.exercises.find((item) => item.id === exerciseId);
}

function templateById(templateId) {
  return state.templates.find((item) => item.id === templateId);
}

function scheduledFor(dateKey) {
  const schedule = profileSchedule();
  const exact = schedule.filter((item) => item.date === dateKey);
  const repeated = schedule.filter((item) => {
    if (!item.repeatWeekly || item.date === dateKey) return false;
    const start = new Date(`${item.date}T12:00:00`);
    const current = new Date(`${dateKey}T12:00:00`);
    const days = Math.round((current - start) / 86400000);
    return days > 0 && days % 7 === 0;
  });
  return [...exact, ...repeated];
}

function currentTemplate() {
  const planned = scheduledFor(todayKey)[0];
  return planned ? templateById(planned.templateId) : profileTemplates()[0];
}

function currentTemplateForProfile(profileId) {
  const previousProfileId = state.activeProfileId;
  state.activeProfileId = profileId;
  const template = currentTemplate();
  state.activeProfileId = previousProfileId;
  return template;
}

function currentLog() {
  let log = state.logs.find((item) => item.profileId === state.activeProfileId && item.date === todayKey && !item.archived);
  if (!log) {
    const template = currentTemplate();
    log = {
      id: id(),
      profileId: state.activeProfileId,
      date: todayKey,
      templateId: template ? template.id : undefined,
      entries: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      startedAt: new Date().toISOString(),
      exitReason: null,
    };
    state.logs.unshift(log);
  }
  return log;
}

function currentLogForProfile(profileId, templateId) {
  let log = state.logs.find((item) => item.profileId === profileId && item.date === todayKey && item.templateId === templateId && !item.archived);
  if (!log) {
    log = {
      id: id(),
      profileId,
      date: todayKey,
      templateId,
      entries: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      startedAt: new Date().toISOString(),
      exitReason: null,
      togetherSession: togetherMode,
    };
    state.logs.unshift(log);
  }
  return log;
}

function entryFor(log, item) {
  let entry = log.entries.find((candidate) => candidate.planItemId === item.id);
  if (!entry) {
    entry = {
      id: id(),
      planItemId: item.id,
      exerciseId: item.exerciseId,
      performedExerciseName: (exerciseById(item.exerciseId) && exerciseById(item.exerciseId).name) || "Exercice",
      weight: item.weight,
      reps: Array(item.sets).fill(""),
      completed: Array(item.sets).fill(false),
    };
    log.entries.push(entry);
  }
  if (!entry.completed) entry.completed = Array(item.sets).fill(false);
  if (!entry.reps) entry.reps = Array(item.sets).fill("");
  return entry;
}

function currentPlanItem(log) {
  const template = templateById(log.templateId);
  return template && template.items ? template.items[log.currentExerciseIndex] : undefined;
}

function profileNameById(profileId) {
  const profile = state.profiles.find((item) => item.id === profileId);
  return (profile && profile.name) || "Profil";
}

function isLogComplete(log) {
  const template = templateById(log.templateId);
  if (!template || !template.items || !template.items.length) return false;
  return template.items.every((item) => {
    const entry = log.entries.find((candidate) => candidate.planItemId === item.id);
    return entry && entry.completed && entry.completed.every(Boolean);
  });
}

function nextTarget(item, repsDone) {
  const reps = repsDone.map((value) => Number(value || 0));
  const complete = reps.length === item.sets && reps.every((rep) => rep >= item.maxReps);
  const allHit = reps.length === item.sets && reps.every((rep, index) => rep >= item.targetReps[index]);
  if (complete) return { weight: item.weight + Number(item.increment || 0), targetReps: Array(item.sets).fill(item.minReps), reason: "haut de fourchette atteint" };
  if (allHit) return { weight: item.weight, targetReps: item.targetReps.map((rep) => Math.min(item.maxReps, rep + 1)), reason: "objectif valide" };
  return { weight: item.weight, targetReps: item.targetReps, reason: "objectif a consolider" };
}

function estimateOneRm(weight, reps) {
  const numericWeight = Number(weight || 0);
  const numericReps = Number(reps || 0);
  if (!numericWeight || !numericReps) return 0;
  if (numericReps === 1) return numericWeight;
  return numericWeight * (1 + numericReps / 30);
}

function ageFromBirthDate(value) {
  if (!value) return "";
  const birth = new Date(`${value}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function restLabel(seconds) {
  return formatTime(Number(seconds || 0));
}

function parseRestInput(value) {
  const text = String(value || "").trim();
  if (!text) return 120;
  if (text.includes(":")) {
    const [minutes, seconds = "0"] = text.split(":");
    return Math.max(15, Number(minutes || 0) * 60 + Number(seconds || 0));
  }
  const numeric = Number(text.replace(",", "."));
  if (!Number.isFinite(numeric)) return 120;
  return numeric <= 10 ? Math.round(numeric * 60) : Math.round(numeric);
}

function logStats(log) {
  const template = templateById(log.templateId);
  const perExercise = template && template.items ? template.items.map((item) => {
    const entry = log.entries.find((candidate) => candidate.planItemId === item.id) || entryFor(log, item);
    const reps = entry.reps.map((rep) => Number(rep || 0));
    const tonnage = reps.reduce((total, rep) => total + rep * Number(entry.weight || 0), 0);
    const calories = Math.round((tonnage * 0.012) + ((entry.completed || []).filter(Boolean).length * 4));
    return { name: entry.performedExerciseName, tonnage, calories };
  }) : [];
  return {
    perExercise,
    tonnage: perExercise.reduce((sum, item) => sum + item.tonnage, 0),
    calories: perExercise.reduce((sum, item) => sum + item.calories, 0),
  };
}

function estimatedTemplateMinutes(template) {
  if (!template || !template.items || !template.items.length) return 0;
  const seconds = template.items.reduce((total, item) => {
    const exercise = exerciseById(item.exerciseId);
    const rest = Number((exercise && exercise.rest) || 90);
    const sets = Number(item.sets || 0);
    return total + (sets * 55) + (Math.max(0, sets - 1) * rest) + 75;
  }, 0);
  return Math.max(10, Math.round(seconds / 60));
}

function lastComparableLog(templateId) {
  return profileLogs()
    .filter((log) => log.templateId === templateId && log.finishedAt)
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))[0];
}

function daysSince(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Math.max(0, Math.floor((new Date() - date) / 86400000));
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return "hier";
  return `il y a ${diff} jours`;
}

function renderTodayDashboard() {
  const panel = $("#todayDashboard");
  if (!panel) return;
  const template = currentTemplate();
  if (!template) {
    panel.innerHTML = `
      <article class="today-card empty-plan">
        <div>
          <p class="label">Aujourd'hui</p>
          <h2>Aucune seance prevue</h2>
          <p>Creer une seance dans Builder pour demarrer proprement.</p>
        </div>
        <button class="primary-button" data-view="builder" type="button">Creer une seance</button>
      </article>
    `;
    return;
  }

  const last = lastComparableLog(template.id);
  const minutes = estimatedTemplateMinutes(template);
  const exerciseNames = template.items.slice(0, 3).map((item) => escapeHtml((exerciseById(item.exerciseId) && exerciseById(item.exerciseId).name) || "Exercice"));
  const more = template.items.length > 3 ? ` +${template.items.length - 3}` : "";
  const activeLog = state.logs.find((item) => item.profileId === state.activeProfileId && item.date === todayKey && item.templateId === template.id && !item.archived && !item.finishedAt);

  panel.innerHTML = `
    <article class="today-card">
      <div class="today-card-main">
        <p class="label">Aujourd'hui</p>
        <h2>${escapeHtml(template.name)}</h2>
        <p>${escapeHtml(activeProfile().name || "Profil")} - ${template.items.length} exercices - environ ${minutes} min</p>
      </div>
      <div class="today-stats">
        <div><span>Duree</span><strong>${minutes} min</strong></div>
        <div><span>Exos</span><strong>${template.items.length}</strong></div>
      </div>
      <p class="today-exercises">${exerciseNames.join(" / ")}${more}</p>
      <p class="hint">${last ? `Derniere ${escapeHtml(template.name)} terminee ${daysSince(last.finishedAt)}.` : "Pas encore d'historique sur cette seance."}</p>
      <button class="primary-button today-start" data-view="training" type="button">${activeLog ? "Reprendre" : "Demarrer"}</button>
    </article>
  `;
}

function todayNutritionEntry() {
  let entry = state.nutrition.find((item) => item.profileId === state.activeProfileId && item.date === todayKey);
  if (!entry) {
    entry = {
      id: id(),
      profileId: state.activeProfileId,
      date: todayKey,
      adherence: "partiel",
      proteinHit: false,
      water: "",
      weight: "",
      note: "",
    };
    state.nutrition.unshift(entry);
  }
  return entry;
}

function renderNutritionPanel() {
  const panel = $("#nutritionPanel");
  if (!panel) return;
  const settings = nutritionSettings();
  const entry = todayNutritionEntry();
  const history = profileNutrition().slice(0, 7);
  const goalLabels = {
    fatloss: "Perte de poids",
    muscle: "Prise de muscle",
    maintain: "Maintien",
    strength: "Performance",
  };
  panel.innerHTML = `
    <div class="section-head">
      <div>
        <p class="label">Nutrition</p>
        <h2>${escapeHtml(activeProfile().name || "Profil")}</h2>
      </div>
    </div>

    <article class="nutrition-card">
      <div class="item-head">
        <div>
          <strong>Aujourd'hui</strong>
          <p>${escapeHtml(goalLabels[settings.goal] || "Objectif")} - cible ${settings.caloriesTarget || "-"} kcal</p>
        </div>
      </div>
      <form class="input-grid compact-form" id="nutritionTodayForm">
        <label>Adherence
          <select id="nutritionAdherence">
            <option value="ok">Dans les clous</option>
            <option value="partiel">Partiel</option>
            <option value="bas">Journee basse</option>
            <option value="haut">Journee haute</option>
          </select>
        </label>
        <label class="check-row">
          <input id="nutritionProteinHit" type="checkbox">
          Proteines atteintes
        </label>
        <label>Eau litre<input id="nutritionWater" inputmode="decimal" type="number" step="0.1" placeholder="2.0"></label>
        <label>Poids du jour kg<input id="nutritionWeight" inputmode="decimal" type="number" step="0.1" placeholder="82.5"></label>
        <label class="wide">Note<input id="nutritionNote" placeholder="Repas, faim, energie, digestion..."></label>
        <button class="primary-button wide" type="submit">Enregistrer aujourd'hui</button>
      </form>
    </article>

    <article class="nutrition-card">
      <strong>Objectif nutrition</strong>
      <form class="input-grid compact-form" id="nutritionSettingsForm">
        <label>Objectif
          <select id="nutritionGoal">
            <option value="muscle">Prise de muscle</option>
            <option value="fatloss">Perte de poids</option>
            <option value="maintain">Maintien</option>
            <option value="strength">Performance</option>
          </select>
        </label>
        <label>Poids actuel kg<input id="nutritionCurrentWeight" inputmode="decimal" type="number" step="0.1"></label>
        <label>Poids cible kg<input id="nutritionTargetWeight" inputmode="decimal" type="number" step="0.1"></label>
        <label>Calories cible<input id="nutritionCaloriesTarget" inputmode="numeric" type="number" step="10"></label>
        <label>Proteines cible g<input id="nutritionProteinTarget" inputmode="numeric" type="number" step="5"></label>
        <label>Eau cible L<input id="nutritionWaterTarget" inputmode="decimal" type="number" step="0.1"></label>
        <button class="primary-button wide" type="submit">Sauver objectif</button>
      </form>
    </article>

    <article class="nutrition-card">
      <strong>Historique rapide</strong>
      <div class="nutrition-history">
        ${history.map((item) => `
          <div>
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.adherence || "partiel")}${item.proteinHit ? " - proteines OK" : ""}</strong>
            <p>${item.water ? `${item.water} L` : "-"}${item.weight ? ` - ${item.weight} kg` : ""}${item.note ? ` - ${escapeHtml(item.note)}` : ""}</p>
          </div>
        `).join("") || `<p class="empty">Aucune donnee nutrition.</p>`}
      </div>
    </article>
  `;
  $("#nutritionAdherence").value = entry.adherence || "partiel";
  $("#nutritionProteinHit").checked = !!entry.proteinHit;
  $("#nutritionWater").value = entry.water || "";
  $("#nutritionWeight").value = entry.weight || "";
  $("#nutritionNote").value = entry.note || "";
  $("#nutritionGoal").value = settings.goal || "muscle";
  $("#nutritionCurrentWeight").value = settings.currentWeight || "";
  $("#nutritionTargetWeight").value = settings.targetWeight || "";
  $("#nutritionCaloriesTarget").value = settings.caloriesTarget || "";
  $("#nutritionProteinTarget").value = settings.proteinTarget || "";
  $("#nutritionWaterTarget").value = settings.waterTarget || "";
}

function completedLogsWithin(days) {
  const limit = new Date();
  limit.setDate(limit.getDate() - days);
  return profileLogs().filter((log) => {
    const date = new Date(`${log.date || ""}T12:00:00`);
    return log.finishedAt && !Number.isNaN(date.getTime()) && date >= limit;
  });
}

function latestEntryForPlanItem(planItemId) {
  const logs = profileLogs()
    .filter((log) => log.finishedAt)
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
  for (const log of logs) {
    const entry = log.entries.find((item) => item.planItemId === planItemId);
    if (entry) return { log, entry };
  }
  return null;
}

function coachProgressSuggestions() {
  const suggestions = [];
  profileTemplates().forEach((template) => {
    (template.items || []).forEach((item) => {
      const latest = latestEntryForPlanItem(item.id);
      const exercise = exerciseById(item.exerciseId);
      if (!latest || !exercise) return;
      const next = nextTarget(item, latest.entry.reps || []);
      if (next.reason === "haut de fourchette atteint") {
        suggestions.push({
          type: "Augmenter",
          text: `${exercise.name} : charge validée. Vise ${next.weight} ${state.settings.weightUnit} sur ${item.minReps}/${item.minReps}/${item.minReps}/${item.minReps}.`,
        });
      } else if (next.reason === "objectif valide") {
        suggestions.push({
          type: "Progression",
          text: `${exercise.name} : objectif validé. Prochaine cible : ${next.targetReps.join("/")}.`,
        });
      } else {
        suggestions.push({
          type: "Consolider",
          text: `${exercise.name} : garde la charge et consolide ${item.targetReps.join("/")}.`,
        });
      }
    });
  });
  return suggestions.slice(0, 4);
}

function coachBalanceSuggestions() {
  const logs = completedLogsWithin(7);
  if (!logs.length) return ["Pas encore assez d'historique cette semaine pour analyser l'équilibre."];
  const volume = new Map();
  logs.forEach((log) => {
    const template = templateById(log.templateId);
    if (!template) return;
    (template.items || []).forEach((item) => {
      const exercise = exerciseById(item.exerciseId);
      const entry = log.entries.find((candidate) => candidate.planItemId === item.id);
      const doneSets = entry && entry.completed ? entry.completed.filter(Boolean).length : 0;
      if (!exercise || !doneSets) return;
      volume.set(exercise.family, (volume.get(exercise.family) || 0) + doneSets);
    });
  });
  const major = ["Dos", "Pectoraux", "Jambes", "Epaules"];
  const missing = major.filter((family) => !volume.get(family));
  const low = major.filter((family) => volume.get(family) && volume.get(family) < 4);
  const messages = [];
  if (missing.length) messages.push(`${missing.join(", ")} peu ou pas travaillé cette semaine.`);
  if (low.length) messages.push(`${low.join(", ")} présent, mais volume faible.`);
  if (!messages.length) messages.push("Répartition correcte sur les grands groupes cette semaine.");
  return messages;
}

function renderCoachPanel() {
  const panel = $("#coachPanel");
  if (!panel) return;
  const template = currentTemplate();
  const progress = coachProgressSuggestions();
  const balance = coachBalanceSuggestions();
  const keyExercise = template && template.items && template.items[0] ? exerciseById(template.items[0].exerciseId) : null;
  const nutrition = state.nutrition.find((item) => item.profileId === state.activeProfileId && item.date === todayKey);
  const nutritionHint = nutrition && nutrition.adherence === "bas" ? "Nutrition basse aujourd'hui : reste prudent sur les augmentations." : "Pas de signal nutrition négatif aujourd'hui.";

  panel.innerHTML = `
    <article class="coach-card primary">
      <span>À faire aujourd'hui</span>
      <strong>${template ? escapeHtml(template.name) : "Aucune séance prévue"}</strong>
      <p>${template ? `${template.items.length} exercices. Exercice clé : ${escapeHtml((keyExercise && keyExercise.name) || "à définir")}.` : "Planifie une séance dans Builder pour recevoir des suggestions ciblées."}</p>
      <p class="hint">${nutritionHint}</p>
      ${template ? `<button class="primary-button" data-view="training" type="button">Démarrer</button>` : `<button class="small-button" data-view="builder" type="button">Aller au Builder</button>`}
    </article>

    <article class="coach-card">
      <span>Progression</span>
      <strong>Charges et objectifs</strong>
      <div class="coach-list">
        ${progress.length ? progress.map((item) => `<div><small>${escapeHtml(item.type)}</small><p>${escapeHtml(item.text)}</p></div>`).join("") : `<p class="empty">Pas encore assez d'historique pour proposer une progression.</p>`}
      </div>
    </article>

    <article class="coach-card">
      <span>Équilibre</span>
      <strong>Volume récent</strong>
      <div class="coach-list">
        ${balance.map((text) => `<div><p>${escapeHtml(text)}</p></div>`).join("")}
      </div>
    </article>
  `;
}

function render() {
  applySettings();
  renderTodayDashboard();
  renderBuilderPanes();
  renderTraining();
  renderBuilder();
  renderCalendar();
  renderTracking();
  renderNutritionPanel();
  renderCoachPanel();
  renderEquipmentFilters();
  renderProfiles();
}

function renderProfiles() {
  $("#activeProfileName").textContent = activeProfile().name || "Profil";
  const addButton = $("#addProfile");
  const list = $("#profileChoices");
  if (!list || !addButton) return;
  list.innerHTML = state.profiles.map((profile) => `
    <button class="profile-choice ${profile.id === state.activeProfileId ? "active" : ""}" data-profile-choice="${profile.id}" type="button">
      ${escapeHtml(profile.name || "Profil")}
    </button>
  `).join("");
  addButton.disabled = state.profiles.length >= 3;
}

function showView(name) {
  Object.entries(views).forEach(([viewName, view]) => {
    if (view) view.classList.toggle("active", viewName === name);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function profileManagerHtml() {
  return `
    <article class="item-card profile-manager">
      <div class="item-head">
        <div>
          <strong>Profils</strong>
          <p>Chaque profil a ses propres seances, stats et mesures.</p>
        </div>
        <span class="status-pill">${state.profiles.length}/3</span>
      </div>
      <div class="profile-bar in-tracking">
        <div>
          <p class="field-title">Profil actif</p>
          <div class="profile-choices" id="profileChoices"></div>
        </div>
        <button class="small-button" id="addProfile" type="button">Ajouter</button>
      </div>
    </article>
  `;
}

function renderBuilderPanes() {
  const paneMap = {
    sessions: "#builderSessions",
    library: "#builderLibrary",
    planner: "#builderPlanner",
  };
  Object.entries(paneMap).forEach(([mode, selector]) => $(selector).classList.toggle("active", mode === builderMode));
  document.querySelectorAll("#builderModes .segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.builderMode === builderMode);
  });
}

function renderTraining() {
  if (togetherMode) {
    renderTogetherTraining();
    return;
  }

  const template = currentTemplate();
  const log = currentLog();
  if (!template) {
    $("#trainingScreen").innerHTML = `<p class="empty">Cree une seance dans Builder pour commencer.</p>`;
    return;
  }

  if (log.finishedAt) {
    renderSessionSummary(log);
    return;
  }

  const item = currentPlanItem(log);
  if (!item) {
    renderSessionSummary(log);
    return;
  }

  const exercise = exerciseById(item.exerciseId);
  const entry = entryFor(log, item);
  const setIndex = Math.min(log.currentSetIndex, item.sets - 1);
  const target = item.targetReps[setIndex] || item.minReps;
  const progress = `${log.currentExerciseIndex + 1}/${template.items.length}`;
  const timerMood = sessionUi.phase === "rest" && sessionUi.restRemaining <= 3 ? "timer-danger" : sessionUi.phase === "rest" && sessionUi.restRemaining <= 10 ? "timer-warning" : "";

  $("#trainingScreen").innerHTML = `
    <section class="together-panel compact">
      <div>
        <strong>Training Together</strong>
        <p>Ajouter un deuxieme profil a cette seance.</p>
      </div>
      <div class="training-control-row">
        ${soundButtonHtml()}
        <button class="small-button update-button" data-together-toggle type="button">Activer</button>
      </div>
    </section>

    <section class="training-hero">
      <div class="training-topline">
        <span>${escapeHtml(template.name)}</span>
        <span>${t("exercise")} ${progress}</span>
      </div>
      <h2>${escapeHtml(entry.performedExerciseName)}</h2>
      <p>${escapeHtml(exercise && exercise.family)} - ${escapeHtml(exercise && exercise.equipment)} - ${entry.weight} ${state.settings.weightUnit}</p>
    </section>

    <section class="set-status-row">
      ${entry.completed.map((done, index) => `
        <button class="set-pill ${done ? "done" : index === setIndex ? "current" : ""}" data-jump-set="${index}" type="button">
          <span>S${index + 1}</span>
          <strong>${entry.reps[index] || item.targetReps[index]}</strong>
        </button>
      `).join("")}
    </section>

    <section class="go-panel ${timerMood}">
      <p class="label">${sessionUi.phase === "rest" ? t("rest") : t("currentSet")}</p>
      <div class="rest-line ${sessionUi.phase === "rest" ? "active" : ""}">
        ${sessionUi.phase === "rest" ? `<button class="timer-adjust" data-rest-adjust="-5" type="button">-5</button>` : ""}
        <div class="rep-target">${sessionUi.phase === "rest" ? formatTime(sessionUi.restRemaining) : `${target} reps`}</div>
        ${sessionUi.phase === "rest" ? `<button class="timer-adjust" data-rest-adjust="5" type="button">+5</button>` : ""}
      </div>
      <input class="rep-input" id="activeRepInput" inputmode="numeric" type="number" min="0" value="${escapeHtml(entry.reps[setIndex] || target)}" aria-label="Reps realisees">
      <button class="go-button ${sessionUi.phase === "rest" ? "resting" : ""}" id="goButton" type="button">${sessionUi.phase === "rest" ? t("skip") : "GO"}</button>
    </section>

    <section class="training-actions">
      <button class="small-button" data-alternative="${item.id}" type="button">${t("unavailable")}</button>
      <button class="small-button" id="skipExercise" type="button">${t("nextExercise")}</button>
    </section>

    <button class="finish-fab" id="finishWorkout" type="button">${t("finishSession")}</button>
  `;
}

function renderTogetherControls(template) {
  const selected = new Set(togetherProfileIds);
  return `
    <section class="together-panel">
      <div class="item-head">
        <div>
          <strong>Training Together</strong>
          <p>2 profils max, chacun garde ses perfs et son timer.</p>
        </div>
        <div class="training-control-row">
          ${soundButtonHtml()}
          <button class="small-button update-button" data-together-toggle type="button">Mode solo</button>
        </div>
      </div>
      <div class="profile-choices together-choices">
        ${state.profiles.map((profile) => `
          <button class="profile-choice ${selected.has(profile.id) ? "active" : ""}" data-together-profile="${profile.id}" type="button">
            ${escapeHtml(profile.name || "Profil")}
          </button>
        `).join("")}
      </div>
      <p class="hint">${escapeHtml(template ? template.name : "Aucune seance")} servira de base commune. Les donnees restent separees par profil.</p>
    </section>
  `;
}

function renderTogetherTraining() {
  if (!togetherProfileIds.includes(state.activeProfileId)) togetherProfileIds.unshift(state.activeProfileId);
  togetherProfileIds = togetherProfileIds.filter((profileId, index, list) => state.profiles.some((profile) => profile.id === profileId) && list.indexOf(profileId) === index).slice(0, 2);
  if (!togetherProfileIds.length) togetherProfileIds = [state.activeProfileId];

  const template = currentTemplate();
  if (!template) {
    $("#trainingScreen").innerHTML = `
      ${renderTogetherControls(null)}
      <p class="empty">Cree une seance dans Builder pour commencer.</p>
    `;
    return;
  }

  $("#trainingScreen").innerHTML = `
    ${renderTogetherControls(template)}
    <section class="together-grid">
      ${togetherProfileIds.map((profileId) => renderTogetherProfileCard(profileId, template)).join("")}
    </section>
    <button class="finish-fab" data-finish-together type="button">${t("finishSession")}</button>
  `;
}

function renderTogetherProfileCard(profileId, template) {
  const log = currentLogForProfile(profileId, template.id);
  if (log.finishedAt) {
    const stats = logStats(log);
    return `
      <article class="together-card done-card">
        <div class="training-topline">
          <span>${escapeHtml(profileNameById(profileId))}</span>
          <span>Terminee</span>
        </div>
        <h2>${Math.round(stats.tonnage)} kg</h2>
        <p>${stats.calories} kcal estimees</p>
      </article>
    `;
  }

  const item = currentPlanItem(log);
  if (!item) {
    finishLog(log, null);
    return renderTogetherProfileCard(profileId, template);
  }

  const ui = togetherUi(profileId);
  const exercise = exerciseById(item.exerciseId);
  const entry = entryFor(log, item);
  const setIndex = Math.min(log.currentSetIndex, item.sets - 1);
  const target = item.targetReps[setIndex] || item.minReps;
  const progress = `${log.currentExerciseIndex + 1}/${template.items.length}`;
  const timerMood = ui.phase === "rest" && ui.restRemaining <= 3 ? "timer-danger" : ui.phase === "rest" && ui.restRemaining <= 10 ? "timer-warning" : "";

  return `
    <article class="together-card ${timerMood}">
      <div class="training-topline">
        <span>${escapeHtml(profileNameById(profileId))}</span>
        <span>${t("exercise")} ${progress}</span>
      </div>
      <h2>${escapeHtml(entry.performedExerciseName)}</h2>
      <p>${escapeHtml(exercise && exercise.family)} - ${entry.weight} ${state.settings.weightUnit}</p>
      <div class="mini-set-row">
        ${entry.completed.map((done, index) => `
          <button class="set-dot ${done ? "done" : index === setIndex ? "current" : ""}" data-together-jump-set="${profileId}:${index}" type="button">
            <span>S${index + 1}</span>
            <strong>${entry.reps[index] || item.targetReps[index]}</strong>
          </button>
        `).join("")}
      </div>
      <div class="rest-line ${ui.phase === "rest" ? "active" : ""}">
        ${ui.phase === "rest" ? `<button class="timer-adjust" data-together-rest-adjust="${profileId}:-5" type="button">-5</button>` : ""}
        <div class="rep-target compact">${ui.phase === "rest" ? formatTime(ui.restRemaining) : `${target} reps`}</div>
        ${ui.phase === "rest" ? `<button class="timer-adjust" data-together-rest-adjust="${profileId}:5" type="button">+5</button>` : ""}
      </div>
      <input class="rep-input" data-together-reps="${profileId}" inputmode="numeric" type="number" min="0" value="${escapeHtml(entry.reps[setIndex] || target)}" aria-label="Reps realisees ${escapeHtml(profileNameById(profileId))}">
      <button class="go-button together-go ${ui.phase === "rest" ? "resting" : ""}" data-together-go="${profileId}" type="button">${ui.phase === "rest" ? t("skip") : "GO"}</button>
    </article>
  `;
}

function renderSessionSummary(log) {
  const stats = logStats(log);
  $("#trainingScreen").innerHTML = `
    <section class="summary-panel">
      <p class="label">Seance terminee</p>
      <div class="celebration-mark">FORGE COMPLETE</div>
      <h2>${escapeHtml((templateById(log.templateId) && templateById(log.templateId).name) || "Seance")}</h2>
      <p class="congrats">Belle séance. Tu as posé une brique de plus, proprement.</p>
      <div class="summary-grid">
        <div><span>Tonnage</span><strong>${Math.round(stats.tonnage)} kg</strong></div>
        <div><span>Calories estimees</span><strong>${stats.calories} kcal</strong></div>
      </div>
      <div class="stack">
        ${stats.perExercise.map((item) => `
          <article class="summary-row">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${Math.round(item.tonnage)} kg - ${item.calories} kcal</span>
          </article>
        `).join("")}
      </div>
      ${log.exitReason ? `<p class="hint">Sortie anticipee : ${escapeHtml(log.exitReason)}</p>` : ""}
      <button class="primary-button" id="newSession" type="button">Nouvelle seance</button>
    </section>
  `;
}

function renderBuilder() {
  const templates = profileTemplates();
  $("#scheduleTemplate").innerHTML = templates.map((template) => `<option value="${template.id}">${escapeHtml(template.name)}</option>`).join("");
  $("#templateList").innerHTML = templates.map((template) => `
    <article class="item-card builder-card">
      <div class="item-head">
        <strong>${escapeHtml(template.name)}</strong>
        <span class="status-pill">${template.items.length} exos</span>
      </div>
      <form class="mini-grid" data-add-item="${template.id}">
        <label class="exercise-pick">Exercice<select name="exerciseId">${state.exercises.map((exercise) => `<option value="${exercise.id}">${escapeHtml(exercise.name)}</option>`).join("")}</select></label>
        <label>Series<input name="sets" inputmode="numeric" min="1" type="number" value="4"></label>
        <label>Rep min<input name="minReps" inputmode="numeric" min="1" type="number" value="8"></label>
        <label>Rep max<input name="maxReps" inputmode="numeric" min="1" type="number" value="12"></label>
        <label>Kg<input name="weight" inputmode="decimal" min="0" step="0.5" type="number" value="40"></label>
        <label>+ kg<input name="increment" inputmode="decimal" min="0" step="0.5" type="number" value="2.5"></label>
        <button class="small-button" type="submit">Ajouter</button>
      </form>
      <div class="template-items">
        ${template.items.map((item) => {
          const exercise = exerciseById(item.exerciseId);
          return `<div class="set-row"><span>${escapeHtml(exercise && exercise.name)} - ${item.sets} series - ${item.minReps}/${item.maxReps} reps - ${item.weight} kg</span><button class="small-button danger" data-remove-item="${template.id}:${item.id}" type="button">Suppr.</button></div>`;
        }).join("")}
      </div>
    </article>
  `).join("");

  const exercises = state.exercises.filter((item) => {
    const equipmentMatch = equipmentFilter === "Tous" || item.equipment === equipmentFilter;
    const muscleMatch = muscleFilter === "Tous" || item.family === muscleFilter;
    return equipmentMatch && muscleMatch;
  });
  $("#exerciseLibrary").innerHTML = exercises.map((exercise) => `
    <article class="item-card exercise-card">
      <div>
        <strong>${escapeHtml(exercise.name)}</strong>
        <p>${escapeHtml(exercise.family)} - ${escapeHtml(exercise.equipment)} - repos ${restLabel(exercise.rest)}</p>
      </div>
      <p class="hint">Alternatives : ${exercise.alternatives.map(escapeHtml).join(", ") || "aucune"}</p>
    </article>
  `).join("");
}

function renderEquipmentFilters() {
  const types = ["Tous", ...new Set(state.exercises.map((item) => item.equipment))];
  $("#equipmentFilters").innerHTML = types.map((type) => `<button class="filter-chip ${type === equipmentFilter ? "active" : ""}" data-equipment="${escapeHtml(type)}" type="button">${escapeHtml(type)}</button>`).join("");
  const muscles = ["Tous", ...new Set(state.exercises.map((item) => item.family).filter(Boolean))];
  $("#muscleFilters").innerHTML = muscles.map((muscle) => `<button class="filter-chip ${muscle === muscleFilter ? "active" : ""}" data-muscle="${escapeHtml(muscle)}" type="button">${escapeHtml(muscle)}</button>`).join("");
  $("#settingsTheme").value = state.settings.theme;
  $("#settingsMode").value = state.settings.mode || "dark";
  $("#settingsWeightUnit").value = state.settings.weightUnit;
  $("#settingsLengthUnit").value = state.settings.lengthUnit;
}

function renderCalendar() {
  $("#scheduleDate").value ||= todayKey;
  if (calendarMode === "week") return renderWeekCalendar();
  if (calendarMode === "planner") return renderPlannerCalendar();
  const items = [...profileSchedule()].sort((a, b) => a.date.localeCompare(b.date));
  $("#calendarList").innerHTML = items.map((item) => {
    const template = templateById(item.templateId);
    return `<article class="item-card set-row"><span>${item.date} - ${escapeHtml(template && template.name)}${item.repeatWeekly ? " - chaque semaine" : ""}</span><button class="small-button danger" data-delete-schedule="${item.id}" type="button">Suppr.</button></article>`;
  }).join("") || `<p class="empty">Aucune seance planifiee.</p>`;
}

function renderWeekCalendar() {
  const start = new Date(`${todayKey}T12:00:00`);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  $("#calendarList").innerHTML = `<div class="week-grid">${days.map((date) => {
    const key = localDateKey(date);
    const planned = scheduledFor(key);
    return `<article class="day-card ${key === todayKey ? "today" : ""}"><span>${date.toLocaleDateString("fr-FR", { weekday: "short" })}</span><strong>${date.getDate()}</strong>${planned.map((item) => `<p>${escapeHtml((templateById(item.templateId) && templateById(item.templateId).name) || "Seance")}</p>`).join("") || `<p>Repos</p>`}</article>`;
  }).join("")}</div>`;
}

function renderPlannerCalendar() {
  const upcoming = Array.from({ length: 21 }, (_, index) => {
    const date = new Date(`${todayKey}T12:00:00`);
    date.setDate(date.getDate() + index);
    return date;
  });
  $("#calendarList").innerHTML = upcoming.map((date) => {
    const key = localDateKey(date);
    const planned = scheduledFor(key);
    if (!planned.length) return "";
    return `<article class="planner-row"><div><span>${date.toLocaleDateString("fr-FR", { weekday: "long" })}</span><strong>${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</strong></div><div class="planner-sessions">${planned.map((item) => `<span>${escapeHtml((templateById(item.templateId) && templateById(item.templateId).name) || "Seance")}</span>`).join("")}</div></article>`;
  }).join("") || `<p class="empty">Aucune seance dans les 3 prochaines semaines.</p>`;
}

function renderTracking() {
  if (trackingMode === "health") {
    const profile = activeProfile();
    const profileAge = ageFromBirthDate(profile.birthDate);
    $("#trackingPanel").innerHTML = `
      ${profileManagerHtml()}

      <article class="item-card">
        <div class="item-head">
          <div>
            <strong>Profil</strong>
            <p>${profile.height || "-"} cm${profileAge ? ` - ${profileAge} ans` : ""}</p>
          </div>
        </div>
        <form class="input-grid compact-form" id="profileForm">
          <label>Nom<input id="profileName" value="${escapeHtml(profile.name || "")}" placeholder="Profil principal"></label>
          <label>Date de naissance<input id="profileBirthDate" type="date" value="${escapeHtml(profile.birthDate || "")}"></label>
          <label>Taille cm<input id="profileHeight" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(profile.height || "")}" placeholder="178"></label>
          <button class="primary-button align-end" type="submit">Sauver profil</button>
        </form>
      </article>

      <form class="input-grid compact-form" id="healthForm">
        <input id="healthEditId" type="hidden">
        <label>Poids kg<input id="healthWeight" inputmode="decimal" type="number" step="0.1" placeholder="82.5"></label>
        <label>Bodyfat %<input id="healthBodyfat" inputmode="decimal" type="number" step="0.1" placeholder="15"></label>
        <label>Tour taille cm<input id="healthWaist" inputmode="decimal" type="number" step="0.1" placeholder="84"></label>
        <label>Poitrine cm<input id="healthChest" inputmode="decimal" type="number" step="0.1" placeholder="105"></label>
        <label>Carre epaules cm<input id="healthShoulders" inputmode="decimal" type="number" step="0.1" placeholder="118"></label>
        <label>Biceps D contracte<input id="healthBicepsRight" inputmode="decimal" type="number" step="0.1" placeholder="38"></label>
        <label>Biceps G contracte<input id="healthBicepsLeft" inputmode="decimal" type="number" step="0.1" placeholder="37.5"></label>
        <label>Avant-bras D<input id="healthForearmRight" inputmode="decimal" type="number" step="0.1" placeholder="30"></label>
        <label>Avant-bras G<input id="healthForearmLeft" inputmode="decimal" type="number" step="0.1" placeholder="29.5"></label>
        <label>Cuisse D<input id="healthThighRight" inputmode="decimal" type="number" step="0.1" placeholder="61"></label>
        <label>Cuisse G<input id="healthThighLeft" inputmode="decimal" type="number" step="0.1" placeholder="60.5"></label>
        <label>Mollet D<input id="healthCalfRight" inputmode="decimal" type="number" step="0.1" placeholder="39"></label>
        <label>Mollet G<input id="healthCalfLeft" inputmode="decimal" type="number" step="0.1" placeholder="38.5"></label>
        <button class="primary-button align-end" type="submit">Enregistrer</button>
      </form>
      <div class="stack">${profileHealth().map((item) => renderHealthEntry(item)).join("") || `<p class="empty">Aucune donnee health.</p>`}</div>
    `;
    renderProfiles();
    return;
  }

  const completed = profileLogs().filter((log) => log.entries.some((entry) => entry.completed && entry.completed.some(Boolean)));
  const rms = bestOneRms();
  $("#trackingPanel").innerHTML = `
    <section class="stack">
      ${profileManagerHtml()}
      <article class="item-card">
        <div class="item-head">
          <strong>RM estimees</strong>
          <span class="status-pill">${rms.length} exos</span>
        </div>
        <div class="rm-grid">
          ${rms.map((item) => `<div><span>${escapeHtml(item.name)}</span><strong>${Math.round(item.rm)} kg</strong><p>${item.weight} kg x ${item.reps}</p></div>`).join("") || `<p class="empty">Aucune RM estimee pour l'instant.</p>`}
        </div>
      </article>
      ${completed.length ? completed.map((log) => {
    const stats = logStats(log);
    return `<article class="item-card"><strong>${log.date} - ${escapeHtml((templateById(log.templateId) && templateById(log.templateId).name) || "Seance")}</strong><div class="summary-grid"><div><span>Tonnage</span><strong>${Math.round(stats.tonnage)} kg</strong></div><div><span>Calories</span><strong>${stats.calories} kcal</strong></div></div>${stats.perExercise.map((item) => `<p>${escapeHtml(item.name)} - ${Math.round(item.tonnage)} kg</p>`).join("")}</article>`;
  }).join("") : `<p class="empty">Les performances apparaitront apres tes seances.</p>`}
    </section>
  `;
  renderProfiles();
}

function renderHealthEntry(item) {
  const parts = [
    `${item.weight || "-"} kg`,
    `${item.bodyfat || "-"}% BF`,
    `taille ${item.waist || "-"}`,
    `poitrine ${item.chest || "-"}`,
    `epaules ${item.shoulders || "-"}`,
    `bras D/G ${item.bicepsRight || "-"}/${item.bicepsLeft || "-"}`,
    `avant-bras D/G ${item.forearmRight || "-"}/${item.forearmLeft || "-"}`,
    `cuisses D/G ${item.thighRight || "-"}/${item.thighLeft || "-"}`,
    `mollets D/G ${item.calfRight || "-"}/${item.calfLeft || "-"}`,
  ];
  return `<article class="item-card health-entry"><div class="item-head"><strong>${item.date}</strong><button class="small-button" data-edit-health="${item.id}" type="button">Modifier</button></div><p>${parts.join(" - ")}</p></article>`;
}

function bestOneRms() {
  const best = new Map();
  profileLogs().forEach((log) => {
    log.entries.forEach((entry) => {
      (entry.reps || []).forEach((reps) => {
        const rm = estimateOneRm(entry.weight, reps);
        if (!rm) return;
        const previous = best.get(entry.performedExerciseName);
        if (!previous || rm > previous.rm) {
          best.set(entry.performedExerciseName, { name: entry.performedExerciseName, rm, weight: entry.weight, reps });
        }
      });
    });
  });
  return [...best.values()].sort((a, b) => b.rm - a.rm);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function startRest(seconds) {
  clearInterval(sessionUi.restTimer);
  sessionUi.phase = "rest";
  sessionUi.restRemaining = seconds;
  sessionUi.restTimer = setInterval(() => {
    sessionUi.restRemaining = Math.max(0, sessionUi.restRemaining - 1);
    handleTimerSound(sessionUi.restRemaining);
    if (sessionUi.restRemaining === 0) {
      clearInterval(sessionUi.restTimer);
      sessionUi.phase = "ready";
      if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
    }
    renderTraining();
  }, 1000);
}

function togetherUi(profileId) {
  if (!sessionUi.together[profileId]) {
    sessionUi.together[profileId] = {
      phase: "ready",
      restRemaining: 0,
      restTimer: null,
    };
  }
  return sessionUi.together[profileId];
}

function startTogetherRest(profileId, seconds) {
  const ui = togetherUi(profileId);
  clearInterval(ui.restTimer);
  ui.phase = "rest";
  ui.restRemaining = seconds;
  ui.restTimer = setInterval(() => {
    ui.restRemaining = Math.max(0, ui.restRemaining - 1);
    handleTimerSound(ui.restRemaining);
    if (ui.restRemaining === 0) {
      clearInterval(ui.restTimer);
      ui.phase = "ready";
      if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
    }
    renderTraining();
  }, 1000);
}

function clearTogetherTimers() {
  Object.values(sessionUi.together).forEach((ui) => clearInterval(ui.restTimer));
  sessionUi.together = {};
}

function completeCurrentSet() {
  const log = currentLog();
  const item = currentPlanItem(log);
  if (!item) return;
  const entry = entryFor(log, item);
  const repsInput = $("#activeRepInput");
  const reps = Number((repsInput && repsInput.value) || item.targetReps[log.currentSetIndex] || item.minReps);
  entry.reps[log.currentSetIndex] = reps;
  entry.completed[log.currentSetIndex] = true;

  if (log.currentSetIndex < item.sets - 1) {
    log.currentSetIndex += 1;
    startRest((exerciseById(item.exerciseId) && exerciseById(item.exerciseId).rest) || 120);
  } else {
    log.currentExerciseIndex += 1;
    log.currentSetIndex = 0;
    sessionUi.phase = "ready";
    if (!currentPlanItem(log)) finishLog(log, null);
  }
  saveState();
  render();
}

function completeTogetherSet(profileId) {
  const template = currentTemplate();
  if (!template) return;
  const log = currentLogForProfile(profileId, template.id);
  const item = currentPlanItem(log);
  if (!item) return;
  const entry = entryFor(log, item);
  const input = document.querySelector(`[data-together-reps="${profileId}"]`);
  const reps = Number((input && input.value) || item.targetReps[log.currentSetIndex] || item.minReps);
  entry.reps[log.currentSetIndex] = reps;
  entry.completed[log.currentSetIndex] = true;

  if (log.currentSetIndex < item.sets - 1) {
    log.currentSetIndex += 1;
    startTogetherRest(profileId, (exerciseById(item.exerciseId) && exerciseById(item.exerciseId).rest) || 120);
  } else {
    log.currentExerciseIndex += 1;
    log.currentSetIndex = 0;
    const ui = togetherUi(profileId);
    ui.phase = "ready";
    if (!currentPlanItem(log)) finishLog(log, null);
  }
  saveState();
  renderTraining();
}

function finishLog(log, reason) {
  clearInterval(sessionUi.restTimer);
  sessionUi.phase = "ready";
  log.finishedAt = new Date().toISOString();
  log.exitReason = reason;
  applyProgression(log);
  saveState();
}

function applyProgression(log) {
  const template = templateById(log.templateId);
  if (!template || !template.items) return;
  if (template.profileId && template.profileId !== log.profileId) return;
  template.items.forEach((item) => {
    const entry = log.entries.find((candidate) => candidate.planItemId === item.id);
    if (!entry) return;
    const next = nextTarget(item, entry.reps);
    item.weight = next.weight;
    item.targetReps = next.targetReps;
  });
}

function openAlternativeDialog(planItemId) {
  activeExercisePlanId = planItemId;
  selectedAlternativeName = "";
  const log = currentLog();
  const template = templateById(log.templateId);
  const item = template.items.find((candidate) => candidate.id === planItemId);
  const entry = entryFor(log, item);
  const exerciseItem = exerciseById(item.exerciseId);
  $("#alternativeHelp").textContent = exerciseItem.name;
  $("#alternativeList").innerHTML = exerciseItem.alternatives.map((name) => `<button class="small-button" data-select-alternative="${escapeHtml(name)}" type="button">${escapeHtml(name)}</button>`).join("") || `<p class="empty">${t("noAlternative")}</p>`;
  $("#alternativeWeight").value = entry.weight || item.weight || "";
  $("#alternativeWeight").previousSibling.textContent = t("usedWeight");
  $("#alternativeDialog").showModal();
}

function updatePwaStatus(message) {
  const status = $("#pwaStatus");
  if (!status) return;
  if (message) {
    status.textContent = message;
    return;
  }
  const offlineReady = "serviceWorker" in navigator && navigator.serviceWorker.controller;
  if (offlineReady) {
    status.textContent = "Disponible hors ligne apres la premiere ouverture complete.";
  } else if ("serviceWorker" in navigator) {
    status.textContent = "Installation hors ligne en preparation. Recharge l'app une fois si besoin.";
  } else {
    status.textContent = "Hors ligne indisponible sur cette adresse. Il faudra le lien HTTPS de la PWA.";
  }
}

function updateDataStatus(message) {
  const status = $("#dataStatus");
  if (status) status.textContent = message || "Les donnees restent sur ce telephone. Garde un export en securite.";
}

function updateVersionLabels() {
  const versionBadge = $("#appVersionBadge");
  const dataPill = $("#dataVersionPill");
  if (versionBadge) versionBadge.textContent = appVersion;
  if (dataPill) dataPill.textContent = `Data V${dataSchemaVersion}`;
}

function showUpdateAvailable() {
  const button = $("#applyUpdateButton");
  if (button) button.hidden = false;
  updatePwaStatus("Une mise a jour est prete. Installe-la puis l'app redemarrera.");
}

function exportData() {
  saveState();
  const profile = activeProfile();
  const payload = {
    app: "AERSTRONG",
    appVersion,
    storageKey,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const safeName = String(profile.name || "profil").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "profil";
  link.href = URL.createObjectURL(blob);
  link.download = `aerstrong-${safeName}-${todayKey}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  updateDataStatus("Export cree. Garde ce fichier comme sauvegarde.");
}

function importDataFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const imported = parsed.data || parsed;
      if (!imported || !imported.exercises || !imported.templates) {
        updateDataStatus("Import refuse : ce fichier ne ressemble pas a une sauvegarde AERSTRONG.");
        return;
      }
      const normalized = normalizeState(imported);
      Object.keys(state).forEach((key) => delete state[key]);
      Object.assign(state, normalized);
      saveState();
      clearInterval(sessionUi.restTimer);
      sessionUi.phase = "ready";
      updateDataStatus("Import termine. Les donnees ont ete restaurees sur ce telephone.");
      render();
    } catch (error) {
      updateDataStatus("Import impossible : fichier illisible ou corrompu.");
    }
  };
  reader.readAsText(file);
}

document.querySelector("main").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  showView(button.dataset.view);
});

$("#builderModes").addEventListener("click", (event) => {
  const button = event.target.closest("[data-builder-mode]");
  if (!button) return;
  builderMode = button.dataset.builderMode;
  renderBuilderPanes();
});

$("#openSettings").addEventListener("click", () => {
  updateVersionLabels();
  updatePwaStatus();
  updateDataStatus();
  $("#settingsTheme").value = state.settings.theme;
  $("#settingsMode").value = state.settings.mode || "dark";
  $("#settingsWeightUnit").value = state.settings.weightUnit;
  $("#settingsLengthUnit").value = state.settings.lengthUnit;
  $("#settingsDialog").showModal();
});

$("#trainingScreen").addEventListener("click", (event) => {
  const soundToggle = event.target.closest("[data-sound-toggle]");
  if (soundToggle) {
    state.settings.soundMuted = !(state.settings && state.settings.soundMuted);
    if (!state.settings.soundMuted) {
      ensureAudioContext();
      playTimerBeep("done");
    }
    saveState();
    renderTraining();
    return;
  }

  if (event.target.closest("[data-together-toggle]")) {
    togetherMode = !togetherMode;
    if (togetherMode) {
      togetherProfileIds = [state.activeProfileId];
    } else {
      clearTogetherTimers();
    }
    renderTraining();
    return;
  }

  const togetherProfile = event.target.closest("[data-together-profile]");
  if (togetherProfile) {
    const profileId = togetherProfile.dataset.togetherProfile;
    if (togetherProfileIds.includes(profileId)) {
      if (togetherProfileIds.length > 1) togetherProfileIds = togetherProfileIds.filter((item) => item !== profileId);
    } else if (togetherProfileIds.length < 2) {
      togetherProfileIds.push(profileId);
    }
    renderTraining();
    return;
  }

  const togetherRestAdjust = event.target.closest("[data-together-rest-adjust]");
  if (togetherRestAdjust) {
    const [profileId, amount] = togetherRestAdjust.dataset.togetherRestAdjust.split(":");
    const ui = togetherUi(profileId);
    ui.restRemaining = Math.max(0, ui.restRemaining + Number(amount));
    renderTraining();
    return;
  }

  const togetherGo = event.target.closest("[data-together-go]");
  if (togetherGo) {
    ensureAudioContext();
    const profileId = togetherGo.dataset.togetherGo;
    const ui = togetherUi(profileId);
    if (ui.phase === "rest") {
      clearInterval(ui.restTimer);
      ui.phase = "ready";
      renderTraining();
    } else {
      completeTogetherSet(profileId);
    }
    return;
  }

  const togetherSet = event.target.closest("[data-together-jump-set]");
  if (togetherSet) {
    const [profileId, setIndex] = togetherSet.dataset.togetherJumpSet.split(":");
    const template = currentTemplate();
    const log = currentLogForProfile(profileId, template.id);
    log.currentSetIndex = Number(setIndex);
    const ui = togetherUi(profileId);
    ui.phase = "ready";
    saveState();
    renderTraining();
    return;
  }

  if (event.target.closest("[data-finish-together]")) {
    const template = currentTemplate();
    togetherProfileIds.forEach((profileId) => {
      const log = currentLogForProfile(profileId, template.id);
      if (!log.finishedAt) finishLog(log, isLogComplete(log) ? null : "seance arretee en mode ensemble");
    });
    clearTogetherTimers();
    renderTraining();
    return;
  }

  const restAdjust = event.target.closest("[data-rest-adjust]");
  if (restAdjust) {
    sessionUi.restRemaining = Math.max(0, sessionUi.restRemaining + Number(restAdjust.dataset.restAdjust));
    renderTraining();
    return;
  }

  if (event.target.closest("#goButton")) {
    ensureAudioContext();
    if (sessionUi.phase === "rest") {
      clearInterval(sessionUi.restTimer);
      sessionUi.phase = "ready";
      renderTraining();
    } else {
      completeCurrentSet();
    }
  }

  const setButton = event.target.closest("[data-jump-set]");
  if (setButton) {
    currentLog().currentSetIndex = Number(setButton.dataset.jumpSet);
    sessionUi.phase = "ready";
    saveState();
    renderTraining();
  }

  const alternative = event.target.closest("[data-alternative]");
  if (alternative) openAlternativeDialog(alternative.dataset.alternative);

  if (event.target.closest("#skipExercise")) {
    const log = currentLog();
    log.currentExerciseIndex += 1;
    log.currentSetIndex = 0;
    saveState();
    render();
  }

  if (event.target.closest("#finishWorkout")) {
    const log = currentLog();
    if (isLogComplete(log)) {
      finishLog(log, null);
      render();
    } else {
      $("#exitDialog").showModal();
    }
  }

  if (event.target.closest("#newSession")) {
    currentLog().archived = true;
    saveState();
    render();
  }
});

$("#exitDialog").addEventListener("click", (event) => {
  const button = event.target.closest("[data-exit-reason]");
  if (!button) return;
  finishLog(currentLog(), button.dataset.exitReason === "terminee" ? null : button.dataset.exitReason);
  $("#exitDialog").close();
  render();
});

$("#alternativeList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-select-alternative]");
  if (!button || !activeExercisePlanId) return;
  selectedAlternativeName = button.dataset.selectAlternative;
  document.querySelectorAll("[data-select-alternative]").forEach((item) => item.classList.toggle("active-choice", item === button));
});

$("#confirmAlternative").addEventListener("click", () => {
  if (!activeExercisePlanId || !selectedAlternativeName) return;
  const log = currentLog();
  const template = templateById(log.templateId);
  const item = template.items.find((candidate) => candidate.id === activeExercisePlanId);
  const entry = entryFor(log, item);
  entry.performedExerciseName = selectedAlternativeName;
  entry.weight = Number($("#alternativeWeight").value || entry.weight || item.weight || 0);
  state.substitutions[item.exerciseId] = { name: selectedAlternativeName, weight: entry.weight };
  $("#alternativeDialog").close();
  activeExercisePlanId = null;
  selectedAlternativeName = "";
  saveState();
  render();
});

$("#templateForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.templates.push({ id: id(), profileId: state.activeProfileId, name: $("#templateName").value.trim().toUpperCase(), items: [] });
  event.target.reset();
  saveState();
  render();
});

$("#exerciseForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.exercises.push(exercise(id(), $("#exerciseName").value.trim(), $("#exerciseFamily").value.trim(), $("#exerciseEquipment").value, parseRestInput($("#exerciseRest").value), $("#exerciseAlternatives").value.split(",").map((item) => item.trim()).filter(Boolean)));
  event.target.reset();
  $("#exerciseRest").value = "2:00";
  saveState();
  render();
});

$("#settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings = {
    theme: $("#settingsTheme").value,
    mode: $("#settingsMode").value,
    weightUnit: $("#settingsWeightUnit").value,
    lengthUnit: $("#settingsLengthUnit").value,
    soundMuted: !!state.settings.soundMuted,
  };
  saveState();
  $("#settingsDialog").close();
  render();
});

function openOnboardingAfterWelcome() {
  if (state.onboardingComplete) return;
  const dialog = $("#onboardingDialog");
  if (dialog && dialog.showModal) dialog.showModal();
}

$("#acceptWelcome").addEventListener("click", () => {
  state.welcomeAccepted = true;
  saveState();
  $("#welcomeDialog").close();
  openOnboardingAfterWelcome();
});

$("#learnMoreWelcome").addEventListener("click", () => {
  aboutFromWelcome = true;
  $("#welcomeDialog").close();
  $("#aboutDialog").showModal();
});

$("#acceptAbout").addEventListener("click", () => {
  $("#aboutDialog").close();
  if (aboutFromWelcome || !state.welcomeAccepted) {
    aboutFromWelcome = false;
    state.welcomeAccepted = true;
    saveState();
    openOnboardingAfterWelcome();
  }
});

$("#openAbout").addEventListener("click", () => {
  aboutFromWelcome = false;
  $("#aboutDialog").showModal();
});

if ($("#plusOpenAbout")) {
  $("#plusOpenAbout").addEventListener("click", () => {
    aboutFromWelcome = false;
    $("#aboutDialog").showModal();
  });
}

if ($("#plusOpenSettings")) {
  $("#plusOpenSettings").addEventListener("click", () => {
    $("#openSettings").click();
  });
}

$("#openNutrition").addEventListener("click", () => {
  showView("nutrition");
  renderNutritionPanel();
  if (!state.nutritionIntroSeen) $("#nutritionIntroDialog").showModal();
});

$("#openCoach").addEventListener("click", () => {
  showView("coach");
  renderCoachPanel();
});

$("#acceptNutritionIntro").addEventListener("click", () => {
  state.nutritionIntroSeen = true;
  saveState();
  $("#nutritionIntroDialog").close();
});

$("#nutritionPanel").addEventListener("submit", (event) => {
  const todayForm = event.target.closest("#nutritionTodayForm");
  const settingsForm = event.target.closest("#nutritionSettingsForm");
  if (!todayForm && !settingsForm) return;
  event.preventDefault();

  if (todayForm) {
    const entry = todayNutritionEntry();
    entry.adherence = $("#nutritionAdherence").value;
    entry.proteinHit = $("#nutritionProteinHit").checked;
    entry.water = $("#nutritionWater").value;
    entry.weight = $("#nutritionWeight").value;
    entry.note = $("#nutritionNote").value;
  }

  if (settingsForm) {
    const settings = nutritionSettings();
    settings.goal = $("#nutritionGoal").value;
    settings.currentWeight = $("#nutritionCurrentWeight").value;
    settings.targetWeight = $("#nutritionTargetWeight").value;
    settings.caloriesTarget = $("#nutritionCaloriesTarget").value;
    settings.proteinTarget = $("#nutritionProteinTarget").value;
    settings.waterTarget = $("#nutritionWaterTarget").value;
  }

  saveState();
  renderNutritionPanel();
});

function selectedOnboardingDays() {
  return [...document.querySelectorAll("[name='onboardingDays']:checked")].map((item) => Number(item.value));
}

function completeOnboarding(generateProgram) {
  const profile = activeProfile();
  profile.name = $("#onboardingName").value.trim() || profile.name || "Profil principal";
  profile.birthDate = $("#onboardingBirthDate").value || profile.birthDate || "";
  profile.height = $("#onboardingHeight").value || profile.height || "";

  const health = {
    weight: $("#onboardingWeight").value,
    bodyfat: $("#onboardingBodyfat").value,
    waist: $("#onboardingWaist").value,
  };
  if (health.weight || health.bodyfat || health.waist) {
    state.health.unshift({ id: id(), profileId: state.activeProfileId, date: todayKey, ...health });
  }

  if (generateProgram) {
    generateOnboardingProgram($("#onboardingGoal").value, Number($("#onboardingFrequency").value), selectedOnboardingDays());
  } else {
    state.templates = state.templates.filter((template) => template.profileId !== state.activeProfileId);
    state.schedule = state.schedule.filter((item) => item.profileId !== state.activeProfileId);
  }

  state.onboardingComplete = true;
  saveState();
  $("#onboardingDialog").close();
  render();
}

$("#onboardingForm").addEventListener("submit", (event) => {
  event.preventDefault();
  completeOnboarding(true);
});

$("#skipOnboarding").addEventListener("click", () => {
  completeOnboarding(false);
});

$("#exportDataButton").addEventListener("click", () => {
  exportData();
});

$("#importDataInput").addEventListener("change", (event) => {
  importDataFile(event.target.files && event.target.files[0]);
  event.target.value = "";
});

$("#checkUpdateButton").addEventListener("click", async () => {
  if (!swRegistration) {
    updatePwaStatus("Aucun service de mise a jour actif sur cette adresse.");
    return;
  }
  updatePwaStatus("Verification de mise a jour...");
  try {
    await swRegistration.update();
    if (swRegistration.waiting) {
      showUpdateAvailable();
    } else {
      updatePwaStatus("AERSTRONG est deja a jour sur ce telephone.");
    }
  } catch (error) {
    updatePwaStatus("Verification impossible pour le moment.");
  }
});

$("#applyUpdateButton").addEventListener("click", () => {
  if (!swRegistration || !swRegistration.waiting) {
    updatePwaStatus("Aucune mise a jour prete pour le moment.");
    return;
  }
  expectingUpdateReload = true;
  swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
});

$("#templateList").addEventListener("submit", (event) => {
  const form = event.target.closest("[data-add-item]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  templateById(form.dataset.addItem).items.push(planItem(data.get("exerciseId"), Number(data.get("sets")), Number(data.get("minReps")), Number(data.get("maxReps")), Number(data.get("weight")), Number(data.get("increment"))));
  saveState();
  render();
});

$("#templateList").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-item]");
  if (!remove) return;
  const [templateId, itemId] = remove.dataset.removeItem.split(":");
  const template = templateById(templateId);
  template.items = template.items.filter((item) => item.id !== itemId);
  saveState();
  render();
});

$("#equipmentFilters").addEventListener("click", (event) => {
  const filter = event.target.closest("[data-equipment]");
  if (!filter) return;
  equipmentFilter = filter.dataset.equipment;
  render();
});

$("#muscleFilters").addEventListener("click", (event) => {
  const filter = event.target.closest("[data-muscle]");
  if (!filter) return;
  muscleFilter = filter.dataset.muscle;
  render();
});

$("#scheduleForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.schedule.push({ id: id(), profileId: state.activeProfileId, date: $("#scheduleDate").value, templateId: $("#scheduleTemplate").value, repeatWeekly: $("#scheduleRepeat").checked });
  saveState();
  render();
});

$("#calendarModes").addEventListener("click", (event) => {
  const button = event.target.closest("[data-calendar-mode]");
  if (!button) return;
  calendarMode = button.dataset.calendarMode;
  document.querySelectorAll("#calendarModes .segment").forEach((item) => item.classList.toggle("active", item === button));
  renderCalendar();
});

$("#calendarList").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-delete-schedule]");
  if (!remove) return;
  state.schedule = state.schedule.filter((item) => item.id !== remove.dataset.deleteSchedule);
  saveState();
  render();
});

$("#trackingModes").addEventListener("click", (event) => {
  const button = event.target.closest("[data-tracking-mode]");
  if (!button) return;
  trackingMode = button.dataset.trackingMode;
  document.querySelectorAll("#trackingModes .segment").forEach((item) => item.classList.toggle("active", item === button));
  renderTracking();
});

$("#trackingPanel").addEventListener("submit", (event) => {
  const profileForm = event.target.closest("#profileForm");
  const healthForm = event.target.closest("#healthForm");
  if (!profileForm && !healthForm) return;
  event.preventDefault();

  if (profileForm) {
    const profile = activeProfile();
    profile.name = $("#profileName").value;
    profile.birthDate = $("#profileBirthDate").value;
    profile.height = $("#profileHeight").value;
    saveState();
    render();
    return;
  }

  const editId = $("#healthEditId").value;
  const payload = healthPayload();
  if (editId) {
    const index = state.health.findIndex((item) => item.id === editId);
    if (index >= 0) state.health[index] = { ...state.health[index], ...payload };
  } else {
    state.health.unshift({ id: id(), profileId: state.activeProfileId, date: todayKey, ...payload });
  }
  event.target.reset();
  saveState();
  renderTracking();
});

$("#trackingPanel").addEventListener("click", (event) => {
  if (event.target.closest("#addProfile")) {
    if (state.profiles.length >= 3) return;
    const profileId = id();
    state.profiles.push({ id: profileId, name: `Profil ${state.profiles.length + 1}`, birthDate: "", height: "" });
    state.activeProfileId = profileId;
    clearInterval(sessionUi.restTimer);
    sessionUi.phase = "ready";
    saveState();
    render();
    return;
  }

  const edit = event.target.closest("[data-edit-health]");
  if (!edit) return;
  const item = state.health.find((candidate) => candidate.profileId === state.activeProfileId && candidate.id === edit.dataset.editHealth);
  if (!item) return;
  fillHealthForm(item);
});

$("#trackingPanel").addEventListener("click", (event) => {
  const profileChoice = event.target.closest("[data-profile-choice]");
  if (!profileChoice) return;
  state.activeProfileId = profileChoice.dataset.profileChoice;
  if (!togetherMode) togetherProfileIds = [state.activeProfileId];
  clearInterval(sessionUi.restTimer);
  clearTogetherTimers();
  sessionUi.phase = "ready";
  saveState();
  render();
});

function healthPayload() {
  return {
    weight: $("#healthWeight").value,
    bodyfat: $("#healthBodyfat").value,
    waist: $("#healthWaist").value,
    chest: $("#healthChest").value,
    shoulders: $("#healthShoulders").value,
    bicepsRight: $("#healthBicepsRight").value,
    bicepsLeft: $("#healthBicepsLeft").value,
    forearmRight: $("#healthForearmRight").value,
    forearmLeft: $("#healthForearmLeft").value,
    thighRight: $("#healthThighRight").value,
    thighLeft: $("#healthThighLeft").value,
    calfRight: $("#healthCalfRight").value,
    calfLeft: $("#healthCalfLeft").value,
  };
}

function fillHealthForm(item) {
  $("#healthEditId").value = item.id;
  $("#healthWeight").value = item.weight || "";
  $("#healthBodyfat").value = item.bodyfat || "";
  $("#healthWaist").value = item.waist || "";
  $("#healthChest").value = item.chest || "";
  $("#healthShoulders").value = item.shoulders || "";
  $("#healthBicepsRight").value = item.bicepsRight || "";
  $("#healthBicepsLeft").value = item.bicepsLeft || "";
  $("#healthForearmRight").value = item.forearmRight || "";
  $("#healthForearmLeft").value = item.forearmLeft || "";
  $("#healthThighRight").value = item.thighRight || "";
  $("#healthThighLeft").value = item.thighLeft || "";
  $("#healthCalfRight").value = item.calfRight || "";
  $("#healthCalfLeft").value = item.calfLeft || "";
  $("#healthWeight").focus();
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("#installButton").hidden = false;
});

$("#installButton").addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $("#installButton").hidden = true;
});

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    updatePwaStatus();
    return;
  }

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (expectingUpdateReload) window.location.reload();
  });

  navigator.serviceWorker.register("./sw.js").then((registration) => {
    swRegistration = registration;
    updatePwaStatus();
    if (registration.waiting) showUpdateAvailable();

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateAvailable();
        }
      });
    });
  }).catch(() => {
    updatePwaStatus("Hors ligne indisponible sur cette adresse. Le futur lien HTTPS reglera ca.");
  });
}

function maybeOpenOnboarding() {
  if (!state.welcomeAccepted) {
    const welcome = $("#welcomeDialog");
    if (welcome && welcome.showModal) welcome.showModal();
    return;
  }
  if (state.onboardingComplete) return;
  const dialog = $("#onboardingDialog");
  if (!dialog || !dialog.showModal) return;
  dialog.showModal();
}

updateVersionLabels();
registerServiceWorker();
render();
maybeOpenOnboarding();
