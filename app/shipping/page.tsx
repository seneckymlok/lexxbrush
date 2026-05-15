"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Locale } from "@/lib/translations";

const content = {
  en: {
    title: "Shipping & Returns",
    lastUpdated: "Last updated: March 2026",
    sections: [
      {
        heading: "Shipping",
        subsections: [
          {
            heading: "Shipping Provider",
            text: `All orders are shipped via Packeta, a leading European delivery service. At checkout, you can choose between:\n\n• Pickup Point - collect your order from thousands of Packeta pickup points and Z-BOXes across Europe\n• Home Delivery - delivered directly to your door`,
          },
          {
            heading: "Shipping Zones",
            text: `We currently ship to: Slovakia, Czech Republic, Germany, Austria, Poland, and Hungary.\n\nFor shipping inquiries to other countries, please contact us at info@lexxbrush.eu.`,
          },
          {
            heading: "Delivery Times",
            text: `• Slovakia: 2-4 business days\n• Czech Republic: 2-4 business days\n• Other EU countries (DE, AT, PL, HU): 5-10 business days\n\nPlease note that delivery times are estimates and may vary due to carrier delays or peak seasons.`,
          },
          {
            heading: "Shipping Costs",
            text: `Shipping costs are calculated at checkout based on your location and the delivery method you choose. The total shipping cost is displayed before you confirm your order.`,
          },
          {
            heading: "Order Processing",
            text: `Orders are typically processed within 1-3 business days. As all products are hand-airbrushed, custom orders may require additional processing time, which will be communicated to you upon order confirmation.`,
          },
          {
            heading: "Tracking",
            text: `Once your order is shipped, you will receive a confirmation email with a Packeta tracking link. You can track your parcel in real time at tracking.packeta.com.`,
          },
        ],
      },
      {
        heading: "Returns & Refunds",
        subsections: [
          {
            heading: "14-Day Right of Withdrawal",
            text: `Under EU consumer protection law, you have the right to return products within 14 days of receiving them, without giving any reason.\n\nTo initiate a return, contact us at info@lexxbrush.eu with your order number and reason for return.`,
          },
          {
            heading: "Return Conditions",
            text: `• Items must be in their original condition - unworn, unwashed, and undamaged\n• Items must be returned in their original packaging\n• Return shipping costs are the responsibility of the buyer\n• Refunds are processed within 14 days of receiving the returned item`,
          },
          {
            heading: "Custom Orders",
            text: `Products created through our custom order service are made to your individual specifications and are therefore exempt from the right of withdrawal. Custom orders cannot be returned or refunded once production has begun.`,
          },
          {
            heading: "Defective Products",
            text: `If you receive a product that is defective or damaged during shipping, please contact us within 14 days of delivery at info@lexxbrush.eu. Include:\n\n• Your order number\n• Photos of the defect or damage\n• A description of the issue\n\nWe will arrange a replacement or full refund, including return shipping costs.`,
          },
          {
            heading: "Refund Method",
            text: `Refunds are processed to the original payment method used during purchase. Please allow 5-10 business days for the refund to appear on your statement after processing.`,
          },
        ],
      },
    ],
  },
  sk: {
    title: "Doprava a Vrátenie",
    lastUpdated: "Posledná aktualizácia: Marec 2026",
    sections: [
      {
        heading: "Doprava",
        subsections: [
          {
            heading: "Prepravca",
            text: `Všetky objednávky doručujeme prostredníctvom Packeta, poprednej európskej doručovacej služby. Pri pokladni si môžete vybrať:\n\n• Odberné miesto - vyzdvihnite si objednávku z tisícok Packeta odberných miest a Z-BOXov po celej Európe\n• Doručenie na adresu - doručenie priamo k vašim dverám`,
          },
          {
            heading: "Oblasti doručenia",
            text: `Momentálne doručujeme do: Slovensko, Česko, Nemecko, Rakúsko, Poľsko a Maďarsko.\n\nPre otázky o doručení do iných krajín nás kontaktujte na info@lexxbrush.eu.`,
          },
          {
            heading: "Dodacie lehoty",
            text: `• Slovensko: 2-4 pracovné dni\n• Česko: 2-4 pracovné dni\n• Ostatné krajiny EÚ (DE, AT, PL, HU): 5-10 pracovných dní\n\nUpozorňujeme, že dodacie lehoty sú orientačné a môžu sa líšiť v dôsledku meškania prepravcu alebo špičkového obdobia.`,
          },
          {
            heading: "Náklady na dopravu",
            text: `Náklady na dopravu sa vypočítavajú pri pokladni na základe vašej polohy a zvoleného spôsobu doručenia. Celkové náklady na dopravu sú zobrazené pred potvrdením objednávky.`,
          },
          {
            heading: "Spracovanie objednávky",
            text: `Objednávky sú zvyčajne spracované do 1-3 pracovných dní. Keďže všetky produkty sú ručne airbrushované, zákazky na mieru môžu vyžadovať dodatočný čas spracovania, o čom vás budeme informovať.`,
          },
          {
            heading: "Sledovanie",
            text: `Po odoslaní objednávky dostanete potvrdzujúci e-mail s odkazom na sledovanie Packeta. Svoju zásielku môžete sledovať v reálnom čase na tracking.packeta.com.`,
          },
        ],
      },
      {
        heading: "Vrátenie a refundácia",
        subsections: [
          {
            heading: "14-dňové právo na odstúpenie",
            text: `Podľa práva EÚ na ochranu spotrebiteľa máte právo vrátiť produkty do 14 dní od ich prevzatia bez udania dôvodu.\n\nPre začatie vrátenia nás kontaktujte na info@lexxbrush.eu s číslom objednávky a dôvodom vrátenia.`,
          },
          {
            heading: "Podmienky vrátenia",
            text: `• Tovar musí byť v pôvodnom stave - nenosený, nepraný a nepoškodený\n• Tovar musí byť vrátený v pôvodnom balení\n• Náklady na vrátenie znáša kupujúci\n• Refundácie sú spracované do 14 dní od prijatia vráteného tovaru`,
          },
          {
            heading: "Zákazky na mieru",
            text: `Produkty vytvorené prostredníctvom našej služby zákaziek na mieru sú vyrobené podľa vašich individuálnych špecifikácií a sú preto vyňaté z práva na odstúpenie. Zákazky na mieru nemožno vrátiť ani refundovať po začatí výroby.`,
          },
          {
            heading: "Chybné produkty",
            text: `Ak dostanete chybný alebo poškodený produkt počas prepravy, kontaktujte nás do 14 dní od doručenia na info@lexxbrush.eu. Uveďte:\n\n• Číslo objednávky\n• Fotografie chyby alebo poškodenia\n• Popis problému\n\nZariiadime výmenu alebo plnú refundáciu vrátane nákladov na vrátenie.`,
          },
          {
            heading: "Spôsob refundácie",
            text: `Refundácie sú spracované na pôvodný platobný spôsob použitý pri nákupe. Po spracovaní počítajte s 5-10 pracovnými dňami, kým sa refundácia zobrazí na vašom výpise.`,
          },
        ],
      },
    ],
  },
};

export default function ShippingPage() {
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

          <div className="space-y-16">
            {c.sections.map((section, i) => (
              <div key={i}>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[0.1em] uppercase text-chrome-bright mb-8">
                  {section.heading}
                </h2>
                <div className="space-y-8">
                  {section.subsections.map((sub, j) => (
                    <div key={j}>
                      <h3 className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.12em] uppercase text-chrome mb-3">
                        {sub.heading}
                      </h3>
                      <p className="text-sm text-chrome leading-relaxed whitespace-pre-line">
                        {sub.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
