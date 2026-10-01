// app/page.tsx — Server Component, NO "use client"
import { HeroSection } from "./components/sections/HeroSection";
import ProjectSectionWrapper from "./components/sections/ProjectSectionWrapper";
import { DirectorySection } from "./components/sections/DirectorySection";
import { CVSection } from "./components/sections/CVSection";
import { ActivitySection } from "./components/sections/ActivitySection";
import { ContactSection } from "./components/sections/ContactSection";
import { PhotographySection } from "./components/sections/PhotographySection";
import { GuestNotesSection } from "./components/sections/GuestNotesSection";
import { MobileNav } from "./components/Mobilenav/Mobilenav";
import { GlassNav, type NavLink } from "./components/GlassNav";
import { ProfileContent } from "./components/ProfileContent";
import { ProfileModeProvider } from "./components/ProfileMode";
import { AccessProvider } from "./components/AccessGate";
import { UnlockedBanner } from "./components/UnlockedBanner";
import { ThemeToggle } from "./components/ThemeToggle";
import { AdminEntry, AdminLink } from "./components/AdminEntry";
import { VisitorCard } from "./components/VisitorCard";
import { Reveal } from "./components/Reveal";
import { listPosts } from "./lib/writing";
import { listEssays } from "./lib/darkroom";
import { listArchivePhotos } from "./lib/cloudinary";

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "#" },
  { label: "Projects", href: "#project" },
  { label: "Writing", href: "/writing" },
  { label: "Activity", href: "#activity" },
  { label: "About", href: "#CV" },
  { label: "Notes", href: "#guest-notes" },
  { label: "Contact", href: "#contact" },
];

// Writing and the darkroom are both Notion-backed and both start empty. A nav
// item that lands on "Nothing published yet" reads as an unfinished site, so
// each is advertised only once it has something behind it. Both listers return
// [] when their database is unconfigured, so this needs no extra guard and the
// links reappear on their own once posts exist.
export default async function Home() {
  const [posts, essays, archive] = await Promise.all([
    listPosts(),
    listEssays(),
    // Only whether it is empty matters here, so this asks for one row rather
    // than three hundred.
    listArchivePhotos(1),
  ]);
  const navLinks = NAV_LINKS.filter(
    (l) => l.href !== "/writing" || posts.length > 0
  );

  // The studio is where photographs get uploaded and essays get written, and
  // it has always been reachable only by typing the URL. It is in the nav now
  // — but the check runs here, on the server, against the same signed cookie
  // the studio's own routes check. A visitor is not served a link they cannot
  // use, and more to the point the markup they receive contains no mention
  // that a studio exists. Hiding it with CSS would have shipped the word to
  // everyone and only stopped them seeing it.
  // Same rule as writing and the darkroom: a nav item that lands on "nothing
  // here yet" reads as an unfinished site, so the archive is advertised only
  // once there is something in it.
  if (archive.length > 0) {
    // findIndex returns -1 when the anchor is missing, and splice(-1, ...)
    // quietly inserts second-from-last instead of failing, so the fallback is
    // explicit: append.
    const at = navLinks.findIndex((l) => l.href === "#activity");
    navLinks.splice(at < 0 ? navLinks.length : at, 0, {
      label: "Archive",
      href: "/archive",
    });
  }

  return (
    <main className="relative min-h-screen bg-bg text-fg">
      <a href="#project" className="skip-link text-[13px] font-medium">
        Skip to content
      </a>
      <nav data-spot className="fixed top-0 left-0 w-full z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between gap-6 max-w-[720px]">
          <AdminEntry>
            <span className="text-[13px] font-medium tracking-[-0.02em] whitespace-nowrap">
              Surfing Whale
            </span>
          </AdminEntry>

          <GlassNav links={navLinks} />

          <div className="flex items-center gap-1">
            {/* Decided in the browser, not baked into the document — see the
                note in AdminEntry. */}
            <AdminLink className="hidden sm:block text-[13px] font-medium text-fg-body hover:text-fg transition-colors duration-200 mr-3" />
            <ThemeToggle />
            <MobileNav links={navLinks} />
          </div>
        </div>
      </nav>

      <div className="pt-14">
        <UnlockedBanner />
        <AccessProvider>
        <ProfileModeProvider>
          <HeroSection />
          <ProfileContent
            analystContent={
              <>
                {/* The index first, then the cards. One is for deciding what to
                    read, the other is for looking at — and the cards were doing
                    both badly. */}
                <DirectorySection />
                <ProjectSectionWrapper />
                <ActivitySection />
                <CVSection />
              </>
            }
            captureContent={<PhotographySection hasDarkroom={essays.length > 0} hasArchive={archive.length > 0} />}
          />
        </ProfileModeProvider>
        </AccessProvider>
        <GuestNotesSection />
        <ContactSection />
      </div>

      <footer data-spot className="border-t border-border py-8 px-6 mt-16">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-3 max-w-[720px]">
          <span className="text-[13px] text-fg-secondary">Muhammad Fauzy</span>
          <span className="text-[13px] text-fg-muted">
            © {new Date().getFullYear()} Surfing Whale
          </span>
        </div>
      </footer>

      <Reveal />
      <VisitorCard />
    </main>
  );
}
