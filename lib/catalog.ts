// Seed catalog and default editable content. Everything here is copied into MongoDB by the seed
// script and edited from the admin panel afterwards; public pages read from the database.

import { IMG } from "./image-assets";
export { IMG } from "./image-assets";

export type SeedCategory = { code: string; name: string; shortName: string; slug: string; description: string; imageUrl: string; courses: string[] };

export const CATEGORIES: SeedCategory[] = [
  {
    code: "A",
    name: "Permit to Work & Site Safety Supervision",
    shortName: "Site Safety & Supervision",
    slug: "site-safety-supervision",
    description: "Permit-to-work, gas testing, isolation and supervision roles that keep live industrial sites controlled and safe.",
    imageUrl: IMG.catA,
    courses: [
      "Work Permit Receiver (WPR) Certification Preparation",
      "Fire Watch / Standby Fire Watcher",
      "Hole Watch / Confined Space Attendant",
      "Standby Man (Confined Space & Excavation)",
      "Authorized Gas Tester (AGT)",
      "Job Safety Analysis (JSA) & Hazard Identification",
      "Lockout / Tagout (LOTO) Authorized Person",
      "Scaffolding Erector, Inspector & Supervisor",
    ],
  },
  {
    code: "B",
    name: "Confined Space, Gas & Respiratory Protection",
    shortName: "Confined Space & Gas Safety",
    slug: "confined-space-gas-safety",
    description: "Entry, attendance, rescue and respiratory protection training for confined spaces and toxic gas environments.",
    imageUrl: IMG.catB,
    courses: [
      "Confined Space Entrant & Attendant",
      "Confined Space Entry Supervisor",
      "Confined Space Rescue Specialist",
      "SCBA (Self-Contained Breathing Apparatus) User & Technician",
      "SCUBAMAN (Surface-Supplied Marine/Diver Support Safety)",
      "H₂S (Hydrogen Sulfide) Awareness & Breathing Apparatus",
      "Quantitative Respiratory Fit Testing",
    ],
  },
  {
    code: "C",
    name: "Offshore, Marine & Water Safety",
    shortName: "Offshore & Marine Safety",
    slug: "offshore-marine-safety",
    description: "Offshore induction, emergency escape, survival and helideck training for marine and offshore operations.",
    imageUrl: IMG.catC,
    courses: [
      "HUET (Helicopter Underwater Escape Training)",
      "BOSIET & T-BOSIET (Basic Offshore Safety Induction & Emergency Training)",
      "FOET (Further Offshore Emergency Training / Refresher)",
      "Offshore Survival & Sea Survival Specialist",
      "Offshore Lifeboatman / Capsule Operator (TEMPSC)",
      "Helideck Landing Officer (HLO) & Helideck Assistant (HDA)",
    ],
  },
  {
    code: "D",
    name: "Heavy Machinery & Equipment Operators",
    shortName: "Heavy Equipment & Lifting",
    slug: "heavy-equipment-lifting",
    description: "Operator training and practical assessment for earthmoving, lifting and access equipment, plus rigging competence.",
    imageUrl: IMG.catD,
    courses: [
      "Compactor & Road Roller Operators",
      "Excavator, Backhoe & Trenching Machine Operators",
      "Wheel Loader, Skid Steer & Bulldozer Operators",
      "Motor Grader Operators",
      "Mobile Crane & Tower Crane Operators",
      "Overhead / Gantry Crane Operators",
      "Forklift Truck & Telehandler Operators",
      "Manlift / Aerial Work Platform (AWP / MEWP) Operators",
      "Rigger Level 1, Level 2, and Level 3 Certifications",
      "Rigging & Heavy Lifting Supervisor",
    ],
  },
  {
    code: "E",
    name: "Emergency Response, First Aid & Specialized Industrial Training",
    shortName: "Emergency Response",
    slug: "emergency-response",
    description: "First aid, fire fighting, rescue and specialized industrial hazard training for site emergency readiness.",
    imageUrl: IMG.catE,
    courses: [
      "Basic & Advanced First Aid, CPR & AED",
      "Basic & Advanced Industrial Fire Fighting",
      "High-Angle & Rope Rescue Specialist",
      "Trenching, Shoring & Excavation Safety",
      "Defensive Driving (Oil & Gas Field Matrix)",
      "Working at Height & Fall Protection",
      "HAZMAT & Chemical Safety (HAZCOM)",
      "Sandblasting, Industrial Painting & Hydro-jetting Safety",
    ],
  },
];

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/₂/g, "2")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function defaultCourseCopy(name: string, category: string) {
  return {
    shortDescription: `${name} training within GSI's ${category} programme.`,
    description: `${name} is delivered through classroom instruction and practical assessment by GSI. The final course outline, duration and certificate validity are confirmed with each client before enrolment, in line with the site or contractor requirements that apply.`,
    whoShouldAttend: "Workers, technicians and supervisors who are assigned to this role on industrial, construction, marine or energy sites, or who need to renew an existing certificate.",
    duration: "Confirmed on enquiry",
  };
}

export const DEFAULT_LOCATIONS = [
  {
    name: "Al Khobar",
    label: "Head Office",
    city: "Al Khobar",
    country: "Saudi Arabia" as const,
    description: "Our head office in Al Khobar serves as the central hub for our training programs and regional operations.",
    imageUrl: IMG.khobar,
    isHeadOffice: true,
    sortOrder: 1,
  },
  {
    name: "Jubail",
    label: "Training Center",
    city: "Jubail",
    country: "Saudi Arabia" as const,
    description: "Our Jubail training center provides specialized facilities for hands-on industrial training.",
    imageUrl: IMG.jubail,
    isHeadOffice: false,
    sortOrder: 2,
  },
];

export type SiteSettings = typeof DEFAULT_SETTINGS;

export const DEFAULT_SETTINGS = {
  instituteName: "GSI",
  instituteFullName: "Gulf Safety Institute",
  tagline: "Empowering Gulf Industries with Certified Safety & Technical Competence",
  utilityText: "Serving the Gulf. Raising the standard.",
  footerText: "Developing safer, more competent workforces for a stronger and more sustainable Gulf industry.",
  logoUrl: "/brand/gsi-logo.png",
  faviconUrl: "/brand/gsi-icon.png",
  stampUrl: "",
  // Certificate layout
  signatureUrl: "",
  signatureLabel: "Authorized Signature",
  supervisionText: "",
  certificateWebsite: "",
  accreditationLogos: [] as string[],
  // Client requirement: the QR landing page and PDFs show the full ID number.
  publicShowFullId: true,
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  social: { linkedin: "", facebook: "", instagram: "", x: "", youtube: "" },
  notificationEmail: "",
  certificatePrefix: "GSI",
  idCardDisclaimer:
    "This card is only valid for the equipment or competency stated. Use of this card by any person other than its owner is considered forgery. If found, please return it to a GSI office. This is not a government-issued license.",
  stats: [
    { value: "auto", label: "Training Programs" },
    { value: "auto", label: "Specialist Categories" },
    { value: "6", label: "GCC Countries" },
    { value: "24/7", label: "Certificate Verification" },
  ],
  seoTitle: "GSI | Gulf Safety Institute",
  seoDescription:
    "Third-party industrial safety training, HSE certification, heavy equipment operator training and online certificate verification across Saudi Arabia and the GCC.",
  home: {
    heroEyebrow: "GULF INDUSTRIAL SAFETY & TRAINING",
    heroLine1: "Certified Safety.",
    heroLine2: "Confident Workforces.",
    heroText: "Safety & technical training built for the demands of Gulf industries.",
    heroImage: IMG.hero,
    categoriesEyebrow: "TRAINING THAT MAKES A DIFFERENCE",
    categoriesHeading: "Real skills. Safer operations.",
    standardImage: IMG.practical,
    standardCaption1: "Practical training.",
    standardCaption2: "Proven competence.",
    standardEyebrow: "THE GSI STANDARD",
    standardHeading1: "Prepared for the job.",
    standardHeading2: "Ready for the responsibility.",
    industriesHeading: "Built for the industries that move the Gulf.",
    verifyHeading: "Verify with confidence. In three simple steps.",
    locationsHeading: "Local expertise. Gulf-wide reach.",
    locationsText: "Training at strategic locations to better serve our clients across the region.",
    alignmentText: "Training aligned with regional contractor requirements",
    alignmentNames: "ARAMCO, SABIC, ADNOC, KOC, QATARENERGY",
    ctaHeading: "A safer workforce starts here.",
    ctaText: "Bring practical, on-site training to your team.",
    ctaImage: IMG.cta,
    aboutImage: IMG.about,
  },
};

export const ABOUT = {
  intro: [
    "Gulf Safety Institute (GSI) is a premier third-party technical training and certification institute operating across Saudi Arabia and the Gulf region. Established to bridge the gap between regulatory industrial standards and workforce execution, GSI delivers high-impact, compliance-driven training solutions designed for the oil & gas, petrochemical, construction, marine, and energy sectors.",
    "Our programs strictly align with international safety frameworks and regional client specifications (including Aramco, SABIC, ADNOC, KOC, and QatarEnergy contractors). Through rigorous theoretical instruction and hands-on practical assessments, we ensure that every technician, operator, and safety supervisor evaluated by GSI meets the highest standards of site safety, operational efficiency, and risk prevention.",
  ],
  mission:
    "To safeguard lives and industrial assets across the Gulf region by delivering world-class third-party training, objective competency assessments, and industry-recognized certifications.",
  vision:
    "To be the most trusted and sought-after third-party industrial safety and technical training academy in the Middle East, recognized for unwavering integrity, practical excellence, and regulatory alignment.",
  why: [
    { title: "Third-Party Credibility", text: "Rigorous assessment and verifiable certifications trusted by top tier contractors and plant operators." },
    { title: "Gulf-Wide Compliance", text: "Courses designed around exact regulatory specifications across GCC industrial zones." },
    { title: "Comprehensive Training Infrastructure", text: "Fully equipped practical evaluation grounds for heavy machinery, confined spaces, H₂S scenarios, and offshore escape simulations." },
    { title: "Fast Verification Portal", text: "Online certificate verification system allowing employers and main contractors to instantly validate worker credentials 24/7." },
    { title: "On-Site Corporate Training", text: "Customizable mobile training modules brought directly to project sites, refineries, and shutdown turnarounds." },
  ],
};

export const INDUSTRIES = ["Oil & Gas", "Petrochemical", "Construction", "Marine & Offshore", "Energy & Utilities"];

export const DEFAULT_LEGAL = {
  "privacy-policy": {
    title: "Privacy Policy",
    body: "This privacy policy explains how GSI collects and uses information submitted through this website.\n\nInformation you submit. When you send an enquiry we store your name, company, contact details and message so that our team can respond.\n\nCertificate verification. Verification searches are logged with the searched number, the result, a privacy-preserving client identifier and the browser user agent, to protect the verification service from misuse. Public verification results show only limited trainee details and a masked identity number.\n\nContact. For any privacy request, please contact GSI using the details on the Contact page.\n\nThis content is a placeholder and should be reviewed by GSI before publication.",
  },
  terms: {
    title: "Terms of Use",
    body: "By using this website you agree to these terms.\n\nCertificate verification is provided to help employers and contractors confirm credentials issued by GSI. Automated or bulk scraping of the verification service is not permitted.\n\nCourse information on this website is indicative. Final course content, duration, pricing and certificate validity are confirmed in writing before enrolment.\n\nThis content is a placeholder and should be reviewed by GSI before publication.",
  },
};
