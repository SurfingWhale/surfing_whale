// app/data/photography.ts
// Hand-maintained manifest — see PRD v2 §3.5. Files live in /public/photos,
// resized to 1400px on the long edge and saved as progressive JPEG.
//
// `width`/`height` are the stored dimensions; the grid uses them to reserve
// space so photographs do not reflow the page as they load.

export type PhotoCategory = "portraits" | "everyday" | "landscapes";

export interface Photo {
  id: string;
  category: PhotoCategory;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const photographs: Photo[] = [
  {
    id: "cirimpak-valley",
    category: "landscapes",
    src: "/photos/cirimpak-valley.jpg",
    alt: "A valley town seen through foliage from a hillside, a transmission tower rising from the treeline",
    width: 1120,
    height: 1400,
  },
  {
    id: "tower-above-clouds",
    category: "landscapes",
    src: "/photos/tower-above-clouds.jpg",
    alt: "A telecoms tower standing above a bank of cloud, shot on black and white film",
    width: 928,
    height: 1400,
  },
  {
    id: "lantern-market",
    category: "everyday",
    src: "/photos/lantern-market.jpg",
    alt: "A man on a stairway looking toward a market stall hung with red lanterns, a light leak across the frame",
    width: 1400,
    height: 928,
  },
  {
    id: "cilincing-worker",
    category: "everyday",
    src: "/photos/cilincing-worker.jpg",
    alt: "A dock worker in an orange jacket crossing a plank between concrete forms",
    width: 1400,
    height: 933,
  },
  {
    id: "jakarta-platform",
    category: "everyday",
    src: "/photos/jakarta-platform.jpg",
    alt: "Commuters waiting on a Jakarta station platform, tracks curving away toward the skyline",
    width: 1400,
    height: 933,
  },
];
