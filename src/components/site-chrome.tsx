import { CountryLogo } from "@/components/country-logo";
import { useGlobalSettings } from "@/hooks/use-global-settings";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Instagram, Linkedin, Menu, Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { applySiteTheme, nextSiteTheme, readSiteTheme, siteThemeLabels, usesLightSurfaces, type SiteTheme } from '@/lib/site-theme';
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/local/riloyd-logo.png.optimized.nav.webp";
import darkLogoAsset from "@/assets/local/riloyd-logo-dark.png.optimized.nav.webp";
const darkLogo = darkLogoAsset;
import globalGlossy from "@/assets/local/riloyd-global-glossy.png.webp";
import globalLight from "@/assets/local/riloyd-global-light.png.webp";
import { serviceOrder, serviceConfigs } from "@/lib/service-config";
import { findMarket } from "@/lib/market-config";
import { internationalServices } from "@/lib/international-programme";

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isGlobalPage = pathname.startsWith("/global-presence");
  const activeMarket = isGlobalPage ? findMarket(pathname.split("/")[2] ?? "") : undefined;
  const [theme, setTheme] = useState<SiteTheme>("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setTheme(readSiteTheme(localStorage.getItem("riloyd-theme")));
  }, []);

  useEffect(() => {
    applySiteTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const next = nextSiteTheme(theme);
    setTheme(next);
    localStorage.setItem("riloyd-theme", next);
  }
  const lightSurfaces = usesLightSurfaces(theme);
  const nextLabel = siteThemeLabels[nextSiteTheme(theme)];

  const navItems = [
    { label: "Home", to: "/" as const },
    { label: "About", to: "/about" as const },
    { label: "Services", to: "/services" as const },
    { label: "Contact", to: "/contact" as const },
    { label: "Help", to: "/help" as const },
  ];

  return <header className="relative z-30 border-b border-border bg-background text-foreground">
    <div className="mx-auto grid h-[70px] max-w-[1380px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-12">
      <Link to="/" aria-label={activeMarket ? `Riloyd ${activeMarket.name} home` : isGlobalPage ? "Riloyd Global home" : "Riloyd home"} className="block h-[59px] w-[188px] shrink-0 sm:w-[208px]">{activeMarket ? <CountryLogo market={activeMarket} className="h-full w-full object-contain object-left" /> : <img src={isGlobalPage ? (lightSurfaces ? globalLight : globalGlossy) : (lightSurfaces ? darkLogo : logoAsset)} alt={isGlobalPage ? "Riloyd Global" : "Riloyd"} className="h-full w-full object-contain object-left" decoding="async" />}</Link>
      <nav aria-label="Main navigation" className="hidden items-center justify-center gap-6 text-xs font-bold xl:gap-9 lg:flex">
        {navItems.map((item) => activeMarket && activeMarket.slug !== "india" && item.label === "Services" ? <Link key={item.label} to="/global-presence/$slug" params={{ slug: activeMarket.slug }} hash="services" className="nav-link">Services</Link> : <Link key={item.label} to={item.to} className={`nav-link ${pathname === item.to ? "nav-active" : ""}`}>{item.label}</Link>)}
        <DropdownMenu><DropdownMenuTrigger className={`nav-link inline-flex items-center gap-1 outline-none ${pathname === "/foundation" || pathname === "/education-support" ? "nav-active" : ""}`}>RILOYD Foundation <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /></DropdownMenuTrigger><DropdownMenuContent align="start" className="min-w-52"><DropdownMenuItem asChild><Link to="/foundation">RILOYD Foundation</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/education-support">Education Support – Scholarship Registration</Link></DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </nav>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme} aria-label={`Switch to ${nextLabel} theme`} title={`Switch to ${nextLabel} theme`}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
        <Button asChild variant="outline" className="hidden h-8 rounded-full border-primary px-4 text-[11px] font-bold lg:inline-flex"><Link to="/register">Register Now <ArrowRight size={14} /></Link></Button>
        <Button asChild variant="outline" className="h-8 rounded-full border-primary px-3 text-[11px] font-bold sm:px-4"><Link to="/login">Login <ArrowRight size={14} /></Link></Button>
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 lg:hidden" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu size={19} /></Button>
      </div>
    </div>
    {menuOpen && <nav aria-label="Mobile navigation" className="absolute inset-x-0 top-full z-40 flex flex-col border-b border-border bg-background px-5 py-3 shadow-xl lg:hidden">
      {navItems.map((item) => activeMarket && activeMarket.slug !== "india" && item.label === "Services" ? <Link key={item.label} to="/global-presence/$slug" params={{ slug: activeMarket.slug }} hash="services" onClick={() => setMenuOpen(false)} className="border-b border-border py-3 text-sm font-semibold">Services</Link> : <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className="border-b border-border py-3 text-sm font-semibold last:border-0">{item.label}</Link>)}
      <Link to="/foundation" onClick={() => setMenuOpen(false)} className="py-3 text-sm font-semibold">RILOYD Foundation</Link><Link to="/education-support" onClick={() => setMenuOpen(false)} className="border-b border-border pb-3 pl-4 text-sm text-muted-foreground">↳ Education Support</Link>
      <div className="grid grid-cols-2 gap-2 py-3"><Button asChild variant="outline" className="h-10 rounded-full border-primary text-xs font-bold"><Link to="/register" onClick={() => setMenuOpen(false)}>Register Now <ArrowRight size={14} /></Link></Button><Button asChild variant="outline" className="h-10 rounded-full border-primary text-xs font-bold"><Link to="/login" onClick={() => setMenuOpen(false)}>Login <ArrowRight size={14} /></Link></Button></div>
    </nav>}
  </header>;
}

const footerMenu = [
  { label: "Home", to: "/" as const },
  { label: "About", to: "/about" as const },
  { label: "Contact", to: "/contact" as const },
  { label: "Register", to: "/register" as const },
  { label: "Careers", to: "/careers" as const },
  { label: "Help Centre", to: "/help" as const },
  { label: "Login", to: "/login" as const },
];
const footerPrograms = [
  { label: "Funding Programme", to: "/funding-programme" as const },
  { label: "Prototype Funding", to: "/prototype-funding" as const },
  { label: "Young Innovators 2026", to: "/young-innovators-2026" as const },
  { label: "Education Support", to: "/education-support" as const },
];

function FooterSocial({ className = "" }: { className?: string }) {
  return <div className={`flex items-center gap-2 ${className}`}><a className="social-link" href="https://www.linkedin.com/company/145354558" target="_blank" rel="noopener noreferrer" aria-label="Riloyd on LinkedIn"><Linkedin className="h-4 w-4" aria-hidden="true" /></a><a className="social-link" href="https://www.instagram.com/riloyd.in/" target="_blank" rel="noopener noreferrer" aria-label="Riloyd on Instagram"><Instagram className="h-4 w-4" aria-hidden="true" /></a></div>;
}

function FooterVolunteer({ className = "", social = false }: { className?: string; social?: boolean }) {
  return <div className={className}><h2 className="text-xs font-bold">Volunteer</h2><div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground"><Link to="/become-a-volunteer">Become a Volunteer</Link><Link to="/volunteer">Volunteer Login</Link></div>
    <div className="mt-2.5 flex items-center gap-3"><Button asChild size="sm" className="h-7 rounded-full px-3 text-[11px] font-bold"><Link to="/become-a-volunteer">Join us <ArrowRight size={13} aria-hidden="true" /></Link></Button>{social && <FooterSocial />}</div></div>;
}

const aboutLinks = [
  { label: "Our Vision", hash: "vision" },
  { label: "Our Mission", hash: "mission" },
  { label: "Who We Serve", hash: "who-we-serve" },
  { label: "What We Do", hash: "what-we-do" },
  { label: "How We Think", hash: "how-we-think" },
  { label: "Our Difference", hash: "our-difference" },
];

/* Phones show About Us in two columns: short names on the left, longer names on the right. */
const phoneAboutOrder = ["vision", "who-we-serve", "what-we-do", "how-we-think", "mission", "our-difference"].map(h => aboutLinks.find(l => l.hash === h)!);

const PeopleLinks = () => <><Link to="/investors">Our Investors</Link><Link to="/mentors">Our Mentors</Link><Link to="/team">Our Team Members</Link><Link to="/careers">Careers</Link><Link to="/startups">Our Startups</Link><Link to="/businesses">Our Businesses</Link></>;
const DownloadLinks = () => <><Link to="/research" className="font-medium text-foreground">Our Researchs</Link><Link to="/downloads">Business Valuation Reports</Link><Link to="/downloads">Business Reports &amp; Documents</Link><Link to="/downloads">All Reports</Link></>;

export function SiteFooter() {
  const settings = useGlobalSettings();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const footerMarket = pathname.startsWith("/global-presence/") ? findMarket(pathname.split("/")[2] ?? "") : undefined;
  const overseas = footerMarket && footerMarket.slug !== "india";
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.documentElement.classList.contains("light") ? "light" : "dark"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
    return () => observer.disconnect();
  }, []);
  const links = "mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground";
  const logo = <Link to="/" aria-label="Riloyd home" className="block shrink-0"><img src={theme === "light" ? darkLogo : logoAsset} alt="Riloyd" loading="lazy" className="h-auto w-[132px] sm:w-36" decoding="async" /></Link>;
  const tagline = <p className="min-w-0 text-[11px] leading-[1.5] text-muted-foreground sm:text-xs">RILOYD helps ambitious businesses find expertise, capital and opportunities for sustainable growth.</p>;
  const explore = <nav aria-label="Explore"><h2 className="text-xs font-bold">Explore</h2><div className={links}>{[...footerMenu, ...footerPrograms].map(l => <Link key={l.to} to={l.to}>{l.label}</Link>)}</div></nav>;
  const people = <div><h2 className="text-xs font-bold">Our People</h2><div className={links}><PeopleLinks /></div></div>;
  const about = <div><h2 className="text-xs font-bold">About Us</h2><div className={links}>{aboutLinks.map((l) => <Link key={l.hash} to="/about" hash={l.hash}>{l.label}</Link>)}</div></div>;
  const services = <div><h2 className="text-xs font-bold">Our Services</h2><div className={links}>{overseas ? internationalServices.map(service => <Link key={service.id} to="/global-presence/$slug" params={{ slug: footerMarket.slug }} hash={service.id}>{service.title}</Link>) : serviceOrder.map((key) => { const service = serviceConfigs[key]; return service ? <Link key={key} to="/services/$slug" params={{ slug: service.slug }}>{service.shortTitle}</Link> : null; })}</div></div>;
  const downloads = <div><h2 className="text-xs font-bold">Downloads</h2><div className={`${links} leading-snug`}><DownloadLinks /></div></div>;
  const emailKeys = ["contact_info_email", "contact_business_email", "contact_careers_email", "contact_idea_email"] as const;
  const emails = emailKeys.map(k => <a key={k} className="whitespace-nowrap font-medium text-foreground hover:underline" href={`mailto:${settings.get(k)}`}>{settings.get(k)}</a>);
  const registered = <div><h3 className="text-xs font-bold text-foreground">Registered Office</h3><p className="mt-1">Rishishwar Industry Pvt. Ltd., Mahadaji Nagar, Lashkar, Gird, Gwalior M.P. - 474001</p></div>;
  const corporate = <div><h3 className="text-xs font-bold text-foreground">Corporate Office</h3><p className="mt-1">Gincube Center, Motimal, Lashkar, Gird, Gwalior &ndash; 474009</p></div>;
  return <footer className="border-t border-border bg-footer text-foreground">
    <div className="mx-auto max-w-[1380px] px-5 pt-5 pb-4 sm:px-6 lg:px-12">
      {/* Phones: compact rows of two or three columns, each filled edge to edge. */}
      <div className="grid gap-y-5 sm:hidden">
        <div className="flex items-center gap-3">{logo}{tagline}</div>
        <div className="grid grid-cols-[auto_auto_auto] justify-between gap-x-4">
          <nav aria-label="Explore programmes"><h2 className="text-xs font-bold">Explore</h2><div className={links}>{footerPrograms.map(l => <Link key={l.to} to={l.to}>{l.label}</Link>)}</div></nav>
          <div><h2 className="text-xs font-bold">Our People</h2><div className={`${links} whitespace-nowrap`}><PeopleLinks /></div></div>
          <nav aria-label="Footer menu"><h2 className="text-xs font-bold">Menu</h2><div className={links}>{footerMenu.map(l => <Link key={l.to} to={l.to}>{l.label}</Link>)}</div></nav>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-x-4">
          <div className="flex flex-col justify-between gap-y-2">
            {services}
            <Link to="/global-presence" aria-label="Explore Riloyd Global presence" className="block w-full"><img src={theme === "light" ? globalLight : globalGlossy} alt="Riloyd Global" loading="lazy" decoding="async" className="h-[60px] w-auto max-w-full object-contain object-left" /></Link>
          </div>
          <div className="grid content-start gap-y-2.5">
            <div><h2 className="text-xs font-bold">About Us</h2><div className="mt-2 grid grid-cols-[auto_auto] justify-start gap-x-3 gap-y-1.5 whitespace-nowrap text-[11px] text-muted-foreground">{phoneAboutOrder.map((l) => <Link key={l.hash} to="/about" hash={l.hash}>{l.label}</Link>)}</div></div>
            <div><h2 className="text-xs font-bold">Volunteer</h2><div className={links}><Link to="/become-a-volunteer">Become a Volunteer</Link><Link to="/volunteer">Volunteer Login</Link></div>
              <div className="mt-2.5 flex items-center gap-2"><Button asChild size="sm" className="h-7 rounded-full px-3 text-[11px] font-bold"><Link to="/become-a-volunteer">Join us <ArrowRight size={13} aria-hidden="true" /></Link></Button><FooterSocial /></div></div>
          </div>
        </div>
      </div>
      {/* Tablets: 3 columns; small laptops: 6 columns; desktops: brand, five link groups and contact on one row. */}
      <div className="hidden gap-x-5 gap-y-5 sm:grid sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-[1.35fr_repeat(5,minmax(0,1fr))_1.75fr] xl:gap-x-6">
        <div className="flex items-center gap-5 sm:col-span-3 lg:col-span-6 xl:col-span-1 xl:block">
          {logo}<div className="min-w-0 flex-1 xl:mt-2">{tagline}</div><FooterSocial className="xl:hidden" />
          <FooterVolunteer social className="mt-4 hidden xl:block" />
        </div>
        {explore}{people}{about}{services}{downloads}
        <FooterVolunteer social={false} className="xl:hidden" />
        <div className="hidden text-[10.5px] leading-relaxed text-muted-foreground xl:block">
          <h2 className="text-xs font-bold text-foreground">Contact</h2>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">{emails}</div>
          <div className="mt-3 grid gap-2.5">{registered}{corporate}</div>
        </div>
      </div>
      {/* Contact below xl: phones 2 columns, tablets emails | registered | corporate. */}
      <div className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground xl:hidden">
        <h2 className="text-[19px] font-bold leading-none text-foreground sm:text-xs sm:leading-normal">Contact</h2>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[auto_auto_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:col-span-1 sm:grid-cols-1 lg:col-span-2 lg:grid-cols-2 lg:gap-x-6">{emails}</div>
          {registered}{corporate}
        </div>
      </div>
    </div>
    <div className="copyright-bar border-t border-border px-5 py-3 text-center text-muted-foreground sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1380px] flex-col items-center gap-2 lg:flex-row lg:gap-6 lg:text-left">
        <Link to="/global-presence" aria-label="Explore Riloyd Global presence" className="hidden shrink-0 sm:block"><img src={theme === "light" ? globalLight : globalGlossy} alt="Riloyd Global — explore our global presence" loading="lazy" className="h-9 w-auto object-contain" decoding="async" /></Link>
        <div className="flex flex-col items-center gap-0.5 lg:flex-1 lg:flex-row lg:flex-wrap lg:justify-end lg:gap-x-2">
        <p>© {new Date().getFullYear()} RILOYD. All rights reserved by RISHISHWAR INDUSTRY PRIVATE LIMITED.</p>
        <span aria-hidden="true" className="hidden lg:inline">·</span>
        <p>Riloyd &mdash; a unit of RISHISHWAR INDUSTRY PRIVATE LIMITED</p>
        <span aria-hidden="true" className="hidden lg:inline">·</span>
        <p>CIN Number: U85500MP2023PTC068770</p>
        </div>
      </div>
    </div>
  </footer>;
}