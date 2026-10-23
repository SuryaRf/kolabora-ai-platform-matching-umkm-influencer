const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
];

export function initialsOf(name: string | null | undefined, fallback = "?") {
  if (!name) return fallback;
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function colorForName(name: string | null | undefined) {
  const key = name ?? "";
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function participantLabel(p: {
  name: string | null;
  businessName?: string | null;
  displayName?: string | null;
  email: string;
}) {
  return p.businessName || p.displayName || p.name || p.email;
}
