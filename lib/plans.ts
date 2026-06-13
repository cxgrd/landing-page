export type SubscriptionPlan = 'free' | 'pro' | 'team';

export const FREE_MONTHLY_AUDIT_LIMIT = 50;
export const FREE_PLAN_FEATURES = [
  '50 audits per month',
  'Local dependency graph (AST)',
  'Blast radius analysis',
  'Compiler-backed checks',
  'No cloud storage',
  'Personal use only',
] as const;

export const PRO_PLAN_FEATURES = [
  'Unlimited audits',
  'Prompt enrichment & repo memory',
  'Advanced analysis features',
  'Cloud backup & sync',
  'Priority support',
  'API access',
] as const;

export const TEAM_PLAN_FEATURES = [
  'Everything in Pro',
  'Shared dependency graph',
  'Role-based audit policies',
  'Team dashboard & analytics',
  'Architecture health metrics',
  'Merge policy enforcement',
] as const;

export interface PlanTier {
  key: SubscriptionPlan;
  name: string;
  description: string;
  priceLabel: string;
  periodLabel: string;
  features: readonly string[];
  monthlyAuditLimit: number | null;
  cloudStorageEnabled: boolean;
  personalUseOnly: boolean;
  teamFeaturesEnabled: boolean;
}

export const PLAN_TIERS: Record<SubscriptionPlan, PlanTier> = {
  free: {
    key: 'free',
    name: 'Free',
    description: 'Perfect for personal local analysis',
    priceLabel: '$0',
    periodLabel: 'forever',
    features: FREE_PLAN_FEATURES,
    monthlyAuditLimit: FREE_MONTHLY_AUDIT_LIMIT,
    cloudStorageEnabled: false,
    personalUseOnly: true,
    teamFeaturesEnabled: false,
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    description: 'For advanced analysis, cloud sync, and API workflows',
    priceLabel: '$19',
    periodLabel: 'month',
    features: PRO_PLAN_FEATURES,
    monthlyAuditLimit: null,
    cloudStorageEnabled: true,
    personalUseOnly: false,
    teamFeaturesEnabled: false,
  },
  team: {
    key: 'team',
    name: 'Team',
    description: 'Shared graph, audit policies, and merge enforcement for eng teams',
    priceLabel: '$16',
    periodLabel: 'seat / month',
    features: TEAM_PLAN_FEATURES,
    monthlyAuditLimit: null,
    cloudStorageEnabled: true,
    personalUseOnly: false,
    teamFeaturesEnabled: true,
  },
};

export function normalizePlan(plan: string | undefined | null): SubscriptionPlan {
  if (plan?.toLowerCase() === 'pro') return 'pro';
  if (plan?.toLowerCase() === 'team') return 'team';
  return 'free';
}

export function isProPlan(plan: SubscriptionPlan): boolean {
  // team inherits all pro features
  return plan === 'pro' || plan === 'team';
}

export function isTeamPlan(plan: SubscriptionPlan): boolean {
  return plan === 'team';
}

export function getPlanTier(plan: string | undefined | null): PlanTier {
  return PLAN_TIERS[normalizePlan(plan)];
}
