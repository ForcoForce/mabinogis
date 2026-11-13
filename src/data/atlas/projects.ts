// The list of atlas projects. A future "Atlas" tab in the side panel can read this list.
export interface AtlasProject {
  slug: string;
  title: string;
  summary: string;
  href: string;
  status: "live" | "planned";
}

export const atlasProjects: AtlasProject[] = [
  {
    slug: "pannonia",
    title: "Atlas Pannoniae Praehistoricae",
    summary:
      "An interactive map of prehistoric archaeological sites in Pannonia, the Dinaric Alps and along the Adriatic coast, from the Paleolithic to the Iron Age.",
    href: "/atlas/pannonia",
    status: "live",
  },
];
