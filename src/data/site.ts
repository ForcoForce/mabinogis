export interface NavEntry { label: string; href: string; coord: string; enabled: boolean; }
export interface Social { label: string; href: string; }

export const site = {
  name: "Mabinogis",
  owner: "Marko Đuranović, M.A.",
  url: "https://www.mabinogis.com",
  tagline: "Maps are cool.",
  email: "marko@mabinogis.com",
  phone: "+49 179 538 7888",
  location: "Zagreb / Remote",
  coord: "45°48′N 15°58′E",
  availability: "Open for new projects. I usually reply within a couple of working days.",
  formAction: "https://formspree.io/f/YOUR_ID",
  socials: [
    { label: "ArtStation", href: "https://www.artstation.com/forcoforce" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/marko-%C4%91uranovi%C4%87-a145961a5/" },
  ] as Social[],
};

export const nav: NavEntry[] = [
  { label: "Home",      href: "/",          coord: "45°48′N", enabled: true },
  { label: "Portfolio", href: "/portfolio", coord: "15°58′E", enabled: true },
  { label: "Blog",      href: "/blog",      coord: "45°49′N", enabled: true },
  { label: "Contact",   href: "/contact",   coord: "15°59′E", enabled: true },
  // reserved for future expansion (enabled: false = hidden from nav)
  { label: "Services",  href: "/services",  coord: "45°50′N", enabled: false },
  { label: "About",     href: "/about",     coord: "16°00′E", enabled: false },
  { label: "Shop",      href: "/shop",      coord: "45°47′N", enabled: false },
  { label: "RSS",       href: "/rss.xml",   coord: "15°57′E", enabled: false },
];
