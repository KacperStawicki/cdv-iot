import sanitizeHtml from 'sanitize-html';

export const sanitizeInput = (input: string): string => {
  return sanitizeHtml(input, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
  }).trim();
};
