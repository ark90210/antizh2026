/* ===========================================================
   ДАННЫЕ ТРЕНИРОВОК v3 — Full Body 5×/week
   Расписание: Пн Squat Focus · Вт Horizontal Push Focus ·
               Ср Recovery/Stretch · Чт Hip Hinge Focus ·
               Пт Vertical Pull Focus · Сб отдых · Вс отдых

   БАНК УПРАЖНЕНИЙ (EXERCISE_BANK):
   Каждый паттерн движения имеет 5 категорий стимула:
   heavy, stable, stretch, shortened, pump
   Каждая категория содержит ровно 5 упражнений для замены.

   РАСПИСАНИЕ (TRAINING_DAYS):
   Каждое упражнение ссылается на паттерн + стимул из банка,
   UI автоматически подтягивает 5 альтернатив из нужной ячейки.
   =========================================================== */

/* -----------------------------------------------------------
   БАНК УПРАЖНЕНИЙ
   Ключ: паттерн движения (HP, VP, HR, VR, SQ, HH, LAT, RD, BI, TR, CALF, CORE)
   Значение: объект с ключами heavy/stable/stretch/shortened/pump
   ----------------------------------------------------------- */
const EXERCISE_BANK = {
  HP: {
    label: "Horizontal Push",
    heavy:    ["Bench Press", "Incline Barbell Bench Press", "Weighted Dips", "Smith Bench Press", "Floor Press"],
    stable:   ["Machine Chest Press", "Hammer Strength Chest Press", "Smith Bench Press", "Seated Chest Press", "Plate Loaded Chest Press"],
    stretch:  ["Dumbbell Bench Press", "Incline DB Press", "Deficit Push-Up", "Ring Push-Up", "Deep Weighted Push-Up"],
    shortened:["Pec Deck", "Machine Fly", "Cable Fly (Low→High)", "Single Arm Cable Fly", "Squeeze Press"],
    pump:     ["Cable Fly", "High Rep Pec Deck", "Banded Push-Up", "Push-Up Burnout", "Machine Fly (20+ reps)"]
  },
  VP: {
    label: "Vertical Push",
    heavy:    ["Standing OHP", "Push Press", "Seated Barbell Press", "Bradford Press", "Strict DB Shoulder Press"],
    stable:   ["Seated DB Press", "Machine Shoulder Press", "Smith Shoulder Press", "Plate Loaded Shoulder Press", "Arnold Press"],
    stretch:  ["High Incline DB Press", "High Incline Smith Press", "Landmine Press", "Single Arm Landmine Press", "High Incline Machine Press"],
    shortened:["Machine Shoulder Press (Pause)", "Cable Front Raise (Peak Hold)", "Plate Front Raise", "Single Arm Cable Press", "Front Raise Machine"],
    pump:     ["Cable Front Raise", "DB Front Raise", "Front Plate Raise", "Band Front Raise", "High Rep Machine Press"]
  },
  HR: {
    label: "Horizontal Pull",
    heavy:    ["Barbell Row", "Pendlay Row", "Meadows Row", "T-Bar Row", "Yates Row"],
    stable:   ["Chest Supported Row", "Seated Cable Row", "Machine Row", "Iso-Lateral Row", "Hammer Strength Row"],
    stretch:  ["Chest Supported DB Row", "Seal Row", "One Arm DB Row", "One Arm Cable Row", "Long Range Machine Row"],
    shortened:["Machine Row (Peak Hold)", "Cable Row (Pause)", "Chest Supported Row (Pause)", "Iso Hold Machine Row", "One Arm Cable Row (Peak)"],
    pump:     ["Straight Arm Rear Row", "Light Cable Row", "High Rep Machine Row", "Band Row", "Face Pull Row"]
  },
  VR: {
    label: "Vertical Pull",
    heavy:    ["Weighted Pull-Up", "Weighted Chin-Up", "Neutral Grip Weighted Pull-Up", "Sternum Pull-Up", "Rope Climb"],
    stable:   ["Lat Pulldown", "Neutral Grip Pulldown", "Assisted Pull-Up", "Machine Pulldown", "MAG Grip Pulldown"],
    stretch:  ["One Arm Lat Pulldown", "Kneeling Cable Pulldown", "Lat Prayer", "Stretch Lat Pulldown", "Incline Cable Pulldown"],
    shortened:["Straight Arm Pulldown", "Machine Pullover", "Nautilus Pullover", "Cable Pullover (Pause)", "Straight Arm Pulldown (Peak Hold)"],
    pump:     ["High Rep Pulldown", "Band Pulldown", "Rope Pulldown", "Machine Pullover Burnout", "Straight Arm Pulldown"]
  },
  SQ: {
    label: "Squat",
    heavy:    ["Back Squat", "Front Squat", "Safety Bar Squat", "High Bar Squat", "Zercher Squat"],
    stable:   ["Hack Squat", "Leg Press", "Belt Squat", "Pendulum Squat", "Smith Squat"],
    stretch:  ["Bulgarian Split Squat", "Cyclist Squat", "Heels Elevated Goblet Squat", "ATG Split Squat", "Walking Lunge"],
    shortened:["Leg Extension", "Single Leg Extension", "Sissy Squat Machine", "Spanish Squat", "Terminal Knee Extension"],
    pump:     ["Sissy Squat", "Bodyweight Sissy Squat", "High Rep Leg Extension", "Walking Lunges", "Reverse Sled Drag"]
  },
  HH: {
    label: "Hip Hinge",
    heavy:    ["Conventional Deadlift", "Romanian Deadlift", "Sumo Deadlift", "Snatch Grip Deadlift", "Deficit Deadlift"],
    stable:   ["Hip Thrust", "45° Back Extension", "Smith RDL", "Machine Hip Thrust", "Reverse Hyperextension"],
    stretch:  ["Romanian Deadlift", "Good Morning", "Stiff Leg Deadlift", "Single Leg RDL", "Deficit RDL"],
    shortened:["Hip Thrust (Pause)", "Glute Bridge (Pause)", "Cable Kickback (Peak Hold)", "Reverse Hyper (Pause)", "Frog Pump"],
    pump:     ["Cable Pull Through", "Frog Pump", "Band Good Morning", "Kettlebell Swing", "Glute Bridge Burnout"]
  },
  LAT: {
    label: "Lateral Delt",
    heavy:    ["Heavy Cable Lateral Raise", "Heavy Machine Lateral Raise", "Heavy DB Lateral Raise", "Upright Cable Raise", "Machine Partial Raise"],
    stable:   ["Machine Lateral Raise", "Cable Lateral Raise", "Lean Away Raise", "DB Lateral Raise", "Single Arm Machine Raise"],
    stretch:  ["Behind Body Cable Raise", "Incline Lateral Raise", "Cross Body Cable Raise", "Leaning DB Raise", "Cable Y Raise"],
    shortened:["Machine Raise (Pause)", "Cable Raise (Hold)", "Single Arm Cable Hold", "Machine Partials", "Iso Hold Raise"],
    pump:     ["DB Lateral Raise", "Myo-Rep Laterals", "Cable Burnout", "Partial Laterals", "Band Laterals"]
  },
  RD: {
    label: "Rear Delt",
    heavy:    ["Heavy Reverse Pec Deck", "Chest Supported Rear Delt Row", "Meadows Rear Delt Row", "Heavy Cable Reverse Fly", "Wide Grip Rear Row"],
    stable:   ["Reverse Pec Deck", "Cable Reverse Fly", "Chest Supported Rear Raise", "Machine Rear Delt Fly", "Rear Delt Row"],
    stretch:  ["Incline Reverse Fly", "Behind Body Cable Fly", "Cross Cable Reverse Fly", "Incline Cable Fly", "Long Range Rear Fly"],
    shortened:["Reverse Pec Deck (Pause)", "Cable Reverse Fly (Hold)", "Machine Hold Fly", "Iso Hold Reverse Fly", "Peak Rear Fly"],
    pump:     ["DB Reverse Fly", "Face Pull", "Band Pull Apart", "High Rep Reverse Pec Deck", "Rear Delt Swing"]
  },
  BI: {
    label: "Biceps",
    heavy:    ["EZ Bar Curl", "Barbell Curl", "Weighted Chin-Up", "Cheat Curl", "Drag Curl"],
    stable:   ["Machine Preacher Curl", "Cable Curl", "Machine Curl", "Standing Cable Curl", "EZ Preacher Curl"],
    stretch:  ["Incline DB Curl", "Bayesian Curl", "Behind Body Cable Curl", "Incline Cable Curl", "Drag Curl"],
    shortened:["Concentration Curl", "Spider Curl", "High Cable Curl", "Machine Curl (Peak Hold)", "Cable Curl (Peak Hold)"],
    pump:     ["DB Curl", "Rope Hammer Curl", "Cross Body Hammer Curl", "Band Curl", "High Rep Cable Curl"]
  },
  TR: {
    label: "Triceps",
    heavy:    ["Close Grip Bench Press", "Weighted Dips", "JM Press", "Close Grip Smith Press", "Floor Press Close Grip"],
    stable:   ["Cable Pushdown", "Machine Extension", "Smith Close Grip Press", "Assisted Dip Machine", "Dual Cable Pushdown"],
    stretch:  ["Overhead Cable Extension", "Overhead DB Extension", "PJR Pullover", "EZ Overhead Extension", "Single Arm Overhead Cable Extension"],
    shortened:["Pushdown (Pause)", "Reverse Grip Pushdown", "Machine Extension (Peak Hold)", "Cross Body Pushdown", "Single Arm Pushdown Hold"],
    pump:     ["Rope Pushdown", "Cable Kickback", "Band Pushdown", "Tate Press", "High Rep Rope Pushdown"]
  },
  CALF: {
    label: "Calves",
    heavy:    ["Standing Calf Raise", "Smith Calf Raise", "Donkey Calf Raise", "Standing Machine Raise", "Heavy Leg Press Calf Raise"],
    stable:   ["Seated Calf Raise", "Machine Calf Raise", "Leg Press Calf Raise", "Single Leg Machine Raise", "Smith Seated Raise"],
    stretch:  ["Deep Standing Raise", "Deep Seated Raise", "Donkey Stretch Raise", "Deficit Calf Raise", "Single Leg Deficit Raise"],
    shortened:["Standing Raise (Pause)", "Seated Raise (Pause)", "Smith Pause Raise", "Leg Press Pause Raise", "Iso Hold Raise"],
    pump:     ["Single Leg Raise", "Bodyweight Raise", "Jump Rope", "Tibialis Raise", "High Rep Calf Raise"]
  },
  CORE: {
    label: "Core",
    heavy:    ["Ab Wheel Rollout", "Weighted Plank", "Dragon Flag", "Hanging Windshield Wiper", "Barbell Rollout"],
    stable:   ["Cable Crunch", "Hanging Leg Raise", "GHD Sit-Up", "Decline Sit-Up", "Weighted Reverse Crunch"],
    stretch:  ["Copenhagen Plank", "Long Lever Plank", "Body Saw Plank", "Stability Ball Rollout", "TRX Fallout"],
    shortened:["Hollow Body Hold", "L-Sit Hold", "V-Sit Hold", "Reverse Crunch (Peak Hold)", "Hanging Knee Raise (Pause)"],
    pump:     ["Reverse Crunch", "Dead Bug", "Pallof Press", "Bird Dog", "Mountain Climber"]
  }
};

/* -----------------------------------------------------------
   МЕТАДАННЫЕ СТИМУЛОВ: цвет и описание каждого типа
   ----------------------------------------------------------- */
const STIMULUS_META = {
  heavy:     { label: "Heavy Compound", color: "stimulus--heavy",    desc: "Максимальная нагрузка, 5–8 повт., прогрессия веса" },
  stable:    { label: "Stable Compound", color: "stimulus--stable",   desc: "Стабильная нагрузка, 8–12 повт., контроль техники" },
  stretch:   { label: "Stretch Bias",    color: "stimulus--stretch",  desc: "Акцент на растяжение, 10–15 повт., полная амплитуда" },
  shortened: { label: "Shortened Bias",  color: "stimulus--shortened",desc: "Пиковое сокращение, 12–15 повт., пауза в точке напряжения" },
  pump:      { label: "Pump / Isolation",color: "stimulus--pump",     desc: "Кровенаполнение, 15–20+ повт., финишер" }
};

/* -----------------------------------------------------------
   РАСПИСАНИЕ ТРЕНИРОВОК
   Каждое упражнение:
     - name: рабочее название (из расписания)
     - pattern: паттерн из EXERCISE_BANK (для поиска замен)
     - stimulus: тип стимула (heavy/stable/stretch/shortened/pump)
     - sets / reps: объём
     - tip: тренерская подсказка
   ----------------------------------------------------------- */
const TRAINING_DAYS = [
  {
    id: "mon",
    day: "Понедельник",
    name: "Squat Focus",
    focus: "SQ · VR · HP · LAT · BI · TR · CORE",
    tags: [{ label: "Full Body", type: "legs" }, { label: "Squat Focus", type: "note" }],
    exercises: [
      { name: "Back Squat",         pattern: "SQ",   stimulus: "heavy",    sets: "3–4", reps: "5–8",   tip: "Основное движение дня — колено-доминантный паттерн с максимальной нагрузкой. Глубина — параллель и ниже, нейтральная спина." },
      { name: "Weighted Pull-Up",   pattern: "VR",   stimulus: "heavy",    sets: "2–3", reps: "6–8",   tip: "Тяжёлая вертикальная тяга — полный диапазон, пик в лопатках, без раскачки." },
      { name: "Machine Chest Press",pattern: "HP",   stimulus: "stable",   sets: "2",   reps: "8–12",  tip: "Стабильный горизонтальный жим — фиксированная траектория, акцент на грудные." },
      { name: "Lean Away Cable Raise",pattern:"LAT", stimulus: "stretch",  sets: "2–3", reps: "12–15", tip: "Отклонение от кабеля создаёт растяжение боковых дельт в нижней точке." },
      { name: "Incline DB Curl",    pattern: "BI",   stimulus: "stretch",  sets: "2",   reps: "10–15", tip: "Наклонная скамья растягивает длинную головку бицепса — максимальная амплитуда." },
      { name: "Rope Pushdown",      pattern: "TR",   stimulus: "pump",     sets: "1–2", reps: "12–15", tip: "Финишер для трицепса — насос, высокое повторение, контроль на эксцентрике." },
      { name: "Ab Wheel Rollout",   pattern: "CORE", stimulus: "heavy",    sets: "2",   reps: "8–12",  tip: "Тяжёлый кор-паттерн — нейтральная спина, не проваливай поясницу." }
    ]
  },
  {
    id: "tue",
    day: "Вторник",
    name: "Horizontal Push Focus",
    focus: "HP · HR · HH · RD · CALF · BI · CORE",
    tags: [{ label: "Full Body", type: "push" }, { label: "HP Focus", type: "note" }],
    exercises: [
      { name: "Bench Press",            pattern: "HP",   stimulus: "heavy",    sets: "3–4", reps: "5–8",   tip: "Ключевое движение — горизонтальный жим с максимальной нагрузкой. Лопатки сведены, дуга естественная." },
      { name: "Chest Supported Row",    pattern: "HR",   stimulus: "stable",   sets: "2–3", reps: "8–12",  tip: "Грудь на подпоре убирает читинг — чистая горизонтальная тяга спиной." },
      { name: "Hip Thrust",             pattern: "HH",   stimulus: "stable",   sets: "2",   reps: "8–10",  tip: "Стабильный тазо-доминантный паттерн — пиковое сокращение ягодиц, фиксация в верхней точке." },
      { name: "Reverse Pec Deck",       pattern: "RD",   stimulus: "shortened",sets: "2–3", reps: "12–15", tip: "Укороченный стимул для задних дельт — пауза в точке пикового напряжения." },
      { name: "Seated Calf Raise",      pattern: "CALF", stimulus: "stable",   sets: "2–3", reps: "10–15", tip: "Сидячий вариант — акцент на камбаловидную мышцу, полный диапазон." },
      { name: "Rope Hammer Curl",       pattern: "BI",   stimulus: "pump",     sets: "2",   reps: "10–15", tip: "Финишер для бицепса и брахиорадиалиса — нейтральный хват, контролируемый темп." },
      { name: "Pallof Press",           pattern: "CORE", stimulus: "stable",   sets: "2",   reps: "12–15", tip: "Антиротационный кор-паттерн — держи таз нейтральным, не позволяй корпусу скручиваться." }
    ]
  },
  {
    id: "wed",
    day: "Среда",
    name: "Recovery / Stretch",
    focus: "SQ · HP · VR · LAT · RD · TR · BI · CALF",
    tags: [{ label: "Full Body", type: "pull" }, { label: "Recovery", type: "core" }],
    exercises: [
      { name: "Bulgarian Split Squat",       pattern: "SQ",   stimulus: "stretch",  sets: "2",   reps: "10–12", tip: "Стретч для квадрицепса и ягодиц — широкий шаг, нога на скамье, колено к полу." },
      { name: "Incline DB Bench Press",      pattern: "HP",   stimulus: "stretch",  sets: "2",   reps: "8–12",  tip: "Растяжение грудных в нижней точке — не бросай вес, контролируй эксцентрик." },
      { name: "One Arm Lat Pulldown",        pattern: "VR",   stimulus: "stretch",  sets: "2",   reps: "10–12", tip: "Одна рука — максимальный диапазон и растяжение широчайшей в верхней точке." },
      { name: "Cable Lateral Raise",         pattern: "LAT",  stimulus: "pump",     sets: "3",   reps: "15–20", tip: "Насос для средних дельт — медленный эксцентрик, никакого читинга корпусом." },
      { name: "Face Pull",                   pattern: "RD",   stimulus: "pump",     sets: "3",   reps: "15–20", tip: "Насос для задних дельт и ротаторов — тяни к лицу, разворот ладоней вверх." },
      { name: "Overhead Cable Extension",    pattern: "TR",   stimulus: "stretch",  sets: "2",   reps: "10–15", tip: "Длинная головка трицепса под растяжением — полный диапазон над головой." },
      { name: "Machine Preacher Curl",       pattern: "BI",   stimulus: "shortened",sets: "2",   reps: "10–12", tip: "Укороченный стимул бицепса — пиковое сокращение в верхней точке, пауза." },
      { name: "Standing Calf Raise",         pattern: "CALF", stimulus: "pump",     sets: "2–3", reps: "15–20", tip: "Финишер икр — полный диапазон, задержка 2 сек внизу." }
    ]
  },
  {
    id: "thu",
    day: "Четверг",
    name: "Hip Hinge Focus",
    focus: "HH · VP · HR · HP · LAT · TR · CORE",
    tags: [{ label: "Full Body", type: "legs" }, { label: "HH Focus", type: "note" }],
    exercises: [
      { name: "Romanian Deadlift",      pattern: "HH",   stimulus: "heavy",    sets: "3–4", reps: "6–8",   tip: "Основное движение дня — тазо-доминантный паттерн с максимальной нагрузкой. Нейтральная спина, шарнир в бедре." },
      { name: "Standing Overhead Press",pattern: "VP",   stimulus: "heavy",    sets: "2–3", reps: "6–8",   tip: "Тяжёлый вертикальный жим стоя — без читинга ногами, стоячая OHP сложнее для ЦНС." },
      { name: "Seated Cable Row",       pattern: "HR",   stimulus: "stable",   sets: "2–3", reps: "8–12",  tip: "Стабильная горизонтальная тяга — лопатки к позвоночнику в конце движения." },
      { name: "Pec Deck",               pattern: "HP",   stimulus: "shortened",sets: "2",   reps: "12–15", tip: "Укороченный стимул для грудных — пиковое сокращение, не бросай в нижней точке." },
      { name: "Machine Lateral Raise",  pattern: "LAT",  stimulus: "stable",   sets: "3",   reps: "12–15", tip: "Стабильный паттерн для средних дельт — контролируемое движение без инерции." },
      { name: "Cable Pushdown",         pattern: "TR",   stimulus: "stable",   sets: "2",   reps: "10–12", tip: "Стабильный стимул трицепса — локти прижаты к корпусу, полное разгибание." },
      { name: "Cable Crunch",           pattern: "CORE", stimulus: "stable",   sets: "2",   reps: "10–15", tip: "Стабильный кор — округляй поясницу, тяни грудную клетку к тазу, не шею." }
    ]
  },
  {
    id: "fri",
    day: "Пятница",
    name: "Vertical Pull Focus",
    focus: "VR · VP · SQ · HP · RD · BI · CALF",
    tags: [{ label: "Full Body", type: "pull" }, { label: "VR Focus", type: "note" }],
    exercises: [
      { name: "Weighted Pull-Up",         pattern: "VR",   stimulus: "heavy",    sets: "3–4", reps: "5–8",   tip: "Основное движение дня — тяжёлая вертикальная тяга. Второй раз за неделю, акцент на нижние широчайшие." },
      { name: "Standing Overhead Press",  pattern: "VP",   stimulus: "heavy",    sets: "2–3", reps: "6–8",   tip: "Тяжёлый вертикальный жим — второй раз за неделю для плечевого пояса." },
      { name: "Leg Press",                pattern: "SQ",   stimulus: "stable",   sets: "2–3", reps: "10–12", tip: "Стабильный квадрицепс — широкая постановка, полный диапазон без отрыва таза." },
      { name: "Cable Fly",                pattern: "HP",   stimulus: "shortened",sets: "2",   reps: "12–15", tip: "Укороченный стимул для грудных — руки сходятся по центру, пиковое сокращение." },
      { name: "Incline Rear Delt Fly",    pattern: "RD",   stimulus: "stretch",  sets: "3",   reps: "12–15", tip: "Наклон скамьи создаёт растяжение задних дельт — медленный эксцентрик." },
      { name: "Spider Curl",              pattern: "BI",   stimulus: "shortened",sets: "2–3", reps: "10–12", tip: "Пиковое сокращение бицепса — грудь на наклонной скамье, пауза в верхней точке." },
      { name: "Standing Calf Raise",      pattern: "CALF", stimulus: "stretch",  sets: "2–3", reps: "10–15", tip: "Стретч-вариант для икр — максимальный диапазон, задержка в нижней точке." }
    ]
  },
  {
    id: "sat",
    day: "Суббота",
    name: "Отдых",
    focus: "Восстановление",
    isRestDay: true,
    restNote: "Активное восстановление · мобилити 10–15 мин · ходьба"
  },
  {
    id: "sun",
    day: "Воскресенье",
    name: "Отдых",
    focus: "Восстановление ЦНС",
    isRestDay: true,
    restNote: "Полный отдых · сон 8+ часов · лёгкая растяжка"
  }
];

/* -----------------------------------------------------------
   ОБЪЁМ НА ГРУППУ МЫШЦ (для раздела Обзор)
   ----------------------------------------------------------- */
const VOLUME_PER_MUSCLE = [
  { muscle: "Quads / Glutes",      sets: "10–14", days: "Пн + Ср + Пт" },
  { muscle: "Hamstrings / Glutes", sets: "6–8",   days: "Вт + Чт" },
  { muscle: "Chest (HP)",          sets: "9–13",  days: "Пн + Вт + Чт + Пт" },
  { muscle: "Back (HR + VR)",      sets: "13–17", days: "Пн + Вт + Ср + Чт + Пт" },
  { muscle: "Side Delts (LAT)",    sets: "7–9",   days: "Пн + Ср + Чт" },
  { muscle: "Rear Delts (RD)",     sets: "7–9",   days: "Вт + Ср + Пт" },
  { muscle: "Shoulders (VP)",      sets: "4–6",   days: "Чт + Пт" },
  { muscle: "Biceps (BI)",         sets: "6–8",   days: "Пн + Вт + Ср + Пт" },
  { muscle: "Triceps (TR)",        sets: "5–7",   days: "Пн + Ср + Чт" },
  { muscle: "Calves (CALF)",       sets: "6–9",   days: "Вт + Ср + Пт" },
  { muscle: "Core",                sets: "6–8",   days: "Пн + Вт + Чт" }
];
