import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createAccessToken, getAuthUser, requireAuth } from '../_shared/auth.ts'
import { getSupabase, getSubPath } from '../_shared/db.ts'
import { sendEmail, referralJoinedEmail, welcomeEmail } from '../_shared/email.ts'
import bcrypt from 'npm:bcryptjs@2'

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const url = new URL(req.url)
  const rawPath = getSubPath(url, 'auth-custom')
  const path = rawPath.startsWith('/auth-custom') 
   ? rawPath.slice('/auth-custom'.length) || '/'
   : rawPath
  console.log('DEBUG fixed path:', path)
  console.log('DEBUG path:', path)
  console.log('DEBUG url.pathname:', url.pathname)
  const method = req.method
  const supabase = getSupabase()

  try {
    // POST /register
    if (method === 'POST' && path === '/register') {
      const body = await req.json()
      const email = String(body.email ?? '').trim().toLowerCase()
      const username = String(body.username ?? '').trim()
      const password = String(body.password ?? '')

      if (!email || !username || !password) {
        return errorResponse('email, username, and password are required', 400)
      }

      const { data: emailUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()
      if (emailUser) return errorResponse('An account with this email already exists.', 409)

      const { data: usernameUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle()
      if (usernameUser) return errorResponse('This username is already taken.', 409)

      const passwordHash = await bcrypt.hash(password, 10)
      const userId = crypto.randomUUID()

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          username,
          password_hash: passwordHash,
          name: username,
          role: 'user',
          last_login: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // If this email was referred by someone, validate that referral now and
      // reward each referrer. Their "Refer a Player" square auto-marks on their
      // next card load (generate-card re-syncs referral squares when a validated
      // referral exists). Best-effort: never block registration if this fails.
      try {
        const { data: pendingRefs } = await supabase
          .from('referrals')
          .select('id, user_id')
          .eq('referred_email', email)
          .eq('is_validated', false)
        if (pendingRefs && pendingRefs.length > 0) {
          await supabase.from('referrals')
            .update({ is_validated: true })
            .eq('referred_email', email)
            .eq('is_validated', false)
          const referrerIds = [...new Set(pendingRefs.map((r) => r.user_id))]
          for (const rid of referrerIds) {
            const { data: referrer } = await supabase
              .from('users').select('email').eq('id', rid).maybeSingle()
            if (referrer?.email) {
              const tpl = referralJoinedEmail(user.name ?? user.username ?? null)
              await sendEmail({ to: referrer.email, subject: tpl.subject, html: tpl.html })
            }
          }
        }
      } catch (refErr) {
        console.error('referral validation error:', refErr)
      }

      // Send a welcome email (best-effort, never blocks registration).
      try {
        const tpl = welcomeEmail(user.name ?? user.username ?? null)
        await sendEmail({ to: email, subject: tpl.subject, html: tpl.html })
      } catch (welErr) {
        console.error('welcome email error:', welErr)
      }

      const token = await createAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        last_login: user.last_login,
      })

      return jsonResponse({
        token,
        user_id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      })
    }

    // POST /login
    if (method === 'POST' && path === '/login') {
      const body = await req.json()
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (!user || !user.password_hash) {
        return errorResponse('Invalid email or password.', 401)
      }

      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) return errorResponse('Invalid email or password.', 401)

      const now = new Date().toISOString()
      await supabase.from('users').update({ last_login: now }).eq('id', user.id)

      const token = await createAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        last_login: now,
      })

      return jsonResponse({
        token,
        user_id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      })
    }

    // POST /logout
    if (method === 'POST' && path === '/logout') {
      return jsonResponse({ success: true, message: 'Logged out.' })
    }

    // GET /me
    if (method === 'GET' && path === '/me') {
      const user = await getAuthUser(req)
      requireAuth(user)
      return jsonResponse({
        id: user!.sub,
        email: user!.email,
        name: user!.name,
        role: user!.role,
        last_login: user!.last_login,
      })
    }

    return errorResponse('Not found', 404)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; detail: string }
      return errorResponse(e.detail, e.status)
    }
    console.error('auth-custom error:', err)
    return errorResponse('Internal server error', 500)
  }
})
