const storageKey = "forgefit-v4";
const backupStorageKey = `${storageKey}-backup`;
const backupMetaKey = `${storageKey}-backup-meta`;
const protectionPromptKey = `${storageKey}-storage-protection-asked`;
const appVersion = "v1.9.4";
const dataSchemaVersion = 8;
const brandMigrationKey = "aerstrongThemeMigrated";
const todayKey = localDateKey(new Date());
const nutritionEnabled = false;

const $ = (selector) => document.querySelector(selector);
const state = loadState();

let activeExercisePlanId = null;
let calendarMode = "week";
let trackingMode = "performance";
let builderMode = "sessions";
let templateGroupFilter = "Tous";
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
let editingExerciseId = null;
let exerciseOptionsId = null;
let pendingDeleteExerciseId = null;
let activeExerciseAlternatives = [];
let expandedTemplateIds = new Set();
let currentViewName = "home";
let activeSummaryLogId = null;
let exerciseIntroOpen = false;
let activeTemplateOptionsId = null;
let activePlanItemOptions = null;
let activeHealthOptionsId = null;
let activeScheduleOptionsId = null;
let activeScheduleOptionsDate = "";
let activeMuscleGroupOptions = "";
let libraryExerciseSearch = "";
let appMessageConfirmHandler = null;
let wakeLock = null;
let previewSettings = null;
let activeWorkoutLogOptionsId = null;

const sessionUi = {
  phase: "ready",
  restRemaining: 0,
  restEndsAt: 0,
  lastSoundSecond: null,
  warmupRest: false,
  restTimer: null,
  together: {},
};

const views = {
  home: $("#homeView"),
  training: $("#trainingView"),
  planner: $("#plannerView"),
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

function planItem(exerciseId, sets, minReps, maxReps, weight, increment, rest) {
  return {
    id: id(),
    exerciseId,
    sets,
    minReps,
    maxReps,
    weight,
    increment,
    rest,
    targetReps: Array(sets).fill(minReps),
  };
}

function defaultMuscleGroups() {
  return ["Dos", "Pectoraux", "Jambes", "Epaules", "Biceps", "Triceps", "Abdos", "Trapezes", "Autre"];
}

function defaultTrainingGroups() {
  return ["General", "Prise de masse", "Seche", "Force", "Maintien"];
}

function extraDefaultExercises() {
  return [
    exercise(id(), "Tirage vertical machine guidee", "Dos", "Machine guidee", 120, ["Tirage vertical machine poulie", "Tractions assistees", "Tirage unilateral poulie"]),
    exercise(id(), "Tirage machine guidee", "Dos", "Machine guidee", 120, ["Tirage vertical machine poulie", "Tirage vertical machine guidee", "Tractions assistees"]),
    exercise(id(), "Tirage vertical poulie", "Dos", "Poulie", 120, ["Tirage vertical machine poulie", "Tractions assistees", "Tirage vertical machine guidee"]),
    exercise(id(), "Tirage unilateral poulie", "Dos", "Poulie", 90, ["Tirage vertical machine poulie", "Rowing unilateral poulie", "Pull-over poulie"]),
    exercise(id(), "Rowing unilateral poulie", "Dos", "Poulie", 90, ["Tirage unilateral poulie", "Rowing poulie basse", "Rowing haltere unilateral"]),
    exercise(id(), "Rowing machine guidee", "Dos", "Machine guidee", 120, ["Rowing poulie basse", "Rowing haltere", "Tirage horizontal machine"]),
    exercise(id(), "Rowing haltere", "Dos", "Halteres", 120, ["Rowing haltere unilateral", "Rowing barre", "Rowing poulie basse"]),
    exercise(id(), "Rowing haltere unilateral", "Dos", "Halteres", 120, ["Rowing poulie basse", "Rowing machine guidee", "Rowing T-bar"]),
    exercise(id(), "Rowing barre", "Dos", "Barre", 150, ["Rowing T-bar", "Rowing haltere", "Rowing poulie basse"]),
    exercise(id(), "Rowing machine", "Dos", "Machine guidee", 120, ["Rowing machine guidee", "Rowing poulie basse", "Tirage horizontal machine"]),
    exercise(id(), "Pull-over machine", "Dos", "Machine guidee", 90, ["Pull-over poulie", "Pull-over haltere"]),
    exercise(id(), "Pull-over haltere", "Dos", "Halteres", 90, ["Pull-over poulie", "Pull-over machine"]),
    exercise(id(), "Tractions pronation", "Dos", "Poids du corps", 150, ["Tractions assistees", "Tirage vertical poulie", "Tirage vertical machine guidee"]),
    exercise(id(), "Tractions supination", "Dos", "Poids du corps", 150, ["Tractions assistees", "Tirage vertical poulie", "Curl barre EZ"]),
    exercise(id(), "Rack pull", "Dos", "Barre", 180, ["Souleve de terre", "Rowing barre", "Rowing T-bar"]),
    exercise(id(), "Souleve de terre", "Dos", "Barre", 180, ["Rack pull", "Souleve de terre roumain", "Rowing T-bar"]),

    exercise(id(), "Developpe couche barre", "Pectoraux", "Barre", 150, ["Developpe couche machine", "Developpe couche halteres", "Pompes"]),
    exercise(id(), "Developpe couche halteres", "Pectoraux", "Halteres", 120, ["Developpe couche barre", "Developpe couche machine", "Pompes"]),
    exercise(id(), "Pompes", "Pectoraux", "Poids du corps", 90, ["Developpe couche machine", "Developpe couche halteres", "Dips assistes"]),
    exercise(id(), "Pompes lestee", "Pectoraux", "Poids du corps", 120, ["Dips assistes", "Developpe decline machine", "Developpe couche barre"]),
    exercise(id(), "Developpe incline machine", "Pectoraux", "Machine guidee", 120, ["Developpe incline halteres", "Developpe incline barre", "Developpe couche machine"]),
    exercise(id(), "Developpe incline barre", "Pectoraux", "Barre", 150, ["Developpe incline halteres", "Developpe incline machine"]),
    exercise(id(), "Developpe decline machine", "Pectoraux", "Machine guidee", 120, ["Dips assistes", "Pompes lestee", "Developpe couche machine"]),
    exercise(id(), "Pec deck", "Pectoraux", "Machine guidee", 75, ["Ecarte poulie vis-a-vis", "Ecarte halteres", "Ecarte machine"]),
    exercise(id(), "Ecarte halteres", "Pectoraux", "Halteres", 75, ["Ecarte poulie vis-a-vis", "Pec deck", "Ecarte incline halteres"]),
    exercise(id(), "Ecarte machine", "Pectoraux", "Machine guidee", 75, ["Pec deck", "Ecarte poulie vis-a-vis", "Ecarte halteres"]),
    exercise(id(), "Ecarte incline halteres", "Pectoraux", "Halteres", 75, ["Ecarte halteres", "Ecarte poulie vis-a-vis", "Developpe incline halteres"]),
    exercise(id(), "Chest press convergente", "Pectoraux", "Machine guidee", 120, ["Developpe couche machine", "Developpe couche halteres", "Developpe incline machine"]),

    exercise(id(), "Developpe epaules machine", "Epaules", "Machine guidee", 120, ["Developpe militaire halteres", "Developpe militaire barre", "Arnold press"]),
    exercise(id(), "Developpe militaire barre", "Epaules", "Barre", 150, ["Developpe militaire halteres", "Developpe epaules machine", "Arnold press"]),
    exercise(id(), "Arnold press", "Epaules", "Halteres", 120, ["Developpe militaire halteres", "Developpe militaire barre", "Developpe epaules machine"]),
    exercise(id(), "Elevation laterale poulie", "Epaules", "Poulie", 60, ["Elevation laterale halteres", "Machine lateral raise"]),
    exercise(id(), "Machine lateral raise", "Epaules", "Machine guidee", 60, ["Elevation laterale halteres", "Elevation laterale poulie"]),
    exercise(id(), "Elevation laterale machine", "Epaules", "Machine guidee", 60, ["Machine lateral raise", "Elevation laterale halteres", "Elevation laterale poulie"]),
    exercise(id(), "Oiseau halteres", "Epaules", "Halteres", 75, ["Oiseau machine", "Oiseau poulie", "Face pull"]),
    exercise(id(), "Oiseau poulie", "Epaules", "Poulie", 75, ["Oiseau machine", "Oiseau halteres", "Face pull"]),
    exercise(id(), "Elevation frontale halteres", "Epaules", "Halteres", 60, ["Elevation frontale poulie", "Developpe militaire halteres"]),
    exercise(id(), "Elevation frontale poulie", "Epaules", "Poulie", 60, ["Elevation frontale halteres", "Developpe epaules machine"]),
    exercise(id(), "Upright row poulie", "Epaules", "Poulie", 75, ["Upright row barre", "Elevation laterale poulie"]),
    exercise(id(), "Upright row barre", "Epaules", "Barre", 90, ["Upright row poulie", "Elevation laterale machine"]),

    exercise(id(), "Goblet squat", "Jambes", "Halteres", 120, ["Goblet squat haltere", "Squat barre", "Presse a cuisses"]),
    exercise(id(), "Goblet squat haltere", "Jambes", "Halteres", 120, ["Goblet squat", "Squat barre", "Presse a cuisses"]),
    exercise(id(), "Fentes marchees", "Jambes", "Halteres", 120, ["Fentes bulgares", "Presse unilaterale", "Split squat"]),
    exercise(id(), "Split squat", "Jambes", "Halteres", 120, ["Fentes bulgares", "Fentes marchees", "Presse unilaterale"]),
    exercise(id(), "Presse unilaterale", "Jambes", "Machine guidee", 120, ["Fentes bulgares", "Fentes marchees", "Presse a cuisses"]),
    exercise(id(), "Hack squat machine", "Jambes", "Machine guidee", 150, ["Hack squat", "Presse a cuisses", "Squat barre"]),
    exercise(id(), "Belt squat", "Jambes", "Machine guidee", 150, ["Presse a cuisses", "Hack squat", "Goblet squat"]),
    exercise(id(), "Front squat", "Jambes", "Barre", 150, ["Squat barre", "Hack squat", "Presse a cuisses"]),
    exercise(id(), "Sissy squat", "Jambes", "Poids du corps", 90, ["Leg extension", "Spanish squat"]),
    exercise(id(), "Spanish squat", "Jambes", "Poids du corps", 90, ["Sissy squat", "Leg extension"]),
    exercise(id(), "Leg curl unilateral", "Jambes", "Machine guidee", 90, ["Leg curl", "Souleve de terre roumain", "RDL halteres"]),
    exercise(id(), "Leg curl assis", "Jambes", "Machine guidee", 90, ["Leg curl", "Leg curl unilateral", "Souleve de terre roumain"]),
    exercise(id(), "RDL halteres", "Jambes", "Halteres", 150, ["Souleve de terre roumain", "Leg curl", "Hip thrust"]),
    exercise(id(), "Hip thrust machine", "Jambes", "Machine guidee", 120, ["Hip thrust", "Glute bridge machine", "Presse a cuisses"]),
    exercise(id(), "Glute bridge machine", "Jambes", "Machine guidee", 120, ["Hip thrust", "Hip thrust machine"]),
    exercise(id(), "Abduction machine", "Jambes", "Machine guidee", 60, ["Abduction poulie", "Fentes bulgares"]),
    exercise(id(), "Adduction machine", "Jambes", "Machine guidee", 60, ["Adduction poulie", "Presse a cuisses"]),
    exercise(id(), "Abduction poulie", "Jambes", "Poulie", 60, ["Abduction machine"]),
    exercise(id(), "Adduction poulie", "Jambes", "Poulie", 60, ["Adduction machine"]),
    exercise(id(), "Mollets presse", "Jambes", "Machine guidee", 75, ["Mollets debout machine", "Mollets assis machine", "Mollets halteres"]),
    exercise(id(), "Mollets halteres", "Jambes", "Halteres", 75, ["Mollets debout machine", "Mollets presse", "Mollets assis machine"]),
    exercise(id(), "Mollets assis machine", "Jambes", "Machine guidee", 75, ["Mollets debout machine", "Mollets presse", "Mollets halteres"]),

    exercise(id(), "Curl pupitre machine", "Biceps", "Machine guidee", 75, ["Curl barre EZ", "Curl pupitre", "Curl halteres"]),
    exercise(id(), "Curl pupitre", "Biceps", "Barre", 75, ["Curl pupitre machine", "Curl barre EZ", "Curl incline halteres"]),
    exercise(id(), "Curl poulie basse", "Biceps", "Poulie", 75, ["Curl barre EZ", "Curl halteres", "Curl corde poulie"]),
    exercise(id(), "Curl corde poulie", "Biceps", "Poulie", 75, ["Curl marteau", "Curl poulie basse", "Curl halteres neutre"]),
    exercise(id(), "Curl halteres neutre", "Biceps", "Halteres", 75, ["Curl marteau", "Curl corde poulie", "Curl halteres"]),
    exercise(id(), "Curl machine", "Biceps", "Machine guidee", 75, ["Curl pupitre machine", "Curl poulie basse", "Curl barre EZ"]),
    exercise(id(), "Curl concentration", "Biceps", "Halteres", 75, ["Curl incline halteres", "Curl pupitre", "Curl halteres"]),
    exercise(id(), "Curl spider", "Biceps", "Barre", 75, ["Curl pupitre", "Curl incline halteres", "Curl machine"]),

    exercise(id(), "Extension triceps haltere", "Triceps", "Halteres", 75, ["Extension haltere nuque", "Extension triceps corde", "Barre au front"]),
    exercise(id(), "Extension haltere nuque", "Triceps", "Halteres", 75, ["Extension triceps haltere", "Barre au front", "Extension triceps corde"]),
    exercise(id(), "Extension barre poulie", "Triceps", "Poulie", 75, ["Extension triceps poulie", "Extension triceps corde", "Barre au front"]),
    exercise(id(), "Dips", "Triceps", "Poids du corps", 120, ["Dips assistes", "Developpe couche prise serree", "Pompes diamant"]),
    exercise(id(), "Developpe couche prise serree", "Triceps", "Barre", 120, ["Dips", "Dips assistes", "Barre au front"]),
    exercise(id(), "Pompes diamant", "Triceps", "Poids du corps", 90, ["Dips", "Extension triceps poulie", "Developpe couche prise serree"]),
    exercise(id(), "Kickback triceps", "Triceps", "Halteres", 60, ["Extension triceps corde", "Extension triceps haltere"]),
    exercise(id(), "Extension triceps machine", "Triceps", "Machine guidee", 75, ["Extension triceps poulie", "Extension barre poulie", "Extension triceps corde"]),

    exercise(id(), "Crunch machine", "Abdos", "Machine guidee", 60, ["Crunch poulie", "Crunch au sol", "Crunch inverse"]),
    exercise(id(), "Crunch au sol", "Abdos", "Poids du corps", 45, ["Crunch machine", "Crunch poulie", "Crunch inverse"]),
    exercise(id(), "Crunch inverse", "Abdos", "Poids du corps", 60, ["Releve de jambes suspendu", "Releve de genoux chaise romaine", "Crunch au sol"]),
    exercise(id(), "Releve de genoux chaise romaine", "Abdos", "Poids du corps", 75, ["Releve de jambes suspendu", "Crunch inverse"]),
    exercise(id(), "Dead bug", "Abdos", "Poids du corps", 45, ["Gainage", "Planche laterale", "Crunch au sol"]),
    exercise(id(), "Planche laterale", "Abdos", "Poids du corps", 45, ["Gainage", "Dead bug"]),
    exercise(id(), "Rotation buste poulie", "Abdos", "Poulie", 60, ["Pallof press", "Planche laterale"]),
    exercise(id(), "Pallof press", "Abdos", "Poulie", 60, ["Rotation buste poulie", "Gainage"]),

    exercise(id(), "Shrugs barre", "Trapezes", "Barre", 90, ["Shrugs halteres", "Shrugs machine"]),
    exercise(id(), "Shrugs machine", "Trapezes", "Machine guidee", 90, ["Shrugs halteres", "Shrugs barre"]),
    exercise(id(), "Farmer walk", "Trapezes", "Halteres", 90, ["Shrugs halteres", "Shrugs barre"]),
  ];
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
      ...extraDefaultExercises(),
    ],
    templates: [
      { id: tplPull, profileId, name: "PULL", group: "General", items: [planItem(ids[0], 4, 8, 12, 80, 2.5), planItem(ids[1], 3, 10, 12, 55, 2.5), planItem(ids[6], 3, 10, 15, 14, 1)] },
      { id: tplPush, profileId, name: "PUSH", group: "General", items: [planItem(ids[2], 4, 8, 12, 70, 2.5), planItem(ids[3], 3, 8, 12, 22, 1), planItem(ids[7], 3, 10, 15, 35, 2.5)] },
      { id: tplLegs, profileId, name: "LEGS", group: "General", items: [planItem(ids[4], 4, 10, 15, 140, 5), planItem(ids[9], 3, 6, 10, 80, 2.5), planItem(ids[5], 3, 10, 15, 45, 2.5)] },
    ],
    schedule: [{ id: id(), profileId, date: todayKey, templateId: tplPull, repeatWeekly: true }],
    scheduleMoves: [],
    logs: [],
    health: [],
    nutrition: [],
    nutritionSettings: [],
    muscleGroups: defaultMuscleGroups(),
    trainingGroups: defaultTrainingGroups(),
    settings: { theme: "gold", mode: "dark", weightUnit: "kg", lengthUnit: "cm", language: "fr", soundMuted: false },
    substitutions: {},
    dataVersion: dataSchemaVersion,
    preferencesComplete: false,
    welcomeAccepted: false,
    onboardingComplete: false,
  };
}

function exercise(idValue, name, family, equipment, rest, alternatives, code = "") {
  return { id: idValue, code, name, family, equipment, rest, alternatives };
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
  const mergedExercises = ensureExerciseCodes(expandAlternativeExercises(mergeExercises(saved.exercises || [], base.exercises)));
  const fallbackProfileId = saved.activeProfileId || (saved.profiles && saved.profiles[0] && saved.profiles[0].id) || id();
  const profiles = saved.profiles && saved.profiles.length ? saved.profiles : [{
    id: fallbackProfileId,
    name: saved.profile && saved.profile.name ? saved.profile.name : "Profil principal",
    birthDate: saved.profile && saved.profile.birthDate ? saved.profile.birthDate : "",
    height: saved.profile && saved.profile.height ? saved.profile.height : "",
  }];
  const activeProfileId = profiles.some((profile) => profile.id === saved.activeProfileId) ? saved.activeProfileId : profiles[0].id;
  const templates = (saved.templates || base.templates).map((item) => ({ ...item, profileId: item.profileId || activeProfileId, group: item.group || "General" }));
  const settings = migratedSettings(saved);
  settings.storageProtectionAsked = Boolean(settings.storageProtectionAsked || localStorage.getItem(protectionPromptKey) === "1");
  return {
    ...starterState(),
    ...saved,
    activeProfileId,
    profiles: profiles.slice(0, 3),
    exercises: mergedExercises.map((item) => ({ ...item, family: item.family === "Ischios" ? "Jambes" : item.family })),
    templates,
    schedule: (saved.schedule || base.schedule).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    scheduleMoves: (saved.scheduleMoves || []).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    logs: (saved.logs || []).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    health: (saved.health || []).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    nutrition: (saved.nutrition || []).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    nutritionSettings: (saved.nutritionSettings || []).map((item) => ({ ...item, profileId: item.profileId || activeProfileId })),
    muscleGroups: normalizeMuscleGroups(saved.muscleGroups, mergedExercises),
    trainingGroups: normalizeTrainingGroups(saved.trainingGroups, templates),
    settings,
    substitutions: saved.substitutions || {},
    dataVersion: dataSchemaVersion,
    preferencesComplete: saved.preferencesComplete === undefined ? true : saved.preferencesComplete,
    welcomeAccepted: saved.welcomeAccepted === undefined ? true : saved.welcomeAccepted,
    onboardingComplete: saved.onboardingComplete === undefined ? true : saved.onboardingComplete,
    [brandMigrationKey]: saved[brandMigrationKey] || (saved.settings && saved.settings.theme === "red"),
  };
}

function ensureExerciseCodes(exercises) {
  const used = new Set();
  return (exercises || []).map((item, index) => {
    let code = String(item.code || "").trim();
    if (!/^e[0-9a-z]+$/i.test(code) || used.has(code.toLowerCase())) {
      let suffix = (index + 1).toString(36);
      code = `e${suffix}`;
      while (used.has(code.toLowerCase())) {
        suffix = (parseInt(suffix, 36) + 1).toString(36);
        code = `e${suffix}`;
      }
    }
    used.add(code.toLowerCase());
    return { ...item, code };
  });
}

function inferEquipmentFromName(name, fallback) {
  const text = String(name || "").toLowerCase();
  if (text.includes("poulie") || text.includes("corde")) return "Poulie";
  if (text.includes("machine") || text.includes("guidee") || text.includes("assist")) return "Machine guidee";
  if (text.includes("haltere")) return "Halteres";
  if (text.includes("barre") || text.includes("ez") || text.includes("t-bar")) return "Barre";
  if (text.includes("pompe") || text.includes("traction") || text.includes("gainage") || text.includes("dips")) return "Poids du corps";
  return fallback || "Machine guidee";
}

function expandAlternativeExercises(exercises) {
  const byName = new Map(exercises.map((item) => [item.name.toLowerCase(), item]));
  exercises.forEach((item) => {
    (item.alternatives || []).forEach((name) => {
      const cleanName = String(name || "").trim();
      if (!cleanName || byName.has(cleanName.toLowerCase())) return;
      byName.set(cleanName.toLowerCase(), exercise(id(), cleanName, item.family || "Autre", inferEquipmentFromName(cleanName, item.equipment), item.rest || 90, []));
    });
  });
  return [...byName.values()];
}

function normalizeMuscleGroups(savedGroups, exercises) {
  const groups = [...defaultMuscleGroups(), ...(savedGroups || []), ...(exercises || []).map((item) => item.family).filter(Boolean)];
  return [...new Set(groups.map((item) => item === "Ischios" ? "Jambes" : item).filter(Boolean))];
}

function normalizeTrainingGroups(savedGroups, templates) {
  const groups = [...defaultTrainingGroups(), ...(savedGroups || []), ...(templates || []).map((item) => item.group).filter(Boolean)];
  return [...new Set(groups.filter(Boolean))];
}

function migratedSettings(saved) {
  const settings = { theme: "gold", mode: "dark", weightUnit: "kg", lengthUnit: "cm", language: "fr", soundMuted: false, ...(saved.settings || {}) };
  if (!saved[brandMigrationKey] && settings.theme === "red") settings.theme = "gold";
  if (!["kg", "lbs"].includes(settings.weightUnit)) settings.weightUnit = "kg";
  if (!["cm", "inch"].includes(settings.lengthUnit)) settings.lengthUnit = "cm";
  if (!["fr", "en"].includes(settings.language)) settings.language = "fr";
  return settings;
}

function mergeExercises(existing, defaults) {
  const byName = new Map(existing.map((item) => [item.name.toLowerCase(), item]));
  defaults.forEach((item) => {
    const key = item.name.toLowerCase();
    const current = byName.get(key);
    if (!current) {
      byName.set(key, item);
      return;
    }
    const alternatives = [...new Set([...(current.alternatives || []), ...(item.alternatives || [])])].filter((name) => name && name.toLowerCase() !== key);
    byName.set(key, {
      ...current,
      family: current.family || item.family,
      equipment: current.equipment || item.equipment,
      rest: current.rest || item.rest,
      alternatives,
    });
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
  return planItem(found.id, preset.sets, preset.minReps, preset.maxReps, defaultWeightForExercise(exerciseName), preset.increment, preset.rest);
}

function clonePlanItem(item) {
  return {
    ...item,
    id: id(),
    targetReps: Array.isArray(item.targetReps) ? [...item.targetReps] : Array(Number(item.sets || 0)).fill(item.minReps),
  };
}

function duplicateTemplate(templateId) {
  const template = templateById(templateId);
  if (!template) return;
  const copy = {
    ...template,
    id: id(),
    profileId: state.activeProfileId,
    name: `${template.name} COPIE`,
    group: template.group || "General",
    items: (template.items || []).map(clonePlanItem),
  };
  state.templates.push(copy);
  expandedTemplateIds.add(copy.id);
}

function deleteTemplate(templateId) {
  const template = templateById(templateId);
  if (!template) return;
  const usedInSchedule = state.schedule.some((item) => item.templateId === templateId);
  const usedInLogs = state.logs.some((log) => log.templateId === templateId);
  const detail = usedInSchedule || usedInLogs ? " Cette action supprimera aussi son planning et son historique associe." : "";
  showAppConfirm(`Supprimer la seance "${template.name}" ?${detail}`, () => {
    state.templates = state.templates.filter((item) => item.id !== templateId);
    state.schedule = state.schedule.filter((item) => item.templateId !== templateId);
    state.logs = state.logs.filter((log) => log.templateId !== templateId);
    expandedTemplateIds.delete(templateId);
    saveState();
    render();
  }, "Supprimer la seance", true, "Supprimer");
}

function createPplTemplates() {
  createProgramModel("mass");
}

function uniqueTemplateName(name) {
  const existing = new Set(profileTemplates().map((template) => template.name.toUpperCase()));
  let candidate = name.toUpperCase();
  let index = 2;
  while (existing.has(candidate)) {
    candidate = `${name.toUpperCase()} ${index}`;
    index += 1;
  }
  return candidate;
}

function addTrainingGroup(group) {
  if (!group) return "General";
  const cleanGroup = group.trim();
  if (!state.trainingGroups.includes(cleanGroup)) state.trainingGroups.push(cleanGroup);
  return cleanGroup;
}

function fillTemplateEditDialog(template) {
  $("#editTemplateId").value = template.id;
  $("#editTemplateName").value = template.name;
  const groups = profileTrainingGroups();
  $("#editTemplateGroup").innerHTML = groups.map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(displayFamily(group))}</option>`).join("");
  $("#editTemplateGroup").value = groups.includes(template.group || "General") ? template.group || "General" : "General";
  $("#editTemplateNewGroup").value = "";
}

function createTemplatesFromDefinitions(definitions, preset, group) {
  const cleanGroup = addTrainingGroup(group);
  const existing = new Set(profileTemplates().map((template) => template.name.toUpperCase()));
  definitions.forEach((definition) => {
    const templateId = id();
    const name = existing.has(definition.name.toUpperCase()) ? uniqueTemplateName(definition.name) : definition.name.toUpperCase();
    existing.add(name);
    state.templates.push({
      id: templateId,
      profileId: state.activeProfileId,
      name,
      group: cleanGroup,
      items: definition.exercises.map((name) => makeProgramItem(name, preset)),
    });
    expandedTemplateIds.add(templateId);
  });
}

function programModels() {
  return [
    {
      id: "mass",
      title: "Prise de masse",
      group: "Prise de masse",
      goal: "muscle",
      meta: "PPL - 5 exos - 45/60 min - cardio non",
      description: "Volume modere/eleve, fourchette 8-12 reps et repos autour de 90 secondes.",
      sessions: [
        { name: "PULL MASSE", exercises: ["Tirage vertical machine poulie", "Rowing poulie basse", "Pull-over poulie", "Face pull", "Curl halteres"] },
        { name: "PUSH MASSE", exercises: ["Developpe couche machine", "Developpe incline halteres", "Developpe militaire halteres", "Elevation laterale halteres", "Extension triceps poulie"] },
        { name: "LEGS MASSE", exercises: ["Presse a cuisses", "Leg curl", "Leg extension", "Souleve de terre roumain", "Mollets debout machine"] },
      ],
    },
    {
      id: "cut",
      title: "Seche",
      group: "Seche",
      goal: "fatloss",
      meta: "Full body - 4/5 exos - 35/50 min - cardio oui",
      description: "Seances plus denses, reps plus hautes et repos courts pour garder du rythme.",
      sessions: [
        { name: "FULL BODY A SECHE", exercises: ["Presse a cuisses", "Tirage vertical machine poulie", "Developpe couche machine", "Leg curl", "Crunch poulie"] },
        { name: "FULL BODY B SECHE", exercises: ["Hack squat", "Rowing poulie basse", "Developpe incline halteres", "Face pull", "Gainage"] },
        { name: "FULL BODY C SECHE", exercises: ["Leg extension", "Pull-over poulie", "Pompes", "Curl poulie basse", "Extension triceps corde"] },
      ],
    },
    {
      id: "strength",
      title: "Force",
      group: "Force",
      goal: "strength",
      meta: "Upper/Lower - 4 exos - 50/70 min - cardio non",
      description: "Moins d'exercices, charges plus lourdes, repos longs et progression stricte.",
      sessions: [
        { name: "UPPER FORCE", exercises: ["Developpe couche barre", "Rowing barre", "Developpe militaire barre", "Tractions pronation"] },
        { name: "LOWER FORCE", exercises: ["Squat barre", "Souleve de terre roumain", "Presse a cuisses", "Mollets debout machine"] },
        { name: "PULL FORCE", exercises: ["Souleve de terre", "Tractions pronation", "Rowing T-bar", "Curl barre EZ"] },
      ],
    },
    {
      id: "maintain",
      title: "Maintien",
      group: "Maintien",
      goal: "maintain",
      meta: "Full body - 4/6 exos - 35/55 min - cardio optionnel",
      description: "Equilibre simple pour garder les acquis sans exploser le planning.",
      sessions: [
        { name: "FULL BODY MAINTIEN A", exercises: ["Presse a cuisses", "Tirage vertical machine poulie", "Developpe couche machine", "Elevation laterale halteres", "Crunch poulie"] },
        { name: "FULL BODY MAINTIEN B", exercises: ["Hack squat", "Rowing poulie basse", "Developpe militaire halteres", "Leg curl", "Extension triceps poulie"] },
      ],
    },
  ];
}

function createProgramModel(modelId) {
  const model = programModels().find((item) => item.id === modelId);
  if (!model) return;
  createTemplatesFromDefinitions(model.sessions, goalPreset(model.goal), model.group);
  templateGroupFilter = model.group;
  builderMode = "sessions";
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
  const group = addTrainingGroup(goalPresetLabel(goal));
  const templates = defs.map((definition) => ({
    id: id(),
    profileId,
    name: definition.name,
    group,
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

function goalPresetLabel(goal) {
  const labels = {
    fatloss: "Seche",
    muscle: "Prise de masse",
    maintain: "Maintien",
    strength: "Force",
  };
  return labels[goal] || "General";
}

function saveState() {
  pruneWorkoutHistory();
  state.dataVersion = dataSchemaVersion;
  state[brandMigrationKey] = true;
  state.exercises = ensureExerciseCodes(state.exercises);
  rotateLocalBackup("auto");
  localStorage.setItem(storageKey, JSON.stringify(state));
  localStorage.setItem(`${storageKey}-saved-at`, new Date().toISOString());
}

function rotateLocalBackup(reason = "auto") {
  try {
    const current = localStorage.getItem(storageKey);
    if (!current) return false;
    const backup = localStorage.getItem(backupStorageKey);
    if (backup === current) return true;
    localStorage.setItem(backupStorageKey, current);
    localStorage.setItem(backupMetaKey, JSON.stringify({
      reason,
      appVersion,
      dataVersion: dataSchemaVersion,
      savedAt: new Date().toISOString(),
      bytes: current.length,
    }));
    return true;
  } catch {
    return false;
  }
}

function backupInfo() {
  try {
    const raw = localStorage.getItem(backupMetaKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function requestPersistentStorage() {
  localStorage.setItem(protectionPromptKey, "1");
  if (!navigator.storage || !navigator.storage.persist) {
    state.settings.storageProtectionAsked = true;
    state.settings.storagePersistent = false;
    saveState();
    updateDataStatus("Protection locale non disponible sur ce navigateur. La backup interne reste active.");
    renderSettingsStatus();
    return false;
  }
  try {
    const persistent = await navigator.storage.persist();
    state.settings.storageProtectionAsked = true;
    state.settings.storagePersistent = persistent;
    saveState();
    updateDataStatus(persistent ? "Stockage protege sur ce telephone. Backup locale automatique active." : "Backup locale active. Le navigateur n'a pas garanti le stockage persistant.");
    renderSettingsStatus();
    return persistent;
  } catch {
    state.settings.storageProtectionAsked = true;
    state.settings.storagePersistent = false;
    saveState();
    updateDataStatus("Backup locale active. La demande de protection a echoue sur ce navigateur.");
    renderSettingsStatus();
    return false;
  }
}

function workoutHistoryKey(log) {
  const template = templateById(log.templateId);
  const name = ((template && template.name) || log.templateName || "SEANCE").toUpperCase();
  if (name.includes("PULL")) return "PULL";
  if (name.includes("PUSH")) return "PUSH";
  if (name.includes("LEGS") || name.includes("LOWER")) return "LEGS";
  if (name.includes("UPPER")) return "UPPER";
  return name.split(/\s+/)[0] || "SEANCE";
}

function pruneWorkoutHistory() {
  const grouped = new Map();
  state.logs.forEach((log) => {
    if (!log.finishedAt || completedSetCount(log) === 0) return;
    const key = `${log.profileId}:${workoutHistoryKey(log)}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(log);
  });
  grouped.forEach((logs) => {
    logs
      .sort((a, b) => new Date(b.finishedAt || b.date) - new Date(a.finishedAt || a.date))
      .forEach((log, index) => {
        log.archived = index >= 2;
        if (log.archived && !log.archivedAt) log.archivedAt = new Date().toISOString();
        if (!log.archived) delete log.archivedAt;
      });
  });
}

function applySettings() {
  document.documentElement.dataset.theme = (state.settings && state.settings.theme) || "gold";
  document.documentElement.dataset.mode = (state.settings && state.settings.mode) || "dark";
}

function applySettingsPreview(theme, mode) {
  document.documentElement.dataset.theme = theme || "gold";
  document.documentElement.dataset.mode = mode || "dark";
}

function soundButtonHtml() {
  const muted = state.settings && state.settings.soundMuted;
  return `
    <button class="sound-toggle ${muted ? "muted" : ""}" data-sound-toggle type="button" aria-label="${muted ? "Activer le son" : "Couper le son"}" title="${muted ? "Activer le son" : "Couper le son"}">
      <span aria-hidden="true">${muted ? "OFF" : "ON"}</span>
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
  const compressor = context.createDynamicsCompressor();
  const final = kind === "done";
  const now = context.currentTime;
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(final ? 1480 : 1320, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(final ? 0.75 : 0.9, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (final ? 0.42 : 0.3));
  oscillator.connect(gain);
  gain.connect(compressor);
  compressor.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + (final ? 0.44 : 0.32));
}

function handleTimerSound(remaining) {
  if (remaining > 0 && remaining <= 3) playTimerBeep("tick");
  if (remaining === 0) playTimerBeep("done");
}

function syncRestCountdown(ui) {
  if (!ui || !["rest", "warmup"].includes(ui.phase) || !ui.restEndsAt) return;
  const previous = ui.restRemaining;
  const remaining = Math.max(0, Math.ceil((ui.restEndsAt - Date.now()) / 1000));
  ui.restRemaining = remaining;
  if (remaining !== previous && remaining <= 3 && ui.lastSoundSecond !== remaining) {
    handleTimerSound(remaining);
    ui.lastSoundSecond = remaining;
  }
  if (remaining === 0) {
    clearInterval(ui.restTimer);
    ui.phase = "ready";
    ui.restEndsAt = 0;
    ui.lastSoundSecond = null;
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
  }
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

function releaseWakeLock() {
  if (!wakeLock) return;
  wakeLock.release();
  wakeLock = null;
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

function profileTrainingGroups() {
  return normalizeTrainingGroups(state.trainingGroups, profileTemplates());
}

function visibleProfileTemplates() {
  const templates = profileTemplates();
  if (templateGroupFilter === "Tous") return templates;
  return templates.filter((template) => (template.group || "General") === templateGroupFilter);
}

function profileSchedule() {
  return state.schedule.filter((item) => item.profileId === state.activeProfileId);
}

function profileScheduleMoves() {
  return (state.scheduleMoves || []).filter((item) => item.profileId === state.activeProfileId);
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
  const fr = {
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
    repsDone: "Reps realisees",
    today: "Aujourd'hui",
    noWorkout: "Aucune seance prevue",
    openPlanner: "Ouvrir Planning",
    start: "Demarrer",
    resume: "Reprendre",
    done: "Fait",
    profile: "Profil",
    save: "Sauver",
    cancel: "Annuler",
    close: "Fermer",
    delete: "Supprimer",
    edit: "Modifier",
    add: "Ajouter",
    birthDate: "Date de naissance",
    height: "Taille",
    weight: "Poids",
    waist: "Tour taille",
    chest: "Poitrine",
    shoulders: "Carre epaules",
    todayWeight: "Poids du jour",
    currentWeight: "Poids actuel",
    targetWeight: "Poids cible",
  };
  const en = {
    training: "Training",
    builder: "Builder",
    tracking: "Tracking",
    more: "More",
    exercise: "Exercise",
    rest: "Rest",
    currentSet: "Current set",
    unavailable: "Machine unavailable",
    nextExercise: "Next exercise",
    finishSession: "Finish workout",
    skip: "SKIP",
    options: "Options",
    confirmAlternative: "Confirm alternative",
    usedWeight: "Weight used",
    noAlternative: "No configured alternative.",
    repsDone: "Completed reps",
    today: "Today",
    noWorkout: "No workout planned",
    openPlanner: "Open Planning",
    start: "Start",
    resume: "Resume",
    done: "Done",
    profile: "Profile",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    birthDate: "Birth date",
    height: "Height",
    weight: "Weight",
    waist: "Waist",
    chest: "Chest",
    shoulders: "Shoulders",
    todayWeight: "Today's weight",
    currentWeight: "Current weight",
    targetWeight: "Target weight",
  };
  return (isEnglish() ? en : fr)[key] || i18n[key] || key;
}

function language() {
  return (state.settings && state.settings.language) || "fr";
}

function isEnglish() {
  return language() === "en";
}

function uiLocale() {
  return isEnglish() ? "en-US" : "fr-FR";
}

function weightUnit() {
  return (state.settings && state.settings.weightUnit) === "lbs" ? "lbs" : "kg";
}

function lengthUnit() {
  return (state.settings && state.settings.lengthUnit) === "inch" ? "inch" : "cm";
}

function kgToLbs(value) {
  return Number(value || 0) * 2.2046226218487757;
}

function lbsToKg(value) {
  return Number(value || 0) / 2.2046226218487757;
}

function cmToInch(value) {
  return Number(value || 0) / 2.54;
}

function inchToCm(value) {
  return Number(value || 0) * 2.54;
}

function decimalValue(value) {
  const number = Number(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function roundUnit(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
}

function toDisplayWeight(value, decimals = 1) {
  const kg = decimalValue(value);
  return weightUnit() === "lbs" ? roundUnit(kgToLbs(kg), decimals) : roundUnit(kg, decimals);
}

function fromDisplayWeight(value) {
  const numeric = decimalValue(value);
  return weightUnit() === "lbs" ? roundUnit(lbsToKg(numeric), 4) : roundUnit(numeric, 4);
}

function toDisplayLength(value, decimals = 1) {
  const cm = decimalValue(value);
  return lengthUnit() === "inch" ? roundUnit(cmToInch(cm), decimals) : roundUnit(cm, decimals);
}

function fromDisplayLength(value) {
  const numeric = decimalValue(value);
  return lengthUnit() === "inch" ? roundUnit(inchToCm(numeric), 4) : roundUnit(numeric, 4);
}

function fmtNumber(value, decimals = 1) {
  const rounded = roundUnit(value, decimals);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", isEnglish() ? "." : ",");
}

function fmtWeight(value, decimals = 1) {
  return `${fmtNumber(toDisplayWeight(value, decimals), decimals)} ${weightUnit()}`;
}

function fmtLength(value, decimals = 1) {
  return `${fmtNumber(toDisplayLength(value, decimals), decimals)} ${lengthUnit()}`;
}

function weightInputValue(value) {
  return String(toDisplayWeight(value, 1));
}

function lengthInputValue(value) {
  return String(toDisplayLength(value, 1));
}
const englishTextMap = new Map(Object.entries({
  "Menu principal": "Main menu",
  "Planning": "Planning",
  "Builder": "Builder",
  "Suivi": "Tracking",
  "Plus": "More",
  "Organiser la semaine et lancer une seance": "Organize the week and start a workout",
  "Creer, organiser et planifier": "Create, organize and schedule",
  "Profils, performances et mesures": "Profiles, performance and measurements",
  "Recovery et futures options": "Recovery and future options",
  "Prepare. Execute. Mesure.": "Prepare. Execute. Measure.",
  "Prepare ton premier programme": "Prepare your first program",
  "Tu peux tout remplir maintenant, completer plus tard, ou partir de zero.": "You can fill everything in now, complete it later, or start from zero.",
  "Mensurations optionnelles": "Optional measurements",
  "optionnelles": "optional",
  "Objectif": "Goal",
  "Frequence": "Frequency",
  "Jours d'entrainement": "Training days",
  "Apercu du programme": "Program preview",
  "Ignorer et commencer de zero": "Skip and start from zero",
  "Creer mon programme": "Create my program",
  "Aujourd'hui": "Today",
  "aujourd'hui": "today",
  "Enregistrer aujourd'hui": "Save today",
  ["Aujourd\u2019hui"]: "Today",
  "Aucune seance prevue": "No workout planned",
  ["Aucune s\u00e9ance pr\u00e9vue"]: "No workout planned",
  "Planifie une seance dans Planning pour l'afficher ici le bon jour.": "Schedule a workout in Planning to show it here on the right day.",
  ["Planifie une s\u00e9ance dans Planning pour recevoir des suggestions cibl\u00e9es."]: "Schedule a workout in Planning to receive targeted suggestions.",
  "Ouvrir Planning": "Open Planning",
  "Aller au Planning": "Go to Planning",
  "No workout planned": "No workout planned",
  "Schedule a workout in Planning to show it here on the right day.": "Schedule a workout in Planning to show it here on the right day.",
  "Seance Builder": "Workout Builder",
  "Preparation des semaines": "Week preparation",
  "Avant la salle": "Before the gym",
  "Seances": "Workouts",
  "Exercices": "Exercises",
  "Modeles": "Models",
  "Nom de la seance": "Workout name",
  "Groupe": "Group",
  "Nouveau groupe": "New group",
  "Creer": "Create",
  "Bibliotheque exercices": "Exercise library",
  "Exercice": "Exercise",
  "Groupe musculaire": "Muscle group",
  "Type": "Type",
  "Repos par defaut": "Default rest",
  "Alternatives": "Alternatives",
  "Ajouter l'exercice": "Add exercise",
  "Groupes musculaires": "Muscle groups",
  "Renommer ou supprimer un groupe personnalise.": "Rename or delete a custom group.",
  "Recherche exercice": "Search exercise",
  "Search exercise": "Search exercise",
  "Squat, tirage, curl...": "Squat, row, curl...",
  "jj/mm/aaaa": "mm/dd/yyyy",
  "Programmes prets a adapter": "Ready-to-adapt programs",
  "Ajouter ce modele": "Add this model",
  "Volume modere/eleve, fourchette 8-12 reps et repos autour de 90 secondes.": "Moderate/high volume, 8-12 rep range and rests around 90 seconds.",
  "Seances plus denses, reps plus hautes et repos courts pour garder du rythme.": "Denser workouts, higher reps and shorter rests to keep the pace.",
  "Moins d'exercices, charges plus lourdes, repos longs et progression stricte.": "Fewer exercises, heavier loads, longer rests and strict progression.",
  "Equilibre simple pour garder les acquis sans exploser le planning.": "Simple balance to keep your gains without overloading the schedule.",
  "cardio oui": "cardio yes",
  "cardio non": "cardio no",
  "cardio optionnel": "cardio optional",
  "Organisation hebdo": "Weekly organization",
  "Calendrier": "Calendar",
  "Date": "Date",
  "Seance": "Workout",
  "Revient chaque semaine": "Repeats weekly",
  "Planifier": "Schedule",
  "Semaine": "Week",
  "Planner": "Planner",
  "Liste": "List",
  "Performance & Mensurations": "Performance & Measurements",
  "Performance": "Performance",
  "Coach": "Coach",
  "Courbes": "Charts",
  "Mensurations": "Measurements",
  "Outils & prochaines categories": "Tools & upcoming categories",
  "Module a venir": "Coming soon",
  "Prochainement": "Coming soon",
  "Sommeil, fatigue et douleurs": "Sleep, fatigue and pain",
  "En reconstruction pour rester simple, clair et vraiment utile.": "Being rebuilt to stay simple, clear and genuinely useful.",
  "Noter la recuperation pour mieux comprendre les performances et ajuster les seances.": "Track recovery to better understand performance and adjust workouts.",
  "Nutrition arrive prochainement": "Nutrition coming soon",
  "Cette partie est mise en pause le temps de construire un suivi plus clair et plus utile.": "This area is paused while a clearer, more useful tracker is built.",
  "Nutrition dans AERSTRONG": "Nutrition in AERSTRONG",
  "Nutrition doit etre un tableau de bord d'adherence, pas un compteur alimentaire complet. Rapide a remplir en 30 secondes par jour, utile pour expliquer les performances.": "Nutrition should be an adherence dashboard, not a full calorie counter. Quick to fill in 30 seconds per day, useful for explaining performance.",
  "Nutrition doit etre un tableau de bord d’adherence, pas un compteur alimentaire complet. Rapide a remplir en 30 secondes par jour, utile pour expliquer les performances.": "Nutrition should be an adherence dashboard, not a full calorie counter. Quick to fill in 30 seconds per day, useful for explaining performance.",
  "J'ai compris": "I understand",
  "Options": "Settings",
  "Couleur interface": "Interface color",
  "Mode": "Mode",
  "Poids": "Weight",
  "Taille": "Height",
  "Tour taille": "Waist",
  "Poitrine": "Chest",
  "Carre epaules": "Shoulder girth",
  "Date des mesures": "Measurement date",
  "Reps par serie": "Reps per set",
  "Mesures": "Measurements",
  "Langue": "Language",
  "Sombre": "Dark",
  "Clair": "Light",
  "Francais": "French",
  "Protection des donnees": "Data protection",
  "Autoriser AERSTRONG a proteger les donnees locales de ce telephone ? Les sauvegardes automatiques resteront sur l'appareil.": "Allow AERSTRONG to protect the local data on this phone? Automatic backups will stay on the device.",
  "Autoriser": "Allow",
  "Confirmer": "Confirm",
  "Confirmation": "Confirmation",
  "Valeur": "Value",
  "Protection locale non activee": "Local protection not enabled",
  "Protection locale active": "Local protection active",
  "Protection locale non disponible sur ce navigateur. La backup interne reste active.": "Local protection is not available in this browser. Internal backup remains active.",
  "Stockage protege": "Protected storage",
  "Stockage protege sur ce telephone. Backup locale automatique active.": "Storage protected on this phone. Automatic local backup is active.",
  "Backup automatique active": "Automatic backup active",
  "Backup locale active. Le navigateur n'a pas garanti le stockage persistant.": "Local backup active. The browser did not guarantee persistent storage.",
  "Backup locale active. La demande de protection a echoue sur ce navigateur.": "Local backup active. The protection request failed in this browser.",
  "Derniere backup": "Latest backup",
  "Backup locale en attente de la prochaine modification.": "Local backup waiting for the next change.",
  "Le telephone a accepte le stockage persistant. AERSTRONG garde aussi une backup precedente en securite.": "The phone accepted persistent storage. AERSTRONG also keeps a previous backup for safety.",
  "Le navigateur n'a pas garanti le stockage persistant, mais AERSTRONG garde une backup locale avant chaque modification.": "The browser did not guarantee persistent storage, but AERSTRONG keeps a local backup before each change.",
  "Demande au telephone de conserver les donnees AERSTRONG et garde une backup precedente en cas d'erreur.": "Ask the phone to keep AERSTRONG data and keep a previous backup in case of error.",
  "Les donnees restent sur ce telephone. Garde un export en securite.": "Your data stays on this phone. Keep an export as a safety copy.",
  "Securite automatique": "Automatic safety",
  "Activer la protection locale": "Enable local protection",
  "Activer": "Enable",
  "Protege": "Protected",
  "Backup active": "Backup active",
  "Sauvegarde fichier": "File backup",
  "Exporter ou importer": "Export or import",
  "Cree un fichier compact a garder hors de l'app, utile avant une grosse mise a jour ou un changement de telephone.": "Create a compact file to keep outside the app, useful before a major update or a phone change.",
  "Exporter": "Export",
  "Importer": "Import",
  "Retour de secours": "Emergency restore",
  "Restaurer la derniere backup": "Restore latest backup",
  "Revient a l'etat juste avant la derniere modification sauvegardee sur ce telephone.": "Returns to the state just before the latest saved change on this phone.",
  "Restaurer": "Restore",
  "Installation et mise a jour": "Install and update",
  "Disponible hors ligne apres la premiere ouverture complete.": "Available offline after the first full launch.",
  "Installation hors ligne en preparation. Recharge l'app une fois si besoin.": "Offline install is being prepared. Reload the app once if needed.",
  "Hors ligne indisponible sur cette adresse. Il faudra le lien HTTPS de la PWA.": "Offline mode is unavailable on this address. The HTTPS PWA link will fix it.",
  "Aucun service de mise a jour actif sur cette adresse.": "No update service is active on this address.",
  "Verification de mise a jour...": "Checking for update...",
  "AERSTRONG est deja a jour sur ce telephone.": "AERSTRONG is already up to date on this phone.",
  "Verification impossible pour le moment.": "Update check is unavailable right now.",
  "Aucune mise a jour prete pour le moment.": "No update is ready right now.",
  "Backup de securite creee avant mise a jour.": "Safety backup created before update.",
  "Nouvelle sauvegarde compacte creee. Tu peux supprimer l'ancien fichier JSON.": "New compact backup created. You can delete the old JSON file.",
  "Export compact cree. Garde ce fichier comme sauvegarde.": "Compact export created. Keep this file as a backup.",
  "Import refuse : ce fichier ne ressemble pas a une sauvegarde AERSTRONG.": "Import refused: this file does not look like an AERSTRONG backup.",
  "Ancien format importe. Conversion compacte conseillee.": "Old format imported. Compact conversion recommended.",
  "Import termine. Les donnees ont ete restaurees sur ce telephone.": "Import complete. Data has been restored on this phone.",
  "Ancien format JSON detecte. Creer maintenant une nouvelle sauvegarde compacte adaptee a AERSTRONG ? L'ancien fichier ne peut pas etre supprime automatiquement, mais tu pourras le retirer apres.": "Old JSON format detected. Create a new compact AERSTRONG backup now? The old file cannot be deleted automatically, but you can remove it afterward.",
  "Convertir la sauvegarde": "Convert backup",
  "Creer la nouvelle": "Create new one",
  "Import impossible : fichier illisible ou corrompu.": "Import impossible: unreadable or corrupted file.",
  "Aucune backup locale disponible pour le moment.": "No local backup available right now.",
  "Restaurer la backup": "Restore backup",
  "Restaurer la derniere backup locale ? Les donnees actuelles seront remplacees par l'etat precedent.": "Restore the latest local backup? Current data will be replaced by the previous state.",
  "Backup locale restauree.": "Local backup restored.",
  "Backup locale illisible. Restauration impossible.": "Local backup unreadable. Restore impossible.",
  "Verifier": "Check",
  "Installer": "Install",
  "A propos d'AERSTRONG": "About AERSTRONG",
  "Profils": "Profiles",
  "Chaque profil a ses propres seances, stats et mesures.": "Each profile has its own workouts, stats and measurements.",
  "Profil principal": "Main profile",
  "Profile principal": "Main profile",
  "Ajouter": "Add",
  "Sauver": "Save",
  "Fermer": "Close",
  "Annuler": "Cancel",
  "Modifier": "Edit",
  "Supprimer": "Delete",
  "Dupliquer": "Duplicate",
  "Deplacer cette occurrence": "Move this occurrence",
  "Nouvelle date": "New date",
  "Machine indisponible": "Machine unavailable",
  "Choisis une alternative.": "Choose an alternative.",
  "Charge utilisee": "Weight used",
  "Valider l'alternative": "Confirm alternative",
  "Quitter la seance ?": "Exit workout?",
  "Certaines series ne sont pas terminees.": "Some sets are not complete.",
  "Manque de temps": "No time",
  "Erreur": "Mistake",
  "Autre raison": "Other reason",
  "Finir quand meme": "Finish anyway",
  "Quitter sans garder": "Exit without saving",
  "Continuer la seance": "Continue workout",
  "Commencer": "Start",
  "Fin seance": "Finish workout",
  "Aucune seance active. Planifie une seance dans Planning ou reviens demain.": "No active workout. Schedule one in Planning or come back tomorrow.",
  "Seance validee": "Workout completed",
  "est terminee pour aujourd'hui.": "is done for today.",
  "exercices": "exercises",
  "environ": "about",
  "Duree": "Duration",
  "Exos": "Exercises",
  "Derniere": "Last",
  "terminee": "completed",
  "Pas encore d'historique sur cette seance.": "No history for this workout yet.",
  "Nutrition basse aujourd'hui : reste vigilant sur proteines/eau.": "Low nutrition today: keep an eye on protein/water.",
  "Pas de signal nutrition negatif aujourd'hui.": "No negative nutrition signal today.",
  "Demarrer": "Start",
  "Reprendre": "Resume",
  "Aucune seance enregistree.": "No saved workout.",
  "Aucune mensuration enregistree.": "No measurements saved.",
  "Aucune seance terminee pour afficher le tonnage.": "No completed workout to show tonnage.",
  "Aucun volume recent.": "No recent volume.",
  "Aucune RM estimee pour l'instant.": "No estimated 1RM yet.",
  "Les performances apparaitront apres tes seances.": "Performances will appear after your workouts.",
  "Ajoute des donnees dans Mensurations ou termine des seances pour afficher les courbes.": "Add data in Measurements or complete workouts to show charts.",
  "Ajoute au moins deux seances terminees pour afficher les courbes sport.": "Add at least two completed workouts to show sport charts.",
  "Deux seances du meme type sont necessaires pour comparer tonnage et calories.": "Two workouts of the same type are needed to compare tonnage and calories.",
  "Deux performances minimum pour voir la RM.": "At least two performances are needed to show 1RM.",
  "Performance sport": "Sport performance",
  "Tonnage": "Tonnage",
  "Calories estimees": "Estimated calories",
  "Historique des seances": "Workout history",
  "Dernieres performances": "Latest performances",
  "RM estimees": "Estimated 1RM",
  "Volume par groupe": "Volume by group",
  "Volume recent": "Recent volume",
  ["Volume r\u00e9cent"]: "Recent volume",
  "Charges et objectifs": "Loads and targets",
  "Tonnage recent": "Recent tonnage",
  "Profil actif": "Active profile",
  "Profil": "Profile",
  "Nom": "Name",
  "Date de naissance": "Birth date",
  "Choisir dans le calendrier": "Choose from calendar",
  "Sauver profil": "Save profile",
  "Date des mesures": "Measurement date",
  "Enregistrer": "Save",
  "taille": "waist",
  "poitrine": "chest",
  "epaules": "shoulders",
  "bras D/G": "arms R/L",
  "avant-bras D/G": "forearms R/L",
  "cuisses D/G": "thighs R/L",
  "mollets D/G": "calves R/L",
  "Bodyfat %": "Bodyfat %",
  "Biceps D contracte": "Right flexed biceps",
  "Biceps G contracte": "Left flexed biceps",
  "Avant-bras D": "Right forearm",
  "Avant-bras G": "Left forearm",
  "Cuisse D": "Right thigh",
  "Cuisse G": "Left thigh",
  "Mollet D": "Right calf",
  "Mollet G": "Left calf",
  "Echauffement": "Warm-up",
  "Echauffement ?": "Warm-up?",
  "Debut de seance": "Workout start",
  "Oui": "Yes",
  "Non": "No",
  "Repos echauffement": "Warm-up rest",
  "Temps echauffement": "Warm-up time",
  "Training Together": "Training Together",
  "Mode solo": "Solo mode",
  "Ajouter un deuxieme profil a cette seance.": "Add a second profile to this workout.",
  "Machine guidee": "Guided machine",
  "Poulie": "Cable",
  "Halteres": "Dumbbells",
  "Barre": "Barbell",
  "Poids du corps": "Bodyweight",
  "Dos": "Back",
  "Pectoraux": "Chest",
  "Jambes": "Legs",
  "Epaules": "Shoulders",
  "Biceps": "Biceps",
  "Triceps": "Triceps",
  "Abdos": "Abs",
  "Trapezes": "Traps",
  "Autre": "Other",
  "Ajouter une alternative...": "Add an alternative...",
  "Aucune alternative ajoutee.": "No alternative added.",
  "Add une alternative...": "Add an alternative...",
  "No alternative ajoutee.": "No alternative added.",
  "aucune": "none",
  "Alternatives :": "Alternatives:",
  "Tous": "All",
  "General": "General",
  "Prise de masse": "Muscle gain",
  "Seche": "Cutting",
  "Force": "Strength",
  "Maintien": "Maintenance",
  "Repos": "Rest",
  "repos": "rest",
  "series": "sets",
  "exos": "exercises",
  "Rep min": "Min reps",
  "Rep max": "Max reps",
  "Secondes": "Seconds",
  "prevue": "planned",
  "en cours": "active",
  "faite": "done",
  "seance": "workout",
  "seances": "workouts",
  "releves": "entries",
  "terminees": "completed",
  "jours": "days",
  "ans": "years",
  "Pas encore assez d'historique pour proposer une progression.": "Not enough history yet to suggest progression.",
  "A faire aujourd'hui": "To do today",
  "Equilibre": "Balance",
  "Aucune seance prevue": "No workout planned",
  "Planifie une seance dans Planning pour recevoir des suggestions ciblees.": "Schedule a workout in Planning to receive targeted suggestions.",
  "Pas de signal nutrition negatif aujourd'hui.": "No negative nutrition signal today.",
  "Charges et objectifs": "Loads and targets",
  "Volume recent": "Recent volume",
  "Pas encore assez d'historique cette semaine pour analyser l'equilibre.": "Not enough history this week to analyze balance.",
  ["Pas encore assez d'historique cette semaine pour analyser l'\u00e9quilibre."]: "Not enough history this week to analyze balance.",
  "Exercice cle": "Key exercise",
  "a definir": "to define",
  ["peu ou pas travaill\u00e9 cette semaine."]: "little or not trained this week.",
  ["pr\u00e9sent, mais volume faible."]: "present, but volume is low.",
  ["R\u00e9partition correcte sur les grands groupes cette semaine."]: "Good distribution across the major groups this week.",
  "Aucun volume recent": "No recent volume",
  ["\u00c0 faire aujourd'hui"]: "To do today",
  ["\u00c9quilibre"]: "Balance",
  ["D\u00e9marrer"]: "Start",
  ["Aucune s\u00e9ance pr\u00e9vue"]: "No workout planned",
  ["Exercice cl\u00e9"]: "Key exercise",
  ["\u00e0 d\u00e9finir"]: "to define"
}));

const exerciseEnglishNames = new Map(Object.entries({
  "Tirage vertical machine poulie": "Machine lat pulldown",
  "Tirage vertical machine guidee": "Guided lat pulldown",
  "Tirage vertical poulie": "Cable lat pulldown",
  "Tirage unilateral poulie": "Single-arm cable pulldown",
  "Tractions assistees": "Assisted pull-ups",
  "Tractions pronation": "Overhand pull-ups",
  "Tractions supination": "Chin-ups",
  "Rowing poulie basse": "Seated cable row",
  "Rowing unilateral poulie": "Single-arm cable row",
  "Rowing machine guidee": "Guided machine row",
  "Rowing machine": "Machine row",
  "Rowing haltere": "Dumbbell row",
  "Rowing haltere unilateral": "Single-arm dumbbell row",
  "Rowing barre": "Barbell row",
  "Rowing T-bar": "T-bar row",
  "Tirage horizontal machine": "Horizontal machine row",
  "Pull-over poulie": "Cable pullover",
  "Pull-over machine": "Machine pullover",
  "Pull-over haltere": "Dumbbell pullover",
  "Souleve de terre": "Deadlift",
  "Souleve de terre roumain": "Romanian deadlift",
  "Rack pull": "Rack pull",
  "Developpe couche machine": "Machine chest press",
  "Developpe couche barre": "Barbell bench press",
  "Developpe couche halteres": "Dumbbell bench press",
  "Developpe incline machine": "Incline machine press",
  "Developpe incline barre": "Incline barbell press",
  "Developpe incline halteres": "Incline dumbbell press",
  "Developpe decline machine": "Decline machine press",
  "Developpe couche prise serree": "Close-grip bench press",
  "Pompes": "Push-ups",
  "Pompes lestee": "Weighted push-ups",
  "Pompes diamant": "Diamond push-ups",
  "Dips": "Dips",
  "Dips assistes": "Assisted dips",
  "Pec deck": "Pec deck",
  "Ecarte poulie vis-a-vis": "Cable fly",
  "Ecarte halteres": "Dumbbell fly",
  "Ecarte machine": "Machine fly",
  "Ecarte incline halteres": "Incline dumbbell fly",
  "Chest press convergente": "Converging chest press",
  "Developpe epaules machine": "Machine shoulder press",
  "Developpe militaire halteres": "Dumbbell shoulder press",
  "Developpe militaire barre": "Barbell overhead press",
  "Arnold press": "Arnold press",
  "Elevation laterale halteres": "Dumbbell lateral raise",
  "Elevation laterale poulie": "Cable lateral raise",
  "Elevation laterale machine": "Machine lateral raise",
  "Machine lateral raise": "Machine lateral raise",
  "Elevation frontale halteres": "Dumbbell front raise",
  "Elevation frontale poulie": "Cable front raise",
  "Oiseau machine": "Reverse pec deck",
  "Oiseau halteres": "Dumbbell rear delt fly",
  "Oiseau poulie": "Cable rear delt fly",
  "Face pull": "Face pull",
  "Upright row poulie": "Cable upright row",
  "Upright row barre": "Barbell upright row",
  "Squat barre": "Barbell squat",
  "Front squat": "Front squat",
  "Hack squat": "Hack squat",
  "Hack squat machine": "Hack squat machine",
  "Belt squat": "Belt squat",
  "Presse a cuisses": "Leg press",
  "Presse unilaterale": "Single-leg press",
  "Leg extension": "Leg extension",
  "Leg curl": "Leg curl",
  "Leg curl unilateral": "Single-leg curl",
  "Leg curl assis": "Seated leg curl",
  "RDL halteres": "Dumbbell RDL",
  "Hip thrust": "Hip thrust",
  "Hip thrust machine": "Machine hip thrust",
  "Glute bridge machine": "Machine glute bridge",
  "Fentes marchees": "Walking lunges",
  "Fentes bulgares": "Bulgarian split squat",
  "Split squat": "Split squat",
  "Goblet squat": "Goblet squat",
  "Goblet squat haltere": "Dumbbell goblet squat",
  "Sissy squat": "Sissy squat",
  "Spanish squat": "Spanish squat",
  "Abduction machine": "Abductor machine",
  "Adduction machine": "Adductor machine",
  "Abduction poulie": "Cable hip abduction",
  "Adduction poulie": "Cable hip adduction",
  "Mollets presse": "Leg press calf raise",
  "Mollets debout machine": "Standing machine calf raise",
  "Mollets assis machine": "Seated calf raise machine",
  "Mollets halteres": "Dumbbell calf raise",
  "Curl halteres": "Dumbbell curl",
  "Curl barre EZ": "EZ-bar curl",
  "Curl pupitre": "Preacher curl",
  "Curl pupitre machine": "Machine preacher curl",
  "Curl poulie basse": "Low cable curl",
  "Curl corde poulie": "Rope cable curl",
  "Curl marteau": "Hammer curl",
  "Curl halteres neutre": "Neutral-grip dumbbell curl",
  "Curl machine": "Machine curl",
  "Curl concentration": "Concentration curl",
  "Curl spider": "Spider curl",
  "Curl incline halteres": "Incline dumbbell curl",
  "Extension triceps poulie": "Cable triceps pushdown",
  "Extension triceps corde": "Rope triceps pushdown",
  "Extension barre poulie": "Straight-bar triceps pushdown",
  "Extension triceps haltere": "Dumbbell triceps extension",
  "Extension haltere nuque": "Overhead dumbbell triceps extension",
  "Extension triceps machine": "Machine triceps extension",
  "Barre au front": "Skull crusher",
  "Kickback triceps": "Triceps kickback",
  "Crunch machine": "Machine crunch",
  "Crunch poulie": "Cable crunch",
  "Crunch au sol": "Floor crunch",
  "Crunch inverse": "Reverse crunch",
  "Releve de jambes suspendu": "Hanging leg raise",
  "Releve de genoux chaise romaine": "Captain's chair knee raise",
  "Gainage": "Plank",
  "Planche laterale": "Side plank",
  "Dead bug": "Dead bug",
  "Rotation buste poulie": "Cable torso rotation",
  "Pallof press": "Pallof press",
  "Shrugs barre": "Barbell shrugs",
  "Shrugs halteres": "Dumbbell shrugs",
  "Shrugs machine": "Machine shrugs",
  "Farmer walk": "Farmer walk"
}));

const frenchFromEnglishTextMap = new Map([...englishTextMap.entries()].map(([fr, en]) => [en, fr]));
const frenchFromEnglishExerciseMap = new Map([...exerciseEnglishNames.entries()].map(([fr, en]) => [en, fr]));

function normalizeFrenchTextForLookup(value) {
  return String(value || "")
    .replace(/Ã€/g, "A")
    .replace(/Ã‰/g, "E")
    .replace(/Ã©/g, "e")
    .replace(/Ã¨/g, "e")
    .replace(/Ãª/g, "e")
    .replace(/Ã«/g, "e")
    .replace(/Ã /g, "a")
    .replace(/Ã¢/g, "a")
    .replace(/Ã´/g, "o")
    .replace(/Ã®/g, "i")
    .replace(/Ã¯/g, "i")
    .replace(/Ã¹/g, "u")
    .replace(/Ã»/g, "u")
    .replace(/Ã§/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function translateKnownText(text) {
  if (!text || !String(text).trim()) return text;
  const maps = isEnglish() ? [englishTextMap, exerciseEnglishNames] : [frenchFromEnglishTextMap, frenchFromEnglishExerciseMap];
  let output = isEnglish() ? normalizeFrenchTextForLookup(text) : String(text);
  maps.forEach((map) => {
    [...map.entries()].sort((a, b) => b[0].length - a[0].length).forEach(([source, target]) => {
      output = output.split(source).join(target);
    });
  });
  return output;
}

function displayExerciseName(name) {
  return isEnglish() ? (exerciseEnglishNames.get(name) || name) : (frenchFromEnglishExerciseMap.get(name) || name);
}

function displayExercise(exerciseItem) {
  return displayExerciseName(exerciseItem && exerciseItem.name ? exerciseItem.name : "Exercice");
}

function displayFamily(value) {
  return translateKnownText(value || "Autre");
}

function displayEquipment(value) {
  return translateKnownText(value || "");
}

function displayProfileName(name) {
  return translateKnownText(name || "Profil");
}

function editableProfileName(name) {
  return isEnglish() && name === "Profil principal" ? "Main profile" : (name || "");
}

function setInputLabel(selector, labelText) {
  const input = $(selector);
  const label = input && input.closest("label");
  if (!label) return;
  const node = [...label.childNodes].find((child) => child.nodeType === Node.TEXT_NODE && child.nodeValue.trim());
  if (node) node.nodeValue = labelText;
}

function updateUnitLabels() {
  setInputLabel("#onboardingBirthDateText", t("birthDate"));
  setInputLabel("#onboardingHeight", `${t("height")} ${lengthUnit()}`);
  setInputLabel("#onboardingWeight", `${t("weight")} ${weightUnit()}`);
  setInputLabel("#onboardingWaist", `${t("waist")} ${lengthUnit()}`);
  setInputLabel("#profileBirthDateText", t("birthDate"));
  setInputLabel("#profileHeight", `${t("height")} ${lengthUnit()}`);
  setInputLabel("#healthWeight", `${t("weight")} ${weightUnit()}`);
  setInputLabel("#healthWaist", `${t("waist")} ${lengthUnit()}`);
  setInputLabel("#healthChest", `${t("chest")} ${lengthUnit()}`);
  setInputLabel("#healthShoulders", `${t("shoulders")} ${lengthUnit()}`);
  setInputLabel("#editPlanWeight", weightUnit());
  setInputLabel("#editPlanIncrement", `+ ${weightUnit()}`);
  setInputLabel("#addExerciseWeight", weightUnit());
  setInputLabel("#addExerciseIncrement", `+ ${weightUnit()}`);
  setInputLabel("#nutritionWeight", `${t("todayWeight")} ${weightUnit()}`);
  setInputLabel("#nutritionCurrentWeight", `${t("currentWeight")} ${weightUnit()}`);
  setInputLabel("#nutritionTargetWeight", `${t("targetWeight")} ${weightUnit()}`);
  const datePlaceholder = isEnglish() ? "mm/dd/yyyy" : "jj/mm/aaaa";
  ["#onboardingBirthDateText", "#profileBirthDateText"].forEach((selector) => {
    const input = $(selector);
    if (input) input.placeholder = datePlaceholder;
  });
}
function localizeDocument(root = document.body) {
  if (!root) return;
  document.documentElement.lang = language();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const next = translateKnownText(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  });
  root.querySelectorAll("input[placeholder]").forEach((input) => {
    input.placeholder = translateKnownText(input.placeholder);
  });
  root.querySelectorAll("button[title], [aria-label]").forEach((el) => {
    if (el.title) el.title = translateKnownText(el.title);
    if (el.getAttribute("aria-label")) el.setAttribute("aria-label", translateKnownText(el.getAttribute("aria-label")));
  });
}

function localizeFragment(root) {
  updateUnitLabels();
  localizeDocument(root);
}
function exerciseById(exerciseId) {
  return state.exercises.find((item) => item.id === exerciseId);
}

function templateById(templateId) {
  return state.templates.find((item) => item.id === templateId);
}

function scheduledFor(dateKey) {
  const schedule = profileSchedule();
  const moves = profileScheduleMoves();
  const movedFrom = new Set(moves.map((move) => `${move.scheduleId}:${move.fromDate}`));
  const movedTo = moves
    .filter((move) => move.toDate === dateKey)
    .map((move) => {
      const source = schedule.find((item) => item.id === move.scheduleId);
      return source ? { ...source, date: move.toDate, movedFromDate: move.fromDate, scheduleKey: `${source.id}:${move.fromDate}:moved:${move.toDate}` } : null;
    })
    .filter(Boolean);
  const exact = schedule
    .filter((item) => item.date === dateKey && !movedFrom.has(`${item.id}:${dateKey}`))
    .map((item) => ({ ...item, scheduleKey: `${item.id}:${dateKey}` }));
  const repeated = schedule.filter((item) => {
    if (!item.repeatWeekly || item.date === dateKey) return false;
    const start = new Date(`${item.date}T12:00:00`);
    const current = new Date(`${dateKey}T12:00:00`);
    const days = Math.round((current - start) / 86400000);
    return days > 0 && days % 7 === 0;
  })
    .filter((item) => !movedFrom.has(`${item.id}:${dateKey}`))
    .map((item) => ({ ...item, scheduleKey: `${item.id}:${dateKey}` }));
  return [...exact, ...repeated, ...movedTo];
}

function isScheduleDone(item, dateKey, profileId = state.activeProfileId) {
  const scheduleKey = item && (item.scheduleKey || `${item.id}:${dateKey}`);
  return state.logs.some((log) => log.profileId === profileId && log.date === dateKey && log.finishedAt && completedSetCount(log) > 0 && (
    log.scheduleKey ? log.scheduleKey === scheduleKey : log.templateId === item.templateId
  ));
}

function isTemplateDoneOnDate(templateId, dateKey, profileId = state.activeProfileId) {
  return state.logs.some((log) => log.profileId === profileId && log.date === dateKey && log.templateId === templateId && log.finishedAt && completedSetCount(log) > 0);
}

function pendingScheduledFor(dateKey) {
  return scheduledFor(dateKey).filter((item) => !isScheduleDone(item, dateKey));
}

function currentScheduledItem() {
  return pendingScheduledFor(todayKey)[0] || null;
}

function currentTemplate() {
  const planned = currentScheduledItem();
  return planned ? templateById(planned.templateId) : null;
}

function todayTemplate() {
  const planned = pendingScheduledFor(todayKey)[0];
  return planned ? templateById(planned.templateId) : null;
}

function currentTemplateForProfile(profileId) {
  const previousProfileId = state.activeProfileId;
  state.activeProfileId = profileId;
  const template = currentTemplate();
  state.activeProfileId = previousProfileId;
  return template;
}

function currentLog(templateId, scheduledItem = currentScheduledItem()) {
  const template = templateId ? templateById(templateId) : currentTemplate();
  const resolvedTemplateId = template ? template.id : undefined;
  const scheduleKey = scheduledItem && (scheduledItem.scheduleKey || `${scheduledItem.id}:${todayKey}`);
  let log = state.logs.find((item) => item.profileId === state.activeProfileId && item.date === todayKey && item.templateId === resolvedTemplateId && !item.archived && !item.finishedAt && (
    scheduleKey ? item.scheduleKey === scheduleKey : !item.scheduleKey
  ));
  if (!log) {
    log = {
      id: id(),
      profileId: state.activeProfileId,
      date: todayKey,
      templateId: resolvedTemplateId,
      scheduleId: scheduledItem && scheduledItem.id,
      scheduleKey,
      entries: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      introSeenIndex: -1,
      startedAt: new Date().toISOString(),
      exitReason: null,
    };
    state.logs.unshift(log);
  }
  return log;
}

function currentLogForProfile(profileId, templateId, scheduledItem = currentScheduledItem()) {
  const scheduleKey = scheduledItem && (scheduledItem.scheduleKey || `${scheduledItem.id}:${todayKey}`);
  let log = state.logs.find((item) => item.profileId === profileId && item.date === todayKey && item.templateId === templateId && !item.archived && !item.finishedAt && (
    scheduleKey ? item.scheduleKey === scheduleKey : !item.scheduleKey
  ));
  if (!log) {
    log = {
      id: id(),
      profileId,
      date: todayKey,
      templateId,
      scheduleId: scheduledItem && scheduledItem.id,
      scheduleKey,
      entries: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      introSeenIndex: -1,
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

function persistActiveTrainingInputs() {
  const scheduledItem = currentScheduledItem();
  const template = scheduledItem ? templateById(scheduledItem.templateId) : currentTemplate();
  if (!template) return;
  const log = currentLog(template.id, scheduledItem);
  const item = currentPlanItem(log);
  if (!item) return;
  const entry = entryFor(log, item);
  const setIndex = Math.min(log.currentSetIndex, item.sets - 1);
  const repsInput = $("#activeRepInput");
  const weightInput = $("#activeWeightInput");
  if (repsInput) entry.reps[setIndex] = repsInput.value;
  if (weightInput && weightInput.value !== "") {
    const weight = fromDisplayWeight(weightInput.value);
    if (Number.isFinite(weight)) {
      entry.weight = weight;
      item.weight = weight;
    }
  }
}

function propagateFutureSetValues(entry, setIndex, reps, weight) {
  for (let index = setIndex + 1; index < entry.reps.length; index += 1) {
    if (entry.completed && entry.completed[index]) continue;
    entry.reps[index] = reps;
  }
  if (Number.isFinite(weight)) entry.weight = weight;
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

function firstIncompleteExerciseIndex(log) {
  const template = templateById(log.templateId);
  if (!template || !template.items) return -1;
  return template.items.findIndex((item) => {
    const entry = log.entries.find((candidate) => candidate.planItemId === item.id);
    return !entry || !entry.completed || entry.completed.some((done) => !done);
  });
}

function moveLogToNextIncomplete(log) {
  const nextIndex = firstIncompleteExerciseIndex(log);
  if (nextIndex < 0) return false;
  log.currentExerciseIndex = nextIndex;
  const item = currentPlanItem(log);
  const entry = item && entryFor(log, item);
  const nextSet = entry ? entry.completed.findIndex((done) => !done) : -1;
  log.currentSetIndex = nextSet >= 0 ? nextSet : 0;
  return true;
}

function completedSetCount(log) {
  return (log.entries || []).reduce((total, entry) => total + ((entry.completed || []).filter(Boolean).length), 0);
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

function birthDateToDisplay(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return isEnglish() ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

function formatBirthDateDisplay(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function displayToBirthDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{4})$/);
  if (!match) return "";
  const [, first, second, year] = match;
  const day = isEnglish() ? second : first;
  const month = isEnglish() ? first : second;
  if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function showAppMessage({ title = "AERSTRONG", message = "", confirmLabel = "OK", cancelLabel = "Annuler", danger = false, input = false, inputLabel = "Valeur", inputValue = "", onConfirm = null }) {
  const dialog = $("#appMessageDialog");
  if (!dialog) return;
  $("#appMessageTitle").textContent = translateKnownText(title);
  $("#appMessageText").textContent = translateKnownText(message);
  $("#appMessageConfirm").textContent = translateKnownText(confirmLabel);
  $("#appMessageCancel").textContent = translateKnownText(cancelLabel);
  $("#appMessageCancel").hidden = !cancelLabel;
  $("#appMessageConfirm").classList.toggle("danger-action", !!danger);
  const inputWrap = $("#appMessageInputWrap");
  const inputField = $("#appMessageInput");
  inputWrap.hidden = !input;
  inputField.value = input ? inputValue : "";
  $("#appMessageInputLabel").textContent = translateKnownText(inputLabel);
  appMessageConfirmHandler = () => {
    const value = input ? inputField.value : true;
    dialog.close();
    if (onConfirm) onConfirm(value);
  };
  if (dialog.showModal && !dialog.open) dialog.showModal();
  if (input) setTimeout(() => inputField.focus(), 50);
}

function showAppNotice(message, title = "AERSTRONG") {
  showAppMessage({ title, message, confirmLabel: "Compris", cancelLabel: "", onConfirm: null });
}

function showAppConfirm(message, onConfirm, title = "Confirmation", danger = false, confirmLabel = "Confirmer") {
  showAppMessage({ title, message, confirmLabel, danger, onConfirm });
}

function showAppPrompt(message, initialValue, onConfirm, title = "AERSTRONG") {
  showAppMessage({ title, message, confirmLabel: "Valider", input: true, inputLabel: message, inputValue: initialValue || "", onConfirm });
}

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function exerciseMatchesSearch(exerciseItem, query) {
  const cleanQuery = normalizeSearch(query);
  if (!cleanQuery) return true;
  const haystack = [
    exerciseItem.name,
    exerciseItem.family,
    exerciseItem.equipment,
    ...(exerciseItem.alternatives || []),
  ].map(normalizeSearch).join(" ");
  return haystack.includes(cleanQuery);
}

function highlightMatch(value, query) {
  const text = String(value || "");
  const cleanQuery = normalizeSearch(query);
  if (!cleanQuery) return escapeHtml(text);
  const normalizedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const index = normalizedText.toLowerCase().indexOf(cleanQuery);
  if (index < 0) return escapeHtml(text);
  return `${escapeHtml(text.slice(0, index))}<mark>${escapeHtml(text.slice(index, index + cleanQuery.length))}</mark>${escapeHtml(text.slice(index + cleanQuery.length))}`;
}

function restLabel(seconds) {
  return formatTime(Number(seconds || 0));
}

function setRestPicker(prefix, seconds) {
  const minuteSelect = $(`#${prefix}Minutes`);
  const secondSelect = $(`#${prefix}Seconds`);
  if (!minuteSelect || !secondSelect) return;
  const normalized = Number(seconds || 120);
  minuteSelect.value = String(Math.floor(normalized / 60));
  secondSelect.value = String(Math.floor(normalized % 60 / 10) * 10);
}

function restFromPicker(prefix) {
  const minutes = Number($(`#${prefix}Minutes`) && $(`#${prefix}Minutes`).value || 0);
  const seconds = Number($(`#${prefix}Seconds`) && $(`#${prefix}Seconds`).value || 0);
  return Math.max(10, minutes * 60 + seconds);
}

function pickerOptions(max, step, selected) {
  const values = [];
  for (let value = 0; value <= max; value += step) values.push(value);
  return values.map((value) => `<option value="${value}" ${Number(selected) === value ? "selected" : ""}>${String(value).padStart(2, "0")}</option>`).join("");
}

function fillRestPickers() {
  ["exerciseRest", "editPlanRest", "addExerciseRest"].forEach((prefix) => {
    const minuteSelect = $(`#${prefix}Minutes`);
    const secondSelect = $(`#${prefix}Seconds`);
    if (!minuteSelect || !secondSelect || minuteSelect.dataset.ready) return;
    minuteSelect.innerHTML = pickerOptions(10, 1, 2);
    secondSelect.innerHTML = pickerOptions(50, 10, 0);
    minuteSelect.dataset.ready = "true";
  });
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

function allMuscleGroups() {
  return normalizeMuscleGroups(state.muscleGroups, state.exercises);
}

function groupedExercises(exercises) {
  return allMuscleGroups()
    .filter((group) => group !== "Autre")
    .map((group) => ({ group, items: exercises.filter((exerciseItem) => exerciseItem.family === group).sort((a, b) => a.name.localeCompare(b.name, "fr")) }))
    .filter((section) => section.items.length);
}

function filteredExercises(query = "") {
  return state.exercises.filter((exerciseItem) => exerciseMatchesSearch(exerciseItem, query));
}

function exerciseSelectOptions(selectedId = "", query = "") {
  return groupedExercises(filteredExercises(query)).map((section) => `
    <optgroup label="${escapeHtml(displayFamily(section.group))}">
      ${section.items.map((exerciseItem) => `<option value="${exerciseItem.id}" ${exerciseItem.id === selectedId ? "selected" : ""}>${escapeHtml(displayExercise(exerciseItem))}</option>`).join("")}
    </optgroup>
  `).join("");
}

function exerciseSuggestionButtons(query, selectedId = "") {
  const cleanQuery = normalizeSearch(query);
  if (!cleanQuery) return "";
  return filteredExercises(query).slice(0, 8).map((exerciseItem) => `
    <button class="suggestion-chip ${exerciseItem.id === selectedId ? "active" : ""}" data-pick-exercise="${exerciseItem.id}" type="button">
      ${highlightMatch(displayExercise(exerciseItem), query)}
      <span>${escapeHtml(displayFamily(exerciseItem.family))} - ${escapeHtml(displayEquipment(exerciseItem.equipment))}</span>
    </button>
  `).join("") || `<p class="empty compact-empty">Aucun exercice trouve.</p>`;
}

function templateSelectOptions(selectedId = "") {
  return profileTrainingGroups().map((group) => {
    const items = profileTemplates()
      .filter((template) => (template.group || "General") === group)
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
    if (!items.length) return "";
    return `<optgroup label="${escapeHtml(translateKnownText(group))}">${items.map((template) => `<option value="${template.id}" ${template.id === selectedId ? "selected" : ""}>${escapeHtml(template.name)}</option>`).join("")}</optgroup>`;
  }).join("");
}

function resetExerciseForm() {
  editingExerciseId = null;
  activeExerciseAlternatives = [];
  $("#exerciseEditId").value = "";
  $("#exerciseForm").reset();
  $("#exerciseSubmitButton").textContent = "Ajouter l'exercice";
  $("#cancelExerciseEdit").hidden = true;
  setRestPicker("exerciseRest", 120);
  renderExerciseFormHelpers();
}

function selectedExerciseFamily() {
  const value = $("#exerciseFamily").value;
  return value || "Autre";
}

function renderExerciseFormHelpers() {
  const previousFamily = $("#exerciseFamily").value || "Dos";
  const previousAlternativePick = $("#exerciseAlternativePick").value;
  const groups = allMuscleGroups();
  $("#exerciseFamily").innerHTML = groups.map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(displayFamily(group))}</option>`).join("");
  $("#exerciseFamily").value = groups.includes(previousFamily) ? previousFamily : "Dos";
  const currentId = $("#exerciseEditId").value;
  const alternatives = state.exercises.filter((exerciseItem) => exerciseItem.id !== currentId && !activeExerciseAlternatives.includes(exerciseItem.name));
  $("#exerciseAlternativePick").innerHTML = `<option value="">Ajouter une alternative...</option>${groupedExercises(alternatives).map((section) => `
    <optgroup label="${escapeHtml(displayFamily(section.group))}">
      ${section.items.map((exerciseItem) => `<option value="${escapeHtml(exerciseItem.name)}">${escapeHtml(displayExercise(exerciseItem))}</option>`).join("")}
    </optgroup>
  `).join("")}`;
  $("#exerciseAlternativePick").value = previousAlternativePick || "";
  $("#exerciseAlternativeTags").innerHTML = activeExerciseAlternatives.map((name) => `
    <button class="tag-chip" data-remove-exercise-alternative="${escapeHtml(name)}" type="button">
      <span>${escapeHtml(displayExerciseName(name))}</span><strong>x</strong>
    </button>
  `).join("") || `<p class="muted-text">Aucune alternative ajoutee.</p>`;
  $("#muscleGroupManager").innerHTML = allMuscleGroups().map((group) => {
    const locked = defaultMuscleGroups().includes(group);
    return `<span class="manager-chip">${escapeHtml(displayFamily(group))}${locked ? "" : `<button class="icon-mini chip-options" data-muscle-group-options="${escapeHtml(group)}" type="button" aria-label="Options ${escapeHtml(displayFamily(group))}">...</button>`}</span>`;
  }).join("");
  localizeFragment($("#builderLibrary"));
}

function renameMuscleGroup(oldName) {
  if (!oldName) return;
  showAppPrompt("Nouveau nom du groupe musculaire", oldName, (newName) => {
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const cleanName = newName.trim();
    state.muscleGroups = state.muscleGroups.map((group) => group === oldName ? cleanName : group);
    state.exercises.forEach((exerciseItem) => {
      if (exerciseItem.family === oldName) exerciseItem.family = cleanName;
    });
    if (muscleFilter === oldName) muscleFilter = cleanName;
    saveState();
    render();
  }, "Renommer le groupe");
}

function deleteMuscleGroup(group) {
  if (!group) return;
  const used = state.exercises.some((exerciseItem) => exerciseItem.family === group);
  const runDelete = () => {
    state.exercises.forEach((exerciseItem) => {
      if (exerciseItem.family === group) exerciseItem.family = "Autre";
    });
    state.muscleGroups = state.muscleGroups.filter((item) => item !== group);
    if (muscleFilter === group) muscleFilter = "Tous";
    saveState();
    render();
  };
  if (used) {
    showAppConfirm(`Le groupe "${group}" contient des exercices. Les passer dans "Autre" ?`, runDelete, "Supprimer le groupe", true, "Supprimer");
    return;
  }
  runDelete();
}

function editExercise(exerciseItem) {
  editingExerciseId = exerciseItem.id;
  activeExerciseAlternatives = [...(exerciseItem.alternatives || [])];
  $("#exerciseEditId").value = exerciseItem.id;
  $("#exerciseName").value = exerciseItem.name;
  $("#exerciseEquipment").value = exerciseItem.equipment;
  renderExerciseFormHelpers();
  $("#exerciseFamily").value = allMuscleGroups().includes(exerciseItem.family) ? exerciseItem.family : "Autre";
  setRestPicker("exerciseRest", exerciseItem.rest);
  $("#exerciseSubmitButton").textContent = "Modifier l'exercice";
  $("#cancelExerciseEdit").hidden = false;
  builderMode = "library";
  renderBuilderPanes();
  $("#exerciseForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function applyExerciseRename(oldName, newName) {
  state.logs.forEach((log) => {
    (log.entries || []).forEach((entry) => {
      if (entry.performedExerciseName === oldName) entry.performedExerciseName = newName;
    });
  });
  state.exercises.forEach((exerciseItem) => {
    exerciseItem.alternatives = (exerciseItem.alternatives || []).map((name) => name === oldName ? newName : name);
  });
}

function removeExerciseEverywhere(exerciseId) {
  const exerciseItem = exerciseById(exerciseId);
  if (!exerciseItem) return;
  state.templates.forEach((template) => {
    template.items = (template.items || []).filter((item) => item.exerciseId !== exerciseId);
  });
  state.logs.forEach((log) => {
    log.entries = (log.entries || []).filter((entry) => entry.exerciseId !== exerciseId && entry.performedExerciseName !== exerciseItem.name);
  });
  state.exercises = state.exercises
    .filter((item) => item.id !== exerciseId)
    .map((item) => ({ ...item, alternatives: (item.alternatives || []).filter((name) => name !== exerciseItem.name) }));
  delete state.substitutions[exerciseId];
}

function estimatedTemplateMinutes(template) {
  if (!template || !template.items || !template.items.length) return 0;
  const seconds = template.items.reduce((total, item) => {
    const exercise = exerciseById(item.exerciseId);
    const rest = Number(item.rest || (exercise && exercise.rest) || 90);
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

function scheduleStatus(item, dateKey) {
  const scheduleKey = item.scheduleKey || `${item.id}:${dateKey}`;
  const active = state.logs.some((log) => log.profileId === state.activeProfileId && log.date === dateKey && log.templateId === item.templateId && !log.archived && !log.finishedAt && (
    log.scheduleKey ? log.scheduleKey === scheduleKey : true
  ));
  const done = isScheduleDone(item, dateKey);
  if (done) return "faite";
  if (active) return "en cours";
  return "prevue";
}

function scheduleStatusPill(item, dateKey) {
  const status = scheduleStatus(item, dateKey);
  return `<span class="status-pill schedule-${status.replace(" ", "-")}">${status}</span>`;
}

function renderTodayDashboard() {
  const panel = $("#todayDashboard");
  if (!panel) return;
  const template = todayTemplate();
  const plannedToday = scheduledFor(todayKey);
  if (!template && plannedToday.length && plannedToday.every((item) => isScheduleDone(item, todayKey))) {
    const doneNames = plannedToday.map((item) => templateById(item.templateId)).filter(Boolean).map((item) => item.name).join(" / ");
    panel.innerHTML = `
      <article class="today-card empty-plan validated-plan">
        <div>
          <p class="label">Aujourd'hui</p>
          <h2>Seance validee</h2>
          <p>${escapeHtml(doneNames)} est terminee pour aujourd'hui.</p>
        </div>
        <span class="status-pill">Fait</span>
      </article>
    `;
    return;
  }
  if (!template) {
    panel.innerHTML = `
      <article class="today-card empty-plan">
        <div>
          <p class="label">Aujourd'hui</p>
          <h2>Aucune seance prevue</h2>
          <p>Planifie une seance dans Planning pour l'afficher ici le bon jour.</p>
        </div>
        <button class="primary-button" data-view="planner" type="button">Ouvrir Planning</button>
      </article>
    `;
    return;
  }

  const last = lastComparableLog(template.id);
  const minutes = estimatedTemplateMinutes(template);
  const exerciseNames = template.items.slice(0, 3).map((item) => escapeHtml((exerciseById(item.exerciseId) && exerciseById(item.exerciseId).name) || "Exercice"));
  const more = template.items.length > 3 ? ` +${template.items.length - 3}` : "";
  const activeSchedule = currentScheduledItem();
  const activeLog = state.logs.find((item) => item.profileId === state.activeProfileId && item.date === todayKey && item.templateId === template.id && !item.archived && !item.finishedAt && (!activeSchedule || item.scheduleKey === activeSchedule.scheduleKey));

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
  if (!nutritionEnabled) {
    panel.innerHTML = `
      <article class="nutrition-card">
        <strong>Nutrition arrive prochainement</strong>
        <p class="muted-text">Cette partie est mise en pause le temps de construire un suivi plus clair et plus utile.</p>
      </article>
    `;
    localizeFragment(panel);
    return;
  }
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
            <p>${item.water ? `${item.water} L` : "-"}${item.weight ? ` - ${fmtWeight(item.weight)}` : ""}${item.note ? ` - ${escapeHtml(item.note)}` : ""}</p>
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
  localizeFragment(panel);
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

function latestEntryForExercise(exerciseId) {
  const exerciseItem = exerciseById(exerciseId);
  const names = new Set([exerciseId, exerciseItem && exerciseItem.name].filter(Boolean));
  const logs = profileLogs()
    .filter((log) => log.finishedAt && !log.archived)
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
  for (const log of logs) {
    const entry = (log.entries || []).find((item) => item.exerciseId === exerciseId || names.has(item.performedExerciseName));
    if (entry && (entry.completed || []).some(Boolean)) return { log, entry };
  }
  return null;
}

function planItemForEntry(log, entry) {
  const template = templateById(log.templateId);
  const exact = template && (template.items || []).find((item) => item.id === entry.planItemId);
  if (exact) return exact;
  const exerciseName = String(entry.performedExerciseName || "").toLowerCase();
  return profileTemplates()
    .flatMap((templateItem) => templateItem.items || [])
    .find((item) => {
      const exercise = exerciseById(item.exerciseId);
      return item.exerciseId === entry.exerciseId || (exercise && exercise.name.toLowerCase() === exerciseName);
    });
}

function coachSuggestionFromEntry(log, entry, item) {
  const exercise = exerciseById((item && item.exerciseId) || entry.exerciseId);
  const exerciseName = (exercise && exercise.name) || entry.performedExerciseName || "Exercice";
  const reps = (entry.reps || []).filter((rep, index) => !entry.completed || entry.completed[index]).map((rep) => Number(rep || 0));
  const safeReps = reps.length ? reps : [0];
  const targetItem = item || {
    sets: safeReps.length,
    minReps: Math.min(...safeReps.filter(Boolean), 8),
    maxReps: Math.max(...safeReps.filter(Boolean), 12),
    weight: Number(entry.weight || 0),
    increment: 2.5,
    targetReps: safeReps,
  };
  const next = nextTarget(targetItem, reps);
  const template = templateById(log.templateId);
  const context = template ? ` (${template.name})` : "";
  if (next.reason === "haut de fourchette atteint") {
    return {
      type: "Augmenter",
      family: exercise && exercise.family,
      templateId: log.templateId,
      text: `${exerciseName}${context} : haut de fourchette valide. Vise ${fmtWeight(next.weight)} sur ${next.targetReps.join("/")}.`,
    };
  }
  if (next.reason === "objectif valide") {
    return {
      type: "Progression",
      family: exercise && exercise.family,
      templateId: log.templateId,
      text: `${exerciseName}${context} : objectif valide. Prochaine cible : ${next.targetReps.join("/")}.`,
    };
  }
  return {
    type: "Consolider",
    family: exercise && exercise.family,
    templateId: log.templateId,
    text: `${exerciseName}${context} : garde la charge et consolide ${next.targetReps.join("/")}.`,
  };
}

function diversifiedSuggestions(items, limit = 8) {
  const selected = [];
  const usedTemplates = new Set();
  const usedFamilies = new Set();
  const passes = [
    (item) => !usedTemplates.has(item.templateId) && !usedFamilies.has(item.family),
    (item) => !usedTemplates.has(item.templateId),
    () => true,
  ];
  passes.forEach((predicate) => {
    items.forEach((item) => {
      if (selected.length >= limit || selected.includes(item) || !predicate(item)) return;
      selected.push(item);
      if (item.templateId) usedTemplates.add(item.templateId);
      if (item.family) usedFamilies.add(item.family);
    });
  });
  return selected;
}

function coachProgressSuggestions() {
  const suggestions = [];
  const seen = new Set();
  completedLogs().slice().reverse().forEach((log) => {
    (log.entries || []).forEach((entry) => {
      const key = entry.exerciseId || String(entry.performedExerciseName || "").toLowerCase();
      if (!key || seen.has(key) || !(entry.completed || []).some(Boolean)) return;
      const item = planItemForEntry(log, entry);
      suggestions.push(coachSuggestionFromEntry(log, entry, item));
      seen.add(key);
    });
  });
  return diversifiedSuggestions(suggestions, 8);
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

function coachPanelHtml() {
  const template = currentTemplate();
  const progress = coachProgressSuggestions();
  const balance = coachBalanceSuggestions();
  const keyExercise = template && template.items && template.items[0] ? exerciseById(template.items[0].exerciseId) : null;
  const nutrition = state.nutrition.find((item) => item.profileId === state.activeProfileId && item.date === todayKey);
  const nutritionHint = nutrition && nutrition.adherence === "bas" ? "Nutrition basse aujourd'hui : reste prudent sur les augmentations." : "Pas de signal nutrition négatif aujourd'hui.";

  return `
    <article class="coach-card primary">
      <span>À faire aujourd'hui</span>
      <strong>${template ? escapeHtml(template.name) : "Aucune séance prévue"}</strong>
      <p>${template ? `${template.items.length} exercices. Exercice clé : ${escapeHtml((keyExercise && keyExercise.name) || "à définir")}.` : "Planifie une séance dans Planning pour recevoir des suggestions ciblées."}</p>
      <p class="hint">${nutritionHint}</p>
      ${template ? `<button class="primary-button" data-view="training" type="button">Démarrer</button>` : `<button class="small-button" data-view="planner" type="button">Aller au Planning</button>`}
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

function renderCoachPanel() {
  const panel = $("#coachPanel");
  if (!panel) return;
  panel.innerHTML = coachPanelHtml();
  localizeFragment(panel);
}

function render() {
  applySettings();
  fillRestPickers();
  renderTodayDashboard();
  renderBuilderPanes();
  renderTraining();
  renderBuilder();
  renderTrainingModels();
  renderPlannerOverview();
  renderCalendar();
  renderTracking();
  renderNutritionPanel();
  renderCoachPanel();
  renderEquipmentFilters();
  renderProfiles();
  updateUnitLabels();
  renderLegalDialogs();
  localizeDocument();
}

function renderProfiles() {
  $("#activeProfileName").textContent = displayProfileName(activeProfile().name);
  const addButton = $("#addProfile");
  const list = $("#profileChoices");
  if (!list || !addButton) return;
  list.innerHTML = state.profiles.map((profile) => `
    <button class="profile-choice ${profile.id === state.activeProfileId ? "active" : ""}" data-profile-choice="${profile.id}" type="button">
      ${escapeHtml(displayProfileName(profile.name))}
    </button>
  `).join("");
  addButton.disabled = state.profiles.length >= 3;
}

function showView(name, options = {}) {
  const push = options.push !== false;
  if (!views[name]) name = "home";
  Object.entries(views).forEach(([viewName, view]) => {
    if (view) view.classList.toggle("active", viewName === name);
  });
  if (push && currentViewName !== name) {
    history.pushState({ view: name }, "", window.location.pathname + window.location.search);
  }
  currentViewName = name;
  if (name === "training") {
    requestWakeLock();
    renderTraining();
  } else {
    releaseWakeLock();
  }
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
    models: "#builderModels",
  };
  Object.entries(paneMap).forEach(([mode, selector]) => {
    const pane = $(selector);
    if (pane) pane.classList.toggle("active", mode === builderMode);
  });
  document.querySelectorAll("#builderModes .segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.builderMode === builderMode);
  });
}

function renderTraining() {
  if (togetherMode) {
    renderTogetherTraining();
    return;
  }

  if (activeSummaryLogId) {
    const summaryLog = state.logs.find((log) => log.id === activeSummaryLogId);
    if (summaryLog && summaryLog.finishedAt && completedSetCount(summaryLog) > 0) {
      renderSessionSummary(summaryLog);
      return;
    }
    if (summaryLog && completedSetCount(summaryLog) === 0) summaryLog.archived = true;
    activeSummaryLogId = null;
  }

  const scheduledItem = currentScheduledItem();
  const template = scheduledItem ? templateById(scheduledItem.templateId) : null;
  if (!template) {
    $("#trainingScreen").innerHTML = `<p class="empty">Aucune seance active. Planifie une seance dans Planning ou reviens demain.</p>`;
    return;
  }
  const log = currentLog(template.id, scheduledItem);

  if (log.finishedAt && completedSetCount(log) > 0) {
    renderSessionSummary(log);
    return;
  }

  if (!log.warmupDone) {
    renderWarmupScreen(log, template);
    return;
  }

  const item = currentPlanItem(log);
  if (!item) {
    if (completedSetCount(log) > 0) {
      finishLog(log, null);
      renderSessionSummary(log);
    } else {
      log.archived = true;
      saveState();
      $("#trainingScreen").innerHTML = `<p class="empty">Aucune serie validee sur cette seance.</p>`;
    }
    return;
  }

  const exercise = exerciseById(item.exerciseId);
  const entry = entryFor(log, item);
  maybeShowExerciseIntro(log, item, exercise, entry, template);
  syncRestCountdown(sessionUi);
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

    <section class="exercise-session-menu">
      ${template.items.map((planItemEntry, index) => {
        const planExercise = exerciseById(planItemEntry.exerciseId);
        const planEntry = log.entries.find((candidate) => candidate.planItemId === planItemEntry.id);
        const done = planEntry && planEntry.completed && planEntry.completed.every(Boolean);
        return `
          <button class="${index === log.currentExerciseIndex ? "active" : ""} ${done ? "done" : ""}" data-session-exercise="${index}" type="button">
            <span>${index + 1}</span>
            <strong>${escapeHtml((planEntry && planEntry.performedExerciseName) || (planExercise && planExercise.name) || "Exercice")}</strong>
          </button>
        `;
      }).join("")}
    </section>

    <section class="training-hero">
      <div class="training-topline">
        <span>${escapeHtml(template.name)}</span>
        <span>${t("exercise")} ${progress}</span>
      </div>
      <h2>${escapeHtml(entry.performedExerciseName)}</h2>
      <p>${escapeHtml(exercise && exercise.family)} - ${escapeHtml(exercise && exercise.equipment)} - ${fmtWeight(entry.weight)}</p>
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
      <input class="rep-input weight-input" id="activeWeightInput" inputmode="decimal" type="number" min="0" step="0.5" value="${escapeHtml(weightInputValue(entry.weight || item.weight || 0))}" aria-label="Charge utilisee">
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
        <h2>${fmtWeight(stats.tonnage, 0)}</h2>
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
  syncRestCountdown(ui);
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
      <p>${escapeHtml(exercise && exercise.family)} - ${fmtWeight(entry.weight)}</p>
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

function renderWarmupScreen(log, template) {
  const seconds = Number(log.warmupSeconds || 150);
  if (log.warmupChoice === "yes" && log.warmupStarted) {
    syncRestCountdown(sessionUi);
    if (sessionUi.warmupRest && sessionUi.phase === "ready" && sessionUi.restRemaining === 0) {
      log.warmupDone = true;
      sessionUi.warmupRest = false;
      saveState();
      renderTraining();
      return;
    }
  }
  const running = log.warmupChoice === "yes" && log.warmupStarted && sessionUi.phase === "warmup";
  const displaySeconds = running ? sessionUi.restRemaining : seconds;
  const timerMood = running && sessionUi.restRemaining <= 3 ? "timer-danger" : running && sessionUi.restRemaining <= 10 ? "timer-warning" : "";
  $("#trainingScreen").innerHTML = `
    <section class="training-hero warmup-hero">
      <div class="training-topline">
        <span>${escapeHtml(template.name)}</span>
        <span>Echauffement</span>
      </div>
      <h2>Echauffement ?</h2>
      <p>Active un repos avant le premier exercice si tu viens de terminer ton echauffement.</p>
    </section>

    ${!log.warmupChoice ? `
      <section class="go-panel">
        <p class="label">Debut de seance</p>
        <div class="rep-target">02:30</div>
        <div class="button-row">
          <button class="primary-button" data-warmup-choice="yes" type="button">Oui</button>
          <button class="small-button" data-warmup-choice="no" type="button">Non</button>
        </div>
      </section>
    ` : `
      <section class="go-panel ${timerMood}">
        <p class="label">${running ? "Repos echauffement" : "Temps echauffement"}</p>
        <div class="rest-line active">
          <button class="timer-adjust" data-warmup-adjust="-5" type="button">-5</button>
          <div class="rep-target">${formatTime(displaySeconds)}</div>
          <button class="timer-adjust" data-warmup-adjust="5" type="button">+5</button>
        </div>
        <button class="go-button ${running ? "resting" : ""}" data-warmup-go type="button">${running ? t("skip") : "GO"}</button>
      </section>
    `}
  `;
}

function maybeShowExerciseIntro(log, item, exerciseItem, entry, template) {
  if (currentViewName !== "training") return;
  if (!log || !item || log.finishedAt || exerciseIntroOpen) return;
  if (log.introSeenIndex === log.currentExerciseIndex) return;
  if (log.currentSetIndex !== 0) return;
  const dialog = $("#exerciseIntroDialog");
  if (!dialog || dialog.open) return;
  const openDialog = document.querySelector("dialog[open]");
  if (openDialog && openDialog !== dialog) return;
  exerciseIntroOpen = true;
  $("#exerciseIntroStep").textContent = `Exercice ${log.currentExerciseIndex + 1}/${template.items.length}`;
  $("#exerciseIntroName").textContent = entry.performedExerciseName || (exerciseItem && exerciseItem.name) || "Exercice";
  $("#exerciseIntroMeta").textContent = `${item.sets} series - ${item.minReps}/${item.maxReps} reps - ${fmtWeight(entry.weight || item.weight || 0)}`;
  setTimeout(() => {
    if (dialog.showModal && !dialog.open) dialog.showModal();
  }, 0);
}

function renderSessionSummary(log) {
  const stats = logStats(log);
  $("#trainingScreen").innerHTML = `
    <section class="summary-panel">
      <p class="label">Seance terminee</p>
      <div class="celebration-mark">STAY STRONG</div>
      <h2>${escapeHtml((templateById(log.templateId) && templateById(log.templateId).name) || "Seance")}</h2>
      <p class="congrats"><strong>Stay Strong.</strong></p>
      <p class="congrats">Belle séance. Tu as posé une brique de plus, proprement.</p>
      <div class="summary-grid">
        <div><span>Tonnage</span><strong>${fmtWeight(stats.tonnage, 0)}</strong></div>
        <div><span>Calories estimees</span><strong>${stats.calories} kcal</strong></div>
      </div>
      <div class="stack">
        ${stats.perExercise.map((item) => `
          <article class="summary-row">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${fmtWeight(item.tonnage, 0)} - ${item.calories} kcal</span>
          </article>
        `).join("")}
      </div>
      ${log.exitReason ? `<p class="hint">Sortie anticipee : ${escapeHtml(log.exitReason)}</p>` : ""}
      <button class="primary-button" id="closeSummary" type="button">Terminer</button>
    </section>
  `;
}

function renderBuilder() {
  const templates = profileTemplates();
  const visibleTemplates = visibleProfileTemplates();
  const groups = profileTrainingGroups();
  const templateGroup = $("#templateGroup");
  if (templateGroup) {
    templateGroup.innerHTML = groups.map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(displayFamily(group))}</option>`).join("");
    templateGroup.value = groups.includes(templateGroupFilter) && templateGroupFilter !== "Tous" ? templateGroupFilter : "General";
  }
  const groupPill = $("#activeTrainingGroupPill");
  if (groupPill) groupPill.textContent = templateGroupFilter;
  const groupFilters = $("#trainingGroupFilters");
  if (groupFilters) {
    groupFilters.innerHTML = ["Tous", ...groups].map((group) => `<button class="filter-chip ${group === templateGroupFilter ? "active" : ""}" data-training-group="${escapeHtml(group)}" type="button">${escapeHtml(group)}</button>`).join("");
  }
  const scheduleTemplate = $("#scheduleTemplate");
  if (scheduleTemplate) scheduleTemplate.innerHTML = templateSelectOptions(scheduleTemplate.value);
  $("#templateList").innerHTML = visibleTemplates.map((template) => {
    const expanded = expandedTemplateIds.has(template.id);
    return `
    <article class="item-card builder-card">
      <div class="item-head">
        <button class="template-toggle ${expanded ? "active" : ""}" data-toggle-template="${template.id}" type="button" aria-expanded="${expanded}">
          <span class="template-title"><strong>${escapeHtml(template.name)}</strong><small>${escapeHtml(template.group || "General")} - ${template.items.length} exos</small></span>
          <span class="chevron" aria-hidden="true"></span>
        </button>
        <button class="icon-mini" data-template-options="${template.id}" type="button" aria-label="Options ${escapeHtml(template.name)}">...</button>
      </div>
      <div class="template-body ${expanded ? "active" : ""}">
      <form class="mini-grid" data-add-item="${template.id}">
        <label class="exercise-search-field">Recherche exercice<input class="exercise-search-input" type="search" placeholder="Squat, tirage, curl..." autocomplete="off"></label>
        <label class="exercise-pick">Exercice<select name="exerciseId">${exerciseSelectOptions()}</select></label>
        <div class="exercise-suggestions" data-exercise-suggestions></div>
        <label>Series<input name="sets" inputmode="numeric" min="1" type="number" value="4"></label>
        <label>Rep min<input name="minReps" inputmode="numeric" min="1" type="number" value="8"></label>
        <label>Rep max<input name="maxReps" inputmode="numeric" min="1" type="number" value="12"></label>
        <label>${weightUnit()}<input name="weight" inputmode="decimal" min="0" step="0.5" type="number" value="40"></label>
        <label>+ ${weightUnit()}<input name="increment" inputmode="decimal" min="0" step="0.5" type="number" value="2.5"></label>
        <label class="rest-pair">Repos
          <div class="time-picker">
            <select name="restMinutes" aria-label="Minutes">${pickerOptions(10, 1, 2)}</select>
            <span class="time-separator">:</span>
            <select name="restSeconds" aria-label="Secondes">${pickerOptions(50, 10, 0)}</select>
          </div>
        </label>
        <button class="small-button" type="submit">Ajouter</button>
      </form>
      <div class="template-items">
        ${template.items.map((item) => {
          const exercise = exerciseById(item.exerciseId);
          return `<div class="set-row"><span>${escapeHtml(exercise && exercise.name)} - ${item.sets} series - ${item.minReps}/${item.maxReps} reps - ${fmtWeight(item.weight)} - repos ${restLabel(item.rest || (exercise && exercise.rest) || 0)}</span><div class="button-row tight-row"><button class="small-button" data-move-item="${template.id}:${item.id}:-1" type="button">↑</button><button class="small-button" data-move-item="${template.id}:${item.id}:1" type="button">↓</button><button class="small-button" data-edit-item="${template.id}:${item.id}" type="button">Modifier</button><button class="small-button danger" data-remove-item="${template.id}:${item.id}" type="button">Suppr.</button></div></div>`;
        }).join("")}
      </div>
      </div>
    </article>
  `;
  }).join("") || `<p class="empty">Aucune seance dans ce groupe.</p>`;

  const exercises = state.exercises.filter((item) => {
    const equipmentMatch = equipmentFilter === "Tous" || item.equipment === equipmentFilter;
    const muscleMatch = muscleFilter === "Tous" || item.family === muscleFilter;
    const searchMatch = exerciseMatchesSearch(item, libraryExerciseSearch);
    return equipmentMatch && muscleMatch && searchMatch;
  });
  const searchInput = $("#exerciseLibrarySearch");
  if (searchInput && searchInput.value !== libraryExerciseSearch) searchInput.value = libraryExerciseSearch;
  $("#exerciseLibrary").innerHTML = groupedExercises(exercises).map((section) => `
    <section class="exercise-group">
      <h4>${escapeHtml(section.group)}</h4>
      ${section.items.map((exerciseItem) => `
        <article class="item-card exercise-card">
          <div class="item-head">
            <div>
              <strong>${highlightMatch(exerciseItem.name, libraryExerciseSearch)}</strong>
              <p>${escapeHtml(exerciseItem.equipment)} - repos ${restLabel(exerciseItem.rest)}</p>
            </div>
            <button class="icon-mini" data-exercise-options="${exerciseItem.id}" type="button" aria-label="Options ${escapeHtml(exerciseItem.name)}">...</button>
          </div>
          <p class="hint">Alternatives : ${(exerciseItem.alternatives || []).map((name) => highlightMatch(name, libraryExerciseSearch)).join(", ") || "aucune"}</p>
        </article>
      `).join("")}
    </section>
  `).join("") || `<p class="empty">Aucun exercice pour ces filtres.</p>`;
  enhanceBuilderRows();
  renderExerciseFormHelpers();
  localizeFragment($("#builderView"));
}

function renderTrainingModels() {
  const panel = $("#programModelList");
  if (!panel) return;
  panel.innerHTML = programModels().map((model) => `
    <article class="model-card">
      <div>
        <span>${escapeHtml(model.group)}</span>
        <strong>${escapeHtml(model.title)}</strong>
        <p>${escapeHtml(model.description)}</p>
      </div>
      <div class="model-meta">${escapeHtml(model.meta)}</div>
      <button class="primary-button" data-create-model="${model.id}" type="button">Ajouter ce modele</button>
    </article>
  `).join("");
  localizeFragment(panel);
}

function renderPlannerOverview() {
  const panel = $("#plannerOverview");
  if (!panel) return;
  const todayItems = scheduledFor(todayKey);
  const pendingToday = pendingScheduledFor(todayKey);
  const next = Array.from({ length: 21 }, (_, index) => {
    const date = new Date(`${todayKey}T12:00:00`);
    date.setDate(date.getDate() + index);
    const key = localDateKey(date);
    const item = pendingScheduledFor(key)[0];
    return item ? { key, item } : null;
  }).filter(Boolean)[0];
  const weekCount = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${todayKey}T12:00:00`);
    date.setDate(date.getDate() + index);
    return scheduledFor(localDateKey(date)).length;
  }).reduce((sum, value) => sum + value, 0);
  const nextTemplate = next && templateById(next.item.templateId);
  panel.innerHTML = `
    <article class="planner-stat-card">
      <span>Aujourd'hui</span>
      <strong>${pendingToday.length ? `${pendingToday.length} a faire` : todayItems.length ? "Valide" : "Repos"}</strong>
      <p>${todayItems.length ? todayItems.map((item) => escapeHtml((templateById(item.templateId) && templateById(item.templateId).name) || "Seance")).join(" / ") : "Aucune seance prevue."}</p>
    </article>
    <article class="planner-stat-card">
      <span>Prochaine</span>
      <strong>${nextTemplate ? escapeHtml(nextTemplate.name) : "Aucune"}</strong>
      <p>${next ? escapeHtml(next.key) : "Planifie une seance pour demarrer."}</p>
    </article>
    <article class="planner-stat-card">
      <span>7 jours</span>
      <strong>${weekCount}</strong>
      <p>seances planifiees</p>
    </article>
  `;
  localizeFragment(panel);
}

function enhanceBuilderRows() {
  document.querySelectorAll("#templateList .template-items .set-row").forEach((row) => {
    const edit = row.querySelector("[data-edit-item]");
    const remove = row.querySelector("[data-remove-item]");
    const source = edit || remove || row.querySelector("[data-move-item]");
    if (!source) return;
    const value = source.dataset.editItem || source.dataset.removeItem || source.dataset.moveItem;
    const [templateId, itemId] = value.split(":");
    const template = templateById(templateId);
    const item = template && template.items.find((candidate) => candidate.id === itemId);
    if (!template || !item) return;
    const exercise = exerciseById(item.exerciseId);
    row.className = "set-row plan-item-row";
    row.draggable = false;
    row.dataset.planRow = `${templateId}:${itemId}`;
    row.innerHTML = `
      <span>${escapeHtml(exercise && exercise.name)} - ${item.sets} series - ${item.minReps}/${item.maxReps} reps - ${fmtWeight(item.weight)} - repos ${restLabel(item.rest || (exercise && exercise.rest) || 0)}</span>
      <button class="icon-mini" data-plan-item-options="${templateId}:${itemId}" type="button" aria-label="Options ${escapeHtml(exercise && exercise.name)}">...</button>
      <button class="drag-handle" data-drag-handle type="button" aria-label="Deplacer ${escapeHtml(exercise && exercise.name)}"><span>&lt;</span><span>&gt;</span></button>
    `;
  });
}

function updateExerciseSearchForm(form) {
  if (!form) return;
  const input = form.querySelector(".exercise-search-input");
  const select = form.querySelector('select[name="exerciseId"]');
  const suggestions = form.querySelector("[data-exercise-suggestions]");
  if (!input || !select || !suggestions) return;
  const previous = select.value;
  select.innerHTML = exerciseSelectOptions(previous, input.value);
  if (previous && [...select.options].some((option) => option.value === previous)) {
    select.value = previous;
  } else if (select.options.length) {
    select.selectedIndex = 0;
  }
  suggestions.innerHTML = exerciseSuggestionButtons(input.value, select.value);
}

function renderEquipmentFilters() {
  const types = ["Tous", ...new Set(state.exercises.map((item) => item.equipment))];
  $("#equipmentFilters").innerHTML = types.map((type) => `<button class="filter-chip ${type === equipmentFilter ? "active" : ""}" data-equipment="${escapeHtml(type)}" type="button">${escapeHtml(type)}</button>`).join("");
  const muscles = ["Tous", ...allMuscleGroups().filter((item) => item !== "Autre")];
  $("#muscleFilters").innerHTML = muscles.map((muscle) => `<button class="filter-chip ${muscle === muscleFilter ? "active" : ""}" data-muscle="${escapeHtml(muscle)}" type="button">${escapeHtml(translateKnownText(muscle))}</button>`).join("");
  $("#settingsTheme").value = state.settings.theme;
  $("#settingsMode").value = state.settings.mode || "dark";
  $("#settingsWeightUnit").value = state.settings.weightUnit;
  $("#settingsLengthUnit").value = state.settings.lengthUnit;
  const languageSelect = $("#settingsLanguage");
  if (languageSelect) languageSelect.value = state.settings.language || "fr";
}

function renderCalendar() {
  $("#scheduleDate").value ||= todayKey;
  if (calendarMode === "week") return renderWeekCalendar();
  if (calendarMode === "planner") return renderPlannerCalendar();
  const items = [...profileSchedule()].sort((a, b) => a.date.localeCompare(b.date));
  $("#calendarList").innerHTML = items.map((item) => {
    const template = templateById(item.templateId);
    const itemDate = item.movedFromDate || item.date;
    return `<article class="item-card set-row schedule-row"><span>${item.date} - ${escapeHtml(template && template.name)}${item.repeatWeekly ? " - chaque semaine" : ""}${item.movedFromDate ? ` - deplacee depuis ${escapeHtml(item.movedFromDate)}` : ""}</span><div class="schedule-actions">${scheduleStatusPill(item, item.date)}<button class="icon-mini" data-schedule-options="${item.id}:${itemDate}" type="button" aria-label="Options planning">...</button></div></article>`;
  }).join("") || `<p class="empty">Aucune seance planifiee.</p>`;
  localizeFragment($("#calendarList"));
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
    return `<article class="day-card ${key === todayKey ? "today" : ""}"><span>${date.toLocaleDateString(uiLocale(), { weekday: "short" })}</span><strong>${date.getDate()}</strong>${planned.map((item) => `<p class="calendar-session-line">${escapeHtml((templateById(item.templateId) && templateById(item.templateId).name) || "Seance")} ${scheduleStatusPill(item, key)} <button class="calendar-mini-options" data-schedule-options="${item.id}:${item.movedFromDate || key}" type="button" aria-label="Options planning">...</button></p>`).join("") || `<p>Repos</p>`}</article>`;
  }).join("")}</div>`;
  localizeFragment($("#calendarList"));
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
    return `<article class="planner-row"><div><span>${date.toLocaleDateString(uiLocale(), { weekday: "long" })}</span><strong>${date.toLocaleDateString(uiLocale(), { day: "numeric", month: "long" })}</strong></div><div class="planner-sessions">${planned.map((item) => `<span>${escapeHtml((templateById(item.templateId) && templateById(item.templateId).name) || "Seance")} ${scheduleStatusPill(item, key)} <button class="calendar-mini-options" data-schedule-options="${item.id}:${item.movedFromDate || key}" type="button" aria-label="Options planning">...</button></span>`).join("")}</div></article>`;
  }).join("") || `<p class="empty">Aucune seance dans les 3 prochaines semaines.</p>`;
  localizeFragment($("#calendarList"));
}

function renderTracking() {
  if (trackingMode === "coach") {
    $("#trackingPanel").innerHTML = `<section class="coach-panel">${coachPanelHtml()}</section>`;
    localizeFragment($("#trackingPanel"));
    return;
  }

  if (trackingMode === "charts") {
    $("#trackingPanel").innerHTML = `
      <section class="stack">
        ${healthChartsHtml()}
      </section>
    `;
    localizeFragment($("#trackingPanel"));
    return;
  }

  if (trackingMode === "health") {
    const profile = activeProfile();
    const profileAge = ageFromBirthDate(profile.birthDate);
    const lastHealth = profileHealth()[0] || {};
    $("#trackingPanel").innerHTML = `
      ${profileManagerHtml()}

      <article class="item-card">
        <div class="item-head">
          <div>
            <strong>Profil</strong>
            <p>${profile.height ? fmtLength(profile.height) : "-"}${profileAge ? ` - ${profileAge} ans` : ""}</p>
          </div>
        </div>
        <form class="input-grid compact-form" id="profileForm">
          <label>Nom<input id="profileName" value="${escapeHtml(editableProfileName(profile.name))}" placeholder="Profil principal"></label>
          <label class="wide">Date de naissance
            <div class="birth-date-row">
              <input id="profileBirthDateText" inputmode="numeric" value="${escapeHtml(birthDateToDisplay(profile.birthDate))}" placeholder="jj/mm/aaaa">
              <input id="profileBirthDatePicker" type="date" value="${escapeHtml(profile.birthDate || "")}" aria-label="Choisir dans le calendrier">
            </div>
          </label>
          <label>Taille ${lengthUnit()}<input id="profileHeight" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(profile.height ? lengthInputValue(profile.height) : "")}" placeholder="${lengthInputValue(178)}"></label>
          <button class="primary-button align-end" type="submit">Sauver profil</button>
        </form>
      </article>

      <form class="input-grid compact-form" id="healthForm">
        <input id="healthEditId" type="hidden">
        <label>Date des mesures<input id="healthDate" type="date" value="${escapeHtml(lastHealth.date || todayKey)}"></label>
        <label>Poids ${weightUnit()}<input id="healthWeight" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.weight ? weightInputValue(lastHealth.weight) : "")}" placeholder="${weightInputValue(82.5)}"></label>
        <label>Bodyfat %<input id="healthBodyfat" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.bodyfat || "")}" placeholder="15"></label>
        <label>Tour taille ${lengthUnit()}<input id="healthWaist" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.waist ? lengthInputValue(lastHealth.waist) : "")}" placeholder="${lengthInputValue(84)}"></label>
        <label>Poitrine ${lengthUnit()}<input id="healthChest" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.chest ? lengthInputValue(lastHealth.chest) : "")}" placeholder="${lengthInputValue(105)}"></label>
        <label>Carre epaules ${lengthUnit()}<input id="healthShoulders" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.shoulders ? lengthInputValue(lastHealth.shoulders) : "")}" placeholder="${lengthInputValue(118)}"></label>
        <label>Biceps D contracte<input id="healthBicepsRight" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.bicepsRight || "")}" placeholder="38"></label>
        <label>Biceps G contracte<input id="healthBicepsLeft" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.bicepsLeft || "")}" placeholder="37.5"></label>
        <label>Avant-bras D<input id="healthForearmRight" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.forearmRight || "")}" placeholder="30"></label>
        <label>Avant-bras G<input id="healthForearmLeft" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.forearmLeft || "")}" placeholder="29.5"></label>
        <label>Cuisse D<input id="healthThighRight" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.thighRight || "")}" placeholder="61"></label>
        <label>Cuisse G<input id="healthThighLeft" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.thighLeft || "")}" placeholder="60.5"></label>
        <label>Mollet D<input id="healthCalfRight" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.calfRight || "")}" placeholder="39"></label>
        <label>Mollet G<input id="healthCalfLeft" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.calfLeft || "")}" placeholder="38.5"></label>
        <button class="primary-button align-end" type="submit">Enregistrer</button>
      </form>
      <div class="stack">${profileHealth().map((item) => renderHealthEntry(item)).join("") || `<p class="empty">Aucune mensuration enregistree.</p>`}</div>
    `;
    renderProfiles();
    localizeFragment($("#trackingPanel"));
    return;
  }

  const rms = bestOneRms();
  const tonnage = recentTonnageData();
  const volume = muscleVolumeData();
  const performances = lastExercisePerformances();
  $("#trackingPanel").innerHTML = `
    <section class="stack">
      ${profileManagerHtml()}
      <article class="item-card">
        <div class="item-head">
          <strong>Tonnage recent</strong>
          <span class="status-pill">${tonnage.length} seances</span>
        </div>
        ${barChartHtml(tonnage, "Aucune seance terminee pour afficher le tonnage.")}
      </article>
      <article class="item-card">
        <div class="item-head">
          <strong>Volume par groupe</strong>
          <span class="status-pill">30 jours</span>
        </div>
        ${barChartHtml(volume, "Aucun volume recent.")}
      </article>
      <article class="item-card">
        <div class="item-head">
          <strong>RM estimees</strong>
          <span class="status-pill">${rms.length} exos</span>
        </div>
        <div class="rm-grid">
          ${rms.map((item) => `<div><span>${escapeHtml(item.name)}</span><strong>${fmtWeight(item.rm, 0)}</strong><p>${fmtWeight(item.weight)} x ${item.reps}</p></div>`).join("") || `<p class="empty">Aucune RM estimee pour l'instant.</p>`}
        </div>
      </article>
      <article class="item-card">
        <div class="item-head">
          <strong>Dernieres performances</strong>
          <span class="status-pill">${performances.length} exos</span>
        </div>
        <div class="performance-list">
          ${performances.map((item) => `<div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.date)} - ${fmtWeight(item.weight)} - ${escapeHtml(item.reps)} reps</span></div>`).join("") || `<p class="empty">Les performances apparaitront apres tes seances.</p>`}
        </div>
      </article>
      <article class="item-card">
        <div class="item-head">
          <strong>Historique des seances</strong>
          <button class="small-button" id="addPastWorkoutLog" type="button">Ajouter</button>
        </div>
        <div class="stack">${renderWorkoutHistory()}</div>
      </article>
    </section>
  `;
  renderProfiles();
  localizeFragment($("#trackingPanel"));
}

function renderHealthEntry(item) {
  const parts = [
    `${item.weight ? fmtWeight(item.weight) : "-"}`,
    `${item.bodyfat || "-"}% BF`,
    `taille ${item.waist ? fmtLength(item.waist) : "-"}`,
    `poitrine ${item.chest ? fmtLength(item.chest) : "-"}`,
    `epaules ${item.shoulders ? fmtLength(item.shoulders) : "-"}`,
    `bras D/G ${item.bicepsRight ? fmtLength(item.bicepsRight) : "-"}/${item.bicepsLeft ? fmtLength(item.bicepsLeft) : "-"}`,
    `avant-bras D/G ${item.forearmRight ? fmtLength(item.forearmRight) : "-"}/${item.forearmLeft ? fmtLength(item.forearmLeft) : "-"}`,
    `cuisses D/G ${item.thighRight ? fmtLength(item.thighRight) : "-"}/${item.thighLeft ? fmtLength(item.thighLeft) : "-"}`,
    `mollets D/G ${item.calfRight ? fmtLength(item.calfRight) : "-"}/${item.calfLeft ? fmtLength(item.calfLeft) : "-"}`,
  ];
  return `<article class="item-card health-entry"><div class="item-head"><strong>${item.date}</strong><button class="icon-mini" data-health-options="${item.id}" type="button" aria-label="Options mesures ${item.date}">...</button></div><p>${parts.join(" - ")}</p></article>`;
}

function renderWorkoutHistory() {
  const logs = profileLogs()
    .filter((log) => log.finishedAt && !log.archived)
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))
    .slice(0, 12);
  return logs.map((log) => {
    const template = templateById(log.templateId);
    const stats = logStats(log);
    return `
      <article class="item-card workout-history-row">
        <div class="item-head">
          <div>
            <strong>${escapeHtml((template && template.name) || "Seance")}</strong>
            <p>${escapeHtml(log.date || "")} - ${fmtWeight(stats.tonnage, 0)} - ${stats.calories} kcal</p>
          </div>
          <button class="icon-mini" data-workout-log-options="${log.id}" type="button" aria-label="Options seance">...</button>
        </div>
      </article>
    `;
  }).join("") || `<p class="empty">Aucune seance enregistree.</p>`;
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

function completedLogs() {
  return profileLogs()
    .filter((log) => log.finishedAt && completedSetCount(log) > 0)
    .sort((a, b) => new Date(a.finishedAt) - new Date(b.finishedAt));
}

function recentTonnageData(limit = 8) {
  return completedLogs().slice(-limit).map((log) => {
    const template = templateById(log.templateId);
    const stats = logStats(log);
    return {
      label: `${log.date.slice(5)} ${template ? template.name : "Seance"}`,
      value: Math.round(toDisplayWeight(stats.tonnage, 0)),
    };
  });
}

function muscleVolumeData(limitDays = 30) {
  const since = new Date();
  since.setDate(since.getDate() - limitDays);
  const volume = new Map();
  completedLogs().forEach((log) => {
    const date = new Date(`${log.date}T12:00:00`);
    if (date < since) return;
    (log.entries || []).forEach((entry) => {
      const exerciseItem = exerciseById(entry.exerciseId);
      const family = (exerciseItem && exerciseItem.family) || "Autre";
      const sets = (entry.completed || []).filter(Boolean).length;
      volume.set(family, (volume.get(family) || 0) + sets);
    });
  });
  return [...volume.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function lastExercisePerformances() {
  const latest = new Map();
  completedLogs().forEach((log) => {
    (log.entries || []).forEach((entry) => {
      const reps = (entry.reps || []).filter((rep, index) => entry.completed && entry.completed[index]);
      if (!reps.length) return;
      latest.set(entry.performedExerciseName, {
        name: entry.performedExerciseName,
        date: log.date,
        weight: entry.weight,
        reps: reps.join("/"),
      });
    });
  });
  return [...latest.values()].slice(-12).reverse();
}

function barChartHtml(items, emptyText) {
  if (!items.length) return `<p class="empty">${emptyText}</p>`;
  const max = Math.max(...items.map((item) => Number(item.value || 0)), 1);
  return `<div class="bar-chart">${items.map((item) => `
    <div class="bar-row">
      <span>${escapeHtml(item.label)}</span>
      <div><i style="width:${Math.max(5, Math.round((item.value / max) * 100))}%"></i></div>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join("")}</div>`;
}

function healthHistorySorted() {
  return profileHealth()
    .filter((item) => item.date)
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function healthSeries(field) {
  return healthHistorySorted()
    .map((item) => ({ date: item.date, value: Number(String(item[field] || "").replace(",", ".")) }))
    .filter((item) => Number.isFinite(item.value) && item.value > 0);
}

function lineChartHtml(series, emptyText, unit = "") {
  if (series.length < 2) return `<p class="empty">${emptyText}</p>`;
  const width = 320;
  const height = 160;
  const padX = 28;
  const padY = 24;
  const values = series.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = series.map((item, index) => {
    const x = padX + (index / Math.max(1, series.length - 1)) * (width - padX * 2);
    const y = height - padY - ((item.value - min) / range) * (height - padY * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const first = series[0];
  const last = series[series.length - 1];
  const delta = last.value - first.value;
  const deltaLabel = `${delta >= 0 ? "+" : ""}${delta.toFixed(1).replace(".", ",")} ${unit}`.trim();
  return `
    <div class="line-chart">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Courbe">
        <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}"></line>
        <line x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}"></line>
        <path d="${path}"></path>
        ${points.map((point) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.6"><title>${escapeHtml(point.date)} - ${point.value}${unit}</title></circle>`).join("")}
      </svg>
      <div class="chart-footer">
        <span>${escapeHtml(first.date)} -> ${escapeHtml(last.date)}</span>
        <strong>${escapeHtml(deltaLabel)}</strong>
      </div>
    </div>
  `;
}

function healthMiniChart(field, label, unit = lengthUnit()) {
  const rawSeries = healthSeries(field);
  const series = field === "weight" ? rawSeries.map((item) => ({ ...item, value: toDisplayWeight(item.value) })) : rawSeries.map((item) => ({ ...item, value: toDisplayLength(item.value) }));
  const latest = series[series.length - 1];
  return `
    <article class="mini-chart-card">
      <div class="item-head">
        <strong>${escapeHtml(label)}</strong>
        <span class="status-pill">${latest ? `${latest.value} ${unit}` : "-"}</span>
      </div>
      ${lineChartHtml(series, `Ajoute au moins deux valeurs pour voir la courbe ${label.toLowerCase()}.`, unit)}
    </article>
  `;
}

function sportSessionSeries(logs, metric) {
  return logs.map((log) => {
    const template = templateById(log.templateId);
    const stats = logStats(log);
    return {
      date: `${log.date}${template ? ` ${template.name}` : ""}`,
      value: metric === "calories" ? Number(stats.calories || 0) : Math.round(Number(stats.tonnage || 0)),
    };
  }).filter((item) => item.value > 0);
}

function groupedCompletedLogsByWorkout() {
  const groups = new Map();
  completedLogs().forEach((log) => {
    const key = workoutHistoryKey(log);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(log);
  });
  return [...groups.entries()]
    .map(([name, logs]) => ({ name, logs: logs.sort((a, b) => new Date(a.finishedAt || a.date) - new Date(b.finishedAt || b.date)) }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

function exerciseRmChartData(limit = 6) {
  const byExercise = new Map();
  completedLogs().forEach((log) => {
    (log.entries || []).forEach((entry) => {
      const reps = (entry.reps || []).filter((rep, index) => !entry.completed || entry.completed[index]);
      if (!reps.length) return;
      const bestRm = Math.max(...reps.map((rep) => estimateOneRm(entry.weight, rep)));
      if (!bestRm) return;
      const key = entry.performedExerciseName || entry.exerciseId || "Exercice";
      if (!byExercise.has(key)) byExercise.set(key, []);
      byExercise.get(key).push({ date: log.date, value: Math.round(bestRm * 10) / 10 });
    });
  });
  return [...byExercise.entries()]
    .map(([name, series]) => ({ name, series }))
    .filter((item) => item.series.length >= 2)
    .sort((a, b) => b.series[b.series.length - 1].value - a.series[a.series.length - 1].value)
    .slice(0, limit);
}

function sportChartsHtml() {
  const workoutGroups = groupedCompletedLogsByWorkout();
  const rmCharts = exerciseRmChartData();
  const workoutCharts = workoutGroups.map((group) => {
    const tonnage = sportSessionSeries(group.logs, "tonnage");
    const calories = sportSessionSeries(group.logs, "calories");
    if (tonnage.length < 2 && calories.length < 2) return "";
    return `
      <article class="mini-chart-card workout-chart-card">
        <div class="item-head">
          <strong>${escapeHtml(group.name)}</strong>
          <span class="status-pill">${group.logs.length} seances</span>
        </div>
        ${lineChartHtml(tonnage.map((item) => ({ ...item, value: toDisplayWeight(item.value, 0) })), `Deux ${group.name} minimum pour voir le tonnage.`, weightUnit())}
        ${lineChartHtml(calories, `Deux ${group.name} minimum pour voir les calories.`, "kcal")}
      </article>
    `;
  }).join("");
  if (!workoutCharts && !rmCharts.length) {
    return `<p class="empty">Ajoute au moins deux seances terminees pour afficher les courbes sport.</p>`;
  }
  return `
    <div class="health-chart-grid">
      ${workoutCharts || `<p class="empty">Deux seances du meme type sont necessaires pour comparer tonnage et calories.</p>`}
    </div>
    <div class="health-chart-grid">
      ${rmCharts.map((item) => `
        <article class="mini-chart-card">
          <div class="item-head">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="status-pill">RM</span>
          </div>
          ${lineChartHtml(item.series.map((point) => ({ ...point, value: toDisplayWeight(point.value) })), "Deux performances minimum pour voir la RM.", weightUnit())}
        </article>
      `).join("")}
    </div>
  `;
}

function healthChartsHtml() {
  const entries = healthHistorySorted();
  if (!entries.length && !completedLogs().length) return `
    <article class="item-card">
      <strong>Courbes</strong>
      <p class="empty">Ajoute des donnees dans Mensurations ou termine des seances pour afficher les courbes.</p>
    </article>
  `;
  const measurementCharts = [
    ["waist", "Taille"],
    ["chest", "Poitrine"],
    ["shoulders", "Epaules"],
    ["bicepsRight", "Biceps D"],
    ["bicepsLeft", "Biceps G"],
    ["thighRight", "Cuisse D"],
    ["thighLeft", "Cuisse G"],
    ["calfRight", "Mollet D"],
    ["calfLeft", "Mollet G"],
  ].map(([field, label]) => healthMiniChart(field, label, lengthUnit())).join("");
  return `
    <article class="item-card health-chart-panel">
      <div class="item-head">
        <div>
          <strong>Courbes</strong>
          <p>${entries.length} releves - ${completedLogs().length} seances terminees</p>
        </div>
      </div>
      <details class="chart-accordion" open>
        <summary>
          <span>Poids</span>
          <i aria-hidden="true"></i>
        </summary>
        ${healthMiniChart("weight", "Poids", weightUnit())}
      </details>
      <details class="chart-accordion">
        <summary>
          <span>Mensurations</span>
          <i aria-hidden="true"></i>
        </summary>
        <div class="health-chart-grid">${measurementCharts}</div>
      </details>
      <details class="chart-accordion">
        <summary>
          <span>Performance sport</span>
          <i aria-hidden="true"></i>
        </summary>
        <div class="chart-accordion-content">${sportChartsHtml()}</div>
      </details>
    </article>
  `;
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
  sessionUi.restEndsAt = Date.now() + seconds * 1000;
  sessionUi.lastSoundSecond = seconds;
  sessionUi.restTimer = setInterval(() => {
    syncRestCountdown(sessionUi);
    renderTraining();
  }, 250);
}

function startWarmupRest(seconds) {
  clearInterval(sessionUi.restTimer);
  sessionUi.phase = "warmup";
  sessionUi.warmupRest = true;
  sessionUi.restRemaining = seconds;
  sessionUi.restEndsAt = Date.now() + seconds * 1000;
  sessionUi.lastSoundSecond = seconds;
  sessionUi.restTimer = setInterval(() => {
    syncRestCountdown(sessionUi);
    renderTraining();
  }, 250);
}

function togetherUi(profileId) {
  if (!sessionUi.together[profileId]) {
    sessionUi.together[profileId] = {
      phase: "ready",
      restRemaining: 0,
      restEndsAt: 0,
      lastSoundSecond: null,
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
  ui.restEndsAt = Date.now() + seconds * 1000;
  ui.lastSoundSecond = seconds;
  ui.restTimer = setInterval(() => {
    syncRestCountdown(ui);
    renderTraining();
  }, 250);
}

function clearTogetherTimers() {
  Object.values(sessionUi.together).forEach((ui) => clearInterval(ui.restTimer));
  sessionUi.together = {};
}

function completeCurrentSet() {
  const scheduledItem = currentScheduledItem();
  const template = scheduledItem ? templateById(scheduledItem.templateId) : currentTemplate();
  if (!template) return;
  const log = currentLog(template.id, scheduledItem);
  const item = currentPlanItem(log);
  if (!item) return;
  const entry = entryFor(log, item);
  const repsInput = $("#activeRepInput");
  const weightInput = $("#activeWeightInput");
  const reps = Number((repsInput && repsInput.value) || item.targetReps[log.currentSetIndex] || item.minReps);
  const weight = fromDisplayWeight((weightInput && weightInput.value) || weightInputValue(entry.weight || item.weight || 0));
  entry.reps[log.currentSetIndex] = reps;
  if (Number.isFinite(weight)) {
    entry.weight = weight;
    item.weight = weight;
  }
  propagateFutureSetValues(entry, log.currentSetIndex, reps, weight);
  entry.completed[log.currentSetIndex] = true;

  if (log.currentSetIndex < item.sets - 1) {
    log.currentSetIndex += 1;
    startRest(item.rest || (exerciseById(item.exerciseId) && exerciseById(item.exerciseId).rest) || 120);
  } else {
    const moved = moveLogToNextIncomplete(log);
    sessionUi.phase = "ready";
    if (!moved && isLogComplete(log)) finishLog(log, null);
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
    startTogetherRest(profileId, item.rest || (exerciseById(item.exerciseId) && exerciseById(item.exerciseId).rest) || 120);
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
  activeSummaryLogId = completedSetCount(log) > 0 ? log.id : null;
  if (completedSetCount(log) === 0) log.archived = true;
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
  const template = currentTemplate();
  if (!template) return;
  const log = currentLog(template.id);
  const item = template.items.find((candidate) => candidate.id === planItemId);
  const entry = entryFor(log, item);
  const exerciseItem = exerciseById(item.exerciseId);
  $("#alternativeHelp").textContent = exerciseItem.name;
  $("#alternativeList").innerHTML = exerciseItem.alternatives.map((name) => `<button class="small-button" data-select-alternative="${escapeHtml(name)}" type="button">${escapeHtml(name)}</button>`).join("") || `<p class="empty">${t("noAlternative")}</p>`;
  $("#alternativeWeight").value = entry.weight || item.weight ? weightInputValue(entry.weight || item.weight) : "";
  $("#alternativeWeight").previousSibling.textContent = t("usedWeight");
  $("#alternativeDialog").showModal();
}

function updatePwaStatus(message) {
  const status = $("#pwaStatus");
  if (!status) return;
  if (message) {
    status.textContent = translateKnownText(message);
    return;
  }
  const offlineReady = "serviceWorker" in navigator && navigator.serviceWorker.controller;
  if (offlineReady) {
    status.textContent = translateKnownText("Disponible hors ligne apres la premiere ouverture complete.");
  } else if ("serviceWorker" in navigator) {
    status.textContent = translateKnownText("Installation hors ligne en preparation. Recharge l'app une fois si besoin.");
  } else {
    status.textContent = translateKnownText("Hors ligne indisponible sur cette adresse. Il faudra le lien HTTPS de la PWA.");
  }
}

function updateDataStatus(message) {
  const status = $("#dataStatus");
  if (status) status.textContent = translateKnownText(message || "Les donnees restent sur ce telephone. Garde un export en securite.");
}

function renderSettingsStatus() {
  const info = backupInfo();
  const asked = state.settings.storageProtectionAsked;
  const persistent = state.settings.storagePersistent;
  const protectedText = persistent ? "Stockage protege" : asked ? "Backup automatique active" : "Protection locale non activee";
  const backupText = info && info.savedAt ? `Derniere backup : ${new Date(info.savedAt).toLocaleString(uiLocale())}` : "Backup locale en attente de la prochaine modification.";
  updateDataStatus(`${protectedText}. ${backupText}`);
  const card = $("#storageProtectionCard");
  const button = $("#protectStorageButton");
  const title = $("#storageProtectionTitle");
  const text = $("#storageProtectionText");
  if (card) {
    card.classList.toggle("is-protected", Boolean(persistent));
    card.classList.toggle("is-backup-active", Boolean(asked && !persistent));
  }
  if (button) {
    button.textContent = translateKnownText(persistent ? "Protege" : asked ? "Backup active" : "Activer");
    button.classList.toggle("is-confirmed", Boolean(asked));
    button.setAttribute("aria-pressed", asked ? "true" : "false");
  }
  if (title) {
    title.textContent = translateKnownText(persistent ? "Protection locale active" : asked ? "Backup automatique active" : "Activer la protection locale");
  }
  if (text) {
    text.textContent = translateKnownText(persistent
      ? "Le telephone a accepte le stockage persistant. AERSTRONG garde aussi une backup precedente en securite."
      : asked
        ? "Le navigateur n'a pas garanti le stockage persistant, mais AERSTRONG garde une backup locale avant chaque modification."
        : "Demande au telephone de conserver les donnees AERSTRONG et garde une backup precedente en cas d'erreur.");
  }
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
  updatePwaStatus("Une mise a jour est prete. Installe-la, puis ferme et rouvre l'app si l'affichage ne change pas.");
}

function exportData() {
  saveState();
  downloadCompactExport("manual");
}

function downloadCompactExport(reason = "manual") {
  const profile = activeProfile();
  const payload = compactStateExport(state);
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const link = document.createElement("a");
  const safeName = String(profile.name || "profil").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "profil";
  link.href = URL.createObjectURL(blob);
  link.download = `aerstrong-${safeName}-${todayKey}.aerstrong.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  state.settings.lastCompactExportAt = new Date().toISOString();
  localStorage.setItem(storageKey, JSON.stringify(state));
  updateDataStatus(reason === "legacy-conversion"
    ? "Nouvelle sauvegarde compacte creee. Tu peux supprimer l'ancien fichier JSON."
    : "Export compact cree. Garde ce fichier comme sauvegarde.");
}

function compactStateExport(source) {
  const exercises = ensureExerciseCodes(source.exercises || []);
  const idToCode = new Map(exercises.map((item) => [item.id, item.code]));
  const nameToCode = new Map(exercises.map((item) => [item.name.toLowerCase(), item.code]));
  const compactItem = (item) => [
    item.id,
    idToCode.get(item.exerciseId) || item.exerciseId,
    item.sets,
    item.minReps,
    item.maxReps,
    item.weight,
    item.increment,
    item.rest,
    item.targetReps || [],
  ];
  const compactEntry = (entry) => [
    entry.id,
    entry.planItemId,
    idToCode.get(entry.exerciseId) || entry.exerciseId,
    entry.performedExerciseName,
    entry.weight,
    entry.reps || [],
    entry.completed || [],
  ];
  return {
    app: "AERSTRONG",
    format: "aerstrong-compact-v1",
    appVersion,
    dataVersion: dataSchemaVersion,
    exportedAt: new Date().toISOString(),
    data: {
      activeProfileId: source.activeProfileId,
      profiles: source.profiles,
      exercises: exercises.map((item) => [
        item.code,
        item.id,
        item.name,
        item.family,
        item.equipment,
        item.rest,
        (item.alternatives || []).map((name) => nameToCode.get(String(name).toLowerCase()) || name),
      ]),
      templates: (source.templates || []).map((template) => ({
        id: template.id,
        p: template.profileId,
        n: template.name,
        g: template.group,
        i: (template.items || []).map(compactItem),
      })),
      schedule: (source.schedule || []).map((item) => [item.id, item.profileId, item.date, item.templateId, item.repeatWeekly ? 1 : 0]),
      scheduleMoves: (source.scheduleMoves || []).map((item) => [item.id, item.profileId, item.scheduleId, item.fromDate, item.toDate]),
      logs: (source.logs || []).map((log) => ({
        id: log.id,
        p: log.profileId,
        d: log.date,
        t: log.templateId,
        tn: log.templateName,
        sk: log.scheduleKey,
        ci: log.currentExerciseIndex,
        cs: log.currentSetIndex,
        f: log.finishedAt,
        a: log.archived ? 1 : 0,
        aa: log.archivedAt,
        m: log.manual ? 1 : 0,
        wc: log.warmupChoice,
        wd: log.warmupDone ? 1 : 0,
        ws: log.warmupSeconds,
        e: (log.entries || []).map(compactEntry),
      })),
      health: source.health || [],
      nutrition: source.nutrition || [],
      nutritionSettings: source.nutritionSettings || [],
      muscleGroups: source.muscleGroups || [],
      trainingGroups: source.trainingGroups || [],
      settings: source.settings || {},
      substitutions: source.substitutions || {},
      preferencesComplete: source.preferencesComplete,
      welcomeAccepted: source.welcomeAccepted,
      onboardingComplete: source.onboardingComplete,
    },
  };
}

function inflateCompactState(payload) {
  const data = payload && payload.data;
  if (!data || payload.format !== "aerstrong-compact-v1") return null;
  const codeToExercise = new Map();
  const exercises = (data.exercises || []).map((item) => {
    const exerciseItem = exercise(item[1], item[2], item[3], item[4], item[5], [], item[0]);
    codeToExercise.set(item[0], exerciseItem);
    return exerciseItem;
  });
  exercises.forEach((exerciseItem, index) => {
    const source = data.exercises[index] || [];
    exerciseItem.alternatives = (source[6] || []).map((ref) => (codeToExercise.get(ref) && codeToExercise.get(ref).name) || ref);
  });
  const inflateItem = (item) => ({
    id: item[0],
    exerciseId: (codeToExercise.get(item[1]) && codeToExercise.get(item[1]).id) || item[1],
    sets: item[2],
    minReps: item[3],
    maxReps: item[4],
    weight: item[5],
    increment: item[6],
    rest: item[7],
    targetReps: item[8] || [],
  });
  const inflateEntry = (entry) => ({
    id: entry[0],
    planItemId: entry[1],
    exerciseId: (codeToExercise.get(entry[2]) && codeToExercise.get(entry[2]).id) || entry[2],
    performedExerciseName: entry[3],
    weight: entry[4],
    reps: entry[5] || [],
    completed: entry[6] || [],
  });
  return {
    activeProfileId: data.activeProfileId,
    profiles: data.profiles || [],
    exercises,
    templates: (data.templates || []).map((template) => ({
      id: template.id,
      profileId: template.p,
      name: template.n,
      group: template.g,
      items: (template.i || []).map(inflateItem),
    })),
    schedule: (data.schedule || []).map((item) => ({ id: item[0], profileId: item[1], date: item[2], templateId: item[3], repeatWeekly: Boolean(item[4]) })),
    scheduleMoves: (data.scheduleMoves || []).map((item) => ({ id: item[0], profileId: item[1], scheduleId: item[2], fromDate: item[3], toDate: item[4] })),
    logs: (data.logs || []).map((log) => ({
      id: log.id,
      profileId: log.p,
      date: log.d,
      templateId: log.t,
      templateName: log.tn,
      scheduleKey: log.sk,
      currentExerciseIndex: log.ci || 0,
      currentSetIndex: log.cs || 0,
      finishedAt: log.f,
      archived: Boolean(log.a),
      archivedAt: log.aa,
      manual: Boolean(log.m),
      warmupChoice: log.wc,
      warmupDone: Boolean(log.wd),
      warmupSeconds: log.ws,
      entries: (log.e || []).map(inflateEntry),
    })),
    health: data.health || [],
    nutrition: data.nutrition || [],
    nutritionSettings: data.nutritionSettings || [],
    muscleGroups: data.muscleGroups || [],
    trainingGroups: data.trainingGroups || [],
    settings: data.settings || {},
    substitutions: data.substitutions || {},
    preferencesComplete: data.preferencesComplete,
    welcomeAccepted: data.welcomeAccepted,
    onboardingComplete: data.onboardingComplete,
  };
}

function importDataFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const compactImport = inflateCompactState(parsed);
      const isLegacyExport = !compactImport && parsed && parsed.format !== "aerstrong-compact-v1" && (parsed.data || parsed.storageKey || parsed.app === "AERSTRONG");
      const imported = compactImport || parsed.data || parsed;
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
      updateDataStatus(isLegacyExport ? "Ancien format importe. Conversion compacte conseillee." : "Import termine. Les donnees ont ete restaurees sur ce telephone.");
      render();
      if (isLegacyExport) {
        showAppConfirm("Ancien format JSON detecte. Creer maintenant une nouvelle sauvegarde compacte adaptee a AERSTRONG ? L'ancien fichier ne peut pas etre supprime automatiquement, mais tu pourras le retirer apres.", () => {
          downloadCompactExport("legacy-conversion");
        }, "Convertir la sauvegarde", false, "Creer la nouvelle");
      }
    } catch (error) {
      updateDataStatus("Import impossible : fichier illisible ou corrompu.");
    }
  };
  reader.readAsText(file);
}

function restoreLocalBackup() {
  const backup = localStorage.getItem(backupStorageKey);
  if (!backup) {
    updateDataStatus("Aucune backup locale disponible pour le moment.");
    return;
  }
  showAppConfirm("Restaurer la derniere backup locale ? Les donnees actuelles seront remplacees par l'etat precedent.", () => {
    try {
      const parsed = JSON.parse(backup);
      const normalized = normalizeState(parsed);
      rotateLocalBackup("before-restore");
      Object.keys(state).forEach((key) => delete state[key]);
      Object.assign(state, normalized);
      localStorage.setItem(storageKey, JSON.stringify(state));
      clearInterval(sessionUi.restTimer);
      sessionUi.phase = "ready";
      updateDataStatus("Backup locale restauree.");
      render();
    } catch {
      updateDataStatus("Backup locale illisible. Restauration impossible.");
    }
  }, "Restaurer la backup", true, "Restaurer");
}

document.querySelector("main").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  showView(button.dataset.view);
});

window.addEventListener("popstate", (event) => {
  showView((event.state && event.state.view) || "home", { push: false });
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && currentViewName === "training") {
    requestWakeLock();
    syncRestCountdown(sessionUi);
    Object.values(sessionUi.together).forEach(syncRestCountdown);
    renderTraining();
  }
});

document.addEventListener("dragstart", (event) => {
  if (event.target.closest("img, .logo, .brand")) event.preventDefault();
});

document.addEventListener("contextmenu", (event) => {
  if (event.target.closest("img, .brand-mark, .onboarding-logo, .brand")) event.preventDefault();
});

$("#builderModes").addEventListener("click", (event) => {
  const button = event.target.closest("[data-builder-mode]");
  if (!button) return;
  builderMode = button.dataset.builderMode;
  renderBuilderPanes();
});

const legacyPplButton = $("#createPplTemplates");
if (legacyPplButton) {
  legacyPplButton.addEventListener("click", () => {
    createPplTemplates();
    saveState();
    render();
  });
}

$("#openSettings").addEventListener("click", () => {
  updateVersionLabels();
  updatePwaStatus();
  renderSettingsStatus();
  previewSettings = { ...state.settings };
  $("#settingsTheme").value = state.settings.theme;
  $("#settingsMode").value = state.settings.mode || "dark";
  $("#settingsWeightUnit").value = state.settings.weightUnit;
  $("#settingsLengthUnit").value = state.settings.lengthUnit;
  const languageSelect = $("#settingsLanguage");
  if (languageSelect) languageSelect.value = state.settings.language || "fr";
  localizeDocument($("#settingsDialog"));
  $("#settingsDialog").showModal();
});

$("#trainingScreen").addEventListener("click", (event) => {
  const warmupChoice = event.target.closest("[data-warmup-choice]");
  if (warmupChoice) {
    const template = currentTemplate();
    if (!template) return;
    const log = currentLog(template.id);
    log.warmupChoice = warmupChoice.dataset.warmupChoice;
    log.warmupSeconds = Number(log.warmupSeconds || 150);
    if (log.warmupChoice === "no") log.warmupDone = true;
    saveState();
    renderTraining();
    return;
  }

  const warmupAdjust = event.target.closest("[data-warmup-adjust]");
  if (warmupAdjust) {
    const template = currentTemplate();
    if (!template) return;
    const log = currentLog(template.id);
    const nextSeconds = Math.max(15, Number(log.warmupSeconds || sessionUi.restRemaining || 150) + Number(warmupAdjust.dataset.warmupAdjust));
    log.warmupSeconds = nextSeconds;
    if (sessionUi.phase === "warmup" && sessionUi.restEndsAt) {
      sessionUi.restRemaining = Math.max(0, sessionUi.restRemaining + Number(warmupAdjust.dataset.warmupAdjust));
      sessionUi.restEndsAt = Date.now() + sessionUi.restRemaining * 1000;
    }
    saveState();
    renderTraining();
    return;
  }

  if (event.target.closest("[data-warmup-go]")) {
    const template = currentTemplate();
    if (!template) return;
    const log = currentLog(template.id);
    if (sessionUi.phase === "warmup") {
      clearInterval(sessionUi.restTimer);
      sessionUi.phase = "ready";
      sessionUi.restRemaining = 0;
      sessionUi.restEndsAt = 0;
      sessionUi.warmupRest = false;
      log.warmupDone = true;
    } else {
      log.warmupStarted = true;
      startWarmupRest(Number(log.warmupSeconds || 150));
    }
    saveState();
    renderTraining();
    return;
  }

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
    if (ui.restEndsAt) ui.restEndsAt = Date.now() + ui.restRemaining * 1000;
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
      ui.restEndsAt = 0;
      ui.lastSoundSecond = null;
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
    ui.restEndsAt = 0;
    ui.lastSoundSecond = null;
    saveState();
    renderTraining();
    return;
  }

  const sessionExercise = event.target.closest("[data-session-exercise]");
  if (sessionExercise) {
    const template = currentTemplate();
    if (!template) return;
    const log = currentLog(template.id);
    persistActiveTrainingInputs();
    log.currentExerciseIndex = Number(sessionExercise.dataset.sessionExercise);
    const nextItem = currentPlanItem(log);
    const nextEntry = nextItem && entryFor(log, nextItem);
    const firstOpenSet = nextEntry ? nextEntry.completed.findIndex((done) => !done) : -1;
    log.currentSetIndex = firstOpenSet >= 0 ? firstOpenSet : 0;
    log.introSeenIndex = log.currentExerciseIndex;
    sessionUi.phase = "ready";
    clearInterval(sessionUi.restTimer);
    sessionUi.restEndsAt = 0;
    sessionUi.lastSoundSecond = null;
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
    if (sessionUi.restEndsAt) sessionUi.restEndsAt = Date.now() + sessionUi.restRemaining * 1000;
    renderTraining();
    return;
  }

  if (event.target.closest("#goButton")) {
    ensureAudioContext();
    if (sessionUi.phase === "rest") {
      clearInterval(sessionUi.restTimer);
      sessionUi.phase = "ready";
      sessionUi.restEndsAt = 0;
      sessionUi.lastSoundSecond = null;
      renderTraining();
    } else {
      completeCurrentSet();
    }
  }

  const setButton = event.target.closest("[data-jump-set]");
  if (setButton) {
    const template = currentTemplate();
    if (!template) return;
    currentLog(template.id).currentSetIndex = Number(setButton.dataset.jumpSet);
    sessionUi.phase = "ready";
    saveState();
    renderTraining();
  }

  const alternative = event.target.closest("[data-alternative]");
  if (alternative) openAlternativeDialog(alternative.dataset.alternative);

  if (event.target.closest("#skipExercise")) {
    const template = currentTemplate();
    if (!template) return;
    const log = currentLog(template.id);
    persistActiveTrainingInputs();
    const templateItems = template.items || [];
    const afterCurrent = templateItems.findIndex((item, index) => {
      if (index <= log.currentExerciseIndex) return false;
      const entry = log.entries.find((candidate) => candidate.planItemId === item.id);
      return !entry || !entry.completed || entry.completed.some((done) => !done);
    });
    if (afterCurrent >= 0) {
      log.currentExerciseIndex = afterCurrent;
      log.currentSetIndex = 0;
    } else {
      moveLogToNextIncomplete(log);
    }
    saveState();
    render();
  }

  if (event.target.closest("#finishWorkout")) {
    const template = currentTemplate();
    if (!template) return;
    const log = currentLog(template.id);
    if (isLogComplete(log)) {
      finishLog(log, null);
      render();
    } else {
      $("#exitDialog").showModal();
    }
  }

  if (event.target.closest("#closeSummary")) {
    activeSummaryLogId = null;
    saveState();
    showView("home");
    render();
  }
});

$("#exitDialog").addEventListener("click", (event) => {
  const discard = event.target.closest("[data-exit-discard]");
  if (discard) {
    const template = currentTemplate();
    if (!template) return;
    const log = currentLog(template.id);
    log.archived = true;
    log.exitReason = "abandon sans sauvegarde";
    activeSummaryLogId = null;
    saveState();
    $("#exitDialog").close();
    showView("home");
    render();
    return;
  }
  const button = event.target.closest("[data-exit-reason]");
  if (!button) return;
  const template = currentTemplate();
  if (!template) return;
  finishLog(currentLog(template.id), button.dataset.exitReason === "terminee" ? null : button.dataset.exitReason);
  $("#exitDialog").close();
  render();
});

$("#startExerciseButton").addEventListener("click", () => {
  const template = currentTemplate();
  if (!template) return;
  const log = currentLog(template.id);
  log.introSeenIndex = log.currentExerciseIndex;
  exerciseIntroOpen = false;
  $("#exerciseIntroDialog").close();
  saveState();
  renderTraining();
});

$("#exerciseIntroDialog").addEventListener("close", () => {
  exerciseIntroOpen = false;
});

$("#alternativeList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-select-alternative]");
  if (!button || !activeExercisePlanId) return;
  selectedAlternativeName = button.dataset.selectAlternative;
  document.querySelectorAll("[data-select-alternative]").forEach((item) => item.classList.toggle("active-choice", item === button));
});

$("#confirmAlternative").addEventListener("click", () => {
  if (!activeExercisePlanId || !selectedAlternativeName) return;
  const template = currentTemplate();
  if (!template) return;
  const log = currentLog(template.id);
  const item = template.items.find((candidate) => candidate.id === activeExercisePlanId);
  const entry = entryFor(log, item);
  entry.performedExerciseName = selectedAlternativeName;
  entry.weight = fromDisplayWeight($("#alternativeWeight").value || weightInputValue(entry.weight || item.weight || 0));
  state.substitutions[item.exerciseId] = { name: selectedAlternativeName, weight: entry.weight };
  $("#alternativeDialog").close();
  activeExercisePlanId = null;
  selectedAlternativeName = "";
  saveState();
  render();
});

$("#templateForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const templateId = id();
  const newGroup = $("#newTemplateGroup").value.trim();
  const group = addTrainingGroup(newGroup || $("#templateGroup").value || "General");
  state.templates.push({ id: templateId, profileId: state.activeProfileId, name: $("#templateName").value.trim().toUpperCase(), group, items: [] });
  templateGroupFilter = group;
  expandedTemplateIds.add(templateId);
  event.target.reset();
  saveState();
  render();
});

$("#exerciseForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#exerciseName").value.trim();
  const family = selectedExerciseFamily();
  if (family && !state.muscleGroups.includes(family)) state.muscleGroups.push(family);
  const payload = {
    name,
    family,
    equipment: $("#exerciseEquipment").value,
    rest: restFromPicker("exerciseRest"),
    alternatives: [...activeExerciseAlternatives],
  };
  if (editingExerciseId) {
    const current = exerciseById(editingExerciseId);
    if (!current) return;
    showAppConfirm(`Modifier "${current.name}" ? Les seances qui utilisent cet exercice seront conservees avec ces nouvelles informations.`, () => {
      const oldName = current.name;
      Object.assign(current, payload);
      if (oldName !== payload.name) applyExerciseRename(oldName, payload.name);
      resetExerciseForm();
      saveState();
      render();
    }, "Modifier l'exercice", false, "Modifier");
    return;
  } else {
    state.exercises.push(exercise(id(), payload.name, payload.family, payload.equipment, payload.rest, payload.alternatives));
  }
  resetExerciseForm();
  saveState();
  render();
});

$("#exerciseFamily").addEventListener("change", () => {
  if ($("#exerciseFamily").value !== "Autre") return;
  showAppPrompt("Nom du nouveau groupe musculaire", "", (newGroup) => {
    if (!newGroup || !newGroup.trim()) {
      $("#exerciseFamily").value = "Dos";
      return;
    }
    const cleanGroup = newGroup.trim();
    if (!state.muscleGroups.includes(cleanGroup)) state.muscleGroups.push(cleanGroup);
    renderExerciseFormHelpers();
    $("#exerciseFamily").value = cleanGroup;
  }, "Nouveau groupe");
});

$("#exerciseAlternativePick").addEventListener("change", () => {
  const value = $("#exerciseAlternativePick").value;
  if (value && !activeExerciseAlternatives.includes(value)) activeExerciseAlternatives.push(value);
  $("#exerciseAlternativePick").value = "";
  renderExerciseFormHelpers();
});

$("#exerciseAlternativeTags").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-exercise-alternative]");
  if (!button) return;
  activeExerciseAlternatives = activeExerciseAlternatives.filter((name) => name !== button.dataset.removeExerciseAlternative);
  renderExerciseFormHelpers();
});

$("#cancelExerciseEdit").addEventListener("click", () => {
  resetExerciseForm();
});

$("#muscleGroupManager").addEventListener("click", (event) => {
  const options = event.target.closest("[data-muscle-group-options]");
  if (options) {
    activeMuscleGroupOptions = options.dataset.muscleGroupOptions;
    $("#muscleGroupActionsTitle").textContent = activeMuscleGroupOptions;
    $("#muscleGroupActionsDialog").showModal();
    return;
  }
  const rename = event.target.closest("[data-rename-muscle]");
  const remove = event.target.closest("[data-delete-muscle]");
  if (rename) {
    renameMuscleGroup(rename.dataset.renameMuscle);
    return;
  }
  if (remove) {
    deleteMuscleGroup(remove.dataset.deleteMuscle);
  }
});

$("#muscleGroupActionRename").addEventListener("click", () => {
  $("#muscleGroupActionsDialog").close();
  renameMuscleGroup(activeMuscleGroupOptions);
});

$("#muscleGroupActionDelete").addEventListener("click", () => {
  $("#muscleGroupActionsDialog").close();
  deleteMuscleGroup(activeMuscleGroupOptions);
});

$("#appMessageConfirm").addEventListener("click", () => {
  if (appMessageConfirmHandler) appMessageConfirmHandler();
});

$("#appMessageCancel").addEventListener("click", () => {
  if ($("#appMessageCancel").dataset.action === "delete-workout") return;
  const dialog = $("#appMessageDialog");
  if (dialog && dialog.open) dialog.close();
  appMessageConfirmHandler = null;
});

$("#appMessageDialog").addEventListener("close", () => {
  appMessageConfirmHandler = null;
  const cancelButton = $("#appMessageCancel");
  cancelButton.classList.remove("danger");
  cancelButton.onclick = null;
  delete cancelButton.dataset.action;
});

$("#settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings = {
    ...state.settings,
    theme: $("#settingsTheme").value,
    mode: $("#settingsMode").value,
    weightUnit: $("#settingsWeightUnit").value,
    lengthUnit: $("#settingsLengthUnit").value,
    language: $("#settingsLanguage").value,
    soundMuted: !!state.settings.soundMuted,
  };
  saveState();
  previewSettings = null;
  $("#settingsDialog").close();
  render();
});

$("#settingsTheme").addEventListener("change", () => {
  applySettingsPreview($("#settingsTheme").value, $("#settingsMode").value);
});

$("#settingsMode").addEventListener("change", () => {
  applySettingsPreview($("#settingsTheme").value, $("#settingsMode").value);
});

$("#settingsDialog").addEventListener("close", () => {
  if (!previewSettings) return;
  state.settings = { ...state.settings, theme: previewSettings.theme, mode: previewSettings.mode };
  previewSettings = null;
  applySettings();
});

function openOnboardingAfterWelcome() {
  if (state.onboardingComplete) return;
  const dialog = $("#onboardingDialog");
  renderOnboardingPreview();
  localizeFragment(dialog);
  if (dialog && dialog.showModal) dialog.showModal();
}

const firstLanguageSelect = $("#firstLanguage");
if (firstLanguageSelect) {
  firstLanguageSelect.addEventListener("change", () => {
    state.settings.language = firstLanguageSelect.value;
    renderFirstSettingsDialog();
  });
}

const firstSettingsForm = $("#firstSettingsForm");
if (firstSettingsForm) {
  firstSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.settings = {
      ...state.settings,
      language: $("#firstLanguage").value,
      weightUnit: $("#firstWeightUnit").value,
      lengthUnit: $("#firstLengthUnit").value,
    };
    state.preferencesComplete = true;
    saveState();
    $("#firstSettingsDialog").close();
    render();
    maybeOpenOnboarding();
  });
}
$("#acceptWelcome").addEventListener("click", () => {
  state.welcomeAccepted = true;
  saveState();
  $("#welcomeDialog").close();
  openOnboardingAfterWelcome();
  maybeAskBackupProtection();
});

$("#learnMoreWelcome").addEventListener("click", () => {
  aboutFromWelcome = true;
  $("#welcomeDialog").close();
  renderLegalDialogs();
  $("#aboutDialog").showModal();
});

$("#acceptAbout").addEventListener("click", () => {
  $("#aboutDialog").close();
  if (aboutFromWelcome || !state.welcomeAccepted) {
    aboutFromWelcome = false;
    state.welcomeAccepted = true;
    saveState();
    openOnboardingAfterWelcome();
    maybeAskBackupProtection();
  }
});

$("#openAbout").addEventListener("click", () => {
  aboutFromWelcome = false;
  renderLegalDialogs();
  $("#aboutDialog").showModal();
});

if ($("#plusOpenAbout")) {
  $("#plusOpenAbout").addEventListener("click", () => {
    aboutFromWelcome = false;
    renderLegalDialogs();
  $("#aboutDialog").showModal();
  });
}

if ($("#plusOpenSettings")) {
  $("#plusOpenSettings").addEventListener("click", () => {
    $("#openSettings").click();
  });
}

$("#openNutrition").addEventListener("click", () => {
  if (!nutritionEnabled) return;
  showView("nutrition");
  renderNutritionPanel();
  if (!state.nutritionIntroSeen) {
    localizeFragment($("#nutritionIntroDialog"));
    $("#nutritionIntroDialog").showModal();
  }
});

const openCoachButton = $("#openCoach");
if (openCoachButton) {
  openCoachButton.addEventListener("click", () => {
    showView("coach");
    renderCoachPanel();
  });
}

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

function renderOnboardingPreview() {
  const panel = $("#onboardingPreview");
  if (!panel) return;
  const goal = $("#onboardingGoal").value;
  const frequency = Number($("#onboardingFrequency").value || 3);
  const preset = goalPreset(goal);
  const defs = onboardingProgramDefinitions(frequency);
  panel.innerHTML = defs.map((definition) => `
    <article>
      <strong>${escapeHtml(definition.name)}</strong>
      <span>${preset.sets} series - ${preset.minReps}/${preset.maxReps} reps - repos ${restLabel(preset.rest)}</span>
      <p>${definition.exercises.slice(0, 4).map(escapeHtml).join(" / ")}${definition.exercises.length > 4 ? " +" : ""}</p>
    </article>
  `).join("");
  localizeFragment(panel);
}

function completeOnboarding(generateProgram) {
  const profile = activeProfile();
  profile.name = $("#onboardingName").value.trim() || profile.name || "Profil principal";
  profile.birthDate = displayToBirthDate($("#onboardingBirthDateText").value) || $("#onboardingBirthDate").value || profile.birthDate || "";
  profile.height = $("#onboardingHeight").value ? fromDisplayLength($("#onboardingHeight").value) : profile.height || "";

  const health = {
    weight: $("#onboardingWeight").value ? fromDisplayWeight($("#onboardingWeight").value) : "",
    bodyfat: $("#onboardingBodyfat").value,
    waist: $("#onboardingWaist").value ? fromDisplayLength($("#onboardingWaist").value) : "",
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
  maybeAskBackupProtection();
}

$("#onboardingForm").addEventListener("submit", (event) => {
  event.preventDefault();
  completeOnboarding(true);
});

$("#onboardingForm").addEventListener("change", (event) => {
  if (event.target.closest("#onboardingGoal") || event.target.closest("#onboardingFrequency")) renderOnboardingPreview();
  if (event.target.closest("#onboardingBirthDate")) {
    $("#onboardingBirthDateText").value = birthDateToDisplay(event.target.value);
  }
});

$("#onboardingForm").addEventListener("input", (event) => {
  if (!event.target.closest("#onboardingBirthDateText")) return;
  const input = event.target;
  input.value = formatBirthDateDisplay(input.value);
  const isoDate = displayToBirthDate(input.value);
  if (isoDate) $("#onboardingBirthDate").value = isoDate;
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

$("#protectStorageButton").addEventListener("click", () => {
  requestPersistentStorage();
});

$("#restoreLocalBackupButton").addEventListener("click", () => {
  restoreLocalBackup();
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
  rotateLocalBackup("pre-update");
  updateDataStatus("Backup de securite creee avant mise a jour.");
  expectingUpdateReload = true;
  swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
});

$("#templateList").addEventListener("submit", (event) => {
  const form = event.target.closest("[data-add-item]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  if (!data.get("exerciseId")) {
    showAppNotice("Aucun exercice selectionne.", "Ajouter un exercice");
    return;
  }
  const rest = Number(data.get("restMinutes") || 0) * 60 + Number(data.get("restSeconds") || 0);
  templateById(form.dataset.addItem).items.push(planItem(data.get("exerciseId"), Number(data.get("sets")), Number(data.get("minReps")), Number(data.get("maxReps")), fromDisplayWeight(data.get("weight")), fromDisplayWeight(data.get("increment")), Math.max(10, rest)));
  saveState();
  render();
});

$("#templateList").addEventListener("input", (event) => {
  const input = event.target.closest(".exercise-search-input");
  if (!input) return;
  updateExerciseSearchForm(input.closest("[data-add-item]"));
});

$("#templateList").addEventListener("change", (event) => {
  const select = event.target.closest('select[name="exerciseId"]');
  if (!select) return;
  updateExerciseSearchForm(select.closest("[data-add-item]"));
});

$("#templateList").addEventListener("click", (event) => {
  const pickExercise = event.target.closest("[data-pick-exercise]");
  if (pickExercise) {
    const form = pickExercise.closest("[data-add-item]");
    const select = form && form.querySelector('select[name="exerciseId"]');
    if (!select) return;
    select.value = pickExercise.dataset.pickExercise;
    updateExerciseSearchForm(form);
    return;
  }
  const toggle = event.target.closest("[data-toggle-template]");
  if (toggle) {
    if (expandedTemplateIds.has(toggle.dataset.toggleTemplate)) {
      expandedTemplateIds.delete(toggle.dataset.toggleTemplate);
    } else {
      expandedTemplateIds.add(toggle.dataset.toggleTemplate);
    }
    renderBuilder();
    return;
  }
  const templateOptions = event.target.closest("[data-template-options]");
  if (templateOptions) {
    activeTemplateOptionsId = templateOptions.dataset.templateOptions;
    const template = templateById(activeTemplateOptionsId);
    $("#templateActionsTitle").textContent = template ? template.name : "Seance";
    $("#templateActionsDialog").showModal();
    return;
  }
  const planItemOptions = event.target.closest("[data-plan-item-options]");
  if (planItemOptions) {
    const [templateId, itemId] = planItemOptions.dataset.planItemOptions.split(":");
    const template = templateById(templateId);
    const item = template && template.items.find((candidate) => candidate.id === itemId);
    const exercise = item && exerciseById(item.exerciseId);
    activePlanItemOptions = { templateId, itemId };
    $("#planItemActionsTitle").textContent = (exercise && exercise.name) || "Exercice";
    $("#planItemActionsDialog").showModal();
    return;
  }
  const editTemplateButton = event.target.closest("[data-edit-template]");
  if (editTemplateButton) {
    const template = templateById(editTemplateButton.dataset.editTemplate);
    if (!template) return;
    fillTemplateEditDialog(template);
    $("#editTemplateDialog").showModal();
    return;
  }
  const duplicateTemplateButton = event.target.closest("[data-duplicate-template]");
  if (duplicateTemplateButton) {
    duplicateTemplate(duplicateTemplateButton.dataset.duplicateTemplate);
    saveState();
    render();
    return;
  }
  const deleteTemplateButton = event.target.closest("[data-delete-template]");
  if (deleteTemplateButton) {
    deleteTemplate(deleteTemplateButton.dataset.deleteTemplate);
    saveState();
    render();
    return;
  }
  const moveItem = event.target.closest("[data-move-item]");
  if (moveItem) {
    const [templateId, itemId, direction] = moveItem.dataset.moveItem.split(":");
    const template = templateById(templateId);
    if (!template) return;
    const index = template.items.findIndex((item) => item.id === itemId);
    const nextIndex = index + Number(direction);
    if (index < 0 || nextIndex < 0 || nextIndex >= template.items.length) return;
    const [item] = template.items.splice(index, 1);
    template.items.splice(nextIndex, 0, item);
    saveState();
    renderBuilder();
    return;
  }
  const editItem = event.target.closest("[data-edit-item]");
  if (editItem) {
    const [templateId, itemId] = editItem.dataset.editItem.split(":");
    const template = templateById(templateId);
    const item = template && template.items.find((candidate) => candidate.id === itemId);
    if (!template || !item) return;
    const exerciseItem = exerciseById(item.exerciseId);
    $("#editPlanTemplateId").value = templateId;
    $("#editPlanItemId").value = itemId;
    $("#editPlanExercise").innerHTML = exerciseSelectOptions(item.exerciseId);
    $("#editPlanSets").value = item.sets;
    $("#editPlanMinReps").value = item.minReps;
    $("#editPlanMaxReps").value = item.maxReps;
    $("#editPlanWeight").value = weightInputValue(item.weight);
    $("#editPlanIncrement").value = weightInputValue(item.increment);
    setRestPicker("editPlanRest", item.rest || (exerciseItem && exerciseItem.rest) || 120);
    $("#editPlanItemDialog").showModal();
    return;
  }
  const remove = event.target.closest("[data-remove-item]");
  if (!remove) return;
  const [templateId, itemId] = remove.dataset.removeItem.split(":");
  const template = templateById(templateId);
  template.items = template.items.filter((item) => item.id !== itemId);
  saveState();
  render();
});

$("#editTemplateForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const template = templateById($("#editTemplateId").value);
  if (!template) return;
  template.name = $("#editTemplateName").value.trim().toUpperCase();
  const newGroup = $("#editTemplateNewGroup").value.trim();
  template.group = addTrainingGroup(newGroup || $("#editTemplateGroup").value || "General");
  templateGroupFilter = template.group;
  $("#editTemplateDialog").close();
  saveState();
  render();
});

$("#templateActionEdit").addEventListener("click", () => {
  const template = templateById(activeTemplateOptionsId);
  if (!template) return;
  $("#templateActionsDialog").close();
  fillTemplateEditDialog(template);
  $("#editTemplateDialog").showModal();
});

$("#templateActionDuplicate").addEventListener("click", () => {
  if (!activeTemplateOptionsId) return;
  $("#templateActionsDialog").close();
  duplicateTemplate(activeTemplateOptionsId);
  saveState();
  render();
});

$("#templateActionDelete").addEventListener("click", () => {
  if (!activeTemplateOptionsId) return;
  $("#templateActionsDialog").close();
  deleteTemplate(activeTemplateOptionsId);
});

$("#planItemActionEdit").addEventListener("click", () => {
  if (!activePlanItemOptions) return;
  const template = templateById(activePlanItemOptions.templateId);
  const item = template && template.items.find((candidate) => candidate.id === activePlanItemOptions.itemId);
  if (!template || !item) return;
  const exerciseItem = exerciseById(item.exerciseId);
  $("#planItemActionsDialog").close();
  $("#editPlanTemplateId").value = template.id;
  $("#editPlanItemId").value = item.id;
  $("#editPlanExercise").innerHTML = exerciseSelectOptions(item.exerciseId);
  $("#editPlanSets").value = item.sets;
  $("#editPlanMinReps").value = item.minReps;
  $("#editPlanMaxReps").value = item.maxReps;
  $("#editPlanWeight").value = weightInputValue(item.weight);
  $("#editPlanIncrement").value = weightInputValue(item.increment);
  setRestPicker("editPlanRest", item.rest || (exerciseItem && exerciseItem.rest) || 120);
  $("#editPlanItemDialog").showModal();
});

$("#planItemActionDelete").addEventListener("click", () => {
  if (!activePlanItemOptions) return;
  const template = templateById(activePlanItemOptions.templateId);
  if (!template) return;
  const item = template.items.find((candidate) => candidate.id === activePlanItemOptions.itemId);
  const exercise = item && exerciseById(item.exerciseId);
  $("#planItemActionsDialog").close();
  showAppConfirm(`Supprimer "${(exercise && exercise.name) || "cet exercice"}" de la seance ?`, () => {
    template.items = template.items.filter((item) => item.id !== activePlanItemOptions.itemId);
    saveState();
    render();
  }, "Supprimer l'exercice", true, "Supprimer");
});

$("#editPlanItemForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const template = templateById($("#editPlanTemplateId").value);
  const item = template && template.items.find((candidate) => candidate.id === $("#editPlanItemId").value);
  if (!template || !item) return;
  const newExerciseId = $("#editPlanExercise").value;
  const exerciseItem = exerciseById(newExerciseId);
  item.exerciseId = newExerciseId;
  item.sets = Number($("#editPlanSets").value);
  item.minReps = Number($("#editPlanMinReps").value);
  item.maxReps = Number($("#editPlanMaxReps").value);
  item.weight = fromDisplayWeight($("#editPlanWeight").value);
  item.increment = fromDisplayWeight($("#editPlanIncrement").value);
  item.targetReps = Array(item.sets).fill(item.minReps);
  item.rest = restFromPicker("editPlanRest");
  $("#editPlanItemDialog").close();
  saveState();
  render();
});

$("#equipmentFilters").addEventListener("click", (event) => {
  const filter = event.target.closest("[data-equipment]");
  if (!filter) return;
  equipmentFilter = filter.dataset.equipment;
  render();
});

$("#exerciseLibrarySearch").addEventListener("input", (event) => {
  libraryExerciseSearch = event.target.value;
  renderBuilder();
});

$("#muscleFilters").addEventListener("click", (event) => {
  const filter = event.target.closest("[data-muscle]");
  if (!filter) return;
  muscleFilter = filter.dataset.muscle;
  render();
});

$("#exerciseLibrary").addEventListener("click", (event) => {
  const options = event.target.closest("[data-exercise-options]");
  if (!options) return;
  exerciseOptionsId = options.dataset.exerciseOptions;
  const exerciseItem = exerciseById(exerciseOptionsId);
  if (!exerciseItem) return;
  $("#exerciseOptionsTitle").textContent = exerciseItem.name;
  $("#exerciseOptionsDialog").showModal();
});

$("#trainingGroupFilters").addEventListener("click", (event) => {
  const filter = event.target.closest("[data-training-group]");
  if (!filter) return;
  templateGroupFilter = filter.dataset.trainingGroup;
  renderBuilder();
});

$("#programModelList").addEventListener("click", (event) => {
  const modelButton = event.target.closest("[data-create-model]");
  if (!modelButton) return;
  createProgramModel(modelButton.dataset.createModel);
  saveState();
  render();
});

$("#editExerciseOption").addEventListener("click", () => {
  const exerciseItem = exerciseById(exerciseOptionsId);
  if (!exerciseItem) return;
  $("#exerciseOptionsDialog").close();
  editExercise(exerciseItem);
});

$("#addExerciseToTemplateOption").addEventListener("click", () => {
  const exerciseItem = exerciseById(exerciseOptionsId);
  if (!exerciseItem) return;
  $("#addExerciseId").value = exerciseItem.id;
  $("#addExerciseTemplate").innerHTML = templateSelectOptions();
  $("#addExerciseWeight").value = weightInputValue(defaultWeightForExercise(exerciseItem.name));
  $("#addExerciseIncrement").value = weightInputValue(goalPreset("muscle").increment);
  setRestPicker("addExerciseRest", exerciseItem.rest || 120);
  $("#exerciseOptionsDialog").close();
  $("#addExerciseToTemplateDialog").showModal();
});

$("#deleteExerciseOption").addEventListener("click", () => {
  const exerciseItem = exerciseById(exerciseOptionsId);
  if (!exerciseItem) return;
  $("#exerciseOptionsDialog").close();
  const warning = `Attention : supprimer "${exerciseItem.name}" l'enlevera aussi des seances existantes et supprimera les stats enregistrees dessus. Continuer ?`;
  showAppConfirm(warning, () => {
    pendingDeleteExerciseId = exerciseItem.id;
    showAppConfirm(`Confirmer definitivement la suppression de "${exerciseItem.name}" ?`, () => {
      removeExerciseEverywhere(pendingDeleteExerciseId);
      pendingDeleteExerciseId = null;
      saveState();
      render();
    }, "Confirmation definitive", true, "Supprimer");
  }, "Supprimer l'exercice", true, "Continuer");
});

$("#addExerciseToTemplateForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const template = templateById($("#addExerciseTemplate").value);
  if (!template) return;
  template.items.push(planItem(
    $("#addExerciseId").value,
    Number($("#addExerciseSets").value),
    Number($("#addExerciseMinReps").value),
    Number($("#addExerciseMaxReps").value),
    fromDisplayWeight($("#addExerciseWeight").value),
    fromDisplayWeight($("#addExerciseIncrement").value),
    restFromPicker("addExerciseRest"),
  ));
  $("#addExerciseToTemplateDialog").close();
  saveState();
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
  const options = event.target.closest("[data-schedule-options]");
  if (options) {
    const [scheduleId, scheduleDate] = options.dataset.scheduleOptions.split(":");
    activeScheduleOptionsId = scheduleId;
    activeScheduleOptionsDate = scheduleDate || todayKey;
    const item = state.schedule.find((candidate) => candidate.id === activeScheduleOptionsId);
    const template = item && templateById(item.templateId);
    $("#scheduleActionsTitle").textContent = template ? template.name : "Planning";
    $("#scheduleActionsDialog").showModal();
    return;
  }
  const remove = event.target.closest("[data-delete-schedule]");
  if (!remove) return;
  state.schedule = state.schedule.filter((item) => item.id !== remove.dataset.deleteSchedule);
  state.scheduleMoves = (state.scheduleMoves || []).filter((move) => move.scheduleId !== remove.dataset.deleteSchedule);
  saveState();
  render();
});

$("#scheduleActionDelete").addEventListener("click", () => {
  if (!activeScheduleOptionsId) return;
  $("#scheduleActionsDialog").close();
  state.schedule = state.schedule.filter((item) => item.id !== activeScheduleOptionsId);
  state.scheduleMoves = (state.scheduleMoves || []).filter((move) => move.scheduleId !== activeScheduleOptionsId);
  activeScheduleOptionsId = null;
  saveState();
  render();
});

$("#scheduleActionMove").addEventListener("click", () => {
  if (!activeScheduleOptionsId) return;
  $("#scheduleActionsDialog").close();
  $("#moveScheduleId").value = activeScheduleOptionsId;
  $("#moveScheduleFrom").value = activeScheduleOptionsDate || todayKey;
  $("#moveScheduleDate").value = activeScheduleOptionsDate || todayKey;
  $("#moveScheduleDialog").showModal();
});

$("#moveScheduleForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const scheduleId = $("#moveScheduleId").value;
  const fromDate = $("#moveScheduleFrom").value || todayKey;
  const toDate = $("#moveScheduleDate").value;
  if (!scheduleId || !toDate) return;
  state.scheduleMoves = (state.scheduleMoves || []).filter((move) => !(move.profileId === state.activeProfileId && move.scheduleId === scheduleId && move.fromDate === fromDate));
  if (fromDate !== toDate) {
    state.scheduleMoves.push({ id: id(), profileId: state.activeProfileId, scheduleId, fromDate, toDate });
  }
  $("#moveScheduleDialog").close();
  saveState();
  render();
});

let draggedPlanRow = null;
let pointerPlanDrag = null;

$("#templateList").addEventListener("dragstart", (event) => {
  if (event.target.closest("[data-drag-handle]")) return;
  const row = event.target.closest("[data-plan-row]");
  if (!row) return;
  draggedPlanRow = row.dataset.planRow;
  row.classList.add("dragging");
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedPlanRow);
  }
});

function clearPlanDropMarkers() {
  document.querySelectorAll(".drop-before, .drop-after").forEach((row) => {
    row.classList.remove("drop-before", "drop-after");
  });
}

function finishPointerPlanDrag(commit) {
  if (!pointerPlanDrag) return;
  const drag = pointerPlanDrag;
  clearPlanDropMarkers();
  if (drag.ghost) drag.ghost.remove();
  if (drag.sourceRow) drag.sourceRow.classList.remove("drag-source");
  if (commit && drag.targetId) {
    const template = templateById(drag.templateId);
    if (template) {
      const sourceIndex = template.items.findIndex((item) => item.id === drag.itemId);
      const targetIndex = template.items.findIndex((item) => item.id === drag.targetId);
      if (sourceIndex >= 0 && targetIndex >= 0 && sourceIndex !== targetIndex) {
        const [item] = template.items.splice(sourceIndex, 1);
        const adjustedTarget = template.items.findIndex((candidate) => candidate.id === drag.targetId);
        template.items.splice(drag.after ? adjustedTarget + 1 : adjustedTarget, 0, item);
        saveState();
      }
    }
  }
  pointerPlanDrag = null;
  if (commit) renderBuilder();
}

$("#templateList").addEventListener("pointerdown", (event) => {
  const handle = event.target.closest("[data-drag-handle]");
  if (!handle) return;
  const row = handle.closest("[data-plan-row]");
  if (!row) return;
  const [templateId, itemId] = row.dataset.planRow.split(":");
  const rect = row.getBoundingClientRect();
  const ghost = row.cloneNode(true);
  ghost.classList.add("drag-ghost");
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.width = `${rect.width}px`;
  document.body.appendChild(ghost);
  row.classList.add("drag-source");
  pointerPlanDrag = {
    pointerId: event.pointerId,
    templateId,
    itemId,
    sourceRow: row,
    ghost,
    offsetY: event.clientY - rect.top,
    targetId: null,
    after: false,
  };
  handle.setPointerCapture(event.pointerId);
  event.preventDefault();
});

$("#templateList").addEventListener("pointermove", (event) => {
  const drag = pointerPlanDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  if (drag.ghost) drag.ghost.style.top = `${event.clientY - drag.offsetY}px`;
  clearPlanDropMarkers();
  const rows = [...document.querySelectorAll(`[data-plan-row^="${drag.templateId}:"]`)].filter((row) => row.dataset.planRow !== `${drag.templateId}:${drag.itemId}`);
  const target = rows.find((row) => {
    const rect = row.getBoundingClientRect();
    return event.clientY >= rect.top && event.clientY <= rect.bottom;
  });
  if (target) {
    const rect = target.getBoundingClientRect();
    drag.targetId = target.dataset.planRow.split(":")[1];
    drag.after = event.clientY > rect.top + rect.height / 2;
    target.classList.add(drag.after ? "drop-after" : "drop-before");
  }
  event.preventDefault();
});

$("#templateList").addEventListener("pointerup", (event) => {
  if (!pointerPlanDrag || pointerPlanDrag.pointerId !== event.pointerId) return;
  finishPointerPlanDrag(true);
});

$("#templateList").addEventListener("pointercancel", (event) => {
  if (!pointerPlanDrag || pointerPlanDrag.pointerId !== event.pointerId) return;
  finishPointerPlanDrag(false);
});

$("#templateList").addEventListener("dragend", (event) => {
  const row = event.target.closest("[data-plan-row]");
  if (row) row.classList.remove("dragging");
  draggedPlanRow = null;
});

$("#templateList").addEventListener("dragover", (event) => {
  if (!draggedPlanRow) return;
  const row = event.target.closest("[data-plan-row]");
  if (!row || row.dataset.planRow === draggedPlanRow) return;
  const [sourceTemplateId] = draggedPlanRow.split(":");
  const [targetTemplateId] = row.dataset.planRow.split(":");
  if (sourceTemplateId !== targetTemplateId) return;
  event.preventDefault();
});

$("#templateList").addEventListener("drop", (event) => {
  if (!draggedPlanRow) return;
  const targetRow = event.target.closest("[data-plan-row]");
  if (!targetRow || targetRow.dataset.planRow === draggedPlanRow) return;
  const [sourceTemplateId, sourceItemId] = draggedPlanRow.split(":");
  const [targetTemplateId, targetItemId] = targetRow.dataset.planRow.split(":");
  if (sourceTemplateId !== targetTemplateId) return;
  const template = templateById(sourceTemplateId);
  if (!template) return;
  const sourceIndex = template.items.findIndex((item) => item.id === sourceItemId);
  const targetIndex = template.items.findIndex((item) => item.id === targetItemId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const [item] = template.items.splice(sourceIndex, 1);
  template.items.splice(targetIndex, 0, item);
  draggedPlanRow = null;
  saveState();
  renderBuilder();
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
    const previousDefaultName = profile.name === "Profil principal";
    const submittedName = $("#profileName").value.trim();
    profile.name = previousDefaultName && submittedName === "Main profile" ? "Profil principal" : submittedName;
    profile.birthDate = displayToBirthDate($("#profileBirthDateText").value) || $("#profileBirthDatePicker").value;
    profile.height = $("#profileHeight").value ? fromDisplayLength($("#profileHeight").value) : "";
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
    const existing = state.health.find((item) => item.profileId === state.activeProfileId && item.date === payload.date);
    if (existing) {
      Object.assign(existing, payload);
    } else {
      state.health.unshift({ id: id(), profileId: state.activeProfileId, ...payload });
    }
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

  const healthOptions = event.target.closest("[data-health-options]");
  if (healthOptions) {
    activeHealthOptionsId = healthOptions.dataset.healthOptions;
    const item = state.health.find((candidate) => candidate.profileId === state.activeProfileId && candidate.id === activeHealthOptionsId);
    $("#healthActionsTitle").textContent = item ? `Mesures ${item.date}` : "Mesures";
    $("#healthActionsDialog").showModal();
    return;
  }

  const workoutOptions = event.target.closest("[data-workout-log-options]");
  if (workoutOptions) {
    const logId = workoutOptions.dataset.workoutLogOptions;
    const log = state.logs.find((item) => item.profileId === state.activeProfileId && item.id === logId);
    const template = log && templateById(log.templateId);
    activeWorkoutLogOptionsId = logId;
    $("#workoutLogActionsTitle").textContent = (template && template.name) || "Seance";
    $("#workoutLogActionsDialog").showModal();
    return;
  }

  if (event.target.closest("#addPastWorkoutLog")) {
    openWorkoutLogEditor(null);
    return;
  }

  const edit = event.target.closest("[data-edit-health]");
  const remove = event.target.closest("[data-delete-health]");
  if (remove) {
    const item = state.health.find((candidate) => candidate.profileId === state.activeProfileId && candidate.id === remove.dataset.deleteHealth);
    if (!item) return;
    showAppConfirm(`Supprimer les mesures du ${item.date} ?`, () => {
      state.health = state.health.filter((candidate) => candidate.id !== item.id);
      saveState();
      renderTracking();
    }, "Supprimer les mesures", true, "Supprimer");
    return;
  }
  if (!edit) return;
  const item = state.health.find((candidate) => candidate.profileId === state.activeProfileId && candidate.id === edit.dataset.editHealth);
  if (!item) return;
  fillHealthForm(item);
});

$("#workoutLogEditForm").addEventListener("submit", (event) => {
  event.preventDefault();
  let log = state.logs.find((item) => item.profileId === state.activeProfileId && item.id === $("#workoutLogEditId").value);
  if (!log) {
    log = buildManualLogFromTemplate($("#workoutLogEditTemplate").value);
    log.id = id();
    state.logs.unshift(log);
  }
  log.date = $("#workoutLogEditDate").value || log.date;
  document.querySelectorAll("[data-edit-log-entry]").forEach((row) => {
    const entry = log.entries.find((item) => item.id === row.dataset.editLogEntry);
    if (!entry) return;
    entry.weight = fromDisplayWeight(row.querySelector("[data-edit-log-weight]").value || 0);
    const reps = row.querySelector("[data-edit-log-reps]").value.split(/[\/,; ]+/).filter(Boolean).map((value) => Number(value || 0));
    entry.reps = reps;
    entry.completed = reps.map((value) => value > 0);
  });
  applyProgression(log);
  saveState();
  $("#workoutLogEditDialog").close();
  renderTracking();
});

$("#workoutLogEditTemplate").addEventListener("change", () => {
  if ($("#workoutLogEditId").value) return;
  const draft = buildManualLogFromTemplate($("#workoutLogEditTemplate").value);
  $("#workoutLogEditEntries").innerHTML = logEditEntryRows(draft);
});

$("#workoutLogActionEdit").addEventListener("click", () => {
  $("#workoutLogActionsDialog").close();
  openWorkoutLogEditor(activeWorkoutLogOptionsId);
});

$("#workoutLogActionDelete").addEventListener("click", () => {
  const logId = activeWorkoutLogOptionsId;
  $("#workoutLogActionsDialog").close();
  showAppConfirm("Supprimer cette seance et ses performances ?", () => {
    state.logs = state.logs.filter((item) => item.id !== logId);
    activeWorkoutLogOptionsId = null;
    saveState();
    renderTracking();
  }, "Supprimer la seance", true, "Supprimer");
});

$("#healthActionEdit").addEventListener("click", () => {
  const item = state.health.find((candidate) => candidate.profileId === state.activeProfileId && candidate.id === activeHealthOptionsId);
  $("#healthActionsDialog").close();
  if (!item) return;
  fillHealthForm(item);
});

$("#healthActionDelete").addEventListener("click", () => {
  const item = state.health.find((candidate) => candidate.profileId === state.activeProfileId && candidate.id === activeHealthOptionsId);
  $("#healthActionsDialog").close();
  if (!item) return;
  showAppConfirm(`Supprimer les mesures du ${item.date} ?`, () => {
    state.health = state.health.filter((candidate) => candidate.id !== item.id);
    activeHealthOptionsId = null;
    saveState();
    renderTracking();
  }, "Supprimer les mesures", true, "Supprimer");
});

$("#trackingPanel").addEventListener("change", (event) => {
  if (!event.target.closest("#profileBirthDatePicker")) return;
  $("#profileBirthDateText").value = birthDateToDisplay(event.target.value);
});

$("#trackingPanel").addEventListener("input", (event) => {
  if (!event.target.closest("#profileBirthDateText")) return;
  const input = event.target;
  input.value = formatBirthDateDisplay(input.value);
  const picker = $("#profileBirthDatePicker");
  const isoDate = displayToBirthDate(input.value);
  if (picker && isoDate) picker.value = isoDate;
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
    date: $("#healthDate").value || todayKey,
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
  $("#healthDate").value = item.date || todayKey;
  $("#healthWeight").value = item.weight ? weightInputValue(item.weight) : "";
  $("#healthBodyfat").value = item.bodyfat || "";
  $("#healthWaist").value = item.waist ? lengthInputValue(item.waist) : "";
  $("#healthChest").value = item.chest ? lengthInputValue(item.chest) : "";
  $("#healthShoulders").value = item.shoulders ? lengthInputValue(item.shoulders) : "";
  $("#healthBicepsRight").value = item.bicepsRight ? lengthInputValue(item.bicepsRight) : "";
  $("#healthBicepsLeft").value = item.bicepsLeft ? lengthInputValue(item.bicepsLeft) : "";
  $("#healthForearmRight").value = item.forearmRight ? lengthInputValue(item.forearmRight) : "";
  $("#healthForearmLeft").value = item.forearmLeft ? lengthInputValue(item.forearmLeft) : "";
  $("#healthThighRight").value = item.thighRight ? lengthInputValue(item.thighRight) : "";
  $("#healthThighLeft").value = item.thighLeft ? lengthInputValue(item.thighLeft) : "";
  $("#healthCalfRight").value = item.calfRight ? lengthInputValue(item.calfRight) : "";
  $("#healthCalfLeft").value = item.calfLeft ? lengthInputValue(item.calfLeft) : "";
  $("#healthWeight").focus();
}

function logEditEntryRows(log) {
  return (log.entries || []).map((entry) => `
    <article class="item-card compact-form" data-edit-log-entry="${entry.id}">
      <strong>${escapeHtml(displayExerciseName(entry.performedExerciseName || "Exercice"))}</strong>
      <label>Poids ${weightUnit()}<input data-edit-log-weight inputmode="decimal" type="number" step="0.5" value="${escapeHtml(weightInputValue(entry.weight || 0))}"></label>
      <label>Reps par serie<input data-edit-log-reps inputmode="numeric" value="${escapeHtml((entry.reps || []).join("/"))}" placeholder="8/8/8/8"></label>
    </article>
  `).join("") || `<p class="empty">Aucune performance dans cette seance.</p>`;
}

function buildManualLogFromTemplate(templateId) {
  const template = templateById(templateId);
  return {
    id: "",
    profileId: state.activeProfileId,
    date: todayKey,
    templateId,
    entries: template ? template.items.map((item) => {
      const exerciseItem = exerciseById(item.exerciseId);
      return {
        id: id(),
        planItemId: item.id,
        exerciseId: item.exerciseId,
        performedExerciseName: (exerciseItem && exerciseItem.name) || "Exercice",
        weight: item.weight,
        reps: Array(item.sets).fill(item.minReps),
        completed: Array(item.sets).fill(true),
      };
    }) : [],
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    introSeenIndex: -1,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    manual: true,
  };
}

function openWorkoutLogEditor(logId) {
  const existing = logId ? state.logs.find((item) => item.profileId === state.activeProfileId && item.id === logId) : null;
  const fallbackTemplate = profileTemplates()[0];
  const log = existing || buildManualLogFromTemplate(fallbackTemplate && fallbackTemplate.id);
  if (!log) return;
  $("#workoutLogEditId").value = existing ? log.id : "";
  $("#workoutLogEditTemplate").innerHTML = templateSelectOptions(log.templateId);
  $("#workoutLogEditTemplate").disabled = !!existing;
  $("#workoutLogTemplateWrap").hidden = false;
  $("#workoutLogEditDate").value = existing ? (log.date || todayKey) : todayKey;
  $("#workoutLogEditEntries").innerHTML = logEditEntryRows(log);
  $("#workoutLogEditDialog").showModal();
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

function legalCopyContent() {
  const fr = {
    firstLabel: "Preferences",
    firstTitle: "Avant de commencer",
    firstText: "Choisis la langue et les unites avant la creation du profil. Tu pourras les modifier plus tard dans Options.",
    firstLanguage: "Langue",
    firstWeight: "Poids",
    firstLength: "Mesures",
    firstContinue: "Continuer",
    welcomeLabel: "Bienvenue sur AERSTRONG",
    welcomeTitle: "Bienvenue sur AERSTRONG",
    welcomeSubtitle: "AERSTRONG est une application creee par un passionne de musculation et de sport, pour les passionnes.",
    welcomeHtml: `
      <p>Son objectif est de vous aider a suivre vos entrainements, mesurer votre progression et rester motive dans votre pratique sportive. Les conseils, suggestions et informations presents dans l'application sont fournis a titre informatif uniquement.</p>
      <p>AERSTRONG n'est pas developpe par des medecins, kinesitherapeutes, nutritionnistes ou autres professionnels de sante. Les contenus proposes ne constituent en aucun cas un avis medical, un diagnostic ou une prescription.</p>
      <p>Chaque personne etant differente, il est recommande de consulter un professionnel qualifie avant d'entreprendre ou de modifier un programme d'entrainement, un regime alimentaire ou toute autre pratique susceptible d'avoir un impact sur votre sante.</p>
      <p>L'utilisation de cette application se fait sous votre entiere responsabilite. Veillez a vous entrainer de maniere adaptee a votre niveau, a respecter vos limites et a privilegier votre securite.</p>
      <p>Merci de faire partie de l'aventure AERSTRONG. Nous esperons que cette application vous accompagnera dans votre progression et votre passion pour le sport.</p>
      <p><strong>Stay Strong.</strong></p>
    `,
    aboutLabel: "A propos",
    aboutTitle: "A propos d'AERSTRONG",
    aboutHtml: `
      <h3>Pourquoi AERSTRONG existe ?</h3>
      <p>AERSTRONG est ne d'une passion pour la musculation, le sport et le depassement de soi.</p>
      <p>Comme beaucoup de pratiquants, j'ai passe des annees a chercher l'application parfaite pour suivre mes entrainements. J'en ai teste beaucoup, mais il y avait toujours quelque chose qui manquait : une fonctionnalite, une simplicite d'utilisation ou simplement une philosophie qui me correspondait.</p>
      <p>Alors un jour, j'ai decide de creer l'outil que j'aurais aime avoir.</p>
      <h3>Un projet de passionne</h3>
      <p>Je ne suis ni une grande entreprise ni une equipe de developpeurs.</p>
      <p>Je suis simplement un passionne de sport qui a voulu mettre ses connaissances, son experience et son temps au service d'un projet utile pour la communaute.</p>
      <p>AERSTRONG a ete concu avec une idee simple : creer une application que j'utiliserais moi-meme chaque jour avec plaisir.</p>
      <p>Si elle peut egalement aider d'autres passionnes a progresser, a rester motives et a atteindre leurs objectifs, alors le projet aura deja rempli sa mission.</p>
      <h3>Ce qu'AERSTRONG est</h3>
      <ul><li>Un carnet d'entrainement numerique.</li><li>Un outil de suivi de progression.</li><li>Une aide a l'organisation de vos seances.</li><li>Un compagnon de route dans votre pratique sportive.</li></ul>
      <h3>Ce qu'AERSTRONG n'est pas</h3>
      <p>AERSTRONG ne remplace pas :</p>
      <ul><li>Un medecin.</li><li>Un kinesitherapeute.</li><li>Un coach sportif diplome.</li><li>Un nutritionniste.</li><li>Un professionnel de sante.</li></ul>
      <p>Les informations et suggestions proposees dans l'application sont fournies a titre informatif uniquement et ne doivent jamais etre considerees comme un avis medical ou professionnel.</p>
      <h3>Votre sante avant tout</h3>
      <p>Chaque personne possede son propre niveau, ses objectifs, ses limites et ses antecedents.</p>
      <p>Avant de commencer un nouveau programme d'entrainement, un changement alimentaire important ou toute activite physique intense, il est recommande de consulter un professionnel qualifie.</p>
      <p>Ecoutez votre corps. En cas de douleur, d'inconfort ou de doute, interrompez l'activite concernee et demandez conseil a un specialiste.</p>
      <p>Votre sante passera toujours avant vos performances.</p>
      <h3>Construisons AERSTRONG ensemble</h3>
      <p>AERSTRONG est un projet vivant qui continuera d'evoluer grace a ses utilisateurs.</p>
      <p>Vos retours, vos idees et vos suggestions sont precieux. Chaque amelioration, chaque fonctionnalite et chaque correction contribue a rendre l'application meilleure pour toute la communaute.</p>
      <p>Merci de faire partie de cette aventure.</p>
      <p>J'ai cree cette application parce que j'avais besoin de cet outil pour moi-meme. Si elle peut aider d'autres passionnes a progresser, alors le pari est reussi.</p>
      <p><strong>Stay Strong.</strong></p>
      <p>- Alvin, createur d'AERSTRONG</p>
    `,
    understood: "J'ai compris",
    learnMore: "En savoir plus",
  };
  const en = {
    firstLabel: "Preferences",
    firstTitle: "Before you start",
    firstText: "Choose the language and units before creating your profile. You can change them later in Settings.",
    firstLanguage: "Language",
    firstWeight: "Weight",
    firstLength: "Measurements",
    firstContinue: "Continue",
    welcomeLabel: "Welcome to AERSTRONG",
    welcomeTitle: "Welcome to AERSTRONG",
    welcomeSubtitle: "AERSTRONG is an app created by a strength training and sports enthusiast, for enthusiasts.",
    welcomeHtml: `
      <p>Its goal is to help you track your workouts, measure your progress, and stay motivated in your sport practice. The advice, suggestions, and information in the app are provided for informational purposes only.</p>
      <p>AERSTRONG is not developed by doctors, physiotherapists, nutritionists, or other health professionals. The content provided is not medical advice, diagnosis, or prescription.</p>
      <p>Because every person is different, you should consult a qualified professional before starting or changing a training program, diet, or any practice that may affect your health.</p>
      <p>You use this application under your own responsibility. Train in a way that fits your level, respect your limits, and prioritize your safety.</p>
      <p>Thank you for being part of the AERSTRONG journey. We hope this app supports your progress and your passion for sport.</p>
      <p><strong>Stay Strong.</strong></p>
    `,
    aboutLabel: "About",
    aboutTitle: "About AERSTRONG",
    aboutHtml: `
      <h3>Why does AERSTRONG exist?</h3>
      <p>AERSTRONG was born from a passion for strength training, sport, and self-improvement.</p>
      <p>Like many lifters, I spent years looking for the perfect app to track my workouts. I tried many of them, but something was always missing: a feature, simplicity, or simply a philosophy that matched the way I train.</p>
      <p>So one day, I decided to build the tool I wished I had.</p>
      <h3>A passion project</h3>
      <p>I am not a large company or a team of developers.</p>
      <p>I am simply a sports enthusiast who wanted to put his knowledge, experience, and time into a useful project for the community.</p>
      <p>AERSTRONG was designed with one simple idea: create an app I would enjoy using myself every day.</p>
      <p>If it also helps other enthusiasts progress, stay motivated, and reach their goals, then the project has already done its job.</p>
      <h3>What AERSTRONG is</h3>
      <ul><li>A digital workout log.</li><li>A progress tracking tool.</li><li>A way to organize your workouts.</li><li>A companion for your sport practice.</li></ul>
      <h3>What AERSTRONG is not</h3>
      <p>AERSTRONG does not replace:</p>
      <ul><li>A doctor.</li><li>A physiotherapist.</li><li>A certified sports coach.</li><li>A nutritionist.</li><li>A health professional.</li></ul>
      <p>The information and suggestions in the app are provided for informational purposes only and should never be considered medical or professional advice.</p>
      <h3>Your health comes first</h3>
      <p>Everyone has their own level, goals, limits, and history.</p>
      <p>Before starting a new training program, making a major diet change, or doing intense physical activity, you should consult a qualified professional.</p>
      <p>Listen to your body. If you feel pain, discomfort, or doubt, stop the activity and ask a specialist for advice.</p>
      <p>Your health will always come before performance.</p>
      <h3>Let's build AERSTRONG together</h3>
      <p>AERSTRONG is a living project that will keep evolving thanks to its users.</p>
      <p>Your feedback, ideas, and suggestions matter. Every improvement, feature, and fix helps make the app better for the whole community.</p>
      <p>Thank you for being part of this journey.</p>
      <p>I created this app because I needed this tool myself. If it can help other enthusiasts progress, then the bet has paid off.</p>
      <p><strong>Stay Strong.</strong></p>
      <p>- Alvin, creator of AERSTRONG</p>
    `,
    understood: "I understand",
    learnMore: "Learn more",
  };
  return isEnglish() ? en : fr;
}

function renderLegalDialogs() {
  const copy = legalCopyContent();
  const setText = (selector, value) => { const el = $(selector); if (el) el.textContent = value; };
  setText("#firstSettingsLabel", copy.firstLabel);
  setText("#firstSettingsTitle", copy.firstTitle);
  setText("#firstSettingsText", copy.firstText);
  setInputLabel("#firstLanguage", copy.firstLanguage);
  setInputLabel("#firstWeightUnit", copy.firstWeight);
  setInputLabel("#firstLengthUnit", copy.firstLength);
  setText("#saveFirstSettings", copy.firstContinue);
  setText("#welcomeLabel", copy.welcomeLabel);
  setText("#welcomeTitle", copy.welcomeTitle);
  setText("#welcomeSubtitle", copy.welcomeSubtitle);
  const welcomeLegal = $("#welcomeLegalCopy");
  if (welcomeLegal) welcomeLegal.innerHTML = copy.welcomeHtml;
  setText("#acceptWelcome", copy.understood);
  setText("#learnMoreWelcome", copy.learnMore);
  setText("#aboutLabel", copy.aboutLabel);
  setText("#aboutTitle", copy.aboutTitle);
  const aboutLegal = $("#aboutLegalCopy");
  if (aboutLegal) aboutLegal.innerHTML = copy.aboutHtml;
  setText("#acceptAbout", copy.understood);
}

function renderFirstSettingsDialog() {
  const languageSelect = $("#firstLanguage");
  const weightSelect = $("#firstWeightUnit");
  const lengthSelect = $("#firstLengthUnit");
  if (languageSelect) languageSelect.value = state.settings.language || "fr";
  if (weightSelect) weightSelect.value = state.settings.weightUnit || "kg";
  if (lengthSelect) lengthSelect.value = state.settings.lengthUnit || "cm";
  renderLegalDialogs();
}
function maybeOpenOnboarding() {
  if (!state.preferencesComplete) {
    const first = $("#firstSettingsDialog");
    renderFirstSettingsDialog();
    if (first && first.showModal) first.showModal();
    return;
  }
  if (!state.welcomeAccepted) {
    const welcome = $("#welcomeDialog");
    renderLegalDialogs();
    if (welcome && welcome.showModal) welcome.showModal();
    return;
  }
  if (state.onboardingComplete) return;
  const dialog = $("#onboardingDialog");
  if (!dialog || !dialog.showModal) return;
  renderOnboardingPreview();
  localizeFragment(dialog);
  dialog.showModal();
}

function maybeAskBackupProtection() {
  if (!state.welcomeAccepted || !state.onboardingComplete || state.settings.storageProtectionAsked || localStorage.getItem(protectionPromptKey) === "1") return;
  window.setTimeout(() => {
    if (document.querySelector("dialog[open]")) return;
    showAppConfirm("Autoriser AERSTRONG a proteger les donnees locales de ce telephone ? Les sauvegardes automatiques resteront sur l'appareil.", () => {
      requestPersistentStorage();
    }, "Protection des donnees", false, "Autoriser");
    state.settings.storageProtectionAsked = true;
    localStorage.setItem(protectionPromptKey, "1");
    saveState();
  }, 800);
}

updateVersionLabels();
registerServiceWorker();
history.replaceState({ view: "home" }, "", window.location.pathname + window.location.search);
render();
maybeOpenOnboarding();
maybeAskBackupProtection();
