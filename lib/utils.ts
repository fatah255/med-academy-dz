import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const modulesByYear = [
  {
    year: "FIRST_YEAR",
    modules: [
      { name: "Anatomie", type: "MODULE", icon: "🫀" },
      { name: "Biochimie", type: "MODULE", icon: "🧪" },
      { name: "Cytologie", type: "MODULE", icon: "🧫" },
      { name: "Embryologie", type: "MODULE", icon: "👶" },
      { name: "Histologie", type: "MODULE", icon: "🔬" },
      { name: "Physiologie", type: "MODULE", icon: "🧠" },
      { name: "Biostatistique", type: "MODULE", icon: "📊" },
      { name: "Santé société humanité (SSH)", type: "MODULE", icon: "🤝" },
    ],
  },
  {
    year: "SECOND_YEAR",
    modules: [
      { name: "Unité Cardio-Respiratoire", type: "UNITE", icon: "❤️" },
      { name: "Unité Digestive", type: "UNITE", icon: "🫃" },
      { name: "Unité Urinaire", type: "UNITE", icon: "💧" },
      { name: "Unité Endocrinienne", type: "UNITE", icon: "🦋" },
      { name: "Unité Neuro-Sensorielle", type: "UNITE", icon: "🧠" },
      { name: "Immunologie fondamentale", type: "MODULE", icon: "🧬" },
      { name: "Génétique", type: "MODULE", icon: "🧪" },
    ],
  },
  {
    year: "THIRD_YEAR",
    modules: [
      { name: "Appareil Cardio-respiratoire", type: "UNITE", icon: "🫀" },
      {
        name: "Appareil Neurologique, Locomoteur et Cutané",
        type: "UNITE",
        icon: "🧠",
      },
      {
        name: "Appareil Endocrinienne de Reproduction",
        type: "UNITE",
        icon: "🧬",
      },
      { name: "Appareil Digestif", type: "UNITE", icon: "🫃" },
      { name: "Immunologie clinique", type: "MODULE", icon: "🧫" },
      { name: "ACP (Anapath)", type: "MODULE", icon: "🦠" },
      { name: "Parasitologie", type: "MODULE", icon: "🦟" },
      { name: "Pharmacologie", type: "MODULE", icon: "💊" },
      { name: "Microbiologie", type: "MODULE", icon: "🧪" },
    ],
  },
  {
    year: "FOURTH_YEAR",
    modules: [
      { name: "Maladies Infectieuses", type: "MODULE", icon: "🦠" },
      { name: "Hématologie", type: "MODULE", icon: "🩸" },
      { name: "Cardiologie", type: "MODULE", icon: "❤️" },
      { name: "Pneumologie", type: "MODULE", icon: "🫁" },
      { name: "Neurologie", type: "MODULE", icon: "🧠" },
      {
        name: "HGE Hépatologie – Gastro – Entérologie",
        type: "MODULE",
        icon: "🩻",
      },
      { name: "Oncologie", type: "MODULE", icon: "🎗️" },
    ],
  },
  {
    year: "FIFTH_YEAR",
    modules: [
      { name: "Psychiatrie", type: "MODULE", icon: "🧠" },
      {
        name: "Endocrinologie, Diabétologie",
        type: "MODULE",
        icon: "🩸",
      },
      {
        name: "Appareil locomoteur (Orthopédie-Rhumatologie)",
        type: "MODULE",
        icon: "🦴",
      },
      { name: "Pédiatrie", type: "MODULE", icon: "👶" },
      { name: "Gynécologie", type: "MODULE", icon: "♀️" },
      { name: "Urologie", type: "MODULE", icon: "🩻" },
      { name: "Néphrologie", type: "MODULE", icon: "🧫" },
    ],
  },
  {
    year: "SIXTH_YEAR",
    modules: [
      { name: "Médecine de travail", type: "MODULE", icon: "👷‍♀️" },
      { name: "Ophtalmologie", type: "MODULE", icon: "👁️" },
      { name: "ORL", type: "MODULE", icon: "👂" },
      {
        name: "Médecine légale & Droit Médical",
        type: "MODULE",
        icon: "⚖️",
      },
      { name: "Dermatologie", type: "MODULE", icon: "🧴" },
      { name: "UMC", type: "MODULE", icon: "🏥" },
      { name: "Maladies Systémiques", type: "MODULE", icon: "🧬" },
      { name: "Gériatrie", type: "MODULE", icon: "🧓" },
      { name: "Épidémiologie", type: "MODULE", icon: "📈" },
    ],
  },
];

export function formatTimeDelta(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  const secs = Math.floor(seconds - hours * 3600 - minutes * 60);
  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0) {
    parts.push(`${secs}s`);
  }
  return parts.join(" ");
}
