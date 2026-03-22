/** Score → color mapping used everywhere */
export function getScoreColor(score: number): string {
  if (score >= 90) return "#FFD700";
  if (score >= 75) return "#00E5A0";
  if (score >= 60) return "#FBBF24";
  if (score >= 40) return "#F97316";
  return "#EF4444";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Great";
  if (score >= 60) return "Average";
  if (score >= 40) return "Below Average";
  return "Needs Attention";
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "mild":
      return "#00E5A0";
    case "moderate":
      return "#FBBF24";
    case "severe":
      return "#EF4444";
    default:
      return "#6B7280";
  }
}

export interface ScanResult {
  id: string;
  created_at: string;
  overall_score: number;
  clarity_score: number;
  glow_score: number;
  texture_score: number;
  hydration_score: number;
  evenness_score: number;
  firmness_score: number;
  skin_age: number;
  percentile: number;
  conditions: {
    name: string;
    severity: string;
    area: string;
    description: string;
  }[];
  score_killer: string;
  improvement_plan: {
    step: number;
    action: string;
    why: string;
    impact: string;
  }[];
  product_recs: {
    product: string;
    brand: string;
    why: string;
    price_range: string;
  }[];
  dietary_triggers: {
    trigger: string;
    impact: string;
    recommendation: string;
  }[];
}
