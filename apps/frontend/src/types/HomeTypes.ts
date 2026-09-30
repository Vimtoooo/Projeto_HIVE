export type Profession =
  | "Elétrica"
  | "Hidráulica"
  | "Limpeza"
  | "Pintura"
  | "Reparos"
  | "Jardinagem"
  | "Beleza"
  | "Aulas";
export interface Professional {
  id: string;
  name: string;
  profession: Profession;
  specialty: string;
  description: string;
  rating: number;
  reviews: number;
  distance: number;
  jobs: number;
  price: number;
  color: string;
  initials: string;
}
export type SortMode = "nearby" | "rating" | "popular";
export interface Viewer {
  id: number;
  name: string;
}
