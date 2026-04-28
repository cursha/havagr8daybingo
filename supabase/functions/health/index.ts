import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabase, getSubPath } from '../_shared/db.ts'

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const url = new URL(req.url)
  const path = getSubPath(url, 'health')

  if (req.method === 'GET' && (path === '/' || path === '')) {
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from('users').select('id').limit(1)
      if (error) throw error
      return jsonResponse({ status: 'healthy', database: 'connected' })
    } catch (err) {
      console.error('Health check failed:', err)
      return errorResponse('Database connection failed', 503)
    }
  }

  return errorResponse('Not found', 404)
})
