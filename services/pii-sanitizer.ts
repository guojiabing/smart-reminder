const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /[一-鿿]{2,4}(?=同学|老师|家长)/g, replacement: "[学生]" },
  { pattern: /1[3-9]\d{9}/g, replacement: "[手机号]" },
  { pattern: /\d{6,18}[xX]?/g, replacement: "[证件号]" },
  { pattern: /[\w.-]+@[\w.-]+\.\w+/g, replacement: "[邮箱]" },
  { pattern: /(?:[一-鿿]+(?:省|市|区|县|路|街|号|栋|楼|室))+/g, replacement: "[地址]" },
];

const NAME_PLACEHOLDER = "[学生]";
const SCHOOL_PLACEHOLDER = "[学校]";

export interface SanitizeResult {
  sanitizedText: string;
  piiFound: boolean;
  replacementCount: number;
}

export function sanitizePii(text: string, realName?: string, schoolName?: string): SanitizeResult {
  let result = text;
  let count = 0;

  if (realName && realName.length > 0) {
    const nameRegex = new RegExp(escapeRegex(realName), "g");
    const matches = result.match(nameRegex);
    if (matches) count += matches.length;
    result = result.replace(nameRegex, NAME_PLACEHOLDER);
  }

  if (schoolName && schoolName.length > 0) {
    const schoolRegex = new RegExp(escapeRegex(schoolName), "g");
    const matches = result.match(schoolRegex);
    if (matches) count += matches.length;
    result = result.replace(schoolRegex, SCHOOL_PLACEHOLDER);
  }

  for (const { pattern, replacement } of PII_PATTERNS) {
    const cloned = new RegExp(pattern.source, pattern.flags);
    const matches = result.match(cloned);
    if (matches) count += matches.length;
    result = result.replace(cloned, replacement);
  }

  return {
    sanitizedText: result,
    piiFound: count > 0,
    replacementCount: count,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
