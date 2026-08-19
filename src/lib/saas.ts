import { apiBase } from './cloudflare'
import { getIdToken } from './auth'
import type { PlanId } from './plans'
import type { TeamRole } from './types'

export interface SaaSWorkspace {
  id: string
  name: string
  role: TeamRole
  createdAt: string
}

export interface AccountSummary {
  user: { uid: string; email: string; name: string }
  subscription: {
    plan: PlanId
    status: 'free' | 'pending' | 'active' | 'past_due' | 'canceled'
    currentPeriodEnd: string | null
  }
  limits: { workspaces: number; members: number; aiActionsMonthly: number }
  usage: { aiActions: number }
  workspaces: SaaSWorkspace[]
}

async function accountFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getIdToken()
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  const body = (await response.json().catch(() => null)) as ({ error?: string } & T) | null
  if (!response.ok) throw new Error(body?.error ?? `Erro ${response.status} na conta`)
  return body as T
}

export function loadAccount(): Promise<AccountSummary> {
  return accountFetch<AccountSummary>('/account')
}

export async function startCheckout(plan: Exclude<PlanId, 'free'>): Promise<{ url: string }> {
  return accountFetch('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  })
}

export function cancelSubscription(reason?: string): Promise<{ ok: true; accessUntil: string }> {
  return accountFetch('/billing/subscription', {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  })
}

export function createCloudWorkspace(name: string): Promise<{ workspace: SaaSWorkspace }> {
  return accountFetch('/account/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function inviteWorkspaceMember(
  workspaceId: string,
  member: { email: string; name: string; role: Exclude<TeamRole, 'owner'> },
): Promise<{ ok: true }> {
  return accountFetch(`/account/workspaces/${encodeURIComponent(workspaceId)}/members`, {
    method: 'POST',
    body: JSON.stringify(member),
  })
}
