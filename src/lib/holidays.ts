/**
 * Utilitário de Feriados Nacionais do Brasil
 * Calcula feriados fixos e móveis (Carnaval, Sexta-Feira Santa, Páscoa, Corpus Christi)
 */

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: "national";
}

/**
 * Calcula a data da Páscoa pelo algoritmo de Meeus/Jones/Butcher (Calendário Gregoriano)
 */
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function formatDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Retorna lista de Feriados Nacionais do Brasil para um determinado ano
 */
export function getBrazilianHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [
    { date: `${year}-01-01`, name: "Confraternização Universal (Ano Novo)", type: "national" },
    { date: `${year}-04-21`, name: "Tiradentes", type: "national" },
    { date: `${year}-05-01`, name: "Dia do Trabalhador", type: "national" },
    { date: `${year}-09-07`, name: "Independência do Brasil", type: "national" },
    { date: `${year}-10-12`, name: "Nossa Senhora Aparecida", type: "national" },
    { date: `${year}-11-02`, name: "Finados", type: "national" },
    { date: `${year}-11-15`, name: "Proclamação da República", type: "national" },
    { date: `${year}-11-20`, name: "Dia Nacional de Zumbi e da Consciência Negra", type: "national" },
    { date: `${year}-12-25`, name: "Natal", type: "national" },
  ];

  // Feriados móveis baseados na Páscoa
  const easter = getEasterDate(year);
  const pascoaIso = formatDateIso(easter);
  const sextaSantaIso = formatDateIso(addDays(easter, -2));
  const carnavalIso = formatDateIso(addDays(easter, -47));
  const corpusChristiIso = formatDateIso(addDays(easter, 60));

  holidays.push(
    { date: carnavalIso, name: "Carnaval", type: "national" },
    { date: sextaSantaIso, name: "Sexta-Feira Santa (Paixão de Cristo)", type: "national" },
    { date: pascoaIso, name: "Páscoa", type: "national" },
    { date: corpusChristiIso, name: "Corpus Christi", type: "national" }
  );

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Retorna um mapa indexado por data ISO (YYYY-MM-DD) para busca O(1)
 */
export function getHolidaysMap(year: number): Record<string, Holiday> {
  const holidays = getBrazilianHolidays(year);
  const map: Record<string, Holiday> = {};
  holidays.forEach((h) => {
    map[h.date] = h;
  });
  return map;
}
