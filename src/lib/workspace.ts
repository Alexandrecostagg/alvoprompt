import { db, getWorkspaces, newKey, saveWorkspace } from './db'
import { pullWorkspacesCloud, pushWorkspacesCloud, type SerializableWorkspace } from './syncWorker'
import type { BrandKit, TeamRole, Workspace, WorkspaceMember } from './types'

export const ROLE_LABEL: Record<TeamRole, string> = {
  owner: 'Dono',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Espectador',
}

export const ROLE_ORDER: TeamRole[] = ['owner', 'admin', 'editor', 'viewer']

export function canManage(ws: Workspace): boolean {
  return ws.myRole === 'owner' || ws.myRole === 'admin'
}

export function canEdit(ws: Workspace): boolean {
  return ws.myRole === 'owner' || ws.myRole === 'admin' || ws.myRole === 'editor'
}

export function defaultBrandKit(): BrandKit {
  return {
    name: 'Marca AlvoPrompter',
    primaryColor: '#8B5CF6',
    accentColor: '#22D3EE',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  }
}

export function newWorkspace(name: string): Workspace {
  const now = Date.now()
  return {
    key: newKey('w'),
    name,
    myRole: 'owner',
    members: [{ name: 'Você', role: 'owner' }],
    brandKit: defaultBrandKit(),
    createdAt: now,
    updatedAt: now,
  }
}

export async function listWorkspaces(): Promise<Workspace[]> {
  return getWorkspaces()
}

export async function upsertWorkspace(workspace: Workspace): Promise<number> {
  return saveWorkspace(workspace)
}

export async function removeWorkspace(id: number): Promise<void> {
  await db.workspaces.delete(id)
}

export async function setMember(
  workspace: Workspace,
  index: number,
  member: WorkspaceMember,
): Promise<number> {
  const members = [...workspace.members]
  members[index] = member
  return saveWorkspace({ ...workspace, members, updatedAt: Date.now() })
}

export async function addMember(workspace: Workspace, member: WorkspaceMember): Promise<number> {
  return saveWorkspace({
    ...workspace,
    members: [...workspace.members, member],
    updatedAt: Date.now(),
  })
}

export async function removeMember(workspace: Workspace, index: number): Promise<number> {
  const members = workspace.members.filter((_, i) => i !== index)
  return saveWorkspace({ ...workspace, members, updatedAt: Date.now() })
}

function toSerializable(ws: Workspace): SerializableWorkspace {
  return {
    key: ws.key ?? '',
    name: ws.name,
    myRole: ws.myRole,
    members: ws.members.map((m) => ({ name: m.name, email: m.email, role: m.role })),
    brandKit: ws.brandKit
      ? {
          name: ws.brandKit.name,
          logoDataUrl: ws.brandKit.logoDataUrl,
          primaryColor: ws.brandKit.primaryColor,
          accentColor: ws.brandKit.accentColor,
          fontFamily: ws.brandKit.fontFamily,
        }
      : undefined,
    createdAt: ws.createdAt,
    updatedAt: ws.updatedAt,
  }
}

/** Merge local + nuvem por key (o mais recente vence) e publica o resultado. */
export async function syncWorkspaces(pass: string): Promise<{ added: number }> {
  const cloud = await pullWorkspacesCloud(pass)
  const local = await getWorkspaces()
  const merged = new Map<string, Workspace>()
  for (const w of local) {
    if (w.key) merged.set(w.key, w)
  }
  let added = 0
  for (const c of cloud) {
    const existing = merged.get(c.key)
    if (!existing) {
      merged.set(c.key, {
        ...(c as unknown as Workspace),
        id: undefined,
        members: c.members.map((m) => ({
          name: m.name,
          email: m.email,
          role: m.role as TeamRole,
        })),
        brandKit: c.brandKit
          ? {
              name: c.brandKit.name,
              logoDataUrl: c.brandKit.logoDataUrl,
              primaryColor: c.brandKit.primaryColor,
              accentColor: c.brandKit.accentColor,
              fontFamily: c.brandKit.fontFamily,
            }
          : undefined,
      })
      added++
    } else if (c.updatedAt > existing.updatedAt) {
      merged.set(c.key, {
        ...existing,
        name: c.name,
        members: c.members.map((m) => ({
          name: m.name,
          email: m.email,
          role: m.role as TeamRole,
        })),
        brandKit: c.brandKit
          ? {
              name: c.brandKit.name,
              logoDataUrl: c.brandKit.logoDataUrl,
              primaryColor: c.brandKit.primaryColor,
              accentColor: c.brandKit.accentColor,
              fontFamily: c.brandKit.fontFamily,
            }
          : undefined,
        updatedAt: c.updatedAt,
      })
    }
  }
  const final = [...merged.values()]
  await db.transaction('rw', db.workspaces, async () => {
    await db.workspaces.clear()
    await db.workspaces.bulkAdd(final)
  })
  await pushWorkspacesCloud(
    pass,
    final.map((w) => toSerializable(w)),
  )
  return { added }
}
