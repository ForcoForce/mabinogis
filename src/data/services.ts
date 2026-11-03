export interface Service {
  id: string; title: string; blurb: string;
  icon: "map" | "analysis" | "database" | "cog";
  coord: string;
}

export const services: Service[] = [
  { id: "map-design", title: "Map Design", icon: "map", coord: "01 · MAP DESIGN",
    blurb: "Clear, good-looking maps that tell the story at a glance." },
  { id: "gis-analysis", title: "GIS Analysis", icon: "analysis", coord: "02 · GIS ANALYSIS",
    blurb: "Turning spatial data into answers: patterns, proximity and change over time." },
  { id: "geodb-analysis", title: "Geospatial Database Analysis", icon: "database", coord: "03 · DATABASE ANALYSIS",
    blurb: "Auditing, querying and untangling the spatial databases you already have." },
  { id: "geodb-management", title: "Database Creation & Management", icon: "cog", coord: "04 · DATABASE BUILD",
    blurb: "Designing, building and maintaining geospatial databases that stay tidy." },
];
