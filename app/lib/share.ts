// app/lib/share.ts
// What both share rows do: the one at the foot of a written-up page
// (ShareRow) and the one at the foot of the home page (FootShare). The url
// always comes from SITE, never from the address bar — see ShareRow.

/** The networks that take a link from the web, as plain links, so nothing of
 *  theirs loads until the visitor taps. */
export function shareLinks(url: string, title: string) {
  return [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}` },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];
}

// A copied link that silently did not copy is worse than no button. Three
// levels: the modern API, the deprecated one it replaced, and — when the
// page is served over plain http, where neither is allowed — false, so the
// caller can say how to copy it by hand. `input` is an off-screen field
// holding the address; the second level selects it.
export async function copyLink(url: string, input: HTMLInputElement | null) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    /* fall through */
  }
  if (input) {
    input.select();
    try {
      if (document.execCommand("copy")) return true;
    } catch {
      /* fall through */
    }
  }
  return false;
}

/** The system share sheet, if this browser has one. Call it straight from the
 *  tap: Safari drops the sheet when anything is awaited first. */
export function openSheet(url: string, title: string) {
  if (typeof navigator.share !== "function") return false;
  navigator.share({ title, url }).catch(() => {
    /* the sheet was dismissed, which is not an error */
  });
  return true;
}

// Instagram takes no link from the web: no share url, no intent. On a touch
// screen it is in the system sheet, so that is what its button opens. On a
// desktop there is no sheet with Instagram in it; false, and the caller
// copies the link and says where to paste it.
export function instagramSheet(url: string, title: string) {
  return window.matchMedia("(pointer: coarse)").matches && openSheet(url, title);
}
