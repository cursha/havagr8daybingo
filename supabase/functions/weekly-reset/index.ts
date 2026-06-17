import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabase } from '../_shared/db.ts'
import { sendEmail } from '../_shared/email.ts'

const SITE_URL = 'https://havagr8day.com'

function newWeekEmail(name: string | null, weekLabel: string): { subject: string; html: string } {
  const hi = name && name.trim() ? name.trim() : 'there'
  return {
    subject: `🎯 Your new Havagr8day Bingo card is ready — ${weekLabel}`,
    html: `
    <div style="background:#f1f5f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
        <div style="background:#4FB3E8;padding:20px 24px;text-align:center">
          <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:0.5px">Havagr8day Bingo</span>
        </div>
        <div style="padding:28px 24px;color:#1e293b;font-size:15px;line-height:1.6">
          <h2 style="margin:0 0 12px;color:#4F46E5;font-size:20px">New week, new card, ${hi}!</h2>
          <p>A fresh bingo card is waiting for you. Complete acts of kindness to mark your squares and go for Bingo!</p>
          <p style="text-align:center;margin:24px 0">
            <a href="${SITE_URL}/game" style="display:inline-block;background:#DC2626;color:#fff;font-weight:bold;padding:13px 30px;border-radius:10px;text-decoration:none;border:2px solid #FCD34D">Play This Week</a>
          </p>
          <p style="color:#64748b;font-size:13px">Have a gr8 day — and make someone else's gr8 too.</p>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;text-align:center">
          Spreading kindness one good deed at a time.<br/>
          <a href="${SITE_URL}" style="color:#6366F1;text-decoration:none">havagr8day.com</a>
        </div>
      </div>
    </div>`,
  }
}

function drawWinnerEmail(name: string | null, weekLabel: string): { subject: string; html: string } {
  const hi = name && name.trim() ? name.trim() : 'there'
  return {
    subject: `🎉 You won the Havagr8day draw — ${weekLabel}!`,
    html: `
    <div style="background:#f1f5f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:20px 24px;text-align:center">
          <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:0.5px">🏆 You're a Winner!</span>
        </div>
        <div style="padding:28px 24px;color:#1e293b;font-size:15px;line-height:1.6">
          <h2 style="margin:0 0 12px;color:#4F46E5;font-size:20px">Congratulations, ${hi}!</h2>
          <p>Your kindness paid off — you've been selected as this week's Havagr8day Bingo draw winner!</p>
          <p>The Havagr8day team will be in touch about your prize. Keep doing good things out there!</p>
          <p style="text-align:center;margin:24px 0">
            <a href="${SITE_URL}/game" style="display:inline-block;background:#DC2626;color:#fff;font-weight:bold;padding:13px 30px;border-radius:10px;text-decoration:none;border:2px solid #FCD34D">Play Again This Week</a>
          </p>
          <p style="color:#64748b;font-size:13px">Have a gr8 day — and make someone else's gr8 too.</p>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;text-align:center">
          Spreading kindness one good deed at a time.<br/>
          <a href="${SITE_URL}" style="color:#6366F1;text-decoration:none">havagr8day.com</a>
        </div>
      </div>
    </div>`,
  }
}

function getCurrentWeekLabel(): string {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const diff = now.getTime() - startOfWeek1.getTime()
  const week = Math.ceil((diff / 86400000 + 1) / 7)
  return `Week ${week}, ${now.getFullYear()}`
}

function getPreviousWeekYear(): string {
  // Returns the week_year string (YYYY-Www) for the week that just ended
  const now = new Date()
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const jan4 = new Date(lastWeek.getFullYear(), 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const diff = lastWeek.getTime() - startOfWeek1.getTime()
  const week = Math.ceil((diff / 86400000 + 1) / 7)
  return `${lastWeek.getFullYear()}-W${String(week).padStart(2, '0')}`
}

async function runWeeklyDraw(supabase: ReturnType<typeof import('../_shared/db.ts').getSupabase>): Promise<{
  winner_id: string | null
  winner_name: string | null
  winner_email: string | null
  entries: number
  week_year: string
  already_ran: boolean
}> {
  const weekYear = getPreviousWeekYear()

  // Idempotent: don't run draw twice for same week
  const { data: existing } = await supabase
    .from('draw_winners').select('id, user_id').eq('week_year', weekYear).maybeSingle()
  if (existing) {
    return { winner_id: existing.user_id, winner_name: null, winner_email: null, entries: 0, week_year: weekYear, already_ran: true }
  }

  // Fetch all draw entries for this week with player info
  const { data: entries } = await supabase
    .from('draw_entries')
    .select('user_id, users!inner(email, first_name, name, username)')
    .eq('week_year', weekYear)

  if (!entries || entries.length === 0) {
    return { winner_id: null, winner_name: null, winner_email: null, entries: 0, week_year: weekYear, already_ran: false }
  }

  // Load recent winner weight from config (default 0.05 = 5% odds)
  const { data: weightConfig } = await supabase
    .from('game_configs').select('value').eq('key', 'recent_winner_weight').maybeSingle()
  const recentWinnerWeight = weightConfig ? parseFloat(weightConfig.value) : 0.05

  const { data: monthsConfig } = await supabase
    .from('game_configs').select('value').eq('key', 'recent_winner_months').maybeSingle()
  const recentWinnerMonths = monthsConfig ? parseInt(monthsConfig.value) : 4

  // Fetch recent winners (last N months) to apply reduced odds
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - recentWinnerMonths)
  const { data: recentWinners } = await supabase
    .from('draw_winners')
    .select('user_id')
    .gte('selected_at', cutoff.toISOString())
  const recentWinnerIds = new Set((recentWinners ?? []).map((w: any) => w.user_id))

  // Build weighted pool
  const pool: Array<{ user_id: string; weight: number; user: any }> = entries.map((e: any) => ({
    user_id: e.user_id,
    weight: recentWinnerIds.has(e.user_id) ? recentWinnerWeight : 1.0,
    user: e.users,
  }))

  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0)

  // Cryptographically random weighted selection
  const randBuf = new Uint32Array(1)
  crypto.getRandomValues(randBuf)
  let rand = (randBuf[0] / 4_294_967_296) * totalWeight

  let winner = pool[pool.length - 1]
  for (const entry of pool) {
    rand -= entry.weight
    if (rand <= 0) {
      winner = entry
      break
    }
  }

  const winnerOddsWeight = recentWinnerIds.has(winner.user_id) ? recentWinnerWeight : 1.0

  // Record the winner
  await supabase.from('draw_winners').insert({
    user_id: winner.user_id,
    week_year: weekYear,
    odds_weight: winnerOddsWeight,
  })

  const winnerName = winner.user?.first_name ?? winner.user?.name ?? winner.user?.username ?? null

  return {
    winner_id: winner.user_id,
    winner_name: winnerName,
    winner_email: winner.user?.email ?? null,
    entries: entries.length,
    week_year: weekYear,
    already_ran: false,
  }
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  // Allow GET for cron invocation, POST for manual trigger
  if (req.method !== 'GET' && req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  // Verify the cron secret to prevent unauthorized triggers
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse('Unauthorized', 401)
    }
  }

  const supabase = getSupabase()

  try {
    // ── Run weekly draw ───────────────────────────────────────────────────────
    const draw = await runWeeklyDraw(supabase)

    // Notify draw winner by email (best-effort)
    if (draw.winner_email && !draw.already_ran) {
      const weekLabel = getCurrentWeekLabel().replace('Week', 'the week of')
      const tpl = drawWinnerEmail(draw.winner_name, weekLabel)
      await sendEmail({ to: draw.winner_email, subject: tpl.subject, html: tpl.html })
    }

    // ── Send new-week emails to all players ───────────────────────────────────
    const { data: players, error } = await supabase
      .from('users')
      .select('email, first_name, name, username')
      .eq('email_verified', true)
      .eq('role', 'user')

    if (error) throw error

    const weekLabel = getCurrentWeekLabel()
    let sent = 0
    let failed = 0

    if (players && players.length > 0) {
      for (const player of players) {
        const displayName = player.first_name ?? player.name ?? player.username ?? null
        const tpl = newWeekEmail(displayName, weekLabel)
        const result = await sendEmail({ to: player.email, subject: tpl.subject, html: tpl.html })
        if (result.sent) sent++
        else failed++
      }
    }

    return jsonResponse({
      success: true,
      sent,
      failed,
      week: weekLabel,
      draw: {
        week_year: draw.week_year,
        entries: draw.entries,
        winner_id: draw.winner_id,
        winner_name: draw.winner_name,
        already_ran: draw.already_ran,
      },
    })
  } catch (err) {
    console.error('weekly-reset error:', err)
    return errorResponse('Internal server error', 500)
  }
})
