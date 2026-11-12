/**
 * TDEE / BMR & Health Nutrition Engine
 * Uses the scientifically validated Mifflin-St Jeor Equation
 */

window.SIETTdee = {
  // Activity levels map with Thai descriptions
  activityLevels: [
    { value: 1.2, label: 'ไม่ออกกำลังกาย (นั่งทำงานโต๊ะเป็นหลัก)' },
    { value: 1.375, label: 'ออกกำลังกายเบาๆ (1 - 3 วัน / สัปดาห์)' },
    { value: 1.55, label: 'ออกกำลังกายปานกลาง (3 - 5 วัน / สัปดาห์)' },
    { value: 1.725, label: 'ออกกำลังกายหนัก (6 - 7 วัน / สัปดาห์)' },
    { value: 1.9, label: 'ออกกำลังกายหนักมาก / ใช้แรงงานทั้งวัน' }
  ],

  // Goal presets
  goals: [
    { id: 'deficit_fast', name: 'ลดไขมันเร่งด่วน (-500 kcal/วัน)', delta: -500, desc: 'ลดน้ำหนักประมาณ 0.5 กก./สัปดาห์' },
    { id: 'deficit', name: 'ลดน้ำหนักแบบยั่งยืน (-300 kcal/วัน)', delta: -300, desc: 'ค่อยเป็นค่อยไป ไม่โยโย่' },
    { id: 'maintain', name: 'รักษาน้ำหนักและสุขภาพ (0 kcal)', delta: 0, desc: 'คงน้ำหนักเดิม เพิ่มความฟิต' },
    { id: 'surplus', name: 'เพิ่มกล้ามเนื้อ / น้ำหนัก (+350 kcal/วัน)', delta: 350, desc: 'เน้นโปรตีนและเวทเทรนนิ่ง' }
  ],

  /**
   * Calculate BMR using Mifflin-St Jeor formula
   * @param {string} gender 'male' | 'female'
   * @param {number} weight kg
   * @param {number} height cm
   * @param {number} age years
   */
  calculateBMR(gender, weight, height, age) {
    const w = parseFloat(weight) || 60;
    const h = parseFloat(height) || 165;
    const a = parseFloat(age) || 25;

    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }
    return Math.round(bmr);
  },

  /**
   * Calculate TDEE and Target Calories
   */
  calculate(profile) {
    const bmr = this.calculateBMR(profile.gender, profile.weight, profile.height, profile.age);
    const activity = parseFloat(profile.activityLevel) || 1.375;
    const tdee = Math.round(bmr * activity);

    const goalObj = this.goals.find(g => g.id === profile.goal) || this.goals[1];
    let target = tdee + goalObj.delta;

    // Safety floor: Target should not drop below absolute minimum healthy floor (1,200 for women, 1,400 for men)
    const minFloor = profile.gender === 'male' ? 1400 : 1200;
    if (target < minFloor) {
      target = minFloor;
    }

    // Macronutrient targets based on target calories
    // Protein: 25%, Carbs: 50%, Fat: 25%
    const proteinCal = target * 0.25;
    const carbsCal = target * 0.50;
    const fatCal = target * 0.25;

    const proteinGrams = Math.round(proteinCal / 4);
    const carbsGrams = Math.round(carbsCal / 4);
    const fatGrams = Math.round(fatCal / 9);

    // Recommended allocation per meal:
    // Breakfast: 30%, Lunch: 40%, Dinner: 30%
    const mealAllocations = {
      breakfast: { cal: Math.round(target * 0.30), budgetRatio: 0.30 },
      lunch: { cal: Math.round(target * 0.40), budgetRatio: 0.45 },
      dinner: { cal: Math.round(target * 0.30), budgetRatio: 0.25 }
    };

    // Calculate BMI
    const heightInMeters = (profile.height || 165) / 100;
    const bmi = parseFloat(((profile.weight || 60) / (heightInMeters * heightInMeters)).toFixed(1));
    let bmiCategory = 'สมส่วน (Normal)';
    let bmiColor = 'text-emerald-500';

    if (bmi < 18.5) {
      bmiCategory = 'น้ำหนักน้อย / ผอม (Underweight)';
      bmiColor = 'text-blue-500';
    } else if (bmi >= 23 && bmi < 25) {
      bmiCategory = 'น้ำหนักเกินเกณฑ์เอเชีย (Overweight)';
      bmiColor = 'text-amber-500';
    } else if (bmi >= 25 && bmi < 30) {
      bmiCategory = 'โรคอ้วนระดับ 1 (Obese Class 1)';
      bmiColor = 'text-orange-500';
    } else if (bmi >= 30) {
      bmiCategory = 'โรคอ้วนอันตราย (Obese Class 2)';
      bmiColor = 'text-rose-500';
    }

    return {
      bmr,
      tdee,
      targetCalories: target,
      goalName: goalObj.name,
      goalDelta: goalObj.delta,
      macros: {
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams
      },
      mealAllocations,
      bmi,
      bmiCategory,
      bmiColor
    };
  }
};
