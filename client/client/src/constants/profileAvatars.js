export const PROFILE_AVATARS = [
  { id: "sunrise", label: "Sunrise", emoji: "🌅", background: "linear-gradient(135deg, #fb923c, #f43f5e)" },
  { id: "builder", label: "Builder", emoji: "🧑‍🔧", background: "linear-gradient(135deg, #38bdf8, #2563eb)" },
  { id: "creative", label: "Creative", emoji: "🎨", background: "linear-gradient(135deg, #c084fc, #7c3aed)" },
  { id: "nature", label: "Nature", emoji: "🌿", background: "linear-gradient(135deg, #4ade80, #059669)" },
  { id: "star", label: "Star", emoji: "🧑‍🚀", background: "linear-gradient(135deg, #818cf8, #4338ca)" },
  { id: "reader", label: "Reader", emoji: "📚", background: "linear-gradient(135deg, #fbbf24, #d97706)" },
  { id: "runner", label: "Runner", emoji: "🏃", background: "linear-gradient(135deg, #2dd4bf, #0f766e)" },
  { id: "friendly", label: "Friendly", emoji: "😊", background: "linear-gradient(135deg, #f472b6, #db2777)" }
];

export const getProfileAvatar = (avatarId) =>
  PROFILE_AVATARS.find((avatar) => avatar.id === avatarId) || PROFILE_AVATARS[0];
