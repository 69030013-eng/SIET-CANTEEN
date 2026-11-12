/**
 * Cloudflare Pages Function: User Health Profile & TDEE API
 * GET /api/profile -> Returns user profile
 * POST /api/profile -> Saves user profile
 */

export async function onRequestGet(context) {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database 'DB' binding not found" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const profile = await db.prepare("SELECT * FROM user_profile WHERE id = 1").first();
    if (!profile) {
      return new Response(JSON.stringify({ success: false, profile: null }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      profile: {
        gender: profile.gender,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        activityLevel: profile.activity_level,
        goal: profile.goal,
        tdee: profile.tdee,
        bmr: profile.bmr,
        targetCalories: profile.target_calories,
        dailyBudget: profile.daily_budget
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database 'DB' binding not found" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await context.request.json();
    await db.prepare(`
      INSERT OR REPLACE INTO user_profile (
        id, gender, age, weight, height, activity_level, goal, tdee, bmr, target_calories, daily_budget, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      data.gender || 'male',
      Number(data.age) || 22,
      Number(data.weight) || 68,
      Number(data.height) || 172,
      Number(data.activityLevel) || 1.375,
      data.goal || 'deficit',
      Number(data.tdee) || 2150,
      Number(data.bmr) || 1620,
      Number(data.targetCalories) || 1650,
      Number(data.dailyBudget) || 150
    ).run();

    return new Response(JSON.stringify({ success: true, message: "Profile saved to D1" }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
