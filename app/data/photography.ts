// app/data/photography.ts
// Placeholder dataset — drop real files into /public/photos and fill in `src`.
// Leave `src` empty to render a labeled placeholder tile instead of a broken image.

export type PhotoCategory = "portraits" | "everyday" | "landscapes";

export interface Photo {
  id: string;
  category: PhotoCategory;
  src: string;
  alt: string;
}

export const photographs: Photo[] = [
  { id: "1", category: "portraits", src: "", alt: "Portrait 01" },
  { id: "2", category: "everyday", src: "", alt: "Everyday 01" },
  { id: "3", category: "landscapes", src: "", alt: "Landscape 01" },
  { id: "4", category: "portraits", src: "", alt: "Portrait 02" },
  { id: "5", category: "landscapes", src: "", alt: "Landscape 02" },
  { id: "6", category: "everyday", src: "", alt: "Everyday 02" },
];
