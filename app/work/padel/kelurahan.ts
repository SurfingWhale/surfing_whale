// app/work/padel/kelurahan.ts
//
// The 22 kelurahan of the Bintaro Jaya scope, lifted out of the folium map in
// the Padel_Courts_Bintaro repo (archive/bintaro/padel-visual). Every field
// is his: gap score, BPS population, court count, centroid.
//
// Sorted by gap score, which is how the analysis ranks them.

export interface Kelurahan {
  name: string;
  /** (court_scarcity x 0.6) + (population_density x 0.4), 0-1. */
  gap: number;
  /** BPS Tangerang Selatan / BPS Jakarta Selatan. */
  pop: number;
  courts: number;
  lat: number;
  lng: number;
}

export const KELURAHAN: Kelurahan[] = [
  { name: "Pondok Aren", gap: 0.79, pop: 31808, courts: 0, lat: -6.259384, lng: 106.7087216 },
  { name: "Perigi Lama", gap: 0.729, pop: 21634, courts: 0, lat: -6.2699989, lng: 106.6969285 },
  { name: "Pondok Kacang Timur", gap: 0.706, pop: 37947, courts: 1, lat: -6.255979099999999, lng: 106.6954544 },
  { name: "Jurangmangu Barat", gap: 0.704, pop: 37582, courts: 1, lat: -6.2588081, lng: 106.7264125 },
  { name: "Jurangmangu Timur", gap: 0.664, pop: 30904, courts: 1, lat: -6.259846599999999, lng: 106.7337841 },
  { name: "Cempaka Putih", gap: 0.631, pop: 25349, courts: 1, lat: -6.3001952, lng: 106.751477 },
  { name: "Petukangan Selatan", gap: 0.624, pop: 44295, courts: 2, lat: -6.2425078, lng: 106.7559004 },
  { name: "Pondok Karya", gap: 0.519, pop: 26680, courts: 2, lat: -6.2621154, lng: 106.7426303 },
  { name: "Petukangan Utara", gap: 0.4, pop: 67106, courts: 15, lat: -6.2273641, lng: 106.7500025 },
  { name: "Bintaro", gap: 0.391, pop: 65557, courts: 15, lat: -6.2711451, lng: 106.7648677 },
  { name: "Rengas", gap: 0.384, pop: 24079, courts: 3, lat: -6.2784983, lng: 106.7500025 },
  { name: "Pondok Betung", gap: 0.319, pop: 33372, courts: 4, lat: -6.264480199999999, lng: 106.748528 },
  { name: "Ulujami", gap: 0.308, pop: 51660, courts: 13, lat: -6.240989799999999, lng: 106.763273 },
  { name: "Rempoa", gap: 0.294, pop: 29265, courts: 4, lat: -6.2885371, lng: 106.7559004 },
  { name: "Pisangan", gap: 0.21, pop: 35195, courts: 6, lat: -6.319242999999999, lng: 106.7559004 },
  { name: "Pesanggrahan", gap: 0.205, pop: 34374, courts: 9, lat: -6.2525412, lng: 106.7617984 },
  { name: "Pondok Ranji", gap: 0.196, pop: 32806, courts: 6, lat: -6.284000199999999, lng: 106.7382072 },
  { name: "Pondok Pucung", gap: 0.166, pop: 27794, courts: 11, lat: -6.2806942, lng: 106.7114267 },
  { name: "Cirendeu", gap: 0.152, pop: 25445, courts: 18, lat: -6.313155999999999, lng: 106.7697896 },
  { name: "Pondok Kacang Barat", gap: 0.145, pop: 24299, courts: 11, lat: -6.251246999999999, lng: 106.683662 },
  { name: "Perigi Baru", gap: 0.077, pop: 12837, courts: 12, lat: -6.2729876, lng: 106.6925781 },
  { name: "Pondok Jaya", gap: 0.065, pop: 10955, courts: 5, lat: -6.2755769, lng: 106.7219896 },
];

export const TOTAL_COURTS = KELURAHAN.reduce((n, k) => n + k.courts, 0);
export const TOTAL_POP = KELURAHAN.reduce((n, k) => n + k.pop, 0);

/** Courts per 100,000 people. The spread across these 22 is the finding. */
export const perCapita = (k: Kelurahan) => (k.courts / k.pop) * 1e5;
