import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";
import barber3 from "@/assets/barber-3.jpg";
import barber4 from "@/assets/barber-4.jpg";

export type ServiceKind = "Cut" | "Color" | "Perm" | "Beard";

export const SERVICE_KINDS: ServiceKind[] = ["Cut", "Color", "Perm", "Beard"];

export interface DemoBarber {
  id: string;
  name: string;
  shop: string;
  area: string;
  rating: number;
  reviews: number;
  photo: string;
  services: { kind: ServiceKind; from: number }[];
}

// Sample listings for the landing page only — real barbers arrive with the database step.
export const DEMO_BARBERS: DemoBarber[] = [
  {
    id: "marco",
    name: "Marco Reyes",
    shop: "Ironline Barbers",
    area: "Da'an",
    rating: 4.9,
    reviews: 312,
    photo: barber1,
    services: [
      { kind: "Cut", from: 600 },
      { kind: "Beard", from: 350 },
    ],
  },
  {
    id: "yuna",
    name: "Yuna Chen",
    shop: "Studio Lumen",
    area: "Xinyi",
    rating: 4.8,
    reviews: 204,
    photo: barber2,
    services: [
      { kind: "Cut", from: 800 },
      { kind: "Color", from: 2200 },
    ],
  },
  {
    id: "earl",
    name: "Earl Thompson",
    shop: "Old Guard Grooming",
    area: "Zhongshan",
    rating: 5.0,
    reviews: 489,
    photo: barber3,
    services: [
      { kind: "Cut", from: 700 },
      { kind: "Beard", from: 400 },
    ],
  },
  {
    id: "camila",
    name: "Camila Ortiz",
    shop: "Curl House",
    area: "Songshan",
    rating: 4.9,
    reviews: 158,
    photo: barber4,
    services: [
      { kind: "Perm", from: 2800 },
      { kind: "Cut", from: 900 },
    ],
  },
];
