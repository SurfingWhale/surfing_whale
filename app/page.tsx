// app/page.tsx — Server Component, NO "use client"
import { HeroSection } from "./components/sections/HeroSection";
import ProjectSectionWrapper from "./components/sections/ProjectSectionWrapper";
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
import { ThemeToggle } from "./components/ThemeToggle";
import { VisitorCard } from "./components/VisitorCard";
import { Reveal } from "./components/Reveal";
import { listPosts } from "./lib/writing";
import { listEssays } from "./lib/darkroom";

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
  const [posts, essays] = await Promise.all([listPosts(), listEssays()]);
  const navLinks = NAV_LINKS.filter(
    (l) => l.href !== "/writing" || posts.length > 0
  );

  return (
    <main className="relative min-h-screen bg-bg text-fg">
      <a href="#project" className="skip-link text-[13px] font-medium">
        Skip to content
      </a>
      <nav data-spot className="fixed top-0 left-0 w-full z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between gap-6 max-w-[720px]">
          <span className="text-[13px] font-medium tracking-[-0.02em] whitespace-nowrap">Surfing Whale</span>

          <GlassNav links={navLinks} />

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <MobileNav links={navLinks} />
          </div>
        </div>
      </nav>

      <div className="pt-14">
        <AccessProvider>
        <ProfileModeProvider>
          <HeroSection />
          <ProfileContent
            analystContent={
              <>
                <ProjectSectionWrapper />
                <ActivitySection />
                <CVSection />
              </>
            }
            captureContent={<PhotographySection hasDarkroom={essays.length > 0} />}
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
