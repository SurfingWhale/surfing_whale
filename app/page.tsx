// app/page.tsx — Server Component, NO "use client"
import { HeroSection } from "./components/sections/HeroSection";
import ProjectSectionWrapper from "./components/sections/ProjectSectionWrapper";
import { CVSection } from "./components/sections/CVSection";
import { SkillsSection } from "./components/sections/SkillsSection";
import { ActivitySection } from "./components/sections/ActivitySection";
import { ContactSection } from "./components/sections/ContactSection";
import { PhotographySection } from "./components/sections/PhotographySection";
import { MobileNav } from "./components/Mobilenav/Mobilenav";
import { ProfileContent } from "./components/ProfileContent";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#080808] text-[#F8F8FF] overflow-x-hidden">
      {/* Noise background */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "300px",
        }}
      />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,_#1f0800,_#080808)]" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/[0.04] bg-[#080808]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 h-12 flex items-center justify-between">
          <span className="font-mono text-sm text-[#ff6a00] tracking-[0.3em] uppercase flex-shrink-0">
            @SurfingWhale
          </span>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-8 text-xs font-mono text-white/40 tracking-widest uppercase">
            <a href="#" className="hover:text-white transition-colors duration-300">Home</a>
            <a href="#project" className="hover:text-white transition-colors duration-300">Projects</a>
            <a href="#skills" className="hover:text-white transition-colors duration-300">Skills</a>
            <a href="#activity" className="hover:text-white transition-colors duration-300">Activity</a>
            <a href="#CV" className="hover:text-white transition-colors duration-300">CV</a>
            <a href="#contact" className="text-[#ff6a00] hover:text-[#ffd500] transition-colors duration-300">Contact</a>
          </div>

          {/* Mobile hamburger */}
          <MobileNav />
        </div>
      </nav>

      {/* Content */}
      <div className="pt-12">
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
          photographyContent={<PhotographySection />}
        />
        <ContactSection />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 px-4 md:px-6 mt-16">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
          <span className="font-mono text-xs text-[#ff6a00] tracking-widest">
            SURFINGWHALE_TERMINAL [ONLINE]
          </span>
          <span className="font-mono text-xs text-white/20">
            © {new Date().getFullYear()} MUHAMMAD_FAUZY
          </span>
          <span className="font-mono text-xs text-white/20">
            ● SYSTEM_STATUS_NOMINAL
          </span>
        </div>
      </footer>
    </main>
  );
}