import { createClient } from '../supabase/client'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/api$/, '') + '/api'

export async function fetchApi(path: string, options: RequestInit = {}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers = new Headers(options.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json')

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    let msg = res.statusText
    try {
      const data = await res.json()
      msg = data.detail || msg
    } catch (e) {}
    throw new Error(msg)
  }
  return res.json()
}

export async function getCart() {
  return fetchApi('/cart');
}

export async function addToCart(artwork_id: string) {
  return fetchApi('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ artwork_id })
  });
}

export async function removeFromCart(artwork_id: string) {
  return fetchApi(`/cart/items/${artwork_id}`, {
    method: 'DELETE'
  });
}

export async function createCheckoutSession(shipping_address: any) {
  return fetchApi('/checkout/session', {
    method: 'POST',
    body: JSON.stringify({ shipping_address })
  });
}

export async function confirmCheckout(order_id: string) {
  return fetchApi(`/checkout/confirm/${order_id}`, {
    method: 'POST'
  });
}

export async function getNotificationUnreadCount() {
  return fetchApi('/notifications/unread-count');
}

export async function getNotifications(skip: number = 0, limit: number = 50) {
  return fetchApi(`/notifications?skip=${skip}&limit=${limit}`);
}

export async function markNotificationRead(id: string) {
  return fetchApi(`/notifications/${id}/read`, {
    method: 'PATCH'
  });
}

export async function markAllNotificationsRead() {
  return fetchApi(`/notifications/read-all`, {
    method: 'PATCH'
  });
}

export async function applyForVerification() {
  return fetchApi('/verification/apply', {
    method: 'POST'
  });
}
