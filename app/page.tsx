// app/page.tsx — Server Component, NO "use client"
import { HeroSection } from "./components/sections/HeroSection";
import ProjectSectionWrapper from "./components/sections/ProjectSectionWrapper";
import { CVSection } from "./components/sections/CVSection";
import { SkillsSection } from "./components/sections/SkillsSection";
import { ActivitySection } from "./components/sections/ActivitySection";
import { ContactSection } from "./components/sections/ContactSection";
import { PhotographySection } from "./components/sections/PhotographySection";
import { GuestNotesSection } from "./components/sections/GuestNotesSection";
import { MobileNav } from "./components/Mobilenav/Mobilenav";
import { ProfileContent } from "./components/ProfileContent";
import { ProfileModeProvider } from "./components/ProfileMode";
import { AccessProvider } from "./components/AccessGate";

const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "Projects", href: "#project" },
  { label: "Skills", href: "#skills" },
  { label: "Activity", href: "#activity" },
  { label: "About", href: "#CV" },
  { label: "Notes", href: "#guest-notes" },
  { label: "Contact", href: "#contact" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-bg text-fg">
      <nav data-spot className="fixed top-0 left-0 w-full z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between max-w-[720px]">
          <span className="text-sm font-medium tracking-tight">Surfing Whale</span>

          <div className="hidden md:flex gap-7 text-sm text-fg-secondary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-fg transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          <MobileNav />
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
                <SkillsSection />
                <ActivitySection />
                <CVSection />
              </>
            }
            captureContent={<PhotographySection />}
          />
        </ProfileModeProvider>
        </AccessProvider>
        <GuestNotesSection />
        <ContactSection />
      </div>

      <footer data-spot className="border-t border-border py-8 px-6 mt-16">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-3 max-w-[720px]">
          <span className="text-sm text-fg-secondary">Muhammad Fauzy</span>
          <span className="text-sm text-fg-muted">
            © {new Date().getFullYear()} Surfing Whale
          </span>
        </div>
      </footer>
    </main>
  );
}
