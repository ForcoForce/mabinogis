export interface NavEntry { label: string; href: string; coord: string; enabled: boolean; }
export interface Social { label: string; href: string; }

export const site = {
  name: "Mabinogis",
  owner: "Marko Đuranović, M.A.",
  url: "https://www.mabinogis.com",
  tagline: "Maps are cool.",
  email: "marko@mabinogis.com",
  phone: "+49 179 538 7888",
  location: "Germany / Croatia / Remote",
  coord: "11°22.4′N 142°35.5′E",
  availability: "Open for new projects. I usually reply within a couple of hours.",
  formAction: "https://formspree.io/f/YOUR_ID",
  socials: [
    { label: "ArtStation", href: "https://www.artstation.com/forcoforce" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/marko-%C4%91uranovi%C4%87-a145961a5/" },
  ] as Social[],
};

export const nav: NavEntry[] = [
  { label: "Home",      href: "/",          coord: "27°59′18″N 86°55′31″E", enabled: true },
  { label: "Portfolio", href: "/portfolio", coord: "32°39′11″S 70°00′42″W", enabled: true },
  { label: "Blog",      href: "/blog",      coord: "63°04′09″N 151°00′23″W", enabled: true },
  { label: "Contact",   href: "/contact",   coord: "03°04′33″S 37°21′12″E", enabled: true },
  // reserved for future expansion (enabled: false = hidden from nav)
  { label: "Services",  href: "/services",  coord: "43°21′18″N 42°26′21″E", enabled: false },
  { label: "About",     href: "/about",     coord: "78°31′32″S 85°37′02″W", enabled: false },
  { label: "Shop",      href: "/shop",      coord: "04°04′44″S 137°09′30″E", enabled: false },
  { label: "RSS",       href: "/rss.xml",   coord: "36°27′21″S 148°15′49″E", enabled: false },
];
