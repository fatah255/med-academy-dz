import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const modulesByYear = [
  {
    year: "FIRST_YEAR",
    modules: [
      {
        name: "Anatomie",
        type: "MODULE",
        icon: "🫀",
        link: "https://drive.google.com/drive/folders/1C76WLmr1sRRG7kKwTBxucozo8XC5ca2o?usp=drive_link",
      },
      {
        name: "Biochimie",
        type: "MODULE",
        icon: "🧪",
        link: "https://drive.google.com/drive/folders/1eX0oUuOvvCr9nSvq2Y_Og0wDJZqWS4df?usp=drive_link",
      },
      {
        name: "Cytologie",
        type: "MODULE",
        icon: "🧫",
        link: "https://drive.google.com/drive/folders/1DgRQ7_ZfwL-_O7EpCiw0Br941ZsTroiV?usp=drive_link",
      },
      {
        name: "Embryologie",
        type: "MODULE",
        icon: "👶",
        link: "https://drive.google.com/drive/folders/1RY9onNzViG6clcSZsz1GZMnD3b23NL4-?usp=drive_link",
      },
      {
        name: "Histologie",
        type: "MODULE",
        icon: "🔬",
        link: "https://drive.google.com/drive/folders/143CA4z02LXeOs5ZR0Ri-NvmsIo1jOX54?usp=drive_link",
      },
      {
        name: "Physiologie",
        type: "MODULE",
        icon: "🧠",
        link: "https://drive.google.com/drive/folders/1GKxx0szcncFoYVIfWAyvV3k1sA4wXEKg?usp=drive_link",
      },
      {
        name: "Biostatistique",
        type: "MODULE",
        icon: "📊",
        link: "https://drive.google.com/drive/folders/1OK38xbcWY1aQ7sBm9-rpMdByUytsshIy?usp=drive_link",
      },
      {
        name: "Santé société humanité (SSH)",
        type: "MODULE",
        icon: "🤝",
        link: "",
      },
      {
        name: "Chimie",
        type: "MODULE",
        icon: "🧪",
        link: "https://drive.google.com/drive/folders/1Ckw1C0AOOx_XTJo8Y6t8zSd-THPzJrDf?usp=drive_link",
      },
      {
        name: "Biophysique",
        type: "MODULE",
        link: "https://drive.google.com/drive/folders/1b6N1eQ3_AqW9yfbAgM9EJ2KyOFO6kTqD?usp=drive_link  ",
      },
      {
        name: "Secourisme",
        type: "MODULE",
        link: "https://drive.google.com/drive/folders/19Zv-65G26yFaYjghGRAE7dxshB4Qnr42?usp=drive_link",
      },
    ],
  },
  {
    year: "SECOND_YEAR",
    modules: [
      {
        name: "Unité Cardio-Respiratoire",
        type: "UNITE",
        icon: "❤️",
        link: "https://drive.google.com/drive/folders/1GAyd6JVtZ2QDthW8G5biwGPzBgns_8Pa?usp=drive_link",
      },
      {
        name: "Unité Digestive",
        type: "UNITE",
        icon: "🫃",
        link: "https://drive.google.com/drive/folders/13IA2MFI-GJeshL_CI1WT0HE5Dyyyjyg1?usp=drive_link",
      },
      {
        name: "Unité Urinaire",
        type: "UNITE",
        icon: "💧",
        link: "https://drive.google.com/drive/folders/1BejQUcUFXTtvDGw37gFIdjegARgOz-BQ?usp=drive_link",
      },
      {
        name: "Unité Endocrinienne",
        type: "UNITE",
        icon: "🦋",
        link: "https://drive.google.com/drive/folders/1CZRhqpscO6uzBjb8BThonluhrUIuLdr1?usp=drive_link",
      },
      {
        name: "Unité Neuro-Sensorielle",
        type: "UNITE",
        icon: "🧠",
        link: "https://drive.google.com/drive/folders/1t5_TrHfwur4pwPl_aeKE-dWCjEXA0GFG?usp=drive_link",
      },
      {
        name: "Immunologie fondamentale",
        type: "MODULE",
        icon: "🧬",
        link: "https://drive.google.com/drive/folders/15un_BwfrknOHa1zbB0iRi5s6GR9i2iZX?usp=drive_link",
      },
      {
        name: "Génétique",
        type: "MODULE",
        icon: "🧪",
        link: "https://drive.google.com/drive/folders/1Ga-nMaHKobKrjFDi4EnF9o-EephG9I9_?usp=drive_link",
      },
    ],
  },
  {
    year: "THIRD_YEAR",
    modules: [
      {
        name: "Appareil Cardio-respiratoire",
        type: "UNITE",
        icon: "🫀",
        link: "https://drive.google.com/drive/folders/1m3_rAiQvA-q7JO0BcnEg1uUB5UCTC29a?usp=drive_link",
      },
      {
        name: "Appareil Neurologique, Locomoteur et Cutané",
        type: "UNITE",
        icon: "🧠",
        link: "https://drive.google.com/drive/folders/1cBDK1pkDSjPoQbeqQe-4U6n0pjcpbt_p?usp=drive_link",
      },
      {
        name: "Appareil Endocrinienne de Reproduction",
        type: "UNITE",
        icon: "🧬",
        link: "https://drive.google.com/drive/folders/1Xj18GPyEMSwq4vlv8jMV1lIohAgBZrQd?usp=drive_link",
      },
      {
        name: "Appareil Digestif",
        type: "UNITE",
        icon: "🫃",
        link: "https://drive.google.com/drive/folders/1tlqnjIF6lsNQRuU8nvg0koddUmmgqIGY?usp=drive_link",
      },
      {
        name: "Immunologie clinique",
        type: "MODULE",
        icon: "🧫",
        link: "https://drive.google.com/drive/folders/1aOM0AEIaiTJDAyHSduSH4y9u3HFO_e_w?usp=drive_link",
      },
      {
        name: "ACP (Anapath)",
        type: "MODULE",
        icon: "🦠",
        link: "https://drive.google.com/drive/folders/1r24GHl1AEMhTf_YCeaC9CjdAqzXS0zBw?usp=drive_link",
      },
      {
        name: "Parasitologie",
        type: "MODULE",
        icon: "🦟",
        link: "https://drive.google.com/drive/folders/12GRXsklZyblb-2xRrwmooXgsLGm0VngK?usp=drive_link",
      },
      {
        name: "Pharmacologie",
        type: "MODULE",
        icon: "💊",
        link: "https://drive.google.com/drive/folders/1w-tWHSk92qBc0kdJt-BxJs6XaphNkopq?usp=drive_link",
      },
      {
        name: "Microbiologie",
        type: "MODULE",
        icon: "🧪",
        link: "https://drive.google.com/drive/folders/1oMTmSMigjw5e3U3Glzu5ZJrkSXE9hziu?usp=drive_link",
      },
    ],
  },
  {
    year: "FOURTH_YEAR",
    modules: [
      {
        name: "Maladies Infectieuses",
        type: "MODULE",
        icon: "🦠",
        link: "https://drive.google.com/drive/folders/1bP0zaBbwmTR-fL1xtVeRtB6kaOOsKym4?usp=drive_link",
      },
      {
        name: "Hématologie",
        type: "MODULE",
        icon: "🩸",
        link: "https://drive.google.com/drive/folders/1wpyHA8c6CC3J2uQlSxS2rvQ0vUIwVGza?usp=drive_link",
      },
      {
        name: "Cardiologie",
        type: "MODULE",
        icon: "❤️",
        link: "https://drive.google.com/drive/folders/1Xb3y2urcWwbM7Ni-w7bkX6lH7gvFCm6a?usp=drive_link",
      },
      {
        name: "Pneumologie",
        type: "MODULE",
        icon: "🫁",
        link: "https://drive.google.com/drive/folders/1dm-47U84yViJYkFb7lX_bxZU1HBvy76B?usp=drive_link",
      },
      {
        name: "Neurologie",
        type: "MODULE",
        icon: "🧠",
        link: "https://drive.google.com/drive/folders/1ocZdeks-iQJipSbEVOB0KZTYXWD2TV94?usp=drive_link",
      },
      {
        name: "HGE Hépatologie – Gastro – Entérologie",
        type: "MODULE",
        icon: "🩻",
        link: "https://drive.google.com/drive/folders/1yDr2Fo7xH7AaM6YyoWURbP4YDsTC4Xyw?usp=drive_link  ",
      },
      { name: "Oncologie", type: "MODULE", icon: "🎗️", link: "" },
    ],
  },
  {
    year: "FIFTH_YEAR",
    modules: [
      {
        name: "Psychiatrie",
        type: "MODULE",
        icon: "🧠",
        link: "https://drive.google.com/drive/folders/1UwqyApGDmVRMljtpUldEyqmG0qj_z6-X?usp=drive_link",
      },
      {
        name: "Endocrinologie, Diabétologie",
        type: "MODULE",
        icon: "🩸",
        link: "https://drive.google.com/drive/folders/1R--jS9aSJm-YrFCmDLJv7eVh1_Ida_Aj?usp=drive_link",
      },
      {
        name: "Appareil locomoteur (Orthopédie-Rhumatologie)",
        type: "MODULE",
        icon: "🦴",
        link: "https://drive.google.com/drive/folders/1vQBF3B3NEcrqUzrmJLJwpupBKeJoJ_5z?usp=drive_link  ",
      },
      {
        name: "Pédiatrie",
        type: "MODULE",
        icon: "👶",
        link: "https://drive.google.com/drive/folders/1lD9qUDLcnKPEIZbQJrp6O_jmC3GuIkO-?usp=drive_link  ",
      },
      {
        name: "Gynécologie",
        type: "MODULE",
        icon: "♀️",
        link: "https://drive.google.com/drive/folders/1ebdI7E3jqywRIAzM_y046ggKbIulygQR?usp=drive_link  ",
      },
      {
        name: "Urologie",
        type: "MODULE",
        icon: "🩻",
        link: "https://drive.google.com/drive/folders/1xd7p20fcA1AD5DEs8ixhvRHKWDQCn660?usp=drive_link",
      },
      {
        name: "Néphrologie",
        type: "MODULE",
        icon: "🧫",
        link: "https://drive.google.com/drive/folders/1xd7p20fcA1AD5DEs8ixhvRHKWDQCn660?usp=drive_link",
      },
    ],
  },
  {
    year: "SIXTH_YEAR",
    modules: [
      { name: "Médecine de travail", type: "MODULE", icon: "👷‍♀️", link: "" },
      { name: "Ophtalmologie", type: "MODULE", icon: "👁️", link: "" },
      { name: "ORL", type: "MODULE", icon: "👂", link: "" },
      {
        name: "Médecine légale & Droit Médical",
        type: "MODULE",
        icon: "⚖️",
        link: "",
      },
      { name: "Dermatologie", type: "MODULE", icon: "🧴", link: "" },
      { name: "UMC", type: "MODULE", icon: "🏥", link: "" },
      { name: "Maladies Systémiques", type: "MODULE", icon: "🧬", link: "" },
      { name: "Gériatrie", type: "MODULE", icon: "🧓", link: "" },
      { name: "Épidémiologie", type: "MODULE", icon: "📈", link: "" },
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

export type QuestionTypeOption = { id: number; name: string };

export const QUESTION_TYPES: readonly QuestionTypeOption[] = [
  { id: 1, name: "QCM" },
  { id: 2, name: "QROC" },
  { id: 4, name: "QCS" },
  { id: 5, name: "Cas Clinique" },
  { id: 6, name: "Dossier Clinique" },
] as const;

// Optional: quick lookup by id
export const QUESTION_TYPE_BY_ID = new Map(
  QUESTION_TYPES.map((t) => [t.id, t.name] as const)
);
export const numToLetter: Map<number, string> = new Map(
  Array.from({ length: 26 }, (_, i) => [i + 1, String.fromCharCode(65 + i)]) // 1->A, 2->B, ...
);
export function convertToAscii(inputString: string) {
  // remove non ascii characters
  const asciiString = inputString.replace(/[^\x00-\x7F]+/g, "");
  return asciiString;
}
