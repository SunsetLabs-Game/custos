import type { CSSProperties } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Cpu,
  Scan,
  Globe,
  History,
  Lock,
  Sparkles,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  Share2,
  Copy,
  Terminal,
  Radio,
  Eye,
  Activity,
  Layers,
  Upload,
  Play,
  Trash2,
  HelpCircle,
  Home,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  UserCheck,
  type LucideIcon
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon | React.ComponentType<{ size?: number | string; style?: CSSProperties }>> = {
  shield: Shield,
  verified_user: ShieldCheck,
  verified: ShieldCheck,
  shield_alert: ShieldAlert,
  warning: AlertTriangle,
  error: AlertCircle,
  block: XCircle,
  close: X,
  check: Check,
  check_circle: CheckCircle2,
  task_alt: CheckCircle2,
  cancel: XCircle,
  crop_free: Scan,
  scanner: Scan,
  search: Search,
  bolt: Zap,
  memory: Cpu,
  translate: LanguagesIcon,
  share: Share2,
  history: History,
  hub: Globe,
  home: Home,
  play_arrow: Play,
  delete_sweep: Trash2,
  file_upload: Upload,
  lock: Lock,
  arrow_forward: ArrowRight,
  trending_up: TrendingUp,
  support_agent: UserCheck,
  content_copy: Copy,
};

function LanguagesIcon({ size = 18, style }: { size?: number | string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2 3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

export function Icon({
  name,
  size = 18,
  style,
  className
}: {
  name: string;
  size?: number | string;
  style?: CSSProperties;
  className?: string;
}) {
  const Component = ICON_MAP[name] || Sparkles;
  return <Component size={size} style={style} className={className} />;
}
