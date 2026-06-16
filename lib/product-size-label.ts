export function cleanLengthSizeLabel(value: string) {
  return value.replace(/^length\s+/i, "").trim();
}

export function normalizeSizeFilterValue(value: string) {
  const cleaned = cleanLengthSizeLabel(value).trim();
  return cleaned.toLowerCase().replace(/\s+/g, "-");
}

export function sizeFilterCandidates(value: string) {
  const cleaned = cleanLengthSizeLabel(value).trim();
  const normalized = normalizeSizeFilterValue(value);
  const candidates = new Set([value.trim(), cleaned, normalized]);

  if (/^\d+$/.test(cleaned)) {
    candidates.add(`Length ${cleaned}`);
    candidates.add(`length-${cleaned}`);
  }

  return Array.from(candidates).filter(Boolean);
}
