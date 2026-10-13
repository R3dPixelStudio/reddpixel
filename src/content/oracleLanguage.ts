export type OracleLanguage = 'en' | 'de' | 'fa'

const GERMAN_WORDS = new Set('hallo moin servus guten tag morgen abend danke bitte ja nein alles gut schön schoen sehr gern gerne hast habt hat haben geht dir es das der die den dem nicht auf zu eine kein keine möchte moechte möchten moechten erstellen bauen zeigen deutsch deutschen deutsche ich du mir mich wir sie wie was wer warum welche welcher welches kannst kann können koennen könnte koennte ist sind ein eine einen und oder für fuer mit über ueber von dein deine ihr ihre arbeit erfahrung fähigkeiten faehigkeiten kenntnisse kontakt projekt projekte sprachen spricht technologien verfügbar verfuegbar womit zeigen erklär erklaer erklären erklaeren'.split(' '))
const ENGLISH_WORDS = new Set('hello hi hey how what why who can could would is are do does you your me my please tell explain show about build work website the and with for thanks thank english'.split(' '))

export function detectOracleLanguage(message: string): OracleLanguage {
  const text = message.normalize('NFKC').toLocaleLowerCase('en-US')
  const words = text.match(/\p{L}+/gu) ?? []
  const english = words.filter(word => ENGLISH_WORDS.has(word)).length
  const german = words.filter(word => GERMAN_WORDS.has(word)).length
  const arabicLetters = (text.match(/[\u0620-\u063f\u0641-\u064a\u066e-\u06d3]/gu) ?? []).length
  const latinLetters = (text.match(/[a-zäöüß]/gu) ?? []).length
  // An English question quoting a short Persian phrase stays English.
  if (arabicLetters > 0 && (english < 3 || arabicLetters >= latinLetters * .5)) return 'fa'
  if (german > english || (/[äöüß]/u.test(text) && english === 0)) return 'de'
  return 'en'
}

const GREETINGS = new Set(['hi', 'hello', 'hey', 'hello there', 'hi there', 'hallo', 'moin', 'servus', 'guten tag', 'guten morgen', 'guten abend', 'سلام', 'درود'])
export function oracleGreeting(message: string): string | null {
  const normalized = message.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trim()
  if (!GREETINGS.has(normalized)) return null
  const language = detectOracleLanguage(normalized)
  if (language === 'fa') return 'سلام! به REDDPIXEL خوش آمدی. دوست داری دربارهٔ وب‌سایت‌ها، کارهای سه‌بعدی یا یک ایدهٔ تازه صحبت کنیم؟'
  if (language === 'de') return 'Hallo! Willkommen bei REDDPIXEL. Möchtest du über Websites, 3D-Arbeiten oder eine neue Idee sprechen?'
  return 'Hi! Welcome to REDDPIXEL. Want to talk about websites, 3D work, or an idea you’d like to build?'
}

export function oracleLanguageInstruction(message: string): string {
  const language = detectOracleLanguage(message)
  const name = { en: 'English', de: 'German', fa: 'Persian (Farsi)' }[language]
  return `REPLY LANGUAGE FOR THIS TURN: ${name}. Write your entire answer in ${name}, apart from brand names, URLs and code. This is selected from the latest user message. Do not copy the language of older messages, the portfolio owner's spoken languages, or quoted text in the portfolio. English is the default for ambiguous Latin-script messages.`
}
