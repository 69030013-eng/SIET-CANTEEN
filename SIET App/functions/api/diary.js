/**
 * Cloudflare Pages Function: Food Diary API
 * GET /api/diary?date=YYYY-MM-DD -> returns entries
 * POST /api/diary -> add entry
 * DELETE /api/diary?id=... OR ?clearDate=... -> remove entry
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
    const url = new URL(context.request.url);
    const dateParam = url.searchParams.get('date');

    let query = "SELECT * FROM diary_entries ORDER BY timestamp DESC LIMIT 100";
    let params = [];

    if (dateParam) {
      query = "SELECT * FROM diary_entries WHERE date = ? ORDER BY timestamp DESC";
      params = [dateParam];
    }

    const { results } = await db.prepare(query).bind(...params).all();

    const formatted = (results || []).map(r => ({
      id: r.id,
      date: r.date,
      time: r.time,
      timestamp: r.timestamp,
      mealType: r.meal_type,
      stallName: r.stall_name,
      menuName: r.menu_name,
      calories: Number(r.calories),
      price: Number(r.price),
      modifiers: typeof r.modifiers === 'string' ? JSON.parse(r.modifiers || '[]') : (r.modifiers || []),
      isAiRecognized: Boolean(r.is_ai_recognized),
      imageUrl: r.image_url,
      nutrition: typeof r.nutrition === 'string' ? JSON.parse(r.nutrition || 'null') : (r.nutrition || null)
    }));

    return new Response(JSON.stringify({
      success: true,
      entries: formatted
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
    const entry = await context.request.json();
    const id = entry.id || ('entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
    const modStr = JSON.stringify(entry.modifiers || []);
    const nutStr = entry.nutrition ? JSON.stringify(entry.nutrition) : null;

    await db.prepare(`
      INSERT INTO diary_entries (
        id, date, time, timestamp, meal_type, stall_name, menu_name, calories, price, modifiers, is_ai_recognized, image_url, nutrition
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      entry.date || new Date().toISOString().split('T')[0],
      entry.time || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      entry.timestamp || Date.now(),
      entry.mealType || 'lunch',
      entry.stallName || 'ทั่วไป',
      entry.menuName || 'เมนูอาหาร',
      Number(entry.calories) || 0,
      Number(entry.price) || 0,
      modStr,
      entry.isAiRecognized ? 1 : 0,
      entry.imageUrl || null,
      nutStr
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id,
      message: "Diary entry saved to D1"
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

export async function onRequestDelete(context) {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database 'DB' binding not found" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(context.request.url);
    const entryId = url.searchParams.get('id');
    const clearDate = url.searchParams.get('clearDate');

    if (entryId) {
      await db.prepare("DELETE FROM diary_entries WHERE id = ?").bind(entryId).run();
      return new Response(JSON.stringify({ success: true, message: "Entry deleted from D1" }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (clearDate) {
      await db.prepare("DELETE FROM diary_entries WHERE date = ?").bind(clearDate).run();
      return new Response(JSON.stringify({ success: true, message: `All entries for ${clearDate} deleted from D1` }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Missing 'id' or 'clearDate' parameter" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
