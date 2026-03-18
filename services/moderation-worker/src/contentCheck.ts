export interface ContentCheckResult {
    decision: 'OK' | 'KO';
    reasons: string[];
}

const FORBIDDEN_WORDS = [
    'arnaque',
    'contrefaçon',
    'faux',
    'insulte',
    'merde',
];

// Simple regex for emails
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
// Simple regex for phone numbers (French/international rough match)
const PHONE_REGEX = /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/;
// Simple regex for URLs
const URL_REGEX = /https?:\/\/[^\s]+/g;

export function checkArticleContent(title: string, description: string): ContentCheckResult {
    const reasons: string[] = [];
    const fullText = `${title} ${description}`.toLowerCase();

    // 1. Length checks
    if (title.length < 5 || title.length > 100) {
        reasons.push('Title must be between 5 and 100 characters');
    }
    if (description.length < 20 || description.length > 5000) {
        reasons.push('Description must be between 20 and 5000 characters');
    }

    // 2. Forbidden words check
    for (const word of FORBIDDEN_WORDS) {
        if (fullText.includes(word)) {
            reasons.push(`Contains forbidden word: ${word}`);
        }
    }

    // 3. Link count check (>= 3 is KO)
    const linksMatch = fullText.match(URL_REGEX);
    const linkCount = linksMatch ? linksMatch.length : 0;
    if (linkCount >= 3) {
        reasons.push(`Contains too many links (${linkCount}, max allowed is 2)`);
    }

    // 4. Contact info check (Email / Phone)
    if (EMAIL_REGEX.test(fullText)) {
        reasons.push('Contains an email address which is forbidden');
    }
    if (PHONE_REGEX.test(fullText)) {
        reasons.push('Contains a phone number which is forbidden');
    }

    return {
        decision: reasons.length > 0 ? 'KO' : 'OK',
        reasons,
    };
}
