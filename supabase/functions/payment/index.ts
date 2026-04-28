import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getAuthUser, requireAuth } from '../_shared/auth.ts'
import { getSubPath, matchPath } from '../_shared/db.ts'
import Stripe from 'npm:stripe@17'

function getStripe(): Stripe {
  const key = Deno.env.get('STRIPE_SECRET_KEY')
  if (!key) throw { status: 503, detail: 'Stripe is not configured' }
  return new Stripe(key, { apiVersion: '2025-03-31.basil' })
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const url = new URL(req.url)
  const path = getSubPath(url, 'payment')
  const method = req.method

  try {
    const authUser = await getAuthUser(req)

    // POST /checkout — create a Stripe checkout session
    if (method === 'POST' && path === '/checkout') {
      requireAuth(authUser)
      const body = await req.json()

      const {
        amount,
        currency = 'usd',
        stripe_price_id,
        quantity = 1,
        mode = 'payment',
        ui_mode = 'hosted',
        return_url,
        success_url,
        cancel_url,
        metadata,
        idempotency_key,
      } = body

      // Validate
      if (mode === 'subscription' && !stripe_price_id) {
        return errorResponse('stripe_price_id is required for subscription mode', 400)
      }
      if (mode === 'payment' && !amount && !stripe_price_id) {
        return errorResponse('Either amount or stripe_price_id is required for payment mode', 400)
      }
      if (ui_mode === 'embedded' && !return_url) {
        return errorResponse('return_url is required for embedded ui_mode', 400)
      }
      if (ui_mode === 'hosted' && (!success_url || !cancel_url)) {
        return errorResponse('success_url and cancel_url are required for hosted ui_mode', 400)
      }

      const stripe = getStripe()

      let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
      if (mode === 'subscription' || stripe_price_id) {
        lineItems = [{ price: stripe_price_id, quantity }]
      } else {
        const amountCents = Math.round(parseFloat(amount) * 100)
        lineItems = [{
          price_data: {
            currency,
            product_data: { name: 'Payment' },
            unit_amount: amountCents,
          },
          quantity,
        }]
      }

      const params: Stripe.Checkout.SessionCreateParams = {
        line_items: lineItems,
        mode,
        metadata: metadata ?? {},
      }

      if (ui_mode === 'embedded') {
        params.ui_mode = 'embedded'
        params.return_url = return_url
      } else {
        params.success_url = success_url
        params.cancel_url = cancel_url
      }

      const options: Stripe.RequestOptions = {}
      if (idempotency_key) options.idempotencyKey = idempotency_key

      const session = await stripe.checkout.sessions.create(params, options)

      return jsonResponse({
        url: session.url ?? null,
        client_secret: session.client_secret ?? null,
        session_id: session.id,
      })
    }

    // GET /checkout/:session_id/status
    const statusMatch = matchPath('/checkout/:session_id/status', path)
    if (method === 'GET' && statusMatch) {
      requireAuth(authUser)
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(statusMatch.session_id)
      return jsonResponse({
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: session.metadata ?? {},
      })
    }

    return errorResponse('Not found', 404)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; detail: string }
      return errorResponse(e.detail, e.status)
    }
    console.error('payment error:', err)
    return errorResponse('Internal server error', 500)
  }
})
