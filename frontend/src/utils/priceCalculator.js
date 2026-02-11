/**
 * Parse page range string into array of page numbers.
 * Supports formats: "all", "1-5", "2,4,6", "1-3,7,10-12"
 */
export function parsePageRange(rangeStr, totalPages) {
  if (!rangeStr || rangeStr.toLowerCase() === "all") {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set();
  const parts = rangeStr.split(",").map((s) => s.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      const page = Number(part);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Calculate the number of physical sides needed based on pages and pagesPerSet.
 */
export function calculateSidesNeeded(activePageCount, pagesPerSet) {
  const pps = parseInt(pagesPerSet) || 1;
  return Math.ceil(activePageCount / pps);
}

/**
 * Find matching pricing rule from rules array.
 */
export function findPricingRule(rules, colorType, sideType, pageCount) {
  // Find most specific match (smallest range that contains pageCount)
  let bestMatch = null;
  let bestRange = Infinity;

  for (const rule of rules) {
    if (rule.colorType === colorType && rule.sideType === sideType) {
      if (pageCount >= rule.fromPage && pageCount <= rule.toPage) {
        const range = rule.toPage - rule.fromPage;
        if (range < bestRange) {
          bestMatch = rule;
          bestRange = range;
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Get price per page from a pricing rule based on profile type.
 */
export function getPriceFromRule(rule, profileType) {
  if (!rule) return 0;
  switch (profileType?.toLowerCase()) {
    case "student":
      return rule.studentPrice || 0;
    case "institute":
      return rule.institutePrice || 0;
    default:
      return rule.regularPrice || 0;
  }
}

/**
 * Find binding price for given binding type, page count, and profile type.
 */
export function getBindingPrice(bindingType, pageCount, profileType) {
  if (!bindingType || !bindingType.prices || !bindingType.isActive) return 0;

  let bestMatch = null;
  let bestRange = Infinity;

  for (const priceRange of bindingType.prices) {
    if (pageCount >= priceRange.fromPage && pageCount <= priceRange.toPage) {
      const range = priceRange.toPage - priceRange.fromPage;
      if (range < bestRange) {
        bestMatch = priceRange;
        bestRange = range;
      }
    }
  }

  if (!bestMatch) return 0;

  switch (profileType?.toLowerCase()) {
    case "student":
      return bestMatch.studentPrice || 0;
    case "institute":
      return bestMatch.institutePrice || 0;
    default:
      return bestMatch.regularPrice || 0;
  }
}

/**
 * Calculate total price for a print job.
 * @param {Object} params
 * @param {number} params.totalPages - Total pages in document
 * @param {string} params.pageRange - Page range string
 * @param {string} params.colorType - 'bw' or 'color'
 * @param {string} params.sideType - 'single' or 'double'
 * @param {string} params.pagesPerSet - Pages per physical page (1, 2, 4, 6, 9, 16)
 * @param {number} params.copies - Number of copies
 * @param {Object} params.bindingType - Binding type object with prices
 * @param {string} params.profileType - 'Regular', 'Student', 'Institute'
 * @param {Array} params.pricingRules - Array of pricing rules
 * @returns {Object} { printCost, bindingCost, totalPerCopy, total, activePages, sidesNeeded, pricePerPage }
 */
export function calculatePrice({
  totalPages,
  pageRange,
  colorType,
  sideType,
  pagesPerSet,
  copies,
  bindingType,
  profileType,
  pricingRules,
}) {
  // 1. Determine active pages
  const activePageNumbers = parsePageRange(pageRange, totalPages);
  const activePages = activePageNumbers.length;

  // 2. Calculate sides needed
  const sidesNeeded = calculateSidesNeeded(activePages, pagesPerSet);

  // 3. Find pricing rule
  const rule = findPricingRule(pricingRules, colorType, sideType, activePages);
  const pricePerPage = getPriceFromRule(rule, profileType);

  // 4. Calculate print cost
  const printCost = sidesNeeded * pricePerPage;

  // 5. Calculate binding cost
  const bindingCost = getBindingPrice(bindingType, activePages, profileType);

  // 6. Total per copy
  const totalPerCopy = printCost + bindingCost;

  // 7. Total with copies
  const total = totalPerCopy * (copies || 1);

  return {
    printCost,
    bindingCost,
    totalPerCopy,
    total,
    activePages,
    sidesNeeded,
    pricePerPage,
  };
}

/**
 * Default pricing rules (fallback when Firestore rules not available)
 */
export const defaultPricingRules = [
  { id: "default-bw-single", colorType: "bw", sideType: "single", fromPage: 1, toPage: 9999, studentPrice: 1.0, institutePrice: 0.8, regularPrice: 1.5 },
  { id: "default-bw-double", colorType: "bw", sideType: "double", fromPage: 1, toPage: 9999, studentPrice: 1.5, institutePrice: 1.2, regularPrice: 2.0 },
  { id: "default-color-single", colorType: "color", sideType: "single", fromPage: 1, toPage: 9999, studentPrice: 5.0, institutePrice: 4.0, regularPrice: 7.0 },
  { id: "default-color-double", colorType: "color", sideType: "double", fromPage: 1, toPage: 9999, studentPrice: 8.0, institutePrice: 6.5, regularPrice: 10.0 },
];
