"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Locale } from "@/lib/translations";

const content = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: March 2026",
    sections: [
      {
        heading: "1. Data Controller",
        text: `Lexxbrush, s. r. o.\nStará ulica 38/27, 094 02 Slovenská Kajňa, Slovakia\nIČO: 57 354 634\nEmail: info@lexxbrush.eu\n\nWe are committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and applicable Slovak data protection laws.`,
      },
      {
        heading: "2. Data We Collect",
        text: `We collect the following personal data when you use our website:\n\n• Name and email address — when you place an order, submit a contact form, or request a custom order\n• Shipping address — when you place an order\n• Payment information — processed securely by Stripe (we do not store card details)\n• Order history — products purchased, quantities, sizes\n• Communication data — messages sent via our contact form`,
      },
      {
        heading: "3. Legal Basis for Processing",
        text: `We process your personal data based on:\n\n• Contract fulfillment — processing orders, shipping products, handling returns\n• Legal obligation — tax and accounting requirements\n• Legitimate interest — improving our services, fraud prevention\n• Consent — marketing communications (when opted in)`,
      },
      {
        heading: "4. How We Use Your Data",
        text: `Your personal data is used to:\n\n• Process and fulfill your orders\n• Communicate with you about your orders\n• Respond to your inquiries via the contact form\n• Comply with legal obligations (tax, accounting)\n• Improve our website and services`,
      },
      {
        heading: "5. Third-Party Services",
        text: `We share your data with the following third-party services, only to the extent necessary:\n\n• Stripe — payment processing (Stripe, Inc., USA, EU-US Data Privacy Framework)\n• Vercel — website hosting (Vercel, Inc., USA)\n• Supabase — database and authentication (Supabase, Inc., USA)\n• Resend — transactional emails (Resend, Inc., USA)\n\nAll third parties are GDPR-compliant and process data under appropriate safeguards.`,
      },
      {
        heading: "6. Newsletter",
        text: `Our newsletter is opt-in only. You can subscribe via the footer form or by ticking the "email me when new pieces drop" box at checkout. We use a double opt-in process — you must confirm via a link sent to your email before you receive anything.\n\nWe collect:\n• Your email address\n• Locale preference (English / Slovak)\n• Consent timestamp, source, and IP address (proof of consent under GDPR)\n\nWhat you'll receive: drop announcements, restock notifications, and occasional behind-the-scenes content. Roughly once a month, never more.\n\nUnsubscribe at any time using the one-click link in every email's footer — no login required. You may also email info@lexxbrush.eu to request the permanent deletion of your subscriber record (separate from a simple unsubscribe).`,
      },
      {
        heading: "7. Cookies",
        text: `Our website uses essential cookies required for the website to function (e.g. cart data, language preference). These do not require consent.\n\nWe do not use advertising or tracking cookies. No data is shared with advertising networks.`,
      },
      {
        heading: "8. Data Retention",
        text: `We retain your personal data for:\n\n• Order data — 10 years (Slovak tax law requirement)\n• Contact form submissions — 1 year\n• Account data — until you request deletion\n• Newsletter subscriber data — until you unsubscribe, plus 30 days for audit purposes\n\nAfter the retention period, data is securely deleted.`,
      },
      {
        heading: "9. Your Rights (GDPR)",
        text: `Under the GDPR, you have the right to:\n\n• Access — request a copy of your personal data\n• Rectification — correct inaccurate data\n• Erasure — request deletion of your data ("right to be forgotten")\n• Restriction — restrict processing of your data\n• Portability — receive your data in a structured, machine-readable format\n• Object — object to processing based on legitimate interest\n• Withdraw consent — at any time, without affecting prior processing\n\nTo exercise any of these rights, email us at info@lexxbrush.eu. We will respond within 30 days.`,
      },
      {
        heading: "10. Data Security",
        text: `We implement appropriate technical and organizational measures to protect your data, including:\n\n• SSL/TLS encryption for all data transmission\n• Secure payment processing through Stripe (PCI DSS compliant)\n• Access controls and authentication for internal systems`,
      },
      {
        heading: "11. Changes to This Policy",
        text: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. We encourage you to review this policy periodically.`,
      },
      {
        heading: "12. Contact & Complaints",
        text: `For privacy-related questions or requests:\n\nEmail: info@lexxbrush.eu\nAddress: Stará ulica 38/27, 094 02 Slovenská Kajňa, Slovakia\n\nYou also have the right to lodge a complaint with the Slovak Data Protection Authority (Úrad na ochranu osobných údajov SR) at https://dataprotection.gov.sk.`,
      },
    ],
  },
  sk: {
    title: "Ochrana Osobných Údajov",
    lastUpdated: "Posledná aktualizácia: Marec 2026",
    sections: [
      {
        heading: "1. Prevádzkovateľ",
        text: `Lexxbrush, s. r. o.\nStará ulica 38/27, 094 02 Slovenská Kajňa, Slovensko\nIČO: 57 354 634\nEmail: info@lexxbrush.eu\n\nZaväzujeme sa chrániť vaše osobné údaje v súlade s Nariadením GDPR a platnými slovenskými zákonmi o ochrane údajov.`,
      },
      {
        heading: "2. Údaje, ktoré zhromažďujeme",
        text: `Pri používaní našej webovej stránky zhromažďujeme nasledovné osobné údaje:\n\n• Meno a e-mailovú adresu — pri objednávke, odoslaní kontaktného formulára alebo žiadosti o zákazku\n• Doručovaciu adresu — pri objednávke\n• Platobné údaje — spracované bezpečne službou Stripe (údaje o karte neukladáme)\n• Históriu objednávok — zakúpené produkty, množstvá, veľkosti\n• Komunikačné údaje — správy odoslané cez kontaktný formulár`,
      },
      {
        heading: "3. Právny základ spracovania",
        text: `Vaše osobné údaje spracovávame na základe:\n\n• Plnenia zmluvy — spracovanie objednávok, doručovanie produktov, vybavovanie vrátení\n• Zákonnej povinnosti — daňové a účtovné požiadavky\n• Oprávneného záujmu — zlepšovanie služieb, prevencia podvodov\n• Súhlasu — marketingová komunikácia (ak ste sa prihlásili)`,
      },
      {
        heading: "4. Ako používame vaše údaje",
        text: `Vaše osobné údaje používame na:\n\n• Spracovanie a vybavenie vašich objednávok\n• Komunikáciu o vašich objednávkach\n• Odpovede na vaše otázky cez kontaktný formulár\n• Splnenie zákonných povinností (dane, účtovníctvo)\n• Zlepšovanie našej webovej stránky a služieb`,
      },
      {
        heading: "5. Služby tretích strán",
        text: `Vaše údaje zdieľame s nasledovnými službami tretích strán, len v nevyhnutnom rozsahu:\n\n• Stripe — spracovanie platieb (Stripe, Inc., USA, EU-US Data Privacy Framework)\n• Vercel — hosting webovej stránky (Vercel, Inc., USA)\n• Supabase — databáza a autentifikácia (Supabase, Inc., USA)\n• Resend — transakčné e-maily (Resend, Inc., USA)\n\nVšetky tretie strany sú v súlade s GDPR a spracovávajú údaje s primeranými zárukami.`,
      },
      {
        heading: "6. Newsletter",
        text: `Náš newsletter je výhradne dobrovoľný (opt-in). Prihlásiť sa môžeš cez formulár v päte stránky alebo zaškrtnutím políčka „daj mi vedieť keď príde nový drop" pri checkoute. Používame dvojité potvrdenie — predtým než ti čokoľvek pošleme, musíš potvrdiť cez link, ktorý ti pošleme e-mailom.\n\nZhromažďujeme:\n• E-mailovú adresu\n• Jazykovú preferenciu (slovenčina / angličtina)\n• Časovú pečiatku, zdroj a IP adresu súhlasu (dôkaz súhlasu podľa GDPR)\n\nČo dostaneš: oznámenia o nových dropoch, oznámenia o doplnení skladu, občasný obsah zo zákulisia. Zvyčajne raz za mesiac, nikdy viac.\n\nOdhlásiť sa môžeš kedykoľvek jediným klikom v päte každého e-mailu — bez prihlásenia. Tiež môžeš napísať na info@lexxbrush.eu a požiadať o trvalé vymazanie záznamu (samostatne od jednoduchého odhlásenia).`,
      },
      {
        heading: "7. Cookies",
        text: `Naša webová stránka používa iba nevyhnutné cookies potrebné na fungovanie stránky (napr. údaje košíka, jazykové preferencie). Tieto nevyžadujú súhlas.\n\nNepoužívame reklamné ani sledovacie cookies. Žiadne údaje nie sú zdieľané s reklamnými sieťami.`,
      },
      {
        heading: "8. Uchovávanie údajov",
        text: `Vaše osobné údaje uchovávame po dobu:\n\n• Údaje o objednávkach — 10 rokov (požiadavka slovenského daňového zákona)\n• Údaje z kontaktného formulára — 1 rok\n• Údaje účtu — do požiadania o vymazanie\n• Údaje odberateľov newslettera — do odhlásenia plus 30 dní pre audit\n\nPo uplynutí doby uchovávania sú údaje bezpečne vymazané.`,
      },
      {
        heading: "9. Vaše práva (GDPR)",
        text: `Podľa GDPR máte právo na:\n\n• Prístup — vyžiadať si kópiu vašich osobných údajov\n• Opravu — opraviť nepresné údaje\n• Vymazanie — požiadať o vymazanie vašich údajov („právo byť zabudnutý")\n• Obmedzenie — obmedziť spracovanie vašich údajov\n• Prenosnosť — získať vaše údaje v štruktúrovanom, strojovo čitateľnom formáte\n• Námietku — namietať proti spracovaniu na základe oprávneného záujmu\n• Odvolanie súhlasu — kedykoľvek, bez vplyvu na predchádzajúce spracovanie\n\nPre uplatnenie týchto práv nám napíšte na info@lexxbrush.eu. Odpovieme do 30 dní.`,
      },
      {
        heading: "10. Bezpečnosť údajov",
        text: `Implementujeme primerané technické a organizačné opatrenia na ochranu vašich údajov vrátane:\n\n• SSL/TLS šifrovanie pre všetku komunikáciu\n• Bezpečné spracovanie platieb cez Stripe (PCI DSS)\n• Riadenie prístupu a autentifikácia interných systémov`,
      },
      {
        heading: "11. Zmeny tejto politiky",
        text: `Túto politiku ochrany osobných údajov môžeme z času na čas aktualizovať. Zmeny budú zverejnené na tejto stránke s aktualizovaným dátumom.`,
      },
      {
        heading: "12. Kontakt a sťažnosti",
        text: `Pre otázky alebo žiadosti týkajúce sa ochrany údajov:\n\nEmail: info@lexxbrush.eu\nAdresa: Stará ulica 38/27, 094 02 Slovenská Kajňa, Slovensko\n\nMáte tiež právo podať sťažnosť na Úrad na ochranu osobných údajov SR na https://dataprotection.gov.sk.`,
      },
    ],
  },
};

export default function PrivacyPage() {
  const { locale } = useLanguage();
  const c = content[locale as Locale];

  return (
    <div className="page-enter relative min-h-screen">
      <div className="absolute inset-0 z-0" style={{
        background: "linear-gradient(180deg, var(--color-void) 0%, rgba(10,10,10,0.97) 50%, var(--color-void) 100%)",
      }} />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text mb-2">
            {c.title}
          </h1>
          <p className="text-text-dim text-xs mb-12">{c.lastUpdated}</p>

          <div className="space-y-10">
            {c.sections.map((section, i) => (
              <div key={i}>
                <h2 className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.12em] uppercase text-chrome-bright mb-3">
                  {section.heading}
                </h2>
                <p className="text-sm text-chrome leading-relaxed whitespace-pre-line">
                  {section.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
