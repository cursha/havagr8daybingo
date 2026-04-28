import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'

export function getSupabase(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Strip the edge-function prefix from the request URL pathname.
 *  Works in both local emulator and Supabase cloud.
 *
 *  e.g.  /functions/v1/auth-custom/register  →  /register
 *        /register                            →  /register
 */
export function getSubPath(url: URL, functionName: string): string {
  const prefix = `/functions/v1/${functionName}`
  const raw = url.pathname.endsWith('/')
    ? url.pathname.slice(0, -1)
    : url.pathname
  if (raw.startsWith(prefix)) return raw.slice(prefix.length) || '/'
  return raw || '/'
}

/** Simple path-pattern matcher.
 *  Returns a params map when the pattern matches, null otherwise.
 *  e.g. matchPath('/admin/deeds/:id', '/admin/deeds/5') → { id: '5' }
 */
export function matchPath(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean)
  const ap = path.split('/').filter(Boolean)
  if (pp.length !== ap.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = ap[i]
    } else if (pp[i] !== ap[i]) {
      return null
    }
  }
  return params
}
