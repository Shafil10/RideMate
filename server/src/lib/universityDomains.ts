interface UniversityDomainEntry {
  displayName: string;
  // Suffix-matched, so listing the base domain also covers student subdomains —
  // e.g. "aiub.edu" matches AIUB's actual student mail at "student.aiub.edu",
  // and "bracu.ac.bd" matches BRAC's student G Suite mail at "g.bracu.ac.bd".
  domain: string;
}

// Verified against each university's own site/notices (not guessed) — top
// private universities in Dhaka. Anything not listed here still gets in via the
// broad .edu/.edu.bd/.ac.bd fallback below, just with a less polished name.
const KNOWN_UNIVERSITIES: UniversityDomainEntry[] = [
  { displayName: "North South University", domain: "northsouth.edu" },
  { displayName: "BRAC University", domain: "bracu.ac.bd" },
  { displayName: "Independent University, Bangladesh", domain: "iub.edu.bd" },
  { displayName: "American International University-Bangladesh", domain: "aiub.edu" },
  { displayName: "East West University", domain: "ewubd.edu" },
  { displayName: "United International University", domain: "uiu.ac.bd" },
  { displayName: "Ahsanullah University of Science and Technology", domain: "aust.edu" },
  { displayName: "Daffodil International University", domain: "diu.edu.bd" },
];

const FALLBACK_SUFFIXES = [".edu", ".edu.bd", ".ac.bd"];

function domainMatches(emailDomain: string, entryDomain: string): boolean {
  return emailDomain === entryDomain || emailDomain.endsWith(`.${entryDomain}`);
}

function titleCaseFromLabel(label: string): string {
  return label
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// Returns the resolved university display name for a signup email, or null if
// the domain isn't a recognized/plausible university domain at all (gmail.com,
// yahoo.com, etc.) — the signup route rejects signup entirely when this is null.
export function resolveUniversityFromEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1) return null;
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain) return null;

  for (const entry of KNOWN_UNIVERSITIES) {
    if (domainMatches(domain, entry.domain)) {
      return entry.displayName;
    }
  }

  if (FALLBACK_SUFFIXES.some((suffix) => domain === suffix.slice(1) || domain.endsWith(suffix))) {
    const firstLabel = domain.split(".")[0];
    return titleCaseFromLabel(firstLabel);
  }

  return null;
}
