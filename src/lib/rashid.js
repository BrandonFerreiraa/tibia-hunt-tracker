// Rashid segue uma escala fixa por dia da semana — não é dado de API, é uma regra
// estática do jogo (muda no server save, ~10:00 CET).
const RASHID_CITY_BY_WEEKDAY = [
  'Carlin', // 0 = domingo
  'Svargrond', // 1 = segunda
  'Liberty Bay', // 2 = terça
  'Port Hope', // 3 = quarta
  'Ankrahmun', // 4 = quinta
  'Darashia', // 5 = sexta
  'Edron', // 6 = sábado
]

export function getRashidCityToday(date = new Date()) {
  return RASHID_CITY_BY_WEEKDAY[date.getDay()]
}

// Sem imagem oficial do Rashid via TibiaData (não há endpoint de NPC) — usa a
// mesma imagem 64x64 da TibiaWiki (Fandom) já confirmada carregando corretamente.
export const RASHID_IMAGE_URL =
  'https://static.wikia.nocookie.net/tibia/images/f/f5/Rashid.gif/revision/latest?cb=20221218120126&path-prefix=en&format=original'
