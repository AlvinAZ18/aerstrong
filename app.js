const storageKey = "forgefit-v4";
const backupStorageKey = `${storageKey}-backup`;
const backupMetaKey = `${storageKey}-backup-meta`;
const protectionPromptKey = `${storageKey}-storage-protection-asked`;
const appVersion = "v1.8.4";
const dataSchemaVersion = 6;
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
    settings: { theme: "gold", mode: "dark", weightUnit: "kg", lengthUnit: "cm", soundMuted: false },
    substitutions: {},
    dataVersion: dataSchemaVersion,
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
  const settings = { theme: "gold", mode: "dark", weightUnit: "kg", lengthUnit: "cm", soundMuted: false, ...(saved.settings || {}) };
  if (!saved[brandMigrationKey] && settings.theme === "red") settings.theme = "gold";
  settings.weightUnit = "kg";
  settings.lengthUnit = "cm";
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
  $("#editTemplateGroup").innerHTML = groups.map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join("");
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
  return state.logs.some((log) => log.profileId === profileId && log.date === dateKey && log.finishedAt && !log.archived && (
    log.scheduleKey ? log.scheduleKey === scheduleKey : log.templateId === item.templateId
  ));
}

function isTemplateDoneOnDate(templateId, dateKey, profileId = state.activeProfileId) {
  return state.logs.some((log) => log.profileId === profileId && log.date === dateKey && log.templateId === templateId && log.finishedAt && !log.archived);
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
    const weight = Number(String(weightInput.value).replace(",", "."));
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
  return `${day}/${month}/${year}`;
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
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function showAppMessage({ title = "AERSTRONG", message = "", confirmLabel = "OK", cancelLabel = "Annuler", danger = false, input = false, inputLabel = "Valeur", inputValue = "", onConfirm = null }) {
  const dialog = $("#appMessageDialog");
  if (!dialog) return;
  $("#appMessageTitle").textContent = title;
  $("#appMessageText").textContent = message;
  $("#appMessageConfirm").textContent = confirmLabel;
  $("#appMessageCancel").textContent = cancelLabel;
  $("#appMessageCancel").hidden = !cancelLabel;
  $("#appMessageConfirm").classList.toggle("danger-action", !!danger);
  const inputWrap = $("#appMessageInputWrap");
  const inputField = $("#appMessageInput");
  inputWrap.hidden = !input;
  inputField.value = input ? inputValue : "";
  $("#appMessageInputLabel").textContent = inputLabel;
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
    <optgroup label="${escapeHtml(section.group)}">
      ${section.items.map((exerciseItem) => `<option value="${exerciseItem.id}" ${exerciseItem.id === selectedId ? "selected" : ""}>${escapeHtml(exerciseItem.name)}</option>`).join("")}
    </optgroup>
  `).join("");
}

function exerciseSuggestionButtons(query, selectedId = "") {
  const cleanQuery = normalizeSearch(query);
  if (!cleanQuery) return "";
  return filteredExercises(query).slice(0, 8).map((exerciseItem) => `
    <button class="suggestion-chip ${exerciseItem.id === selectedId ? "active" : ""}" data-pick-exercise="${exerciseItem.id}" type="button">
      ${highlightMatch(exerciseItem.name, query)}
      <span>${escapeHtml(exerciseItem.family)} - ${escapeHtml(exerciseItem.equipment)}</span>
    </button>
  `).join("") || `<p class="empty compact-empty">Aucun exercice trouve.</p>`;
}

function templateSelectOptions(selectedId = "") {
  return profileTrainingGroups().map((group) => {
    const items = profileTemplates()
      .filter((template) => (template.group || "General") === group)
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
    if (!items.length) return "";
    return `<optgroup label="${escapeHtml(group)}">${items.map((template) => `<option value="${template.id}" ${template.id === selectedId ? "selected" : ""}>${escapeHtml(template.name)}</option>`).join("")}</optgroup>`;
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
  $("#exerciseFamily").innerHTML = groups.map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join("");
  $("#exerciseFamily").value = groups.includes(previousFamily) ? previousFamily : "Dos";
  const currentId = $("#exerciseEditId").value;
  const alternatives = state.exercises.filter((exerciseItem) => exerciseItem.id !== currentId && !activeExerciseAlternatives.includes(exerciseItem.name));
  $("#exerciseAlternativePick").innerHTML = `<option value="">Ajouter une alternative...</option>${groupedExercises(alternatives).map((section) => `
    <optgroup label="${escapeHtml(section.group)}">
      ${section.items.map((exerciseItem) => `<option value="${escapeHtml(exerciseItem.name)}">${escapeHtml(exerciseItem.name)}</option>`).join("")}
    </optgroup>
  `).join("")}`;
  $("#exerciseAlternativePick").value = previousAlternativePick || "";
  $("#exerciseAlternativeTags").innerHTML = activeExerciseAlternatives.map((name) => `
    <button class="tag-chip" data-remove-exercise-alternative="${escapeHtml(name)}" type="button">
      <span>${escapeHtml(name)}</span><strong>x</strong>
    </button>
  `).join("") || `<p class="muted-text">Aucune alternative ajoutee.</p>`;
  $("#muscleGroupManager").innerHTML = allMuscleGroups().map((group) => {
    const locked = defaultMuscleGroups().includes(group);
    return `<span class="manager-chip">${escapeHtml(group)}${locked ? "" : `<button class="icon-mini chip-options" data-muscle-group-options="${escapeHtml(group)}" type="button" aria-label="Options ${escapeHtml(group)}">...</button>`}</span>`;
  }).join("");
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
      text: `${exerciseName}${context} : haut de fourchette valide. Vise ${next.weight} ${state.settings.weightUnit} sur ${next.targetReps.join("/")}.`,
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
  profileTemplates().forEach((template) => {
    (template.items || []).forEach((item) => {
      const latest = latestEntryForExercise(item.exerciseId);
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
      <input class="rep-input weight-input" id="activeWeightInput" inputmode="decimal" type="number" min="0" step="0.5" value="${escapeHtml(entry.weight || item.weight || 0)}" aria-label="Charge utilisee">
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
  $("#exerciseIntroMeta").textContent = `${item.sets} series - ${item.minReps}/${item.maxReps} reps - ${entry.weight || item.weight || 0} ${state.settings.weightUnit}`;
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
    templateGroup.innerHTML = groups.map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join("");
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
        <label>Kg<input name="weight" inputmode="decimal" min="0" step="0.5" type="number" value="40"></label>
        <label>+ kg<input name="increment" inputmode="decimal" min="0" step="0.5" type="number" value="2.5"></label>
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
          return `<div class="set-row"><span>${escapeHtml(exercise && exercise.name)} - ${item.sets} series - ${item.minReps}/${item.maxReps} reps - ${item.weight} kg - repos ${restLabel(item.rest || (exercise && exercise.rest) || 0)}</span><div class="button-row tight-row"><button class="small-button" data-move-item="${template.id}:${item.id}:-1" type="button">↑</button><button class="small-button" data-move-item="${template.id}:${item.id}:1" type="button">↓</button><button class="small-button" data-edit-item="${template.id}:${item.id}" type="button">Modifier</button><button class="small-button danger" data-remove-item="${template.id}:${item.id}" type="button">Suppr.</button></div></div>`;
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
      <span>${escapeHtml(exercise && exercise.name)} - ${item.sets} series - ${item.minReps}/${item.maxReps} reps - ${item.weight} kg - repos ${restLabel(item.rest || (exercise && exercise.rest) || 0)}</span>
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
    const itemDate = item.movedFromDate || item.date;
    return `<article class="item-card set-row schedule-row"><span>${item.date} - ${escapeHtml(template && template.name)}${item.repeatWeekly ? " - chaque semaine" : ""}${item.movedFromDate ? ` - deplacee depuis ${escapeHtml(item.movedFromDate)}` : ""}</span><div class="schedule-actions">${scheduleStatusPill(item, item.date)}<button class="icon-mini" data-schedule-options="${item.id}:${itemDate}" type="button" aria-label="Options planning">...</button></div></article>`;
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
    return `<article class="day-card ${key === todayKey ? "today" : ""}"><span>${date.toLocaleDateString("fr-FR", { weekday: "short" })}</span><strong>${date.getDate()}</strong>${planned.map((item) => `<p class="calendar-session-line">${escapeHtml((templateById(item.templateId) && templateById(item.templateId).name) || "Seance")} ${scheduleStatusPill(item, key)} <button class="calendar-mini-options" data-schedule-options="${item.id}:${item.movedFromDate || key}" type="button" aria-label="Options planning">...</button></p>`).join("") || `<p>Repos</p>`}</article>`;
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
    return `<article class="planner-row"><div><span>${date.toLocaleDateString("fr-FR", { weekday: "long" })}</span><strong>${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</strong></div><div class="planner-sessions">${planned.map((item) => `<span>${escapeHtml((templateById(item.templateId) && templateById(item.templateId).name) || "Seance")} ${scheduleStatusPill(item, key)} <button class="calendar-mini-options" data-schedule-options="${item.id}:${item.movedFromDate || key}" type="button" aria-label="Options planning">...</button></span>`).join("")}</div></article>`;
  }).join("") || `<p class="empty">Aucune seance dans les 3 prochaines semaines.</p>`;
}

function renderTracking() {
  if (trackingMode === "coach") {
    $("#trackingPanel").innerHTML = `<section class="coach-panel">${coachPanelHtml()}</section>`;
    return;
  }

  if (trackingMode === "charts") {
    $("#trackingPanel").innerHTML = `
      <section class="stack">
        ${healthChartsHtml()}
      </section>
    `;
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
            <p>${profile.height || "-"} cm${profileAge ? ` - ${profileAge} ans` : ""}</p>
          </div>
        </div>
        <form class="input-grid compact-form" id="profileForm">
          <label>Nom<input id="profileName" value="${escapeHtml(profile.name || "")}" placeholder="Profil principal"></label>
          <label class="wide">Date de naissance
            <div class="birth-date-row">
              <input id="profileBirthDateText" inputmode="numeric" value="${escapeHtml(birthDateToDisplay(profile.birthDate))}" placeholder="jj/mm/aaaa">
              <input id="profileBirthDatePicker" type="date" value="${escapeHtml(profile.birthDate || "")}" aria-label="Choisir dans le calendrier">
            </div>
          </label>
          <label>Taille cm<input id="profileHeight" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(profile.height || "")}" placeholder="178"></label>
          <button class="primary-button align-end" type="submit">Sauver profil</button>
        </form>
      </article>

      <form class="input-grid compact-form" id="healthForm">
        <input id="healthEditId" type="hidden">
        <label>Date des mesures<input id="healthDate" type="date" value="${escapeHtml(lastHealth.date || todayKey)}"></label>
        <label>Poids kg<input id="healthWeight" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.weight || "")}" placeholder="82.5"></label>
        <label>Bodyfat %<input id="healthBodyfat" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.bodyfat || "")}" placeholder="15"></label>
        <label>Tour taille cm<input id="healthWaist" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.waist || "")}" placeholder="84"></label>
        <label>Poitrine cm<input id="healthChest" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.chest || "")}" placeholder="105"></label>
        <label>Carre epaules cm<input id="healthShoulders" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(lastHealth.shoulders || "")}" placeholder="118"></label>
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
          ${rms.map((item) => `<div><span>${escapeHtml(item.name)}</span><strong>${Math.round(item.rm)} kg</strong><p>${item.weight} kg x ${item.reps}</p></div>`).join("") || `<p class="empty">Aucune RM estimee pour l'instant.</p>`}
        </div>
      </article>
      <article class="item-card">
        <div class="item-head">
          <strong>Dernieres performances</strong>
          <span class="status-pill">${performances.length} exos</span>
        </div>
        <div class="performance-list">
          ${performances.map((item) => `<div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.date)} - ${item.weight} kg - ${escapeHtml(item.reps)} reps</span></div>`).join("") || `<p class="empty">Les performances apparaitront apres tes seances.</p>`}
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
            <p>${escapeHtml(log.date || "")} - ${Math.round(stats.tonnage)} kg - ${stats.calories} kcal</p>
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
      value: Math.round(stats.tonnage),
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

function healthMiniChart(field, label, unit = "cm") {
  const series = healthSeries(field);
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
        ${lineChartHtml(tonnage, `Deux ${group.name} minimum pour voir le tonnage.`, "kg")}
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
          ${lineChartHtml(item.series, "Deux performances minimum pour voir la RM.", "kg")}
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
  ].map(([field, label]) => healthMiniChart(field, label, "cm")).join("");
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
        ${healthMiniChart("weight", "Poids", "kg")}
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
  const weight = Number(String((weightInput && weightInput.value) || entry.weight || item.weight || 0).replace(",", "."));
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

function renderSettingsStatus() {
  const info = backupInfo();
  const asked = state.settings.storageProtectionAsked;
  const persistent = state.settings.storagePersistent;
  const protectedText = persistent ? "Stockage protege" : asked ? "Backup automatique active" : "Protection locale non activee";
  const backupText = info && info.savedAt ? `Derniere backup : ${new Date(info.savedAt).toLocaleString("fr-FR")}` : "Backup locale en attente de la prochaine modification.";
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
    button.textContent = persistent ? "Protege" : asked ? "Backup active" : "Activer";
    button.classList.toggle("is-confirmed", Boolean(asked));
    button.setAttribute("aria-pressed", asked ? "true" : "false");
  }
  if (title) {
    title.textContent = persistent ? "Protection locale active" : asked ? "Backup automatique active" : "Activer la protection locale";
  }
  if (text) {
    text.textContent = persistent
      ? "Le telephone a accepte le stockage persistant. AERSTRONG garde aussi une backup precedente en securite."
      : asked
        ? "Le navigateur n'a pas garanti le stockage persistant, mais AERSTRONG garde une backup locale avant chaque modification."
        : "Demande au telephone de conserver les donnees AERSTRONG et garde une backup precedente en cas d'erreur.";
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
    theme: $("#settingsTheme").value,
    mode: $("#settingsMode").value,
    weightUnit: "kg",
    lengthUnit: "cm",
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
  if (dialog && dialog.showModal) dialog.showModal();
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
  if (!nutritionEnabled) return;
  showView("nutrition");
  renderNutritionPanel();
  if (!state.nutritionIntroSeen) $("#nutritionIntroDialog").showModal();
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
  maybeAskBackupProtection();
}

$("#onboardingForm").addEventListener("submit", (event) => {
  event.preventDefault();
  completeOnboarding(true);
});

$("#onboardingForm").addEventListener("change", (event) => {
  if (event.target.closest("#onboardingGoal") || event.target.closest("#onboardingFrequency")) renderOnboardingPreview();
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
  templateById(form.dataset.addItem).items.push(planItem(data.get("exerciseId"), Number(data.get("sets")), Number(data.get("minReps")), Number(data.get("maxReps")), Number(data.get("weight")), Number(data.get("increment")), Math.max(10, rest)));
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
    $("#editPlanWeight").value = item.weight;
    $("#editPlanIncrement").value = item.increment;
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
  $("#editPlanWeight").value = item.weight;
  $("#editPlanIncrement").value = item.increment;
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
  item.weight = Number($("#editPlanWeight").value);
  item.increment = Number($("#editPlanIncrement").value);
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
    Number($("#addExerciseWeight").value),
    Number($("#addExerciseIncrement").value),
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
    profile.name = $("#profileName").value;
    profile.birthDate = displayToBirthDate($("#profileBirthDateText").value) || $("#profileBirthDatePicker").value;
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
    entry.weight = Number(row.querySelector("[data-edit-log-weight]").value || 0);
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

function logEditEntryRows(log) {
  return (log.entries || []).map((entry) => `
    <article class="item-card compact-form" data-edit-log-entry="${entry.id}">
      <strong>${escapeHtml(entry.performedExerciseName || "Exercice")}</strong>
      <label>Poids kg<input data-edit-log-weight inputmode="decimal" type="number" step="0.5" value="${escapeHtml(entry.weight || 0)}"></label>
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

function maybeOpenOnboarding() {
  if (!state.welcomeAccepted) {
    const welcome = $("#welcomeDialog");
    if (welcome && welcome.showModal) welcome.showModal();
    return;
  }
  if (state.onboardingComplete) return;
  const dialog = $("#onboardingDialog");
  if (!dialog || !dialog.showModal) return;
  renderOnboardingPreview();
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
