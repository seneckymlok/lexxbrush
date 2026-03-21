"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Locale } from "@/lib/translations";

const content = {
  en: {
    title: "Terms & Conditions",
    lastUpdated: "Last updated: March 2026",
    sections: [
      {
        heading: "1. General Provisions",
        text: `These Terms & Conditions ("Terms") govern the purchase of products from Lexxbrush, s. r. o. ("we", "us", "the Company"), a company registered in the Slovak Republic.\n\nCompany: Lexxbrush, s. r. o.\nAddress: Stará ulica 38/27, 094 02 Slovenská Kajňa\nIČO: 57 354 634\nDIČ: 2122713032\nIČ DPH: SK2122713032\nRegistered: District Court Prešov, section Sro, file 51456/P\n\nBy placing an order through our website, you agree to be bound by these Terms.`,
      },
      {
        heading: "2. Products & Orders",
        text: `All products sold on lexxbrush.eu are hand-airbrushed, one-of-a-kind wearable art pieces. Due to the handmade nature of our products, slight variations from displayed images may occur.\n\nBy placing an order you confirm that:\n• You are at least 18 years old or have parental consent\n• The information you provide is accurate and complete\n• You accept these Terms in full`,
      },
      {
        heading: "3. Pricing & Payment",
        text: `All prices are displayed in Euros (€) and include VAT where applicable. Payment is processed securely through Stripe. We accept major credit and debit cards.\n\nThe total price includes the product price and any applicable shipping costs, which are displayed before you confirm your order.\n\nAn order is confirmed only after successful payment processing.`,
      },
      {
        heading: "4. Shipping",
        text: `We ship across the European Union. Delivery times vary depending on your location, typically 5–10 business days within the EU.\n\nShipping costs are calculated at checkout based on destination. Risk of loss passes to you upon delivery to the carrier.\n\nFor more details, please see our Shipping & Returns page.`,
      },
      {
        heading: "5. Right of Withdrawal",
        text: `Under EU consumer protection law, you have the right to withdraw from your purchase within 14 days of receiving the goods, without giving any reason.\n\nTo exercise this right, you must inform us of your decision by a clear statement (e.g. email to info@lexxbrush.eu).\n\nYou must return the goods in their original condition, unworn and undamaged. Return shipping costs are borne by the buyer.\n\nCustom-made products (custom orders) are exempt from the right of withdrawal as they are made to your personal specifications.`,
      },
      {
        heading: "6. Custom Orders",
        text: `Custom orders are created to your individual specifications and are therefore non-refundable and non-returnable once production has begun.\n\nWe will confirm the design, garment choice, and pricing with you before beginning work. A custom order is considered confirmed once payment is received.`,
      },
      {
        heading: "7. Intellectual Property",
        text: `All designs, artwork, images, and content on this website are the intellectual property of Lexxbrush, s. r. o. and are protected by applicable copyright laws.\n\nPurchasing a product grants you ownership of the physical item but does not transfer any intellectual property rights to the design or artwork.`,
      },
      {
        heading: "8. Liability",
        text: `We warrant that all products are free from defects in materials and craftsmanship. If you receive a defective product, please contact us within 14 days of delivery.\n\nOur liability is limited to the purchase price of the product. We are not liable for any indirect, incidental, or consequential damages.`,
      },
      {
        heading: "9. Governing Law",
        text: `These Terms are governed by and construed in accordance with the laws of the Slovak Republic. Any disputes arising from these Terms shall be resolved by the competent courts of the Slovak Republic.\n\nFor EU consumers: you may also use the European Commission's Online Dispute Resolution platform at https://ec.europa.eu/odr.`,
      },
      {
        heading: "10. Contact",
        text: `For any questions regarding these Terms, please contact us:\n\nEmail: info@lexxbrush.eu\nAddress: Stará ulica 38/27, 094 02 Slovenská Kajňa, Slovakia`,
      },
    ],
  },
  sk: {
    title: "Obchodné Podmienky",
    lastUpdated: "Posledná aktualizácia: Marec 2026",
    sections: [
      {
        heading: "1. Všeobecné ustanovenia",
        text: `Tieto Obchodné podmienky („Podmienky") upravujú nákup produktov od spoločnosti Lexxbrush, s. r. o. („my", „nás", „Spoločnosť"), spoločnosti registrovanej v Slovenskej republike.\n\nSpoločnosť: Lexxbrush, s. r. o.\nSídlo: Stará ulica 38/27, 094 02 Slovenská Kajňa\nIČO: 57 354 634\nDIČ: 2122713032\nIČ DPH: SK2122713032\nZápis: Okresný súd Prešov, oddiel Sro, vložka 51456/P\n\nOdoslaním objednávky prostredníctvom našej webovej stránky súhlasíte s týmito Podmienkami.`,
      },
      {
        heading: "2. Produkty a objednávky",
        text: `Všetky produkty predávané na lexxbrush.eu sú ručne airbrushované, unikátne umelecké kúsky na nosenie. Vzhľadom na ručnú výrobu sa môžu vyskytnúť drobné odchýlky od zobrazených fotografií.\n\nOdoslaním objednávky potvrdzujete, že:\n• Máte aspoň 18 rokov alebo súhlas zákonného zástupcu\n• Poskytnuté informácie sú presné a úplné\n• Súhlasíte s týmito Podmienkami v plnom rozsahu`,
      },
      {
        heading: "3. Ceny a platba",
        text: `Všetky ceny sú uvedené v eurách (€) vrátane DPH. Platba je bezpečne spracovaná prostredníctvom služby Stripe. Prijímame hlavné kreditné a debetné karty.\n\nCelková cena zahŕňa cenu produktu a prípadné náklady na dopravu, ktoré sú zobrazené pred potvrdením objednávky.\n\nObjednávka je potvrdená až po úspešnom spracovaní platby.`,
      },
      {
        heading: "4. Doprava",
        text: `Doručujeme po celej Európskej únii. Dodacie lehoty sa líšia v závislosti od vašej lokality, zvyčajne 5–10 pracovných dní v rámci EÚ.\n\nNáklady na dopravu sú vypočítané pri pokladni na základe destinácie. Riziko straty prechádza na vás pri odovzdaní prepravcovi.\n\nViac informácií nájdete na stránke Doprava a vrátenie.`,
      },
      {
        heading: "5. Právo na odstúpenie od zmluvy",
        text: `Podľa právnych predpisov EÚ na ochranu spotrebiteľa máte právo odstúpiť od kúpy do 14 dní od prevzatia tovaru bez udania dôvodu.\n\nPre uplatnenie tohto práva nás musíte informovať jasným vyhlásením (napr. e-mailom na info@lexxbrush.eu).\n\nTovar musíte vrátiť v pôvodnom stave, nenosený a nepoškodený. Náklady na vrátenie znáša kupujúci.\n\nProdukty vyrobené na zákazku sú vyňaté z práva na odstúpenie, pretože sú vyrobené podľa vašich osobných špecifikácií.`,
      },
      {
        heading: "6. Zákazky na mieru",
        text: `Zákazky na mieru sú vytvorené podľa vašich individuálnych špecifikácií, a preto sú nevratné po začatí výroby.\n\nPred začiatkom práce s vami potvrdíme dizajn, výber oblečenia a cenu. Objednávka na mieru sa považuje za potvrdenú po prijatí platby.`,
      },
      {
        heading: "7. Duševné vlastníctvo",
        text: `Všetky dizajny, umelecké diela, obrázky a obsah na tejto webovej stránke sú duševným vlastníctvom spoločnosti Lexxbrush, s. r. o. a sú chránené platnými autorskými zákonmi.\n\nZakúpením produktu získate vlastníctvo fyzického predmetu, ale neprenášajú sa žiadne práva duševného vlastníctva k dizajnu alebo umeleckému dielu.`,
      },
      {
        heading: "8. Zodpovednosť",
        text: `Zaručujeme, že všetky produkty sú bez vád materiálu a spracovania. Ak dostanete chybný produkt, kontaktujte nás do 14 dní od doručenia.\n\nNaša zodpovednosť je obmedzená na kúpnu cenu produktu. Nezodpovedáme za žiadne nepriame, náhodné alebo následné škody.`,
      },
      {
        heading: "9. Rozhodné právo",
        text: `Tieto Podmienky sa riadia a vykladajú v súlade so zákonmi Slovenskej republiky. Akékoľvek spory vyplývajúce z týchto Podmienok budú riešené príslušnými súdmi Slovenskej republiky.\n\nPre spotrebiteľov v EÚ: môžete tiež využiť platformu na riešenie sporov online Európskej komisie na https://ec.europa.eu/odr.`,
      },
      {
        heading: "10. Kontakt",
        text: `V prípade akýchkoľvek otázok k týmto Podmienkam nás kontaktujte:\n\nEmail: info@lexxbrush.eu\nAdresa: Stará ulica 38/27, 094 02 Slovenská Kajňa, Slovensko`,
      },
    ],
  },
};

export default function TermsPage() {
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
