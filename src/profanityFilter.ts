import { Filter } from 'bad-words';

const englishFilter = new Filter();

// Basic Arabic profanity list (can be expanded)
const arabicWords = [
  'كلمة_مسيئة_1',
  'كلمة_مسيئة_2',
  'كلمة_مسيئة_3',
  // Add more Arabic offensive words here
];

function filterArabic(text: string): string {
  let filteredText = text;
  arabicWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  return filteredText;
}

function filterPhoneNumbers(text: string): string {
  // Regex for Egyptian mobile numbers (010, 011, 012, 015 followed by 8 digits)
  // Also matches general sequences of 10-15 digits to catch other numbers
  // Allows for spaces, dashes, or dots between digits
  const phoneRegex = /\b(?:\+?20|0)?1[0125]\d{8}\b|\b\d{10,15}\b|\b(?:\d[ -.]*){10,15}\b/g;
  
  return text.replace(phoneRegex, (match) => {
    // Check if it's actually a long number sequence (to avoid filtering short numbers or dates if possible, though dates are usually shorter)
    // For now, replace with a placeholder
    return "[رقم هاتف محذوف]";
  });
}

export function filterProfanity(text: string): string {
  if (typeof text !== 'string') return '';
  let filtered = englishFilter.clean(text);
  filtered = filterArabic(filtered);
  filtered = filterPhoneNumbers(filtered);
  return filtered;
}
