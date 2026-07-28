/* ===========================================================
   UI.JS — отрисовка тренировок, питания и банка упражнений
   Логика трекера — в tracker.js. Инициализация — в app.js.

   Ключевые функции:
   - renderTrainingAccordion() — расписание с аккордеоном
   - openExerciseSwap(dayId, exIndex) — модал выбора замены
   - renderMealsList(), renderFoodSources() — питание
   =========================================================== */

/* -----------------------------------------------------------
   СОСТОЯНИЕ ВЫБРАННЫХ УПРАЖНЕНИЙ
   Хранится в localStorage: ключ EXERCISE_SELECTIONS_KEY
   Структура: { "mon-0": "Back Squat", "mon-1": "Weighted Pull-Up", ... }
   ----------------------------------------------------------- */
const EXERCISE_SELECTIONS_KEY = "antizh2026_exercises_v1";

function loadExerciseSelections() {
  try {
    const raw = localStorage.getItem(EXERCISE_SELECTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveExerciseSelection(dayId, exIndex, exerciseName) {
  const selections = loadExerciseSelections();
  selections[`${dayId}-${exIndex}`] = exerciseName;
  localStorage.setItem(EXERCISE_SELECTIONS_KEY, JSON.stringify(selections));
}

function getSelectedExercise(dayId, exIndex, defaultName) {
  const selections = loadExerciseSelections();
  return selections[`${dayId}-${exIndex}`] || defaultName;
}

/* -----------------------------------------------------------
   РЕНДЕР АККОРДЕОНА ТРЕНИРОВОК
   ----------------------------------------------------------- */
function renderTrainingAccordion() {
  const container = document.getElementById("days-accordion");
  if (!container) return;

  container.innerHTML = TRAINING_DAYS.map((day) => {
    if (day.isRestDay) {
      return `
        <div class="rest-day-card">
          <i class="ti ti-bed"></i>
          <div class="rest-day-title">${day.day} — ${day.name}</div>
          <div class="rest-day-sub">${day.restNote}</div>
        </div>`;
    }

    const tagsHtml = day.tags
      .map(t => `<span class="tag tag--${t.type}">${t.label}</span>`)
      .join("");

    const exercisesHtml = day.exercises
      .map((ex, i) => renderExerciseRow(day.id, ex, i))
      .join("");

    return `
      <div class="day-card" data-day-id="${day.id}">
        <button class="day-header" aria-expanded="false">
          <div class="day-header-text">
            <div class="day-name">${day.day} — ${day.name}</div>
            <div class="day-focus">${day.focus}</div>
          </div>
          <i class="ti ti-chevron-down day-chevron"></i>
        </button>
        <div class="day-body">
          <div class="day-body-inner">
            <div class="day-tags">${tagsHtml}</div>
            ${exercisesHtml}
          </div>
        </div>
      </div>`;
  }).join("");

  // Обработчики аккордеона
  container.querySelectorAll(".day-header").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".day-card");
      const isOpen = card.classList.contains("open");
      container.querySelectorAll(".day-card").forEach(c => {
        c.classList.remove("open");
        c.querySelector(".day-header").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        card.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  // Обработчики кнопок замены
  container.querySelectorAll(".swap-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const dayId = btn.getAttribute("data-day");
      const exIndex = Number(btn.getAttribute("data-ex"));
      openExerciseSwap(dayId, exIndex);
    });
  });
}

/* -----------------------------------------------------------
   РЕНДЕР ОДНОГО УПРАЖНЕНИЯ
   ----------------------------------------------------------- */
function renderExerciseRow(dayId, ex, index) {
  const pattern = EXERCISE_BANK[ex.pattern];
  const stimMeta = STIMULUS_META[ex.stimulus];
  const selectedName = getSelectedExercise(dayId, index, ex.name);
  const bankExercises = pattern ? pattern[ex.stimulus] : [];
  const isCustom = selectedName !== ex.name;

  return `
    <div class="exercise-row" data-day="${dayId}" data-ex="${index}">
      <div class="ex-header">
        <div class="ex-name-wrap">
          <span class="ex-name">${selectedName}</span>
          ${isCustom ? `<span class="ex-custom-badge">замена</span>` : ""}
        </div>
        <button class="swap-btn" data-day="${dayId}" data-ex="${index}"
                title="Выбрать упражнение из банка"
                aria-label="Сменить упражнение">
          <i class="ti ti-switch-2"></i>
          <span>Swap</span>
        </button>
      </div>
      <div class="ex-meta-row">
        <span class="ex-detail">${ex.sets} × ${ex.reps}</span>
        <span class="stimulus-badge ${stimMeta.color}" title="${stimMeta.desc}">${stimMeta.label}</span>
        <span class="pattern-badge">${ex.pattern}</span>
      </div>
      <div class="ex-tip"><i class="ti ti-bulb"></i> ${ex.tip}</div>
    </div>`;
}

/* -----------------------------------------------------------
   МОДАЛЬНОЕ ОКНО ВЫБОРА УПРАЖНЕНИЯ ИЗ БАНКА
   ----------------------------------------------------------- */
function openExerciseSwap(dayId, exIndex) {
  const day = TRAINING_DAYS.find(d => d.id === dayId);
  if (!day) return;
  const ex = day.exercises[exIndex];
  const pattern = EXERCISE_BANK[ex.pattern];
  const stimMeta = STIMULUS_META[ex.stimulus];
  const bankExercises = pattern ? pattern[ex.stimulus] : [];
  const currentSelected = getSelectedExercise(dayId, exIndex, ex.name);

  // Удаляем предыдущий модал если есть
  const existing = document.getElementById("swap-modal");
  if (existing) existing.remove();

  const exercisesHtml = bankExercises.map((exName, i) => {
    const isActive = exName === currentSelected;
    const isDefault = exName === ex.name;
    return `
      <button class="bank-option ${isActive ? "bank-option--active" : ""}"
              data-name="${exName}" data-day="${dayId}" data-ex="${exIndex}">
        <span class="bank-option-name">${exName}</span>
        <span class="bank-option-badges">
          ${isDefault ? `<span class="bank-badge bank-badge--default">default</span>` : ""}
          ${isActive ? `<span class="bank-badge bank-badge--active"><i class="ti ti-check"></i></span>` : ""}
        </span>
      </button>`;
  }).join("");

  const modal = document.createElement("div");
  modal.id = "swap-modal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-panel">
      <div class="modal-header">
        <div class="modal-header-text">
          <div class="modal-title">Выбор упражнения</div>
          <div class="modal-sub">${pattern?.label || ex.pattern} · <span class="stimulus-badge ${stimMeta.color}">${stimMeta.label}</span></div>
        </div>
        <button class="modal-close" id="modal-close-btn" aria-label="Закрыть">
          <i class="ti ti-x"></i>
        </button>
      </div>
      <div class="modal-desc">${stimMeta.desc}</div>
      <div class="modal-options">${exercisesHtml}</div>
      <button class="modal-reset" id="modal-reset-btn">
        <i class="ti ti-refresh"></i> Сбросить на default
      </button>
    </div>`;

  document.body.appendChild(modal);

  // Закрытие по клику на оверлей
  modal.addEventListener("click", e => {
    if (e.target === modal) closeSwapModal();
  });

  document.getElementById("modal-close-btn").addEventListener("click", closeSwapModal);

  // Сброс на default
  document.getElementById("modal-reset-btn").addEventListener("click", () => {
    saveExerciseSelection(dayId, exIndex, ex.name);
    closeSwapModal();
    renderTrainingAccordion();
    reopenDay(dayId);
  });

  // Выбор упражнения
  modal.querySelectorAll(".bank-option").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-name");
      saveExerciseSelection(dayId, exIndex, name);
      closeSwapModal();
      renderTrainingAccordion();
      reopenDay(dayId);
    });
  });

  // Анимация появления
  requestAnimationFrame(() => modal.classList.add("modal-overlay--visible"));

  // Закрытие по Escape
  document.addEventListener("keydown", handleModalEscape);
}

function handleModalEscape(e) {
  if (e.key === "Escape") {
    closeSwapModal();
    document.removeEventListener("keydown", handleModalEscape);
  }
}

function closeSwapModal() {
  const modal = document.getElementById("swap-modal");
  if (!modal) return;
  modal.classList.remove("modal-overlay--visible");
  setTimeout(() => modal.remove(), 200);
  document.removeEventListener("keydown", handleModalEscape);
}

/** После ре-рендера аккордеона снова открываем нужный день */
function reopenDay(dayId) {
  const card = document.querySelector(`.day-card[data-day-id="${dayId}"]`);
  if (card) {
    card.classList.add("open");
    card.querySelector(".day-header")?.setAttribute("aria-expanded", "true");
  }
}

/* -----------------------------------------------------------
   РЕНДЕР ПРИЁМОВ ПИЩИ
   ----------------------------------------------------------- */
function renderMealsList() {
  const container = document.getElementById("meals-list");
  if (!container) return;

  container.innerHTML = MEAL_PLAN.map(meal => {
    const macrosHtml = meal.macros
      .map(m => `<span class="meal-macro-chip">${m}</span>`)
      .join("");
    return `
      <div class="meal-card">
        <div class="meal-time">${meal.time}</div>
        <div class="meal-name">${meal.name}</div>
        <div class="meal-desc">${meal.desc}</div>
        <div class="meal-macros">${macrosHtml}</div>
      </div>`;
  }).join("");
}

/* -----------------------------------------------------------
   РЕНДЕР ЛУЧШИХ ПРОДУКТОВ ПО КАТЕГОРИЯМ
   ----------------------------------------------------------- */
function renderFoodSources() {
  const container = document.getElementById("food-sources-list");
  if (!container) return;

  container.innerHTML = FOOD_SOURCES.map(cat => {
    const itemsHtml = cat.items.map(item => `<li>${item}</li>`).join("");
    return `
      <div class="food-cat-card">
        <div class="food-cat-header">
          <i class="ti ${cat.icon}"></i>
          <span>${cat.category}</span>
        </div>
        <ul class="food-cat-list">${itemsHtml}</ul>
      </div>`;
  }).join("");
}
