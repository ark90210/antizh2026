/* ===========================================================
   APP.JS — точка входа приложения.
   Инициализирует навигацию по табам и подключает рендеринг
   из ui.js (статический контент) и tracker.js (динамический
   трекер с localStorage).
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initTabNavigation();
  renderTrainingAccordion();
  renderMealsList();
  renderFoodSources();
  renderTracker();
  bindTrackerFormEvents();
  prefillNextWeek();
});

/**
 * Настраивает переключение между табами (Обзор / Тренировки /
 * Питание / Прогресс) через нижнюю навигацию.
 */
function initTabNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      switchTab(targetTab);
    });
  });
}

/**
 * Переключает видимую секцию и активную кнопку навигации.
 * @param {string} tabId — одно из: overview, training, nutrition, tracker
 */
function switchTab(tabId) {
  document.querySelectorAll(".tab-section").forEach((section) => {
    section.classList.remove("active");
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const targetSection = document.getElementById(`tab-${tabId}`);
  const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);

  if (targetSection) targetSection.classList.add("active");
  if (targetBtn) targetBtn.classList.add("active");

  // При переходе на трекер — пересчитываем график (Chart.js требует
  // видимый canvas для корректного измерения размеров)
  if (tabId === "tracker" && weightChartInstance) {
    weightChartInstance.resize();
  }

  // Скроллим контейнер вверх при переключении таба
  window.scrollTo({ top: 0, behavior: "instant" });
}

/**
 * Подключает обработчики кнопок формы трекера (сохранение, экспорт).
 */
function bindTrackerFormEvents() {
  const saveBtn = document.getElementById("btn-save-entry");
  const exportBtn = document.getElementById("btn-export");

  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveEntry);
  }
  if (exportBtn) {
    exportBtn.addEventListener("click", handleExportCsv);
  }

  // Позволяем сохранять нажатием Enter в полях формы
  const formInputs = document.querySelectorAll("#entry-form .field-input");
  formInputs.forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleSaveEntry();
      }
    });
  });
}
