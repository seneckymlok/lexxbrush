interface PacketaPointGps {
  lat: number;
  lon: number;
}

interface PacketaPoint {
  id: number;
  name: string;
  nameStreet: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  carrierId: number | null;
  carrierPickupPointId: string | null;
  gps: PacketaPointGps;
  openingHours: {
    compactShort: string;
    compactLong: string;
    tableLong: string;
    regular: Record<string, string>;
    exceptions: string[];
  };
  photos: Array<{ thumbnail: string; normal: string }>;
  place: string;
  group: string;
  pickupPointType: string;
  maxWeight: number;
  currency: string;
  wheelchairAccessible: boolean;
  url: string;
}

interface PacketaHDAddress {
  country: string;
  county: string;
  city: string;
  street: string;
  houseNumber: string;
  postcode: string;
}

interface PacketaWidgetOptions {
  country?: string;
  language?: string;
  vendors?: Array<{ country: string; group?: string }>;
  weight?: number;
  expeditionDay?: string;
  livePickupPoint?: boolean;
  layout?: "hd";
  carrierId?: number;
}

interface PacketaDelivery {
  type: "pickup" | "home_delivery";
  country: string;
  point?: {
    id: number;
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    carrierId: number | null;
    carrierPickupPointId: string | null;
    gps: PacketaPointGps;
  };
  address?: PacketaHDAddress & { carrierId: number };
}

declare namespace Packeta {
  namespace Widget {
    function pick(
      apiKey: string,
      callback: (point: PacketaPoint | null) => void,
      options?: PacketaWidgetOptions,
      element?: HTMLElement | null
    ): void;
    function close(): void;
  }
}
