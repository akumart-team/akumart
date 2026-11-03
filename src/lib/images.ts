import plastic from "@/assets/mat-plastic.jpg";
import metal from "@/assets/mat-metal.jpg";
import cardboard from "@/assets/mat-cardboard.jpg";
import materials from "@/assets/materials-flatlay.jpg";
import yard from "@/assets/hero-yard.jpg";
import kiosk from "@/assets/akubin-kiosk.jpg";
import truck from "@/assets/logistics-truck.jpg";

export const IMAGES: Record<string, string> = {
  plastic,
  metal,
  cardboard,
  glass: materials,
  paper: materials,
  wood: yard,
  textiles: materials,
  rubber: yard,
  materials,
  yard,
  kiosk,
  truck,
};

export const img = (key: string) => (key?.startsWith("data:") ? key : IMAGES[key] ?? materials);
export { plastic, metal, cardboard, materials, yard, kiosk, truck };
