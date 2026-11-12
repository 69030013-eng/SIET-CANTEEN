/**
 * Main Application Controller for SIET Smart Canteen
 * Binds DOM events, tab routing, notifications, and initializes components
 */

window.SIETApp = {
  currentTab: 'roulette',

  init() {
    // 1. Initialize State
    window.SIETState.init();

    // 2. Setup Roulette Canvas
    const canvas = document.getElementById('wheelCanvas');
    if (canvas) {
      window.SIETRoulette.init(canvas);
    }

    // 3. Bind Navigation
    this.bindNavigation();

    // 4. Bind Roulette Tab Controls
    this.bindRouletteEvents();

    // 5. Bind Vision Scanner Controls
    this.bindVisionEvents();

    // 6. Bind TDEE Controls
    this.bindTDEEEvents();

    // 7. Bind Canteen & Menu Manager
    this.bindCanteenEvents();

    // 8. Bind Diary & Settings Events
    this.bindDiaryEvents();

    // 9. Subscribe to state changes for live UI refresh
    window.SIETState.subscribe(() => {
      this.updateHeaderStats();
      this.renderCurrentTab();
    });

    // 10. Initial Render
    this.updateHeaderStats();
    this.switchTab('roulette');

    // Handle responsive canvas resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
    this.resizeCanvas();
  },

  resizeCanvas() {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    const isMobile = window.innerWidth < 640;
    const size = isMobile ? 320 : 380;
    canvas.width = size;
    canvas.height = size;
    window.SIETRoulette.drawWheel();
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('appToast');
    if (!toast) return;

    const bgColors = {
      success: 'bg-emerald-600 border-emerald-400',
      error: 'bg-rose-600 border-rose-400',
      warning: 'bg-amber-600 border-amber-400',
      info: 'bg-blue-600 border-blue-400'
    };

    toast.className = `fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-xl text-white shadow-2xl border flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100 ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <span class="text-xl">${type === 'success' ? '✅' : type === 'error' ? '⚠️' : '💡'}</span>
      <span class="text-sm font-medium">${message}</span>
    `;

    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
    }, 3200);
  },

  // -------------------------------------------------------------
  // Header Stats Bar
  // -------------------------------------------------------------
  updateHeaderStats() {
    const stats = window.SIETState.getTodayStats();

    // Calorie stats
    const elConsumedCal = document.getElementById('headerConsumedCal');
    const elTargetCal = document.getElementById('headerTargetCal');
    const elRemainingCal = document.getElementById('headerRemainingCal');
    const elCalProgress = document.getElementById('headerCalProgress');
    const elCalOverNotice = document.getElementById('headerCalOverNotice');

    if (elConsumedCal) elConsumedCal.textContent = stats.consumedCalories.toLocaleString();
    if (elTargetCal) elTargetCal.textContent = stats.targetCalories.toLocaleString();
    if (elRemainingCal) elRemainingCal.textContent = stats.remainingCalories.toLocaleString();
    
    if (elCalProgress) {
      elCalProgress.style.width = `${stats.caloriePercentage}%`;
      if (stats.isCalorieOver) {
        elCalProgress.className = 'h-full bg-rose-500 rounded-full transition-all duration-500';
        if (elCalOverNotice) elCalOverNotice.classList.remove('hidden');
      } else {
        elCalProgress.className = 'h-full bg-emerald-500 rounded-full transition-all duration-500';
        if (elCalOverNotice) elCalOverNotice.classList.add('hidden');
      }
    }

    // Budget stats
    const elSpentBudget = document.getElementById('headerSpentBudget');
    const elDailyBudget = document.getElementById('headerDailyBudget');
    const elRemainingBudget = document.getElementById('headerRemainingBudget');
    const elBudgetProgress = document.getElementById('headerBudgetProgress');

    if (elSpentBudget) elSpentBudget.textContent = stats.spentBudget.toLocaleString();
    if (elDailyBudget) elDailyBudget.textContent = stats.dailyBudget.toLocaleString();
    if (elRemainingBudget) elRemainingBudget.textContent = stats.remainingBudget.toLocaleString();

    if (elBudgetProgress) {
      elBudgetProgress.style.width = `${stats.budgetPercentage}%`;
      elBudgetProgress.className = stats.isBudgetOver
        ? 'h-full bg-rose-500 rounded-full transition-all duration-500'
        : 'h-full bg-amber-500 rounded-full transition-all duration-500';
    }

    // Canteen Name
    const elCanteenName = document.getElementById('headerCanteenTitle');
    if (elCanteenName) {
      elCanteenName.textContent = window.SIETState.canteenInfo.name || "โรงอาหารกลาง";
    }

    // Cloudflare D1 Connection Status
    const cloudBadge = document.getElementById('headerCloudBadge');
    const settingsCloudBadge = document.getElementById('settingsCloudBadge');
    const settingsCloudMode = document.getElementById('settingsCloudMode');

    if (window.SIETState.cloudStatus === 'connected') {
      if (cloudBadge) {
        cloudBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold flex items-center gap-1';
        cloudBadge.innerHTML = '☁️ Cloudflare D1';
      }
      if (settingsCloudBadge) {
        settingsCloudBadge.className = 'text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold';
        settingsCloudBadge.textContent = '✅ เชื่อมต่อ D1 สำเร็จ (Online)';
      }
      if (settingsCloudMode) {
        settingsCloudMode.className = 'font-bold text-emerald-400';
        settingsCloudMode.textContent = 'Cloudflare Pages + D1 Database (ซิงค์อัตโนมัติ)';
      }
    } else if (window.SIETState.cloudStatus === 'checking') {
      if (cloudBadge) {
        cloudBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 font-semibold flex items-center gap-1';
        cloudBadge.innerHTML = '⏳ ตรวจสอบคลาวด์...';
      }
      if (settingsCloudBadge) {
        settingsCloudBadge.className = 'text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 font-semibold';
        settingsCloudBadge.textContent = '⏳ กำลังตรวจสอบการเชื่อมต่อ...';
      }
    } else {
      if (cloudBadge) {
        cloudBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold flex items-center gap-1';
        cloudBadge.innerHTML = '💾 LocalStorage';
      }
      if (settingsCloudBadge) {
        settingsCloudBadge.className = 'text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold';
        settingsCloudBadge.textContent = '💾 โหมดในเครื่อง (Offline)';
      }
      if (settingsCloudMode) {
        settingsCloudMode.className = 'font-bold text-slate-300';
        settingsCloudMode.textContent = 'LocalStorage (บันทึกในเครื่อง ไม่ต้องต่อเน็ต)';
      }
    }
  },

  // -------------------------------------------------------------
  // Tab Routing
  // -------------------------------------------------------------
  bindNavigation() {
    const tabButtons = document.querySelectorAll('[data-tab-target]');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-tab-target');
        this.switchTab(target);
      });
    });
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Toggle active class on navigation items
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      if (btn.getAttribute('data-tab-target') === tabId) {
        btn.classList.add('active', 'text-emerald-400');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('active', 'text-emerald-400');
        btn.classList.add('text-slate-400');
      }
    });

    // Toggle tab panes
    const panes = ['roulette', 'vision', 'tdee', 'canteen', 'diary'];
    panes.forEach(p => {
      const paneEl = document.getElementById(`tab-pane-${p}`);
      if (paneEl) {
        if (p === tabId) {
          paneEl.classList.remove('hidden');
        } else {
          paneEl.classList.add('hidden');
        }
      }
    });

    this.renderCurrentTab();
  },

  renderCurrentTab() {
    switch (this.currentTab) {
      case 'roulette':
        this.renderRouletteTab();
        break;
      case 'vision':
        // Vision state preserved
        break;
      case 'tdee':
        this.renderTDEETab();
        break;
      case 'canteen':
        this.renderCanteenTab();
        break;
      case 'diary':
        this.renderDiaryTab();
        break;
    }
  },

  // -------------------------------------------------------------
  // TAB 1: Roulette & Smart Filter
  // -------------------------------------------------------------
  bindRouletteEvents() {
    const btnSpin = document.getElementById('btnSpinWheel');
    if (btnSpin) {
      btnSpin.addEventListener('click', () => {
        if (window.SIETRoulette.isSpinning) return;
        btnSpin.disabled = true;
        btnSpin.classList.add('opacity-50', 'cursor-not-allowed');

        window.SIETRoulette.spin((wonItem) => {
          btnSpin.disabled = false;
          btnSpin.classList.remove('opacity-50', 'cursor-not-allowed');
          this.openSpinResultModal(wonItem);
        });
      });
    }

    // Stall filter dropdown
    const filterStall = document.getElementById('filterStall');
    if (filterStall) {
      filterStall.addEventListener('change', (e) => {
        window.SIETState.randomizerFilter.stallId = e.target.value;
        this.refreshRoulettePool();
      });
    }

    // Budget limit filter pills
    const budgetButtons = document.querySelectorAll('[data-budget-filter]');
    budgetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        budgetButtons.forEach(b => b.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-500'));
        btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-500');

        const val = parseInt(btn.getAttribute('data-budget-filter'), 10);
        window.SIETState.randomizerFilter.maxPrice = val;
        this.refreshRoulettePool();
      });
    });

    // Strict Calorie Filter toggle
    const toggleStrictCal = document.getElementById('toggleStrictCal');
    if (toggleStrictCal) {
      toggleStrictCal.addEventListener('change', (e) => {
        window.SIETState.randomizerFilter.strictCalories = e.target.checked;
        this.refreshRoulettePool();
      });
    }

    // Anti-Monotony Filter toggle
    const toggleAntiMonotony = document.getElementById('toggleAntiMonotony');
    if (toggleAntiMonotony) {
      toggleAntiMonotony.addEventListener('change', (e) => {
        window.SIETState.randomizerFilter.antiMonotony = e.target.checked;
        this.refreshRoulettePool();
      });
    }

    // Spin result modal close & log buttons
    const btnCloseModal = document.getElementById('btnCloseResultModal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        document.getElementById('resultModal').classList.add('hidden');
      });
    }

    const btnConfirmEaten = document.getElementById('btnConfirmEaten');
    if (btnConfirmEaten) {
      btnConfirmEaten.addEventListener('click', () => {
        this.logWinningMeal();
      });
    }
  },

  refreshRoulettePool() {
    const result = window.SIETRoulette.updatePool();
    window.SIETRoulette.drawWheel();

    // Update filter status counter in UI
    const elPoolCount = document.getElementById('roulettePoolCount');
    if (elPoolCount) {
      elPoolCount.textContent = `${result.menus.length} เมนู`;
    }

    const elFilterNotice = document.getElementById('rouletteFilterNotice');
    if (elFilterNotice) {
      let notices = [];
      if (result.calorieFilteredOutCount > 0) {
        notices.push(`ตัดออก ${result.calorieFilteredOutCount} เมนู (แคลเกินโควต้า)`);
      }
      if (result.monotonyFilteredOutCount > 0) {
        notices.push(`ตัดออก ${result.monotonyFilteredOutCount} เมนู (กินไปแล้วใน 2 มื้อล่าสุด)`);
      }
      if (notices.length > 0) {
        elFilterNotice.textContent = notices.join(' • ');
        elFilterNotice.classList.remove('hidden');
      } else {
        elFilterNotice.classList.add('hidden');
      }
    }
  },

  renderRouletteTab() {
    // Populate stall select dropdown
    const filterStall = document.getElementById('filterStall');
    if (filterStall) {
      const currentVal = window.SIETState.randomizerFilter.stallId;
      filterStall.innerHTML = '<option value="all">🏪 ทุกร้านในโรงอาหาร</option>' +
        window.SIETState.stalls.map(s => `<option value="${s.id}">${s.icon} ${s.name} (${s.menus.length} เมนู)</option>`).join('');
      filterStall.value = currentVal;
    }

    this.refreshRoulettePool();
  },

  openSpinResultModal(item) {
    if (!item) return;
    const modal = document.getElementById('resultModal');
    if (!modal) return;

    modal.classList.remove('hidden');

    // Populate details
    document.getElementById('resultItemName').textContent = item.name;
    document.getElementById('resultStallName').textContent = `${item.stallIcon} ${item.stallName}`;
    document.getElementById('resultCategory').textContent = item.category || 'อาหารจานเดียว';

    // Reset modifier states
    window.SIETRoulette.activeModifiers = {
      rice: 'rice_normal',
      addons: []
    };

    // Render Modifier Options (Rice)
    const riceContainer = document.getElementById('modifierRiceOptions');
    if (riceContainer) {
      riceContainer.innerHTML = window.SIETPresets.modifiers.rice.map(r => `
        <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 cursor-pointer hover:border-emerald-500 transition-all">
          <div class="flex items-center gap-2">
            <input type="radio" name="mod_rice" value="${r.id}" ${r.id === 'rice_normal' ? 'checked' : ''} class="text-emerald-500 focus:ring-emerald-500">
            <span class="text-sm font-medium text-slate-200">${r.name}</span>
          </div>
        </label>
      `).join('');

      riceContainer.querySelectorAll('input[name="mod_rice"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          window.SIETRoulette.activeModifiers.rice = e.target.value;
          this.updateResultTotals(item);
        });
      });
    }

    // Render Modifier Options (Addons)
    const addonsContainer = document.getElementById('modifierAddonOptions');
    if (addonsContainer) {
      addonsContainer.innerHTML = window.SIETPresets.modifiers.addons.map(a => `
        <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 cursor-pointer hover:border-emerald-500 transition-all">
          <div class="flex items-center gap-2">
            <input type="checkbox" name="mod_addon" value="${a.id}" class="rounded text-emerald-500 focus:ring-emerald-500">
            <span class="text-sm font-medium text-slate-200">${a.name}</span>
          </div>
        </label>
      `).join('');

      addonsContainer.querySelectorAll('input[name="mod_addon"]').forEach(cb => {
        cb.addEventListener('change', () => {
          const checked = Array.from(addonsContainer.querySelectorAll('input[name="mod_addon"]:checked')).map(c => c.value);
          window.SIETRoulette.activeModifiers.addons = checked;
          this.updateResultTotals(item);
        });
      });
    }

    this.updateResultTotals(item);
  },

  updateResultTotals(item) {
    const totals = window.SIETRoulette.calculateCurrentTotals(item, window.SIETRoulette.activeModifiers);
    const stats = window.SIETState.getTodayStats();

    document.getElementById('resultTotalCalories').textContent = `${totals.calories} kcal`;
    document.getElementById('resultTotalPrice').textContent = `${totals.price} บาท`;

    // Comparison badges
    const elCalBadge = document.getElementById('resultCalorieCompare');
    if (elCalBadge) {
      if (totals.calories <= stats.remainingCalories) {
        elCalBadge.className = 'text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        elCalBadge.textContent = `✅ พอดีโควต้า (เหลือโควต้า ${stats.remainingCalories - totals.calories} kcal)`;
      } else {
        elCalBadge.className = 'text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30';
        elCalBadge.textContent = `⚠️ เกินโควต้า ${totals.calories - stats.remainingCalories} kcal`;
      }
    }

    const elBudgetBadge = document.getElementById('resultBudgetCompare');
    if (elBudgetBadge) {
      if (totals.price <= stats.remainingBudget) {
        elBudgetBadge.className = 'text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30';
        elBudgetBadge.textContent = `💰 เหลืองบวันนี้ ${stats.remainingBudget - totals.price} บาท`;
      } else {
        elBudgetBadge.className = 'text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30';
        elBudgetBadge.textContent = `💸 เกินงบวันนี้ ${totals.price - stats.remainingBudget} บาท`;
      }
    }
  },

  logWinningMeal() {
    const item = window.SIETRoulette.selectedItem;
    if (!item) return;

    const totals = window.SIETRoulette.calculateCurrentTotals(item, window.SIETRoulette.activeModifiers);

    // Collect modifier names
    const modNames = [];
    const riceMod = window.SIETPresets.modifiers.rice.find(r => r.id === window.SIETRoulette.activeModifiers.rice);
    if (riceMod && riceMod.id !== 'rice_normal') modNames.push(riceMod.name);

    window.SIETRoulette.activeModifiers.addons.forEach(aid => {
      const addon = window.SIETPresets.modifiers.addons.find(a => a.id === aid);
      if (addon) modNames.push(addon.name);
    });

    const mealTypeSelect = document.getElementById('resultMealTypeSelect');
    const mealType = mealTypeSelect ? mealTypeSelect.value : window.SIETState.inferMealType();

    window.SIETState.addDiaryEntry({
      stallName: item.stallName,
      menuName: item.name,
      calories: totals.calories,
      price: totals.price,
      modifiers: modNames,
      mealType: mealType,
      isAiRecognized: false
    });

    document.getElementById('resultModal').classList.add('hidden');
    this.showToast(`บันทึก "${item.name}" เรียบร้อยแล้ว!`, 'success');
  },

  // -------------------------------------------------------------
  // TAB 2: AI Vision Food Scanner
  // -------------------------------------------------------------
  bindVisionEvents() {
    const fileInput = document.getElementById('visionFileInput');
    const dropZone = document.getElementById('visionDropZone');
    const btnAnalyze = document.getElementById('btnAnalyzeFood');
    const btnSaveAiMeal = document.getElementById('btnSaveAiMeal');

    let currentImageDataUrl = null;
    let lastAiResult = null;

    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        currentImageDataUrl = await window.SIETGemini.fileToBase64(file);
        this.showVisionPreview(currentImageDataUrl);
      });
    }

    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-emerald-500', 'bg-emerald-950/20');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-emerald-500', 'bg-emerald-950/20');
      });
      dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-emerald-500', 'bg-emerald-950/20');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          currentImageDataUrl = await window.SIETGemini.fileToBase64(file);
          this.showVisionPreview(currentImageDataUrl);
        }
      });
    }

    if (btnAnalyze) {
      btnAnalyze.addEventListener('click', async () => {
        if (!currentImageDataUrl) {
          this.showToast('กรุณาถ่ายภาพหรืออัปโหลดรูปอาหารก่อน', 'warning');
          return;
        }

        const progressEl = document.getElementById('visionProgress');
        const resultCard = document.getElementById('visionResultCard');
        btnAnalyze.disabled = true;
        btnAnalyze.classList.add('opacity-50');
        progressEl.classList.remove('hidden');
        resultCard.classList.add('hidden');

        try {
          const result = await window.SIETGemini.analyzeFoodImage(currentImageDataUrl, (msg) => {
            const statusText = document.getElementById('visionProgressText');
            if (statusText) statusText.textContent = msg;
          });

          lastAiResult = result;
          this.renderVisionResult(result);
          resultCard.classList.remove('hidden');
          this.showToast('วิเคราะห์สารอาหารสำเร็จ!', 'success');
        } catch(err) {
          this.showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
        } finally {
          btnAnalyze.disabled = false;
          btnAnalyze.classList.remove('opacity-50');
          progressEl.classList.add('hidden');
        }
      });
    }

    if (btnSaveAiMeal) {
      btnSaveAiMeal.addEventListener('click', () => {
        if (!lastAiResult) return;
        const mealType = document.getElementById('visionMealTypeSelect')?.value || window.SIETState.inferMealType();

        window.SIETState.addDiaryEntry({
          stallName: 'ถ่ายภาพ AI',
          menuName: lastAiResult.foodName,
          calories: lastAiResult.estimatedCalories,
          price: lastAiResult.estimatedPrice || 45,
          imageUrl: currentImageDataUrl,
          mealType: mealType,
          isAiRecognized: true,
          nutrition: lastAiResult.macronutrients
        });

        this.showToast(`บันทึก ${lastAiResult.foodName} (${lastAiResult.estimatedCalories} kcal) เรียบร้อย!`, 'success');
      });
    }
  },

  showVisionPreview(dataUrl) {
    const previewImg = document.getElementById('visionPreviewImg');
    const placeholder = document.getElementById('visionPlaceholder');
    const btnAnalyze = document.getElementById('btnAnalyzeFood');

    if (previewImg && placeholder) {
      previewImg.src = dataUrl;
      previewImg.classList.remove('hidden');
      placeholder.classList.add('hidden');
    }
    if (btnAnalyze) {
      btnAnalyze.classList.remove('hidden');
    }
  },

  renderVisionResult(result) {
    document.getElementById('aiFoodName').textContent = result.foodName;
    document.getElementById('aiPortion').textContent = result.portionDesc;
    document.getElementById('aiCalories').textContent = `${result.estimatedCalories} kcal`;
    document.getElementById('aiPrice').textContent = `~${result.estimatedPrice} บาท`;

    document.getElementById('aiProtein').textContent = `${result.macronutrients.protein}g`;
    document.getElementById('aiCarbs').textContent = `${result.macronutrients.carbs}g`;
    document.getElementById('aiFat').textContent = `${result.macronutrients.fat}g`;
    document.getElementById('aiSodium').textContent = `${result.macronutrients.sodium}mg`;

    const elRating = document.getElementById('aiHealthRating');
    if (elRating) {
      elRating.textContent = `เกรด ${result.healthRating}`;
      const ratingColors = {
        'A+': 'bg-emerald-500/20 text-emerald-400 border-emerald-500',
        'A': 'bg-emerald-500/20 text-emerald-400 border-emerald-500',
        'B': 'bg-blue-500/20 text-blue-400 border-blue-500',
        'C': 'bg-amber-500/20 text-amber-400 border-amber-500',
        'D': 'bg-rose-500/20 text-rose-400 border-rose-500'
      };
      elRating.className = `text-xs px-3 py-1 rounded-full border font-bold ${ratingColors[result.healthRating] || ratingColors['B']}`;
    }

    document.getElementById('aiAdvice').textContent = result.healthAdvice;
    document.getElementById('aiNotice').textContent = result.notice || '';

    // Render ingredients tags
    const ingContainer = document.getElementById('aiIngredients');
    if (ingContainer && Array.isArray(result.ingredients)) {
      ingContainer.innerHTML = result.ingredients.map(ing => `
        <span class="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">🌿 ${ing}</span>
      `).join('');
    }
  },

  // -------------------------------------------------------------
  // TAB 3: TDEE & Health Target Calculator
  // -------------------------------------------------------------
  bindTDEEEvents() {
    const form = document.getElementById('tdeeForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedProfile = {
        gender: form.gender.value,
        age: parseInt(form.age.value, 10),
        weight: parseFloat(form.weight.value),
        height: parseFloat(form.height.value),
        activityLevel: parseFloat(form.activityLevel.value),
        goal: form.goal.value,
        dailyBudget: parseInt(form.dailyBudget.value, 10) || 150
      };

      const calcResult = window.SIETTdee.calculate(updatedProfile);
      updatedProfile.bmr = calcResult.bmr;
      updatedProfile.tdee = calcResult.tdee;
      updatedProfile.targetCalories = calcResult.targetCalories;

      window.SIETState.updateProfile(updatedProfile);
      this.showToast('บันทึกข้อมูลและคำนวณเป้าหมาย TDEE ใหม่สำเร็จ!', 'success');
      this.renderTDEETab();
    });
  },

  renderTDEETab() {
    const profile = window.SIETState.profile;
    const form = document.getElementById('tdeeForm');
    if (form) {
      form.gender.value = profile.gender || 'male';
      form.age.value = profile.age || 22;
      form.weight.value = profile.weight || 68;
      form.height.value = profile.height || 172;
      form.activityLevel.value = profile.activityLevel || 1.375;
      form.goal.value = profile.goal || 'deficit';
      form.dailyBudget.value = profile.dailyBudget || 150;
    }

    const calcResult = window.SIETTdee.calculate(profile);

    document.getElementById('tdeeResultBmr').textContent = `${calcResult.bmr} kcal`;
    document.getElementById('tdeeResultTdee').textContent = `${calcResult.tdee} kcal`;
    document.getElementById('tdeeResultTarget').textContent = `${calcResult.targetCalories} kcal`;
    document.getElementById('tdeeResultGoalName').textContent = calcResult.goalName;

    // BMI display
    const elBmi = document.getElementById('tdeeBmiValue');
    const elBmiCat = document.getElementById('tdeeBmiCategory');
    if (elBmi) elBmi.textContent = calcResult.bmi;
    if (elBmiCat) {
      elBmiCat.textContent = calcResult.bmiCategory;
      elBmiCat.className = `text-sm font-semibold ${calcResult.bmiColor}`;
    }

    // Macros
    document.getElementById('macroProtein').textContent = `${calcResult.macros.protein}g`;
    document.getElementById('macroCarbs').textContent = `${calcResult.macros.carbs}g`;
    document.getElementById('macroFat').textContent = `${calcResult.macros.fat}g`;

    // Meal allocations
    document.getElementById('allocBreakfast').textContent = `${calcResult.mealAllocations.breakfast.cal} kcal (~${Math.round(profile.dailyBudget * calcResult.mealAllocations.breakfast.budgetRatio)}฿)`;
    document.getElementById('allocLunch').textContent = `${calcResult.mealAllocations.lunch.cal} kcal (~${Math.round(profile.dailyBudget * calcResult.mealAllocations.lunch.budgetRatio)}฿)`;
    document.getElementById('allocDinner').textContent = `${calcResult.mealAllocations.dinner.cal} kcal (~${Math.round(profile.dailyBudget * calcResult.mealAllocations.dinner.budgetRatio)}฿)`;
  },

  // -------------------------------------------------------------
  // TAB 4: Canteen & Menu Manager
  // -------------------------------------------------------------
  canteenSearchKeyword: '',

  renderEmojiPicker(containerId, inputId, selectedEmoji) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    if (!container || !input) return;
    const emojis = ['🍲', '🍜', '🍗', '🍳', '🥗', '🥘', '🍛', '🍱', '🍙', '🥩', '☕', '🥤', '🍧', '🥐', '🥟', '🍔'];
    container.innerHTML = emojis.map(em => `
      <button type="button" class="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${em === selectedEmoji ? 'bg-emerald-600 scale-110 shadow-lg ring-2 ring-emerald-400' : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200'}" data-emoji="${em}">
        ${em}
      </button>
    `).join('');
    container.querySelectorAll('[data-emoji]').forEach(b => {
      b.addEventListener('click', () => {
        const em = b.getAttribute('data-emoji');
        input.value = em;
        this.renderEmojiPicker(containerId, inputId, em);
      });
    });
  },

  renderColorPicker(containerId, inputId, selectedColor) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    if (!container || !input) return;
    const colors = ['#F97316', '#3B82F6', '#EAB308', '#10B981', '#06B6D4', '#8B5CF6', '#EC4899', '#EF4444'];
    container.innerHTML = colors.map(c => `
      <button type="button" class="w-8 h-8 rounded-full transition-all flex items-center justify-center text-xs font-bold text-white shadow-md ${c.toLowerCase() === (selectedColor || '').toLowerCase() ? 'ring-4 ring-white scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}" style="background-color: ${c}" data-color="${c}">
        ${c.toLowerCase() === (selectedColor || '').toLowerCase() ? '✓' : ''}
      </button>
    `).join('');
    container.querySelectorAll('[data-color]').forEach(b => {
      b.addEventListener('click', () => {
        const col = b.getAttribute('data-color');
        input.value = col;
        this.renderColorPicker(containerId, inputId, col);
      });
    });
  },

  bindCanteenEvents() {
    // Quick adjustment buttons (+5, -5, +50, -50)
    document.querySelectorAll('.btn-quick-adjust').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const delta = parseInt(btn.getAttribute('data-delta'), 10) || 0;
        const input = document.getElementById(targetId);
        if (input) {
          const current = parseInt(input.value, 10) || 0;
          input.value = Math.max(0, current + delta);
        }
      });
    });

    // Canteen Name Edit Modal
    const btnEditCanteenName = document.getElementById('btnEditCanteenName');
    const modalEditCanteenName = document.getElementById('modalEditCanteenName');
    const formEditCanteenName = document.getElementById('formEditCanteenName');
    const btnCloseEditCanteenModal = document.getElementById('btnCloseEditCanteenModal');

    if (btnEditCanteenName && modalEditCanteenName) {
      btnEditCanteenName.addEventListener('click', () => {
        document.getElementById('inputCanteenName').value = window.SIETState.canteenInfo.name || '';
        modalEditCanteenName.classList.remove('hidden');
      });
    }
    if (btnCloseEditCanteenModal && modalEditCanteenName) {
      btnCloseEditCanteenModal.addEventListener('click', () => modalEditCanteenName.classList.add('hidden'));
    }
    if (formEditCanteenName) {
      formEditCanteenName.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('inputCanteenName').value.trim();
        if (newName) {
          window.SIETCanteen.updateCanteenName(newName);
          this.updateHeaderStats();
          this.showToast(`เปลี่ยนชื่อโรงอาหารเป็น "${newName}" แล้ว`, 'success');
          modalEditCanteenName.classList.add('hidden');
        }
      });
    }

    // Add stall button
    const btnOpenAddStall = document.getElementById('btnOpenAddStallModal');
    const modalAddStall = document.getElementById('modalAddStall');
    const formAddStall = document.getElementById('formAddStall');
    const btnCloseAddStall = document.getElementById('btnCloseAddStallModal');

    if (btnOpenAddStall && modalAddStall) {
      btnOpenAddStall.addEventListener('click', () => {
        this.renderEmojiPicker('addStallIconPicker', 'addStallIcon', '🍲');
        this.renderColorPicker('addStallColorPicker', 'addStallColor', '#F97316');
        modalAddStall.classList.remove('hidden');
      });
    }
    if (btnCloseAddStall && modalAddStall) {
      btnCloseAddStall.addEventListener('click', () => modalAddStall.classList.add('hidden'));
    }
    if (formAddStall) {
      formAddStall.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = formAddStall.stallName.value;
        const icon = formAddStall.stallIcon.value || '🍲';
        const color = formAddStall.stallColor.value || '#F97316';
        window.SIETCanteen.addStall(name, icon, color);
        formAddStall.reset();
        modalAddStall.classList.add('hidden');
        this.showToast(`เพิ่มร้าน "${name}" สำเร็จ!`, 'success');
        this.renderCanteenTab();
      });
    }

    // Edit stall modal
    const modalEditStall = document.getElementById('modalEditStall');
    const formEditStall = document.getElementById('formEditStall');
    const btnCloseEditStallModal = document.getElementById('btnCloseEditStallModal');
    const btnDeleteStallFromModal = document.getElementById('btnDeleteStallFromModal');

    if (btnCloseEditStallModal && modalEditStall) {
      btnCloseEditStallModal.addEventListener('click', () => modalEditStall.classList.add('hidden'));
    }
    if (formEditStall) {
      formEditStall.addEventListener('submit', (e) => {
        e.preventDefault();
        const stallId = document.getElementById('editStallId').value;
        const name = document.getElementById('editStallName').value;
        const icon = document.getElementById('editStallIcon').value;
        const color = document.getElementById('editStallColor').value;
        window.SIETCanteen.updateStall(stallId, name, icon, color);
        modalEditStall.classList.add('hidden');
        this.showToast(`แก้ไขร้าน "${name}" เรียบร้อย!`, 'success');
        this.renderCanteenTab();
      });
    }
    if (btnDeleteStallFromModal) {
      btnDeleteStallFromModal.addEventListener('click', () => {
        const stallId = document.getElementById('editStallId').value;
        if (confirm('คุณต้องการลบร้านค้านี้และเมนูทั้งหมดในร้านใช่หรือไม่?')) {
          window.SIETCanteen.deleteStall(stallId);
          modalEditStall.classList.add('hidden');
          this.showToast('ลบร้านค้าเรียบร้อยแล้ว', 'info');
          this.renderCanteenTab();
        }
      });
    }

    // Add Menu modal
    const modalAddMenu = document.getElementById('modalAddMenu');
    const formAddMenu = document.getElementById('formAddMenu');
    const btnCloseAddMenu = document.getElementById('btnCloseAddMenuModal');

    if (btnCloseAddMenu && modalAddMenu) {
      btnCloseAddMenu.addEventListener('click', () => modalAddMenu.classList.add('hidden'));
    }
    if (formAddMenu) {
      formAddMenu.addEventListener('submit', (e) => {
        e.preventDefault();
        const stallId = formAddMenu.targetStallId.value;
        const menuData = {
          name: formAddMenu.menuName.value,
          price: formAddMenu.menuPrice.value,
          calories: formAddMenu.menuCalories.value,
          category: formAddMenu.menuCategory.value,
          tags: formAddMenu.menuTags.value
        };

        window.SIETCanteen.addMenu(stallId, menuData);
        formAddMenu.reset();
        modalAddMenu.classList.add('hidden');
        this.showToast(`เพิ่มเมนู "${menuData.name}" เรียบร้อยแล้ว!`, 'success');
        this.renderCanteenTab();
      });
    }

    // Edit Menu modal
    const modalEditMenu = document.getElementById('modalEditMenu');
    const formEditMenu = document.getElementById('formEditMenu');
    const btnCloseEditMenuModal = document.getElementById('btnCloseEditMenuModal');
    const btnDeleteMenuFromModal = document.getElementById('btnDeleteMenuFromModal');
    const btnDuplicateMenuFromModal = document.getElementById('btnDuplicateMenuFromModal');

    if (btnCloseEditMenuModal && modalEditMenu) {
      btnCloseEditMenuModal.addEventListener('click', () => modalEditMenu.classList.add('hidden'));
    }
    if (formEditMenu) {
      formEditMenu.addEventListener('submit', (e) => {
        e.preventDefault();
        const stallId = document.getElementById('editMenuStallId').value;
        const menuId = document.getElementById('editMenuId').value;
        const menuData = {
          name: document.getElementById('editMenuName').value,
          price: document.getElementById('editMenuPrice').value,
          calories: document.getElementById('editMenuCalories').value,
          category: document.getElementById('editMenuCategory').value,
          tags: document.getElementById('editMenuTags').value
        };

        window.SIETCanteen.updateMenu(stallId, menuId, menuData);
        modalEditMenu.classList.add('hidden');
        this.showToast(`แก้ไขเมนู "${menuData.name}" สำเร็จ!`, 'success');
        this.renderCanteenTab();
      });
    }
    if (btnDeleteMenuFromModal) {
      btnDeleteMenuFromModal.addEventListener('click', () => {
        const stallId = document.getElementById('editMenuStallId').value;
        const menuId = document.getElementById('editMenuId').value;
        if (confirm('คุณต้องการลบเมนูนี้ใช่หรือไม่?')) {
          window.SIETCanteen.deleteMenu(stallId, menuId);
          modalEditMenu.classList.add('hidden');
          this.showToast('ลบเมนูเรียบร้อยแล้ว', 'info');
          this.renderCanteenTab();
        }
      });
    }
    if (btnDuplicateMenuFromModal) {
      btnDuplicateMenuFromModal.addEventListener('click', () => {
        const stallId = document.getElementById('editMenuStallId').value;
        const menuId = document.getElementById('editMenuId').value;
        const cloned = window.SIETCanteen.duplicateMenu(stallId, menuId);
        if (cloned) {
          modalEditMenu.classList.add('hidden');
          this.showToast(`คัดลอกสร้างเมนู "${cloned.name}" เรียบร้อย!`, 'success');
          this.renderCanteenTab();
        }
      });
    }

    // Search bar event
    const searchInput = document.getElementById('canteenSearchInput');
    const btnClearSearch = document.getElementById('btnClearCanteenSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.canteenSearchKeyword = e.target.value.trim().toLowerCase();
        if (this.canteenSearchKeyword) {
          btnClearSearch?.classList.remove('hidden');
        } else {
          btnClearSearch?.classList.add('hidden');
        }
        this.renderCanteenTab();
      });
    }
    if (btnClearSearch && searchInput) {
      btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        this.canteenSearchKeyword = '';
        btnClearSearch.classList.add('hidden');
        this.renderCanteenTab();
      });
    }

    // Reset default canteen button
    const btnResetCanteen = document.getElementById('btnResetCanteen');
    if (btnResetCanteen) {
      btnResetCanteen.addEventListener('click', () => {
        if (confirm('คุณต้องการรีเซ็ตร้านค้าและเมนูทั้งหมดกลับเป็นค่าเริ่มต้นโรงอาหารไทยหรือไม่?')) {
          window.SIETState.resetStallsToPreset();
          this.showToast('รีเซ็ตข้อมูลโรงอาหารเป็นค่าเริ่มต้นแล้ว', 'success');
          this.renderCanteenTab();
        }
      });
    }

    // Export/Import JSON
    const btnExportData = document.getElementById('btnExportData');
    if (btnExportData) {
      btnExportData.addEventListener('click', () => window.SIETCanteen.exportData());
    }

    const fileImportData = document.getElementById('fileImportData');
    if (fileImportData) {
      fileImportData.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        const res = window.SIETCanteen.importData(text);
        if (res.success) {
          this.showToast('นำเข้าข้อมูลสำเร็จ!', 'success');
          this.renderCanteenTab();
        } else {
          this.showToast(`เกิดข้อผิดพลาดในการนำเข้า: ${res.error}`, 'error');
        }
      });
    }
  },

  renderCanteenTab() {
    const container = document.getElementById('canteenStallsList');
    if (!container) return;

    if (window.SIETState.stalls.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center glass-panel rounded-2xl">
          <p class="text-slate-400 text-base mb-4">ยังไม่มีร้านค้าในโรงอาหารนี้</p>
          <button id="btnEmptyAddStall" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
            ➕ เพิ่มร้านค้าแรกของคุณ
          </button>
        </div>
      `;
      const btn = document.getElementById('btnEmptyAddStall');
      if (btn) btn.addEventListener('click', () => {
        this.renderEmojiPicker('addStallIconPicker', 'addStallIcon', '🍲');
        this.renderColorPicker('addStallColorPicker', 'addStallColor', '#F97316');
        document.getElementById('modalAddStall').classList.remove('hidden');
      });
      return;
    }

    // Apply search filter if active
    const keyword = this.canteenSearchKeyword;
    let displayedStalls = window.SIETState.stalls;

    if (keyword) {
      displayedStalls = displayedStalls.filter(stall => {
        const matchStallName = stall.name.toLowerCase().includes(keyword);
        const matchMenu = stall.menus.some(m => m.name.toLowerCase().includes(keyword) || (m.tags && m.tags.some(t => t.toLowerCase().includes(keyword))));
        return matchStallName || matchMenu;
      });
    }

    if (displayedStalls.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center glass-panel rounded-2xl border border-slate-700">
          <p class="text-3xl mb-2">🔍</p>
          <p class="text-slate-300 font-medium">ไม่พบร้านค้าหรือเมนูที่ตรงกับคำค้นหา "${keyword}"</p>
          <p class="text-xs text-slate-500 mt-1">ลองพิมพ์คำค้นอื่น เช่น กะเพรา, ไก่, ก๋วยเตี๋ยว หรือล้างคำค้นหา</p>
        </div>
      `;
      return;
    }

    container.innerHTML = displayedStalls.map(stall => {
      // Filter menus if keyword is present
      const menus = keyword
        ? stall.menus.filter(m => stall.name.toLowerCase().includes(keyword) || m.name.toLowerCase().includes(keyword) || (m.tags && m.tags.some(t => t.toLowerCase().includes(keyword))))
        : stall.menus;

      return `
      <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-700/60 transition-all hover:border-slate-600">
        <!-- Stall Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/50 mb-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg cursor-pointer hover:scale-105 transition-all" 
                 style="background-color: ${stall.color}25; border: 1px solid ${stall.color}60;"
                 data-action="edit-stall" data-stall-id="${stall.id}" title="คลิกเพื่อแก้ไขร้านนี้">
              ${stall.icon}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-bold text-slate-100 hover:text-emerald-400 cursor-pointer transition-all" 
                    data-action="edit-stall" data-stall-id="${stall.id}" title="คลิกเพื่อแก้ไขร้านนี้">
                  ${stall.name}
                </h3>
                <button data-action="edit-stall" data-stall-id="${stall.id}" class="text-slate-400 hover:text-emerald-400 text-xs px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 transition-all">
                  <span>✏️ แก้ไขร้าน</span>
                </button>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">${stall.menus.length} เมนูอาหาร</p>
            </div>
          </div>
          <div class="flex items-center gap-2 self-end sm:self-center">
            <button data-action="add-menu-to-stall" data-stall-id="${stall.id}" class="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs font-semibold border border-emerald-500/40 transition-all flex items-center gap-1">
              ➕ เพิ่มเมนู
            </button>
            <button data-action="delete-stall" data-stall-id="${stall.id}" class="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all text-xs" title="ลบร้านค้านี้">
              🗑️
            </button>
          </div>
        </div>

        <!-- Menus Grid -->
        ${menus.length === 0 ? `
          <div class="p-4 text-center text-xs text-slate-500 bg-slate-800/40 rounded-xl">
            ยังไม่มีเมนูในร้านนี้ คลิก "➕ เพิ่มเมนู" ด้านบนเพื่อเริ่มเพิ่มเมนู
          </div>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            ${menus.map(menu => `
              <div class="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-slate-800 transition-all group">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span class="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-all block">${menu.name}</span>
                    <span class="text-[10px] text-slate-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800 inline-block mt-0.5">${menu.category}</span>
                  </div>
                  <!-- Action Toolbar -->
                  <div class="flex items-center gap-1">
                    <button data-action="edit-menu" data-stall-id="${stall.id}" data-menu-id="${menu.id}" class="text-slate-400 hover:text-emerald-400 hover:bg-slate-700 p-1.5 rounded-lg text-xs transition-all" title="แก้ไขเมนูนี้">
                      ✏️
                    </button>
                    <button data-action="duplicate-menu" data-stall-id="${stall.id}" data-menu-id="${menu.id}" class="text-slate-400 hover:text-blue-400 hover:bg-slate-700 p-1.5 rounded-lg text-xs transition-all" title="คัดลอกสร้างเมนูใหม่">
                      📋
                    </button>
                    <button data-action="delete-menu" data-stall-id="${stall.id}" data-menu-id="${menu.id}" class="text-slate-400 hover:text-rose-400 hover:bg-slate-700 p-1.5 rounded-lg text-xs transition-all" title="ลบเมนูนี้">
                      🗑️
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-700/50 mt-1">
                  <div class="flex items-center gap-2">
                    <span class="text-amber-400 font-bold text-sm">${menu.price} ฿</span>
                    <span class="text-emerald-400 font-medium">${menu.calories} kcal</span>
                  </div>
                  <button data-action="edit-menu" data-stall-id="${stall.id}" data-menu-id="${menu.id}" class="text-[11px] text-slate-400 hover:text-emerald-400 transition-all flex items-center gap-0.5">
                    <span>แก้ไข</span> ➔
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
    }).join('');

    // Attach actions to buttons
    container.querySelectorAll('[data-action="add-menu-to-stall"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const stallId = btn.getAttribute('data-stall-id');
        const modal = document.getElementById('modalAddMenu');
        const hiddenInput = document.getElementById('targetStallId');
        if (modal && hiddenInput) {
          hiddenInput.value = stallId;
          modal.classList.remove('hidden');
        }
      });
    });

    // Edit stall
    container.querySelectorAll('[data-action="edit-stall"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const stallId = btn.getAttribute('data-stall-id');
        const stall = window.SIETState.stalls.find(s => s.id === stallId);
        if (!stall) return;

        document.getElementById('editStallId').value = stall.id;
        document.getElementById('editStallName').value = stall.name;
        document.getElementById('editStallIcon').value = stall.icon;
        document.getElementById('editStallColor').value = stall.color;

        this.renderEmojiPicker('editStallIconPicker', 'editStallIcon', stall.icon);
        this.renderColorPicker('editStallColorPicker', 'editStallColor', stall.color);

        document.getElementById('modalEditStall').classList.remove('hidden');
      });
    });

    // Edit menu
    container.querySelectorAll('[data-action="edit-menu"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stallId = btn.getAttribute('data-stall-id');
        const menuId = btn.getAttribute('data-menu-id');
        const stall = window.SIETState.stalls.find(s => s.id === stallId);
        if (!stall) return;
        const menu = stall.menus.find(m => m.id === menuId);
        if (!menu) return;

        document.getElementById('editMenuStallId').value = stallId;
        document.getElementById('editMenuId').value = menuId;
        document.getElementById('editMenuName').value = menu.name;
        document.getElementById('editMenuPrice').value = menu.price;
        document.getElementById('editMenuCalories').value = menu.calories;
        document.getElementById('editMenuCategory').value = menu.category || 'จานเดียว';
        document.getElementById('editMenuTags').value = Array.isArray(menu.tags) ? menu.tags.join(', ') : (menu.tags || '');

        document.getElementById('modalEditMenu').classList.remove('hidden');
      });
    });

    // Duplicate menu
    container.querySelectorAll('[data-action="duplicate-menu"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stallId = btn.getAttribute('data-stall-id');
        const menuId = btn.getAttribute('data-menu-id');
        const cloned = window.SIETCanteen.duplicateMenu(stallId, menuId);
        if (cloned) {
          this.showToast(`คัดลอกสร้างเมนู "${cloned.name}" สำเร็จ!`, 'success');
          this.renderCanteenTab();
        }
      });
    });

    // Delete stall
    container.querySelectorAll('[data-action="delete-stall"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const stallId = btn.getAttribute('data-stall-id');
        if (confirm('คุณต้องการลบร้านค้านี้และเมนูทั้งหมดในร้านใช่หรือไม่?')) {
          window.SIETCanteen.deleteStall(stallId);
          this.showToast('ลบร้านค้าเรียบร้อยแล้ว', 'info');
          this.renderCanteenTab();
        }
      });
    });

    // Delete menu
    container.querySelectorAll('[data-action="delete-menu"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stallId = btn.getAttribute('data-stall-id');
        const menuId = btn.getAttribute('data-menu-id');
        if (confirm('คุณต้องการลบเมนูนี้ใช่หรือไม่?')) {
          window.SIETCanteen.deleteMenu(stallId, menuId);
          this.showToast('ลบเมนูเรียบร้อยแล้ว', 'info');
          this.renderCanteenTab();
        }
      });
    });
  },

  // -------------------------------------------------------------
  // TAB 5: Diary & Budget Settings
  // -------------------------------------------------------------
  bindDiaryEvents() {
    // Clear today's diary
    const btnClear = document.getElementById('btnClearDiaryToday');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('ต้องการล้างประวัติการกินของวันนี้ทั้งหมดหรือไม่?')) {
          window.SIETState.clearTodayDiary();
          this.showToast('ล้างประวัติของวันนี้แล้ว', 'info');
          this.renderDiaryTab();
        }
      });
    }

    // Save Settings
    const formSettings = document.getElementById('formAppSettings');
    if (formSettings) {
      formSettings.addEventListener('submit', (e) => {
        e.preventDefault();
        const geminiApiKey = formSettings.geminiApiKey.value.trim();
        const dailyBudget = parseInt(formSettings.settingsDailyBudget.value, 10) || 150;
        const antiMonotonyCount = parseInt(formSettings.antiMonotonyCount.value, 10) || 2;
        const soundEnabled = formSettings.soundEnabled.checked;

        window.SIETState.updateSettings({
          geminiApiKey,
          antiMonotonyCount,
          soundEnabled
        });

        window.SIETState.updateProfile({ dailyBudget });
        this.showToast('บันทึกการตั้งค่าเรียบร้อย!', 'success');
      });
    }

    // Test Cloudflare D1 Connection Button
    const btnTestCloud = document.getElementById('btnTestCloudSync');
    if (btnTestCloud) {
      btnTestCloud.addEventListener('click', async () => {
        this.showToast('กำลังทดสอบเชื่อมต่อ Cloudflare D1...', 'info');
        await window.SIETState.initCloudSync();
        if (window.SIETState.isCloudflare) {
          this.showToast('เชื่อมต่อ Cloudflare D1 สำเร็จแล้ว!', 'success');
        } else {
          this.showToast('ไม่สามารถเชื่อมต่อ Cloudflare API ได้ (กำลังทำงานในโหมด LocalStorage)', 'warning');
        }
        this.updateHeaderStats();
      });
    }

    // Init D1 Database Schema Button
    const btnInitD1 = document.getElementById('btnInitD1Database');
    if (btnInitD1) {
      btnInitD1.addEventListener('click', async () => {
        try {
          this.showToast('กำลังส่งคำสั่งสร้างตารางข้อมูลไปยัง Cloudflare D1...', 'info');
          const res = await fetch('/api/init-db', { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            this.showToast(data.message || 'สร้างตารางข้อมูล D1 สำเร็จ!', 'success');
            await window.SIETState.initCloudSync();
          } else {
            this.showToast(`ข้อผิดพลาด D1: ${data.error}`, 'error');
          }
        } catch(err) {
          this.showToast(`ไม่สามารถเรียก /api/init-db ได้ (${err.message})`, 'error');
        }
      });
    }
  },

  renderDiaryTab() {
    const stats = window.SIETState.getTodayStats();
    const container = document.getElementById('diaryEntriesList');
    if (!container) return;

    // Populate settings inputs
    const formSettings = document.getElementById('formAppSettings');
    if (formSettings) {
      formSettings.geminiApiKey.value = window.SIETState.settings.geminiApiKey || '';
      formSettings.settingsDailyBudget.value = window.SIETState.profile.dailyBudget || 150;
      formSettings.antiMonotonyCount.value = window.SIETState.settings.antiMonotonyCount || 2;
      formSettings.soundEnabled.checked = window.SIETState.settings.soundEnabled !== false;
    }

    if (stats.entries.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 glass-card rounded-2xl border border-slate-800">
          <p class="text-3xl mb-2">🍽️</p>
          <p class="font-medium text-slate-300">ยังไม่มีบันทึกมื้ออาหารสำหรับวันนี้</p>
          <p class="text-xs text-slate-500 mt-1">เริ่มสุ่มเมนูในแท็บ "สุ่มอาหาร" หรือถ่ายภาพเพื่อบันทึกมื้อแรกของคุณได้เลย!</p>
        </div>
      `;
      return;
    }

    const mealTypeNames = {
      breakfast: '🌅 มื้อเช้า',
      lunch: '☀️ มื้อกลางวัน',
      dinner: '🌙 มื้อเย็น',
      snack: '🍎 ของว่าง/เครื่องดื่ม'
    };

    container.innerHTML = stats.entries.map(entry => `
      <div class="glass-card rounded-2xl p-4 flex items-center justify-between border border-slate-700/60">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
            ${entry.imageUrl ? `<img src="${entry.imageUrl}" class="w-full h-full object-cover">` : (entry.isAiRecognized ? '📸' : '🍲')}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                ${mealTypeNames[entry.mealType] || 'มื้ออาหาร'}
              </span>
              <span class="text-xs text-slate-400">${entry.time} น.</span>
            </div>
            <h4 class="text-base font-bold text-slate-100 mt-0.5">${entry.menuName}</h4>
            <p class="text-xs text-slate-400">ร้าน: ${entry.stallName}</p>
            ${entry.modifiers && entry.modifiers.length > 0 ? `
              <div class="flex flex-wrap gap-1 mt-1">
                ${entry.modifiers.map(m => `<span class="tag-badge text-[10px] text-amber-300 bg-amber-950/40 border-amber-800">${m}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right">
            <span class="text-base font-bold text-emerald-400 block">${entry.calories} kcal</span>
            <span class="text-xs text-amber-400 font-semibold block">${entry.price} ฿</span>
          </div>
          <button data-action="delete-diary-entry" data-entry-id="${entry.id}" class="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition-all" title="ลบรายการนี้">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-action="delete-diary-entry"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-entry-id');
        window.SIETState.removeDiaryEntry(id);
        this.renderDiaryTab();
        this.showToast('ลบรายการอาหารแล้ว', 'info');
      });
    });
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.SIETApp.init();
});
