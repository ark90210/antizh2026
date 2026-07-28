/* ===========================================================
   TRACKER.JS — еженедельный трекер прогресса
   Хранение: localStorage (ключ ANTIZH_STORAGE_KEY).
   Это значит данные сохраняются ТОЛЬКО в этом браузере на
   этом устройстве. Если открыть сайт в другом браузере —
   данных не будет. Кнопка "CSV" позволяет сделать бэкап.

   Формулы:
   - Сожжено шагами   = (шаги / 1000) × 60 ккал
   - Сожжено тренировками = тренировок × 250 ккал
   - Сожжено всего (доп. к BMR) = шаги_ккал + тренировки_ккал
   - Дельта веса = вес_текущей_недели − вес_предыдущей_недели
   - BMR пересчитывается от ПОСЛЕДНЕГО известного веса
     (формула Mifflin-St Jeor для мужчин), поэтому TDEE и
     целевой калораж в разделе "Обзор" обновляются по мере
     похудения — это и есть смысл доработки от пользователя.
   - Прогресс (по весу и по калориям) может уходить в минус
     (>100%) или быть отрицательным, если пользователь
     набрал вес — это намеренно, как дополнительный мотиватор/
     индикатор отклонения от плана.
   =========================================================== */

const ANTIZH_STORAGE_KEY = "antizh2026_progress_v1";

/* --- Константы операции (можно скорректировать) --- */
const START_WEIGHT = 95;   // кг, стартовый вес
const GOAL_WEIGHT = 80;    // кг, целевой вес
const GOAL_LOSS_KG = START_WEIGHT - GOAL_WEIGHT; // 15 кг

/* --- Константы формулы BMR (Mifflin-St Jeor, мужчины) --- */
const HEIGHT_CM = 180;
const AGE_YEARS = 27;

/* --- Константы расчёта расхода калорий --- */
const KCAL_PER_1000_STEPS = 60;  // ккал на 1000 шагов
const KCAL_PER_WORKOUT = 250;    // ккал за одну тренировку
const STEPS_PER_DAY_PLAN = 15000; // плановые шаги/день для расчёта в "Обзоре"
const WORKOUTS_PER_WEEK_PLAN = 6; // плановое количество тренировок/нед

/* --- Целевая суммарная "энергетическая дистанция" операции ---
   Считаем сколько ккал дефицита нужно набрать суммарно, чтобы
   потерять GOAL_LOSS_KG жира. 1 кг жировой массы ≈ 7700 ккал. */
const KCAL_PER_KG_FAT = 7700;
const GOAL_TOTAL_DEFICIT_KCAL = GOAL_LOSS_KG * KCAL_PER_KG_FAT; // 115 500 ккал

let weightChartInstance = null;

/* ===========================================================
   ХРАНИЛИЩЕ (localStorage)
   =========================================================== */

/**
 * Считывает все записи недель из localStorage.
 * @returns {Array<Object>} массив записей, отсортированный по номеру недели
 */
function loadEntries() {
  try {
    const raw = localStorage.getItem(ANTIZH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => a.week - b.week);
  } catch (err) {
    console.error("Не удалось прочитать данные трекера:", err);
    return [];
  }
}

/**
 * Сохраняет массив записей в localStorage.
 * @param {Array<Object>} entries
 */
function saveEntries(entries) {
  try {
    localStorage.setItem(ANTIZH_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("Не удалось сохранить данные трекера:", err);
    alert("Ошибка сохранения данных. Проверьте, что localStorage доступен (не режим инкогнито).");
  }
}

/**
 * Добавляет новую запись недели или обновляет существующую
 * (если запись с таким номером недели уже есть — перезаписывает).
 * @param {Object} entry { week, weight, kcalEaten, workouts, steps }
 */
function upsertEntry(entry) {
  const entries = loadEntries();
  const existingIndex = entries.findIndex((e) => e.week === entry.week);

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  entries.sort((a, b) => a.week - b.week);
  saveEntries(entries);
  return entries;
}

/**
 * Удаляет запись по номеру недели.
 * @param {number} week
 */
function deleteEntry(week) {
  const entries = loadEntries().filter((e) => e.week !== week);
  saveEntries(entries);
  return entries;
}

/* ===========================================================
   BMR / TDEE — ДИНАМИЧЕСКИЙ РАСЧЁТ ОТ ТЕКУЩЕГО ВЕСА
   =========================================================== */

/**
 * Считает BMR по формуле Mifflin-St Jeor для мужчин:
 * BMR = 10×вес(кг) + 6.25×рост(см) − 5×возраст + 5
 * @param {number} weightKg
 * @returns {number} BMR в ккал, округлённый
 */
function calcBMR(weightKg) {
  const bmr = 10 * weightKg + 6.25 * HEIGHT_CM - 5 * AGE_YEARS + 5;
  return Math.round(bmr);
}

/**
 * Возвращает последний известный вес из записей трекера,
 * либо START_WEIGHT, если записей ещё нет.
 * @param {Array<Object>} entries
 * @returns {number}
 */
function getLatestWeight(entries) {
  if (entries.length === 0) return START_WEIGHT;
  return entries[entries.length - 1].weight;
}

/**
 * Считает полный набор показателей TDEE/калоража на основе
 * текущего веса. Используется для динамического обновления
 * раздела "Обзор".
 * @param {number} currentWeight
 * @returns {Object} все промежуточные и итоговые цифры
 */
function calcTdeeMetrics(currentWeight) {
  const bmr = calcBMR(currentWeight);
  const stepsKcal = Math.round((STEPS_PER_DAY_PLAN / 1000) * KCAL_PER_1000_STEPS);
  const workoutKcalAvgPerDay = Math.round((WORKOUTS_PER_WEEK_PLAN * KCAL_PER_WORKOUT) / 7);

  const tdeeTrainDay = bmr + stepsKcal + KCAL_PER_WORKOUT; // день с тренировкой
  const tdeeRestDay = bmr + stepsKcal; // день без тренировки
  const tdeeAvg = Math.round(bmr + stepsKcal + workoutKcalAvgPerDay);

  // Целевой калораж: держим дефицит ~750-800 ккал от среднего TDEE,
  // но не даём уйти ниже безопасного минимума 1900 ккал
  const targetKcalRaw = tdeeAvg - 800;
  const targetKcal = Math.max(1900, Math.round(targetKcalRaw / 10) * 10);
  const actualDeficit = tdeeAvg - targetKcal;

  return {
    bmr,
    stepsKcal,
    tdeeTrainDay,
    tdeeRestDay,
    tdeeAvg,
    targetKcal,
    actualDeficit
  };
}

/**
 * Считает срок достижения цели в неделях на основе текущего
 * фактического дефицита (или планового, если записей нет).
 * @param {number} actualDeficitPerDay
 * @param {number} remainingKg — сколько кг ещё осталось сбросить
 * @returns {Object} { weeklyDeficit, weeklyLossKg, etaWeeks, etaWeeksWithPlateau }
 */
function calcEtaMetrics(actualDeficitPerDay, remainingKg) {
  const weeklyDeficit = actualDeficitPerDay * 7;
  const weeklyLossKg = weeklyDeficit / KCAL_PER_KG_FAT;
  const etaWeeks = weeklyLossKg > 0 ? remainingKg / weeklyLossKg : Infinity;
  const etaWeeksWithPlateau = etaWeeks * 1.15; // +15% запас на плато

  return {
    weeklyDeficit: Math.round(weeklyDeficit),
    weeklyLossKg: Math.round(weeklyLossKg * 100) / 100,
    etaWeeks: Math.round(etaWeeks),
    etaWeeksWithPlateau: Math.round(etaWeeksWithPlateau)
  };
}

/* ===========================================================
   РАСЧЁТЫ ПО ЗАПИСЯМ ТРЕКЕРА
   =========================================================== */

/**
 * Считает калории, сожжённые активностью за неделю
 * (шаги + тренировки), сверх базового метаболизма.
 * @param {Object} entry
 * @returns {number} ккал
 */
function calcBurnedKcal(entry) {
  const stepsKcal = (entry.steps / 1000) * KCAL_PER_1000_STEPS;
  const workoutsKcal = entry.workouts * KCAL_PER_WORKOUT;
  return Math.round(stepsKcal + workoutsKcal);
}

/**
 * Считает разницу в весе по сравнению с предыдущей записью.
 * @param {Array<Object>} entries — отсортированный массив (по неделе)
 * @param {number} currentWeek
 * @returns {number|null} дельта в кг, либо null если нет предыдущей записи
 */
function calcWeightDelta(entries, currentWeek) {
  const idx = entries.findIndex((e) => e.week === currentWeek);
  if (idx <= 0) return null;
  const prevWeight = entries[idx - 1].weight;
  const currentWeight = entries[idx].weight;
  return Math.round((currentWeight - prevWeight) * 100) / 100;
}

/**
 * Считает общий прогресс операции по весу (% от 15 кг сброшено).
 * Намеренно НЕ ограничивает процент диапазоном [0, 100] — если
 * человек набрал вес, pct уйдёт в минус, что должно служить
 * дополнительным сигналом/мотиватором, а не быть скрыто.
 * @param {Array<Object>} entries
 * @returns {Object} { lostKg, leftKg, pct, currentWeight }
 */
function calcOverallProgress(entries) {
  if (entries.length === 0) {
    return { lostKg: 0, leftKg: GOAL_LOSS_KG, pct: 0, currentWeight: null };
  }

  const latest = entries[entries.length - 1];
  const lostKg = Math.round((START_WEIGHT - latest.weight) * 100) / 100;
  const leftKg = Math.round((latest.weight - GOAL_WEIGHT) * 100) / 100;
  const pct = Math.round((lostKg / GOAL_LOSS_KG) * 100);

  return { lostKg, leftKg, pct, currentWeight: latest.weight };
}

/**
 * Считает суммарный дефицит калорий за все недели
 * (расход минус съедено). Расход = BMR(текущий вес недели) × 7
 * + сожжено активностью (шаги + тренировки) за неделю.
 * BMR пересчитывается ПОЗАПИСИ — то есть для недели 25 берётся
 * BMR от веса недели 25, для недели 26 — от веса недели 26 и т.д.
 * Это даёт более точную картину, чем фиксированный BMR.
 * @param {Array<Object>} entries
 * @returns {number} суммарный дефицит в ккал (может быть отрицательным,
 *                    если человек переедал относительно расхода)
 */
function calcTotalDeficit(entries) {
  let totalDeficit = 0;

  entries.forEach((entry) => {
    const bmr = calcBMR(entry.weight);
    const totalExpenditure = bmr * 7 + calcBurnedKcal(entry);
    const deficit = totalExpenditure - entry.kcalEaten;
    totalDeficit += deficit;
  });

  return Math.round(totalDeficit);
}

/**
 * Считает прогресс по энергетическому дефициту относительно
 * общей цели (GOAL_TOTAL_DEFICIT_KCAL = 15 кг × 7700 ккал).
 * Тоже может уйти в минус, если суммарный дефицит отрицательный.
 * @param {Array<Object>} entries
 * @returns {Object} { totalDeficit, pct, remainingKcal }
 */
function calcKcalProgress(entries) {
  const totalDeficit = calcTotalDeficit(entries);
  const pct = Math.round((totalDeficit / GOAL_TOTAL_DEFICIT_KCAL) * 100);
  const remainingKcal = GOAL_TOTAL_DEFICIT_KCAL - totalDeficit;

  return { totalDeficit, pct, remainingKcal };
}

/* ===========================================================
   РЕНДЕРИНГ
   =========================================================== */

/**
 * Обновляет все виджеты трекера (карточки, прогресс-бары, таблицу,
 * график) и синхронизирует динамические показатели TDEE/срока
 * в разделе "Обзор".
 */
function renderTracker() {
  const entries = loadEntries();

  renderSummaryCards(entries);
  renderProgressBar(entries);
  renderKcalProgressBar(entries);
  renderWeeksTable(entries);
  renderWeightChart(entries);
  renderOverviewProgressCard(entries);
  renderOverviewKcalProgressCard(entries);
  renderOverviewTdeeAndEta(entries);
}

/**
 * Обновляет карточки сводки (сброшено / осталось / недель / дефицит).
 * Значения могут быть отрицательными — это нормально и осознанно.
 */
function renderSummaryCards(entries) {
  const progress = calcOverallProgress(entries);
  const kcalProgress = calcKcalProgress(entries);

  const lostEl = document.getElementById("ts-lost");
  const leftEl = document.getElementById("ts-left");

  lostEl.textContent = entries.length > 0 ? `${formatSigned(progress.lostKg)} кг` : "— кг";
  lostEl.classList.toggle("value-negative", progress.lostKg < 0);

  leftEl.textContent = `${progress.leftKg} кг`;
  leftEl.classList.toggle("value-negative", progress.leftKg > GOAL_LOSS_KG);

  document.getElementById("ts-weeks").textContent =
    entries.length > 0 ? entries.length : "—";

  const deficitEl = document.getElementById("ts-deficit");
  deficitEl.textContent =
    entries.length > 0 ? `${formatSigned(kcalProgress.totalDeficit)} ккал` : "— ккал";
  deficitEl.classList.toggle("value-negative", kcalProgress.totalDeficit < 0);
}

/**
 * Обновляет большой прогресс-бар по весу на табе "Прогресс".
 * Полоса заполнения визуально ограничена [0, 100]%, но цифра
 * рядом показывает реальный (в т.ч. отрицательный или >100%) процент.
 */
function renderProgressBar(entries) {
  const progress = calcOverallProgress(entries);
  const clampedWidth = Math.max(0, Math.min(100, progress.pct));

  const pctLabel = document.getElementById("big-pct-label");
  pctLabel.textContent = `${formatSigned(progress.pct)}%`;
  pctLabel.classList.toggle("value-negative", progress.pct < 0);

  const fillEl = document.getElementById("big-progress-fill");
  fillEl.style.width = `${clampedWidth}%`;
  fillEl.classList.toggle("bar-negative", progress.pct < 0);

  document.getElementById("big-start-weight").textContent = `Старт: ${START_WEIGHT} кг`;
  document.getElementById("big-current-weight").textContent =
    progress.currentWeight !== null ? `Сейчас: ${progress.currentWeight} кг` : "Сейчас: — кг";
}

/**
 * Обновляет большой прогресс-бар по сожжённым калориям (дефициту)
 * на табе "Прогресс".
 */
function renderKcalProgressBar(entries) {
  const kcalProgress = calcKcalProgress(entries);
  const clampedWidth = Math.max(0, Math.min(100, kcalProgress.pct));

  const pctLabel = document.getElementById("big-kcal-pct-label");
  pctLabel.textContent = `${formatSigned(kcalProgress.pct)}%`;
  pctLabel.classList.toggle("value-negative", kcalProgress.pct < 0);

  const fillEl = document.getElementById("big-kcal-progress-fill");
  fillEl.style.width = `${clampedWidth}%`;
  fillEl.classList.toggle("bar-negative", kcalProgress.pct < 0);

  document.getElementById("big-kcal-done").textContent =
    `Накоплено: ${formatSigned(kcalProgress.totalDeficit)} ккал`;
  document.getElementById("big-kcal-left").textContent =
    `Цель: ${GOAL_TOTAL_DEFICIT_KCAL.toLocaleString("ru-RU")} ккал`;
}

/**
 * Обновляет компактную карточку прогресса по весу на табе "Обзор".
 */
function renderOverviewProgressCard(entries) {
  const progress = calcOverallProgress(entries);
  const clampedWidth = Math.max(0, Math.min(100, progress.pct));

  const pctEl = document.getElementById("op-pct");
  if (!pctEl) return;

  pctEl.textContent = `${formatSigned(progress.pct)}%`;
  pctEl.classList.toggle("value-negative", progress.pct < 0);

  const barEl = document.getElementById("op-bar");
  barEl.style.width = `${clampedWidth}%`;
  barEl.classList.toggle("bar-negative", progress.pct < 0);

  document.getElementById("op-lost").textContent =
    entries.length > 0 ? `Сброшено: ${formatSigned(progress.lostKg)} кг` : "Сброшено: — кг";
  document.getElementById("op-left").textContent = `Осталось: ${progress.leftKg} кг`;
}

/**
 * Обновляет компактную карточку прогресса по калориям на табе "Обзор".
 */
function renderOverviewKcalProgressCard(entries) {
  const kcalProgress = calcKcalProgress(entries);
  const clampedWidth = Math.max(0, Math.min(100, kcalProgress.pct));

  const pctEl = document.getElementById("op-kcal-pct");
  if (!pctEl) return;

  pctEl.textContent = `${formatSigned(kcalProgress.pct)}%`;
  pctEl.classList.toggle("value-negative", kcalProgress.pct < 0);

  const barEl = document.getElementById("op-kcal-bar");
  barEl.style.width = `${clampedWidth}%`;
  barEl.classList.toggle("bar-negative", kcalProgress.pct < 0);

  document.getElementById("op-kcal-done").textContent =
    `Накоплено: ${formatSigned(kcalProgress.totalDeficit)} ккал`;
  document.getElementById("op-kcal-left").textContent =
    `Цель: ${GOAL_TOTAL_DEFICIT_KCAL.toLocaleString("ru-RU")} ккал`;
}

/**
 * Обновляет блок TDEE и блок "Срок операции" на табе "Обзор" —
 * пересчитывает их от ТЕКУЩЕГО (последнего записанного) веса.
 * Также обновляет карточки метрик (цель, калории/день, дефицит,
 * темп, срок) и заголовочную плашку с подписью цели.
 */
function renderOverviewTdeeAndEta(entries) {
  const currentWeight = getLatestWeight(entries);
  const tdee = calcTdeeMetrics(currentWeight);
  const progress = calcOverallProgress(entries);
  const remainingKg = entries.length > 0 ? Math.max(progress.leftKg, 0.1) : GOAL_LOSS_KG;
  const eta = calcEtaMetrics(tdee.actualDeficit, remainingKg);

  // --- Карточки метрик ---
  setText("m-goal", `−${GOAL_LOSS_KG} <span class="metric-unit">кг</span>`, true);
  setText("m-kcal", `${tdee.targetKcal} <span class="metric-unit">ккал</span>`, true);
  setText("m-deficit", `~${tdee.actualDeficit} <span class="metric-unit">ккал/д</span>`, true);
  setText("m-pace", `~${eta.weeklyLossKg} <span class="metric-unit">кг/нед</span>`, true);
  setText("m-eta", `~${eta.etaWeeks} <span class="metric-unit">нед</span>`, true);

  // --- Таблица TDEE ---
  setText("t-weight", `${currentWeight} кг`);
  setText("t-bmr", `${tdee.bmr} ккал`);
  setText("t-steps", `+${tdee.stepsKcal} ккал`);
  setText("t-tdee-train", `≈${tdee.tdeeTrainDay} ккал`);
  setText("t-tdee-rest", `≈${tdee.tdeeRestDay} ккал`);
  setText("t-tdee-avg", `≈${tdee.tdeeAvg} ккал`);
  setText("t-target-kcal", `${tdee.targetKcal} ккал`);
  setText("t-actual-deficit", `≈${tdee.actualDeficit} ккал/д`);

  setText(
    "deficit-warning-text",
    `Дефицит ~${tdee.actualDeficit} ккал — верхняя граница безопасного. Белок 190 г и прогрессивная перегрузка обязательны. При упадке сил — поднять калораж на 100–150 ккал.`
  );

  // --- Таблица "Срок операции" ---
  setText("e-goal", `${remainingKg.toFixed(1)} кг жира`);
  setText("e-weekly-deficit", `≈${eta.weeklyDeficit.toLocaleString("ru-RU")} ккал`);
  setText("e-weekly-loss", `≈${eta.weeklyLossKg} кг`);
  setText("e-eta", `${eta.etaWeeks} недель`);
  setText("e-eta-plateau", `${eta.etaWeeksWithPlateau} недель`);
}

/**
 * Утилита: устанавливает textContent или innerHTML элемента по id,
 * если элемент существует на странице.
 * @param {string} id
 * @param {string} value
 * @param {boolean} [asHtml=false]
 */
function setText(id, value, asHtml = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (asHtml) {
    el.innerHTML = value;
  } else {
    el.textContent = value;
  }
}

/**
 * Форматирует число со знаком "+" для положительных значений
 * (отрицательные и так получат "−" от toLocaleString/обычного minus).
 * @param {number} value
 * @returns {string}
 */
function formatSigned(value) {
  const formatted = Math.abs(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

/**
 * Перерисовывает таблицу недель.
 */
function renderWeeksTable(entries) {
  const tbody = document.getElementById("weeks-tbody");

  if (entries.length === 0) {
    tbody.innerHTML = `<tr class="empty-row" id="weeks-empty"><td colspan="8">Записей пока нет — добавьте первую неделю выше</td></tr>`;
    return;
  }

  tbody.innerHTML = entries
    .map((entry) => {
      const burned = calcBurnedKcal(entry);
      const delta = calcWeightDelta(entries, entry.week);
      let deltaHtml = "—";

      if (delta !== null) {
        const cls = delta <= 0 ? "delta-pos" : "delta-neg";
        const sign = delta > 0 ? "+" : "";
        deltaHtml = `<span class="${cls}">${sign}${delta} кг</span>`;
      }

      return `
        <tr>
          <td>${entry.week}</td>
          <td>${entry.weight}</td>
          <td>${entry.kcalEaten.toLocaleString("ru-RU")}</td>
          <td>${entry.workouts}</td>
          <td>${entry.steps.toLocaleString("ru-RU")}</td>
          <td>${burned.toLocaleString("ru-RU")}</td>
          <td>${deltaHtml}</td>
          <td><button class="row-delete-btn" data-delete-week="${entry.week}" title="Удалить запись"><i class="ti ti-trash"></i></button></td>
        </tr>
      `;
    })
    .join("");

  // Обработчики удаления строк
  tbody.querySelectorAll("[data-delete-week]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const week = Number(btn.getAttribute("data-delete-week"));
      if (confirm(`Удалить запись недели ${week}?`)) {
        deleteEntry(week);
        renderTracker();
      }
    });
  });
}

/**
 * Перерисовывает график веса (Chart.js).
 * Если библиотека Chart.js не загрузилась (например, нет интернета
 * или блокировка CDN), показывает сообщение вместо графика —
 * сами данные при этом не теряются.
 */
function renderWeightChart(entries) {
  const canvas = document.getElementById("weightChart");
  const emptyState = document.getElementById("chart-empty");

  if (typeof Chart === "undefined") {
    canvas.style.display = "none";
    emptyState.style.display = "flex";
    emptyState.innerHTML = `
      <i class="ti ti-wifi-off" style="font-size:32px;color:var(--c-border)"></i>
      <p>График временно недоступен (не загрузилась библиотека Chart.js).<br>Проверьте подключение к интернету — данные не потеряны, они в таблице ниже.</p>
    `;
    return;
  }

  if (entries.length === 0) {
    emptyState.style.display = "flex";
    emptyState.innerHTML = `
      <i class="ti ti-chart-line" style="font-size:32px;color:var(--c-border)"></i>
      <p>Добавьте первые записи чтобы увидеть график</p>
    `;
    canvas.style.display = "none";
    if (weightChartInstance) {
      weightChartInstance.destroy();
      weightChartInstance = null;
    }
    return;
  }

  emptyState.style.display = "none";
  canvas.style.display = "block";

  const labels = entries.map((e) => `Нед ${e.week}`);
  const weights = entries.map((e) => e.weight);

  if (weightChartInstance) {
    weightChartInstance.data.labels = labels;
    weightChartInstance.data.datasets[0].data = weights;
    weightChartInstance.data.datasets[1].data = entries.map(() => GOAL_WEIGHT);
    weightChartInstance.update();
    return;
  }

  const ctx = canvas.getContext("2d");
  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Вес, кг",
          data: weights,
          borderColor: "#D4A12A",
          backgroundColor: "rgba(212,161,42,0.08)",
          borderWidth: 2,
          pointBackgroundColor: "#D4A12A",
          pointBorderColor: "#141712",
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: true
        },
        {
          label: "Цель",
          data: entries.map(() => GOAL_WEIGHT),
          borderColor: "#7BA428",
          borderWidth: 1.5,
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { color: "#9CA28C", font: { family: "Inter", size: 11 } }
        },
        tooltip: {
          backgroundColor: "#1c2018",
          borderColor: "#2e3526",
          borderWidth: 1,
          titleColor: "#ECE9DD",
          bodyColor: "#ECE9DD"
        }
      },
      scales: {
        x: {
          ticks: { color: "#6B7160", font: { family: "JetBrains Mono", size: 10 } },
          grid: { color: "#242a1d" }
        },
        y: {
          ticks: { color: "#6B7160", font: { family: "JetBrains Mono", size: 10 } },
          grid: { color: "#242a1d" }
        }
      }
    }
  });
}

/* ===========================================================
   ОБРАБОТКА ФОРМЫ ВВОДА
   =========================================================== */

/**
 * Считывает значения формы, валидирует и сохраняет новую запись.
 */
function handleSaveEntry() {
  const week = Number(document.getElementById("f-week").value);
  const weight = Number(document.getElementById("f-weight").value);
  const kcalEaten = Number(document.getElementById("f-kcal").value);
  const workouts = Number(document.getElementById("f-workouts").value);
  const steps = Number(document.getElementById("f-steps").value);

  if (!week || week < 1) {
    alert("Укажите корректный номер недели");
    return;
  }
  if (!weight || weight < 40 || weight > 250) {
    alert("Укажите корректный вес в кг");
    return;
  }
  if (!kcalEaten || kcalEaten < 0) {
    alert("Укажите количество съеденных калорий за неделю");
    return;
  }
  if (workouts === null || workouts < 0 || workouts > 14) {
    alert("Укажите количество тренировок (0–14)");
    return;
  }
  if (!steps || steps < 0) {
    alert("Укажите количество шагов за неделю");
    return;
  }

  const entries = loadEntries();
  const existing = entries.find((e) => e.week === week);
  if (existing && !confirm(`Запись недели ${week} уже существует. Перезаписать?`)) {
    return;
  }

  upsertEntry({ week, weight, kcalEaten, workouts, steps });

  // Очищаем форму, подставляем следующий номер недели для удобства
  document.getElementById("f-week").value = week + 1;
  document.getElementById("f-weight").value = "";
  document.getElementById("f-kcal").value = "";
  document.getElementById("f-workouts").value = "";
  document.getElementById("f-steps").value = "";

  renderTracker();
}

/**
 * Экспортирует все записи в CSV-файл для скачивания (резервная копия).
 */
function handleExportCsv() {
  const entries = loadEntries();
  if (entries.length === 0) {
    alert("Нет данных для экспорта");
    return;
  }

  const header = "Неделя,Вес кг,Съедено ккал,Тренировок,Шагов,Сожжено ккал,Дельта веса\n";
  const rows = entries
    .map((entry) => {
      const burned = calcBurnedKcal(entry);
      const delta = calcWeightDelta(entries, entry.week);
      return [
        entry.week,
        entry.weight,
        entry.kcalEaten,
        entry.workouts,
        entry.steps,
        burned,
        delta !== null ? delta : ""
      ].join(",");
    })
    .join("\n");

  const csvContent = header + rows;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `antizh2026_progress_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Подставляет в форму следующий пустой номер недели при открытии таба.
 */
function prefillNextWeek() {
  const entries = loadEntries();
  const nextWeek = entries.length > 0 ? entries[entries.length - 1].week + 1 : 25;
  const weekInput = document.getElementById("f-week");
  if (weekInput && !weekInput.value) {
    weekInput.value = nextWeek;
  }
}
