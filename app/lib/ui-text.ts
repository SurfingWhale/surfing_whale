// app/lib/ui-text.ts
//
// Interface strings in both languages. INTERFACE ONLY — the chrome a reader
// operates: controls, labels, the words on buttons.
//
// WHAT IS NOT HERE, DELIBERATELY: the writing. Every case study stays in the
// language it was written in, and PRD §38 is the reason. /work/dalrs is in
// Indonesian because DALRS is an Indonesian product and translating
// "serah terima" and "BAST" would have been translating the subject. The
// brand book's voice page lists "Specific — prefers a number to an adjective"
// as a trait extracted from live copy; running that copy through a second
// language would flatten exactly the thing it is describing.
//
// So this switches what a visitor clicks, not what he wrote.
export type Lang = "en" | "id";

export const LANGS: Lang[] = ["en", "id"];

/** What each language is called, in itself. */
export const LANG_NAME: Record<Lang, string> = { en: "English", id: "Indonesia" };

/** Two letters for the control, which is 44px and has room for no more. */
export const LANG_SHORT: Record<Lang, string> = { en: "EN", id: "ID" };

type Dict = {
  share: string;
  copyLink: string;
  copied: string;
  pressToCopy: string;
  shareOther: string;
  more: string;
  writeToMe: string;
  sayHello: string;
  leaveNote: string;
  backToTop: string;
  home: string;
  work: string;
  /** On the control itself, read by a screen reader. */
  switchTo: (name: string) => string;
};

export const UI: Record<Lang, Dict> = {
  en: {
    share: "Share",
    copyLink: "Copy link",
    copied: "Copied",
    pressToCopy: "Press ⌘C",
    shareOther: "Share with another app",
    more: "More",
    writeToMe: "Write to me",
    sayHello: "Say hello",
    leaveNote: "Leave a note",
    backToTop: "Back to top ↑",
    home: "Home",
    work: "Work",
    switchTo: (name) => `Switch the interface to ${name}`,
  },
  id: {
    share: "Bagikan",
    copyLink: "Salin tautan",
    copied: "Tersalin",
    // ⌘C is the key, not a word; it stays as it is printed on the keyboard.
    pressToCopy: "Tekan ⌘C",
    shareOther: "Bagikan lewat aplikasi lain",
    more: "Lainnya",
    writeToMe: "Tulis ke saya",
    sayHello: "Sapa saya",
    leaveNote: "Tinggalkan catatan",
    backToTop: "Kembali ke atas ↑",
    home: "Beranda",
    work: "Karya",
    switchTo: (name) => `Ganti bahasa antarmuka ke ${name}`,
  },
};
