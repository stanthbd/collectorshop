import { checkArticleContent } from '../src/contentCheck';

describe('Content Check Logic', () => {
    it('should pass valid content', () => {
        const result = checkArticleContent('Vintage Rolex Submariner', 'Beautiful watch in excellent condition with original box and papers.');
        expect(result.decision).toBe('OK');
        expect(result.reasons.length).toBe(0);
    });

    it('should reject titles that are too short or too long', () => {
        let result = checkArticleContent('A', 'Beautiful watch in excellent condition with original box and papers.');
        expect(result.decision).toBe('KO');
        expect(result.reasons).toContain('Title must be between 5 and 100 characters');

        const longTitle = 'A'.repeat(101);
        result = checkArticleContent(longTitle, 'Beautiful watch in excellent condition with original box and papers.');
        expect(result.decision).toBe('KO');
        expect(result.reasons).toContain('Title must be between 5 and 100 characters');
    });

    it('should reject descriptions that are too short', () => {
        const result = checkArticleContent('Vintage Rolex', 'Too short');
        expect(result.decision).toBe('KO');
        expect(result.reasons).toContain('Description must be between 20 and 5000 characters');
    });

    it('should reject forbidden words', () => {
        const result = checkArticleContent('ArNaQuE watch', 'Beautiful contrefaçon watch in excellent condition.');
        expect(result.decision).toBe('KO');
        expect(result.reasons).toContain('Contains forbidden word: arnaque');
        expect(result.reasons).toContain('Contains forbidden word: contrefaçon');
    });

    it('should reject when there are 3 or more links', () => {
        const desc = 'Check http://link1.com and https://link2.com and also http://link3.com';
        const result = checkArticleContent('Vintage watch', desc);
        expect(result.decision).toBe('KO');
        expect(result.reasons).toContain('Contains too many links (3, max allowed is 2)');
    });

    it('should accept when there are exactly 2 links', () => {
        const desc = 'Check http://link1.com and https://link2.com. Condition is great.';
        const result = checkArticleContent('Vintage watch', desc);
        expect(result.decision).toBe('OK');
    });

    it('should reject email addresses', () => {
        const result = checkArticleContent('Vintage watch', 'Contact me at test@example.com for more info.');
        expect(result.decision).toBe('KO');
        expect(result.reasons).toContain('Contains an email address which is forbidden');
    });

    it('should reject phone numbers', () => {
        const result = checkArticleContent('Vintage watch', 'Call me at 06 12 34 56 78');
        expect(result.decision).toBe('KO');
        expect(result.reasons).toContain('Contains a phone number which is forbidden');

        const result2 = checkArticleContent('Vintage watch', 'Call me at +33612345678');
        expect(result2.decision).toBe('KO');
        expect(result2.reasons).toContain('Contains a phone number which is forbidden');
    });
});
