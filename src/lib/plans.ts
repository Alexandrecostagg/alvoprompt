export type PlanId = 'free' | 'creator' | 'studio'

export interface PlanDefinition {
  id: PlanId
  name: string
  priceMonthly: number
  description: string
  badge?: string
  features: string[]
  limits: {
    workspaces: number
    members: number
    aiActionsMonthly: number
  }
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Grátis',
    priceMonthly: 0,
    description: 'Para testar o prompter e gravar no próprio dispositivo.',
    features: ['Prompter e VoiceTrack', 'Roteiros salvos localmente', 'Gravação e modo espelho'],
    limits: { workspaces: 0, members: 1, aiActionsMonthly: 10 },
  },
  creator: {
    id: 'creator',
    name: 'Criador',
    priceMonthly: 29.9,
    description: 'Para quem publica com frequência e quer acelerar a produção.',
    badge: 'Mais escolhido',
    features: ['Tudo do plano Grátis', 'Sincronização em nuvem', '100 ações de IA por mês', 'Sem limite de roteiros'],
    limits: { workspaces: 1, members: 1, aiActionsMonthly: 100 },
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    priceMonthly: 79.9,
    description: 'Para marcas e pequenas equipes com aprovação e identidade visual.',
    features: ['Tudo do plano Criador', 'Até 5 membros', 'Papéis e permissões (RBAC)', 'Brand kit', '300 ações de IA por mês'],
    limits: { workspaces: 5, members: 5, aiActionsMonthly: 300 },
  },
}

export const PAID_PLAN_IDS: PlanId[] = ['creator', 'studio']

export function formatPlanPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
