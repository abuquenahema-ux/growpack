export type Country = { code: string; dial: string; name: string; flag: string; digits: number };

export const COUNTRIES: Country[] = [
  { code: "MZ", dial: "+258", name: "Moçambique", flag: "🇲🇿", digits: 9 },
  { code: "AO", dial: "+244", name: "Angola", flag: "🇦🇴", digits: 9 },
  { code: "PT", dial: "+351", name: "Portugal", flag: "🇵🇹", digits: 9 },
  { code: "BR", dial: "+55", name: "Brasil", flag: "🇧🇷", digits: 11 },
  { code: "ZA", dial: "+27", name: "África do Sul", flag: "🇿🇦", digits: 9 },
  { code: "ZW", dial: "+263", name: "Zimbabué", flag: "🇿🇼", digits: 9 },
  { code: "MW", dial: "+265", name: "Malawi", flag: "🇲🇼", digits: 9 },
  { code: "TZ", dial: "+255", name: "Tanzânia", flag: "🇹🇿", digits: 9 },
  { code: "ZM", dial: "+260", name: "Zâmbia", flag: "🇿🇲", digits: 9 },
  { code: "CV", dial: "+238", name: "Cabo Verde", flag: "🇨🇻", digits: 7 },
  { code: "GW", dial: "+245", name: "Guiné-Bissau", flag: "🇬🇼", digits: 7 },
  { code: "ST", dial: "+239", name: "São Tomé e Príncipe", flag: "🇸🇹", digits: 7 },
];

export function normalizePhone(dial: string, raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  return `${dial.replace(/\D/g, "")}${digits}`;
}

export function phoneToEmail(dial: string, raw: string) {
  return `u${normalizePhone(dial, raw)}@investnatura.app`;
}

export function formatMzn(value: number) {
  return `${new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} MZN`;
}