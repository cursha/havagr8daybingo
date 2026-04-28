import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getAuthUser, requireAuth } from '../_shared/auth.ts'
import { getSupabase, getSubPath } from '../_shared/db.ts'

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const url = new URL(req.url)
  const path = getSubPath(url, 'users')
  const method = req.method
  const supabase = getSupabase()

  try {
    const authUser = await getAuthUser(req)

    // GET /profile
    if (method === 'GET' && path === '/profile') {
      const user = requireAuth(authUser)
      const { data, error } = await supabase
        .from('users')
        .select('id, email, username, name, role, last_login, profile_completed, signup_bonus_granted, first_name, last_name')
        .eq('id', user.sub)
        .maybeSingle()
      if (error) throw error
      if (!data) return errorResponse('User profile not found', 404)
      return jsonResponse(data)
    }

    // PUT /profile
    if (method === 'PUT' && path === '/profile') {
      const user = requireAuth(authUser)
      const body = await req.json()
      const updates: Record<string, string> = {}
      if (body.name !== undefined) updates.name = String(body.name)

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.sub)
        .select('id, email, username, name, role, last_login, profile_completed, signup_bonus_granted, first_name, last_name')
        .maybeSingle()
      if (error) throw error
      if (!data) return errorResponse('User profile not found', 404)
      return jsonResponse(data)
    }

    return errorResponse('Not found', 404)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; detail: string }
      return errorResponse(e.detail, e.status)
    }
    console.error('users error:', err)
    return errorResponse('Internal server error', 500)
  }
})
