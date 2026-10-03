// app/page.tsx — Server Component, NO "use client"
import { HeroSection } from "./components/sections/HeroSection";
import ProjectSectionWrapper from "./components/sections/ProjectSectionWrapper";
import { DirectorySection } from "./components/sections/DirectorySection";
import { CVSection } from "./components/sections/CVSection";
import { ActivitySection } from "./components/sections/ActivitySection";
import { ContactSection } from "./components/sections/ContactSection";
import { PhotographySection } from "./components/sections/PhotographySection";
import { GuestNotesSection } from "./components/sections/GuestNotesSection";
import { TestamentSection } from "./components/sections/TestamentSection";
import { HalloSection } from "./components/sections/HalloSection";
import { SiteFooter } from "./components/SiteFooter";
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
import { listPublishedPhotos } from "./lib/photos";
import { JsonLd, homeGraph } from "./lib/schema";

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "#" },
  { label: "Projects", href: "#project" },
  { label: "Writing", href: "/writing" },
  { label: "Darkroom", href: "/photo" },
  { label: "Activity", href: "#activity" },
  { label: "About", href: "#CV" },
  { label: "Notes", href: "#guest-notes" },
  { label: "Contact", href: "#contact" },
];

// Writing and the darkroom both start empty. A nav item that lands on
// "Nothing published yet" reads as an unfinished site, so each is advertised
// only once it has something behind it. Both listers return [] when their
// database is unconfigured, so this needs no extra guard and the links appear
// on their own once something is published.
//
// The darkroom had no nav entry at all, which meant /photo was reachable from
// nowhere — good title, good description, and no path to it from the home
// page in any state. Both are in the sitemap whatever this filter decides,
// which is the half of discoverability that does not depend on having
// published yet.
export default async function Home() {
  const [posts, essays, photos] = await Promise.all([
    listPosts(),
    listEssays(),
    listPublishedPhotos(),
  ]);
  const navLinks = NAV_LINKS.filter((l) => {
    if (l.href === "/writing") return posts.length > 0;
    if (l.href === "/photo") return essays.length > 0;
    return true;
  });

  return (
    <main className="relative min-h-screen bg-bg text-fg">
      <JsonLd data={homeGraph()} />
      {/* Everything but the footer, on one sheet that lifts off it at the end
          of the page (globals.css, .page-sheet). */}
      <div className="page-sheet">
      <a href="#hero" className="skip-link text-[13px] font-medium">
        Skip to content
      </a>
      <nav data-spot className="site-nav fixed top-0 left-0 w-full z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="frame h-14 flex items-center justify-between gap-6">
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

      {/* The skip link lands on the hero (#hero), past the greeting: the
          start of the content in either half, not a section only one of them
          has. */}
      <div id="content" className="pt-16">
        <UnlockedBanner />
        <AccessProvider>
        <ProfileModeProvider>
          <HalloSection />
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
            captureContent={<PhotographySection hasDarkroom={essays.length > 0} photos={photos} />}
          />
        </ProfileModeProvider>
        {/* After the work and the photographs, before the visitor is asked to
            say anything: what the rest of the page is for. */}
        <TestamentSection />
        {/* Inside the provider now. Contact asks the gate whether this reader
            is approved before it will open WhatsApp, so it has to be able to
            see it — and the gate is the thing that explains the wait. */}
        <GuestNotesSection />
        <ContactSection />
        </AccessProvider>
      </div>

      <Reveal />
      <VisitorCard />
      </div>

      <SiteFooter hasWriting={posts.length > 0} hasDarkroom={essays.length > 0} />
    </main>
  );
}
