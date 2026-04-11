/**
 * generate-material-types-excel.js
 *
 * Genera el archivo Excel listo para importar en el módulo Material Types.
 *
 * Uso:
 *   node scripts/generate-material-types-excel.js
 *
 * Salida:
 *   scripts/material-types-seed.xlsx
 */

const XLSX = require("xlsx");
const path = require("path");

/**
 * Derives a material-type code from a human-readable name.
 * Takes the first letter of each word, uppercases, and truncates to 10 chars.
 * @param {string} name
 * @returns {string}
 */
function toCode(name) {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 10);
}

const ROWS = [          

  // ── Decoration & Theming ───────────────────────────────────────────────
  { categoryName: "Decoration & Theming", name: "LED Fairy Light String 10m",   description: "Warm white decorative string lights for ambient setups",        pricePerDay: 15000  },
  { categoryName: "Decoration & Theming", name: "Balloon Arch Frame Kit",        description: "Complete adjustable frame for balloon arch displays",            pricePerDay: 25000  },
  { categoryName: "Decoration & Theming", name: "Step & Repeat Banner Stand 2x2m", description: "Collapsible backdrop stand with carrying bag",               pricePerDay: 40000  },
  { categoryName: "Decoration & Theming", name: "Tall Metallic Candelabra",      description: "Elegant centerpiece candelabra 150 cm height",                 pricePerDay: 20000  },
  { categoryName: "Decoration & Theming", name: "LED Neon Sign",                 description: "Custom design flexible LED neon sign for branding",             pricePerDay: 60000  },

  // ── Electrical Equipment ───────────────────────────────────────────────
  { categoryName: "Electrical Equipment", name: "Portable Generator 5 kVA",     description: "Silent diesel generator for outdoor events",                    pricePerDay: 150000 },
  { categoryName: "Electrical Equipment", name: "Power Distribution Box 32A",   description: "Multi-outlet professional power distro panel",                  pricePerDay: 45000  },
  { categoryName: "Electrical Equipment", name: "Extension Cable 50m 3-Phase",  description: "Heavy-duty outdoor-rated electrical extension cable",           pricePerDay: 20000  },
  { categoryName: "Electrical Equipment", name: "UPS 3000VA",                   description: "Uninterruptible power supply for sensitive equipment",          pricePerDay: 55000  },
  { categoryName: "Electrical Equipment", name: "Voltage Regulator 5 kVA",      description: "Industrial stabilizer protecting AV equipment from surges",    pricePerDay: 40000  },

  // ── Event Structures ───────────────────────────────────────────────────
  { categoryName: "Event Structures",     name: "Folding Banquet Table 1.8m",   description: "Rectangular lightweight folding table seats 6-8 guests",       pricePerDay: 12000  },
  { categoryName: "Event Structures",     name: "Padded Folding Chair",          description: "White padded folding chair for formal events",                  pricePerDay: 5000   },
  { categoryName: "Event Structures",     name: "Modular Stage Section 2x1m",   description: "Aluminum adjustable-height stage platform section",             pricePerDay: 35000  },
  { categoryName: "Event Structures",     name: "Pipe & Drape Kit 3m",          description: "Complete uprights, crossbars and drape panel set",             pricePerDay: 50000  },
  { categoryName: "Event Structures",     name: "Steel Crowd Control Barrier",  description: "Interlocking steel safety barrier panel for crowd management",  pricePerDay: 15000  },

  // ── Furniture ──────────────────────────────────────────────────────────
  { categoryName: "Furniture",            name: "High Cocktail Table",           description: "Round high-top cocktail table 110 cm height",                  pricePerDay: 18000  },
  { categoryName: "Furniture",            name: "Lounge Sofa 3-Seater",         description: "Modern white event lounge sofa for VIP areas",                 pricePerDay: 55000  },
  { categoryName: "Furniture",            name: "Chrome Padded Bar Stool",      description: "Adjustable height chrome bar stool with padded seat",          pricePerDay: 10000  },
  { categoryName: "Furniture",            name: "Draped Buffet Table 2m",       description: "Folding table pre-dressed with skirting for service areas",    pricePerDay: 20000  },
  { categoryName: "Furniture",            name: "Upholstered Ottoman Cube",     description: "Square ottoman in neutral upholstery for event lounges",       pricePerDay: 12000  },

  // ── IT & Computing Equipment ───────────────────────────────────────────
  { categoryName: "IT & Computing Equipment", name: "Laptop 15\" i7 16GB",      description: "Windows laptop configured for event presentations",             pricePerDay: 70000  },
  { categoryName: "IT & Computing Equipment", name: "Wireless Presenter Clicker", description: "Bluetooth slide remote with laser pointer and timer",         pricePerDay: 15000  },
  { categoryName: "IT & Computing Equipment", name: "Router WiFi 6 High-Density", description: "Enterprise wireless router for high-attendance events",       pricePerDay: 30000  },
  { categoryName: "IT & Computing Equipment", name: "Managed Gigabit Switch 24-Port", description: "Rackmount managed network switch for event infrastructure", pricePerDay: 40000 },
  { categoryName: "IT & Computing Equipment", name: "Tablet 10\" Registration", description: "iPad configured for guest check-in and registration",          pricePerDay: 35000  },

  // ── Lighting Equipment ─────────────────────────────────────────────────
  { categoryName: "Lighting Equipment",   name: "Moving Head Beam 200W",        description: "Professional motorized spot/beam moving head fixture",         pricePerDay: 90000  },
  { categoryName: "Lighting Equipment",   name: "LED PAR 64 RGBW",              description: "DMX-controlled stage wash light, full color mix",              pricePerDay: 30000  },
  { categoryName: "Lighting Equipment",   name: "Water-Based Haze Machine 1500W", description: "Low-haze atmospheric effect machine for lighting beams",     pricePerDay: 40000  },
  { categoryName: "Lighting Equipment",   name: "DMX Lighting Controller 512ch", description: "Professional 512-channel lighting console",                   pricePerDay: 50000  },
  { categoryName: "Lighting Equipment",   name: "Laser RGB 5W",                 description: "Full-color 5W professional event laser with DMX control",     pricePerDay: 80000  },

  // ── Photography Equipment ──────────────────────────────────────────────
  { categoryName: "Photography Equipment", name: "DSLR Camera Full Frame Body", description: "Professional DSLR body (Canon/Nikon) with dual card slots",   pricePerDay: 120000 },
  { categoryName: "Photography Equipment", name: "Mirrorless Camera Kit 24-70mm", description: "Sony A7 mirrorless with standard zoom lens",                 pricePerDay: 150000 },
  { categoryName: "Photography Equipment", name: "Studio Flash Kit 3-Light",    description: "Complete monoblock strobe set with softboxes and stands",      pricePerDay: 80000  },
  { categoryName: "Photography Equipment", name: "DJI Drone Mini 4K",           description: "Compact aerial drone for event photography and video",         pricePerDay: 100000 },
  { categoryName: "Photography Equipment", name: "360 Rotating Photo Booth",    description: "Automated rotating camera platform for 360 video clips",      pricePerDay: 200000 },

  // ── Stage & Performance Equipment ─────────────────────────────────────
  { categoryName: "Stage & Performance Equipment", name: "Wireless Handheld Microphone",  description: "Shure ULX-D system with rechargeable handheld transmitter", pricePerDay: 55000 },
  { categoryName: "Stage & Performance Equipment", name: "Stage Wedge Monitor 12\"",       description: "Floor monitor wedge speaker for stage performers",           pricePerDay: 35000 },
  { categoryName: "Stage & Performance Equipment", name: "Adjustable Podium / Lectern",   description: "Height-adjustable presentation podium with shelf",            pricePerDay: 30000 },
  { categoryName: "Stage & Performance Equipment", name: "Teleprompter Kit",              description: "Glass beamsplitter teleprompter with controller and stand",   pricePerDay: 60000 },
  { categoryName: "Stage & Performance Equipment", name: "Presenter Confidence Monitor 40\"", description: "Backstage flat-screen monitor for presenter notes",       pricePerDay: 45000 },

  // ── Tools & Accessories ────────────────────────────────────────────────
  { categoryName: "Tools & Accessories", name: "Audio Multicore Snake 32ch",    description: "32-channel stage box with 30m cable for audio routing",        pricePerDay: 30000  },
  { categoryName: "Tools & Accessories", name: "Professional Event Toolbox",    description: "Complete tool kit: screwdrivers, pliers, cable tester, etc.", pricePerDay: 25000  },
  { categoryName: "Tools & Accessories", name: "Gaffer Tape Pack x5",           description: "5-roll pack of heavy-duty black cloth gaffer tape",           pricePerDay: 8000   },
  { categoryName: "Tools & Accessories", name: "ATA Flight Case Large",         description: "Wheeled road case for transporting fragile equipment",        pricePerDay: 20000  },
  { categoryName: "Tools & Accessories", name: "Walkie-Talkie Set 5 Units",     description: "5-unit two-way radio set with charging base station",         pricePerDay: 40000  },

  // ── Video Equipment ────────────────────────────────────────────────────
  { categoryName: "Video Equipment",     name: "LED Video Wall Panel P2.9",     description: "Indoor P2.9 LED wall module for staging and events",           pricePerDay: 180000 },
  { categoryName: "Video Equipment",     name: "Laser Projector 5000lm Full HD", description: "Long-throw laser projector for large projection surfaces",    pricePerDay: 130000 },
  { categoryName: "Video Equipment",     name: "Fast-Fold Projection Screen 3x2m", description: "Quick-deploy rear/front projection screen with frame",      pricePerDay: 45000  },
  { categoryName: "Video Equipment",     name: "HDMI Live Switcher 4-Input",    description: "Multi-source video production switcher for live events",       pricePerDay: 55000  },
  { categoryName: "Video Equipment",     name: "HDMI Distribution Amplifier 1:8", description: "1-in 8-out HDMI signal splitter and booster",               pricePerDay: 25000  },
];

const orderedRows = ROWS.map((row) => ({
  categoryName: row.categoryName,
  code: toCode(row.name),
  name: row.name,
  pricePerDay: row.pricePerDay,
  description: row.description,
}));

const ws = XLSX.utils.json_to_sheet(orderedRows, {
  header: ["categoryName", "code", "name", "pricePerDay", "description"],
});

// Column widths
ws["!cols"] = [
  { wch: 30 }, // categoryName
  { wch: 12 }, // code
  { wch: 40 }, // name
  { wch: 14 }, // pricePerDay
  { wch: 58 }, // description
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "MaterialTypes");

const outPath = path.join(__dirname, "material-types-seed.xlsx");
XLSX.writeFile(wb, outPath);

console.log(`✅ Excel generado: ${outPath}`);
console.log(`📊 Filas: ${ROWS.length} tipos de material (5 por cada categoría)`);
