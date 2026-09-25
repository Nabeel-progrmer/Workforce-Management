import { Building2, CheckSquare, Clock, Code, CreditCard, ShieldCheck, UserRound, Users } from "lucide-react";

export const PROFILE_AVATARS = [
  { id: "professional", label: "Professional", Icon: UserRound, background: "linear-gradient(135deg, #475569, #1e293b)" },
  { id: "team-lead", label: "Team lead", Icon: Users, background: "linear-gradient(135deg, #2563eb, #1d4ed8)" },
  { id: "operations", label: "Operations", Icon: Building2, background: "linear-gradient(135deg, #0f766e, #115e59)" },
  { id: "security", label: "Security", Icon: ShieldCheck, background: "linear-gradient(135deg, #7c3aed, #5b21b6)" },
  { id: "developer", label: "Developer", Icon: Code, background: "linear-gradient(135deg, #0891b2, #155e75)" },
  { id: "project", label: "Project", Icon: CheckSquare, background: "linear-gradient(135deg, #d97706, #b45309)" },
  { id: "finance", label: "Finance", Icon: CreditCard, background: "linear-gradient(135deg, #059669, #047857)" },
  { id: "schedule", label: "Schedule", Icon: Clock, background: "linear-gradient(135deg, #db2777, #9d174d)" }
];

export const getProfileAvatar = (avatarId) =>
  PROFILE_AVATARS.find((avatar) => avatar.id === (avatarId === "sunrise" ? "professional" : avatarId)) || PROFILE_AVATARS[0];
