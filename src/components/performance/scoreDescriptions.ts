export const SCORE_OPTIONS = [2, 1, 0.5, -1] as const;
export type ScoreValue = typeof SCORE_OPTIONS[number];

export const SCORE_LABELS: Record<number, string> = {
  2: 'Herausragend',
  1: 'Gut',
  0.5: 'Verbesserungsfähig',
  [-1]: 'Nicht zufriedenstellend',
};

export interface CategoryInfo {
  key: string;
  label: string;
  dbField: string;
  descriptions: Record<number, string>;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    key: 'speed',
    label: 'Montagegeschwindigkeit',
    dbField: 'score_speed',
    descriptions: {
      2: 'Der Monteur erreicht jederzeit gesetzte Zeitziele und übertrifft diese häufiger.',
      1: 'Der Monteur hält vorgegebene Zeitziele zuverlässig ein.',
      0.5: 'Der Monteur benötigt gelegentlich länger als geplant.',
      [-1]: 'Zeitvorgaben werden regelmäßig deutlich überschritten.',
    },
  },
  {
    key: 'quality',
    label: 'Arbeitsqualität',
    dbField: 'score_quality',
    descriptions: {
      2: 'Arbeiten werden stets fehlerfrei und mit besonderer Sorgfalt ausgeführt.',
      1: 'Arbeiten werden in guter Qualität und weitgehend fehlerfrei erledigt.',
      0.5: 'Es treten gelegentlich Qualitätsmängel auf, die nachgebessert werden müssen.',
      [-1]: 'Häufige Mängel und Nacharbeit erforderlich.',
    },
  },
  {
    key: 'reliability',
    label: 'Zuverlässigkeit',
    dbField: 'score_reliability',
    descriptions: {
      2: 'Immer pünktlich, hält alle Absprachen vorbildlich ein.',
      1: 'Zuverlässig und pünktlich, hält Absprachen ein.',
      0.5: 'Gelegentlich unpünktlich oder vergisst Absprachen.',
      [-1]: 'Häufig unpünktlich, Absprachen werden regelmäßig nicht eingehalten.',
    },
  },
  {
    key: 'team',
    label: 'Verhalten & Teamfähigkeit',
    dbField: 'score_team',
    descriptions: {
      2: 'Vorbildliches Verhalten, unterstützt Kollegen aktiv, positiver Einfluss aufs Team.',
      1: 'Gutes Teamverhalten, kooperativ und hilfsbereit.',
      0.5: 'Zurückhaltend im Team, gelegentlich Konflikte.',
      [-1]: 'Teamarbeit wird erschwert, häufige Konflikte.',
    },
  },
  {
    key: 'cleanliness',
    label: 'Sauberkeit',
    dbField: 'score_cleanliness',
    descriptions: {
      2: 'Arbeitsplatz und Fahrzeug stets vorbildlich sauber und geordnet.',
      1: 'Arbeitsplatz und Fahrzeug werden ordentlich hinterlassen.',
      0.5: 'Gelegentlich wird der Arbeitsplatz unaufgeräumt hinterlassen.',
      [-1]: 'Arbeitsplatz und Fahrzeug werden regelmäßig unordentlich hinterlassen.',
    },
  },
];
