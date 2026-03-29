"use client";

import { useEffect, useCallback, useState } from "react";
import Script from "next/script";
import { HD_CARRIER_IDS } from "@/lib/packeta";

interface PacketaWidgetProps {
  country: string;
  language: string;
  deliveryType: "pickup" | "home_delivery";
  selectedPoint: PacketaPoint | null;
  selectedAddress: (PacketaHDAddress & { carrierId: number }) | null;
  onPointSelect: (point: PacketaPoint | null) => void;
  onAddressSelect: (address: (PacketaHDAddress & { carrierId: number }) | null) => void;
}

export default function PacketaWidget({
  country,
  language,
  deliveryType,
  selectedPoint,
  selectedAddress,
  onPointSelect,
  onAddressSelect,
}: PacketaWidgetProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_PACKETA_API_KEY || "";

  const openPickupWidget = useCallback(() => {
    if (!scriptLoaded || typeof Packeta === "undefined") return;

    Packeta.Widget.pick(
      apiKey,
      (point) => {
        onPointSelect(point);
      },
      {
        country: country.toLowerCase(),
        language: language === "sk" ? "sk" : "en",
      }
    );
  }, [scriptLoaded, apiKey, country, language, onPointSelect]);

  const openHDWidget = useCallback(() => {
    if (!scriptLoaded || typeof Packeta === "undefined") return;

    const carrierId = HD_CARRIER_IDS[country];
    if (!carrierId) return;

    Packeta.Widget.pick(
      apiKey,
      (point) => {
        if (point && "address" in point) {
          const addr = (point as any).address as PacketaHDAddress;
          onAddressSelect({ ...addr, carrierId });
        } else {
          onAddressSelect(null);
        }
      },
      {
        country: country.toLowerCase(),
        language: language === "sk" ? "sk" : "en",
        layout: "hd",
        carrierId,
      }
    );
  }, [scriptLoaded, apiKey, country, language, onAddressSelect]);

  const handleOpen = deliveryType === "pickup" ? openPickupWidget : openHDWidget;

  const hasSelection = deliveryType === "pickup" ? !!selectedPoint : !!selectedAddress;

  return (
    <>
      <Script
        src="https://widget.packeta.com/v6/www/js/library.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      {hasSelection ? (
        <SelectedSummary
          deliveryType={deliveryType}
          point={selectedPoint}
          address={selectedAddress}
          onChangeClick={handleOpen}
        />
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          disabled={!scriptLoaded}
          className="w-full py-4 border border-dashed border-white/20 rounded-lg text-sm text-chrome hover:text-white hover:border-white/40 hover:bg-white/5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {!scriptLoaded ? (
            <span className="animate-pulse">Loading...</span>
          ) : deliveryType === "pickup" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Choose Pickup Point
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Enter Delivery Address
            </span>
          )}
        </button>
      )}
    </>
  );
}

function SelectedSummary({
  deliveryType,
  point,
  address,
  onChangeClick,
}: {
  deliveryType: "pickup" | "home_delivery";
  point: PacketaPoint | null;
  address: (PacketaHDAddress & { carrierId: number }) | null;
  onChangeClick: () => void;
}) {
  if (deliveryType === "pickup" && point) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-[family-name:var(--font-display)] font-bold tracking-wide uppercase text-chrome-bright truncate">
                {point.name}
              </span>
            </div>
            <p className="text-xs text-chrome ml-6">
              {point.street}, {point.city} {point.zip}
            </p>
            {point.openingHours?.compactShort && (
              <p className="text-xs text-white/30 ml-6 mt-1">
                {point.openingHours.compactShort}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onChangeClick}
            className="text-xs text-chrome hover:text-white transition-colors flex-shrink-0 underline underline-offset-2"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  if (deliveryType === "home_delivery" && address) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-[family-name:var(--font-display)] font-bold tracking-wide uppercase text-chrome-bright">
                Home Delivery
              </span>
            </div>
            <p className="text-xs text-chrome ml-6">
              {address.street} {address.houseNumber}, {address.city} {address.postcode}
            </p>
            <p className="text-xs text-white/30 ml-6 mt-0.5">
              {address.country?.toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onChangeClick}
            className="text-xs text-chrome hover:text-white transition-colors flex-shrink-0 underline underline-offset-2"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return null;
}
