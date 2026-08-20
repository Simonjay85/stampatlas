export type StampCondition = "Mint" | "Used" | "Fine used" | "FDC";

export type Stamp = {
  id: string;
  slug: string;
  title: string;
  country: string;
  countryCode: string;
  year: number;
  decade: string;
  topic: string;
  series: string;
  color: string;
  condition: StampCondition;
  denomination: string;
  image: string;
  imageAlt: string;
  description: string;
  historicalContext: string;
  perforation: string;
  watermark: string;
  printingMethod: string;
  printRun: string;
  catalogueReference: string;
  distinguishingFeatures: string[];
  value: {
    mint: [number, number];
    used: [number, number];
    fdc: [number, number];
    currency: string;
    confidence: "Illustrative";
  };
  valueEvidence: Array<{ condition: "Mint" | "Used" | "FDC"; source: string; observedAt: string; observation: string }>;
  sourceCredit: string;
  sourceUrl: string;
  provenance: {
    provider: "Wikimedia Commons" | "Smithsonian" | "Public-domain archive";
    rightsLabel: string;
    attribution: string;
    publishStatus: "Seeded verified" | "Approved import";
  };
  isSeededMock: true;
};

const imageSet = [
  {
    src: "/manus-storage/usps-national-parks-1934_fc5d903c.jpg",
    alt: "Official 1934 United States National Park Service commemorative stamp issue",
    credit: "Chris Light scan; underlying U.S. Post Office design, public domain in the United States",
    url: "https://commons.wikimedia.org/wiki/File:USPS_National_Park_Service_1934.jpg",
    provider: "Wikimedia Commons",
    rightsLabel: "Public domain",
  },
  {
    src: "/manus-storage/usps-two-cent-reds-1926_3e7f9d63.jpg",
    alt: "Official 1926 United States two-cent Sesquicentennial commemorative stamps",
    credit: "U.S. Post Office / Bureau of Engraving and Printing, public domain in the United States",
    url: "https://commons.wikimedia.org/wiki/File:Two_Cent_Reds_of_1926-1930.jpg",
    provider: "Wikimedia Commons",
    rightsLabel: "Public domain",
  },
] as const;

const records = [
  ["liberty-observatory", "Liberty Observatory", "United States", "US", 1938, "Architecture", "Civic Landmarks", "Burnt orange", "3¢"],
  ["prairie-mail-route", "Prairie Mail Route", "United States", "US", 1952, "Transport", "American Scenes", "Olive green", "4¢"],
  ["flag-over-capitol", "Flag Over Capitol", "United States", "US", 1963, "Patriotic", "National Symbols", "Indigo & red", "5¢"],
  ["coastal-preserve", "Coastal Preserve", "United States", "US", 1978, "Nature", "National Parks", "Sea blue", "15¢"],
  ["moonlight-post", "Moonlight Post", "United States", "US", 1998, "Space", "Millennium Studies", "Midnight blue", "33¢"],
  ["coronation-rose", "Coronation Rose", "United Kingdom", "GB", 1953, "Royalty", "Crown & Country", "Carmine", "2½d"],
  ["harbour-ferry", "Harbour Ferry", "United Kingdom", "GB", 1967, "Transport", "Modern Britain", "Ultramarine", "4d"],
  ["winter-garden", "Winter Garden", "United Kingdom", "GB", 1974, "Flora", "British Gardens", "Emerald", "8p"],
  ["science-museum", "Science Museum", "United Kingdom", "GB", 1988, "Science", "Industrial Heritage", "Violet", "31p"],
  ["island-lighthouse", "Island Lighthouse", "United Kingdom", "GB", 2004, "Architecture", "Coastal Britain", "Amber", "42p"],
  ["alpine-mailcoach", "Alpine Mailcoach", "France", "FR", 1936, "Transport", "French Routes", "Sepia", "1f"],
  ["marianne-study", "Marianne Study", "France", "FR", 1958, "Portrait", "Republic Studies", "Cobalt", "25c"],
  ["river-market", "River Market", "France", "FR", 1972, "Culture", "French Life", "Saffron", "0,50f"],
  ["garden-orchid", "Garden Orchid", "France", "FR", 1986, "Flora", "French Botany", "Magenta", "2,20f"],
  ["european-bridge", "European Bridge", "France", "FR", 2001, "Architecture", "European Design", "Slate blue", "0,46€"],
  ["cherry-post", "Cherry Post", "Japan", "JP", 1949, "Flora", "Spring Seasons", "Rose", "5y"],
  ["mountain-temple", "Mountain Temple", "Japan", "JP", 1961, "Architecture", "Heritage Views", "Vermilion", "10y"],
  ["paper-crane", "Paper Crane", "Japan", "JP", 1976, "Culture", "Craft Traditions", "Teal", "20y"],
  ["night-rail", "Night Rail", "Japan", "JP", 1989, "Transport", "Modern Journeys", "Navy", "41y"],
  ["sea-turtle-watch", "Sea Turtle Watch", "Japan", "JP", 2005, "Wildlife", "Ocean Studies", "Turquoise", "80y"],
  ["imperial-garden", "Imperial Garden", "Brazil", "BR", 1943, "Flora", "Botanical Studies", "Leaf green", "300r"],
  ["coffee-harvest", "Coffee Harvest", "Brazil", "BR", 1956, "Agriculture", "Brazil at Work", "Umber", "1,20cr"],
  ["rainforest-canopy", "Rainforest Canopy", "Brazil", "BR", 1971, "Nature", "Living Forests", "Jade", "2cr"],
  ["modernist-hall", "Modernist Hall", "Brazil", "BR", 1984, "Architecture", "Design in Brazil", "Concrete grey", "150cr"],
  ["macaw-flight", "Macaw Flight", "Brazil", "BR", 2002, "Wildlife", "Brazilian Fauna", "Cerulean", "0,60r"],
  ["nile-sails", "Nile Sails", "Egypt", "EG", 1935, "Transport", "River Heritage", "Crimson", "4m"],
  ["desert-astronomy", "Desert Astronomy", "Egypt", "EG", 1959, "Science", "Egyptian Studies", "Indigo", "10m"],
  ["thebes-column", "Thebes Column", "Egypt", "EG", 1970, "Archaeology", "Ancient Sites", "Ochre", "25m"],
  ["coral-reef", "Coral Reef", "Egypt", "EG", 1983, "Nature", "Red Sea Life", "Aqua", "35m"],
  ["solar-temple", "Solar Temple", "Egypt", "EG", 2003, "Architecture", "Historic Horizons", "Gold", "1le"],
  ["southern-cross", "Southern Cross", "Australia", "AU", 1941, "Space", "Australian Skies", "Blue black", "2½d"],
  ["outback-postman", "Outback Postman", "Australia", "AU", 1965, "People", "Australians at Work", "Rust", "5d"],
  ["eucalyptus-study", "Eucalyptus Study", "Australia", "AU", 1979, "Flora", "Native Botanicals", "Sage", "20c"],
  ["reef-guardian", "Reef Guardian", "Australia", "AU", 1992, "Wildlife", "Ocean Guardians", "Ocean blue", "45c"],
  ["opera-silhouette", "Opera Silhouette", "Australia", "AU", 2006, "Architecture", "Australian Design", "Charcoal", "50c"],
  ["northern-pine", "Northern Pine", "Canada", "CA", 1946, "Nature", "Forest Studies", "Pine green", "4c"],
  ["maple-message", "Maple Message", "Canada", "CA", 1964, "Patriotic", "Canadian Symbols", "Scarlet", "5c"],
  ["arctic-research", "Arctic Research", "Canada", "CA", 1973, "Science", "Northern Science", "Ice blue", "8c"],
  ["prairie-bison", "Prairie Bison", "Canada", "CA", 1987, "Wildlife", "Canadian Wildlife", "Brown", "37c"],
  ["urban-garden", "Urban Garden", "Canada", "CA", 2007, "Flora", "Living Cities", "Green", "52c"],
] as const;

export const stamps: Stamp[] = records.map((record, index) => {
  const [slug, title, country, countryCode, year, topic, series, color, denomination] = record;
  const image = imageSet[index % imageSet.length];
  const mintLow = 7 + (index % 6) * 4;
  const usedLow = Math.max(3, mintLow - 4);
  return {
    id: `sa-${String(index + 1).padStart(3, "0")}`,
    slug,
    title,
    country,
    countryCode,
    year,
    decade: `${Math.floor(year / 10) * 10}s`,
    topic,
    series,
    color,
    condition: index % 4 === 0 ? "Fine used" : "Mint",
    denomination,
    image: image.src,
    imageAlt: image.alt,
    description: `${title} is a clearly marked development record in the ${series} series. Its composition centres on ${topic.toLowerCase()} and is included to demonstrate visual catalogue browsing.`,
    historicalContext: `Seeded development metadata places this mock issue in a ${Math.floor(year / 10) * 10}s design context. It should not be treated as a catalogue authority.`,
    perforation: index % 3 === 0 ? "Comb 13 × 13½" : index % 3 === 1 ? "Line 12½" : "Comb 14",
    watermark: index % 4 === 0 ? "Crown motif (illustrative)" : "None recorded in development data",
    printingMethod: index % 2 === 0 ? "Photogravure (illustrative)" : "Offset lithography (illustrative)",
    printRun: `${(1.2 + (index % 8) * 0.35).toFixed(2)}m (illustrative)`,
    catalogueReference: "Licensed Scott / Stanley Gibbons reference unavailable in development data",
    distinguishingFeatures: [
      `${color} palette`,
      `${denomination} denomination`,
      `${topic.toLowerCase()} motif`,
      `${year} issue year`,
    ],
    value: {
      mint: [mintLow, mintLow + 10],
      used: [usedLow, usedLow + 7],
      fdc: [mintLow + 8, mintLow + 22],
      currency: "USD",
      confidence: "Illustrative",
    },
    valueEvidence: [
      { condition: "Mint", source: "StampAtlas development fixture", observedAt: "20 Aug 2026", observation: "Mock mint-condition range; no external market data used." },
      { condition: "Used", source: "StampAtlas development fixture", observedAt: "20 Aug 2026", observation: "Mock used-condition range; no external market data used." },
      { condition: "FDC", source: "StampAtlas development fixture", observedAt: "20 Aug 2026", observation: "Mock first-day-cover range; no external market data used." },
    ],
    sourceCredit: image.credit,
    sourceUrl: image.url,
    provenance: {
      provider: image.provider,
      rightsLabel: image.rightsLabel,
      attribution: image.credit,
      publishStatus: "Seeded verified",
    },
    isSeededMock: true,
  };
});

export type CatalogFilter = {
  query?: string;
  country?: string;
  decade?: string;
  topic?: string;
  condition?: string;
  source?: string;
};

export function filterStamps(filters: CatalogFilter) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  return stamps.filter((stamp) => {
    const searchText = `${stamp.title} ${stamp.country} ${stamp.year} ${stamp.series} ${stamp.topic}`.toLowerCase();
    return (
      (!query || searchText.includes(query)) &&
      (!filters.country || filters.country === "All countries" || stamp.country === filters.country) &&
      (!filters.decade || filters.decade === "All eras" || stamp.decade === filters.decade) &&
      (!filters.topic || filters.topic === "All topics" || stamp.topic === filters.topic) &&
      (!filters.condition || filters.condition === "All conditions" || stamp.condition === filters.condition) &&
      (!filters.source || filters.source === "All sources" || stamp.provenance.provider === filters.source)
    );
  });
}

export const countries = ["All countries", ...Array.from(new Set(stamps.map((stamp) => stamp.country)))];
export const decades = ["All eras", ...Array.from(new Set(stamps.map((stamp) => stamp.decade)))];
export const topics = ["All topics", ...Array.from(new Set(stamps.map((stamp) => stamp.topic)))];
export const conditions = ["All conditions", "Mint", "Used", "Fine used", "FDC"];
export const sources = ["All sources", ...Array.from(new Set(stamps.map((stamp) => stamp.provenance.provider)))];

export function getStamp(slug: string) {
  return stamps.find((stamp) => stamp.slug === slug);
}

export type PublicAlbum = { slug: string; name: string; description: string; stampSlugs: string[] };
export type PublicProfile = { username: string; displayName: string; location: string; bio: string; albums: PublicAlbum[] };

export const publicProfiles: PublicProfile[] = [
  {
    username: "elena",
    displayName: "Elena",
    location: "Lisbon, Portugal",
    bio: "A living gallery of landscapes, civic symbols, and small visual moments from the postwar era. This is a read-only seeded public profile for the StampAtlas MVP.",
    albums: [
      { slug: "modern-icons", name: "Modern icons", description: "Civic symbols and visual studies from a changing world.", stampSlugs: ["flag-over-capitol", "paper-crane", "coral-reef", "maple-message"] },
      { slug: "small-horizons", name: "Small horizons", description: "Landscape-minded designs, from forests to far coasts.", stampSlugs: ["rainforest-canopy", "sea-turtle-watch", "northern-pine", "solar-temple"] },
    ],
  },
];

export function getPublicProfile(username: string) {
  return publicProfiles.find((profile) => profile.username === username);
}

export function getPublicAlbum(username: string, slug: string) {
  return getPublicProfile(username)?.albums.find((album) => album.slug === slug);
}

export const featuredStamps = [stamps[2], stamps[17], stamps[28], stamps[36]];
