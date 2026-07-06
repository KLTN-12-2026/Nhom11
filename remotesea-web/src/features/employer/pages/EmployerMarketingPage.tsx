import { PricingSection } from "@/features/employer/components/PricingSection";
import { FAQSection } from "@/features/employer/components/FAQSection";
import { HeroSection } from "@/features/employer/pages/employer-marketing/HeroSection";
import { LogoStrip } from "@/features/employer/pages/employer-marketing/LogoStrip";
import { WhySection } from "@/features/employer/pages/employer-marketing/WhySection";
import { CompareSection } from "@/features/employer/pages/employer-marketing/CompareSection";
import { ProcessSection } from "@/features/employer/pages/employer-marketing/ProcessSection";
import { CaseStudySection } from "@/features/employer/pages/employer-marketing/CaseStudySection";
import { FinalCtaSection } from "@/features/employer/pages/employer-marketing/FinalCtaSection";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const EmployerMarketingPage = () => {
  useDocumentTitle("For Employers — Hire Vietnam Remote Talent");

  return (
    <>
      <HeroSection />
      <LogoStrip />
      <WhySection />
      <CompareSection />
      <ProcessSection />

      <div id="pricing">
        <PricingSection />
      </div>

      <CaseStudySection />
      <FAQSection />
      <FinalCtaSection />
    </>
  );
};
