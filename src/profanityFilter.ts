import { Filter } from 'bad-words';

const englishFilter = new Filter();

// Basic Arabic profanity list (can be expanded)
const arabicWords = [
  'احا',
  'شرموطة',
  'شرموط',
  'عرص',
  'متناك',
  'خول',
  'لبوة',
  'منيوك',
  'خولات',
  'معرص',
  'قحبة',
  'قحاب',
  'زبي',
  'كس',
  'كسمك',
  'كسم',
  'كس امك',
  'ابن المتناكة',
  'بنت المتناكة',
  'ابن العرص',
  'ابن الشرموطة',
  'ابن القحبة',
  'خرا',
  'وسخ',
  'وسخة',
  'زانية',
  'زاني',
  'نيك',
  'نيكه',
  'بضان',
  'بضاني',
  'طيز',
  'طيزك',
  'مومس',
  'عاهر',
  'عاهرة',
  'فاجرة',
  'فاجر',
  'ديوث',
  'مخنث',
  'شاذ',
  'شواذ',
  'علق',
  'علوق',
  // Game hints and cheating prevention (Arabic)
  'النصيحة', 'نصيحة', 'نصيحه', 'النصيحه',
  'التلميح', 'تلميح',
  'هينت',
  'معلومة', 'معلومه',
  'اول', 'أول',
  'ثاني', 'تاني',
  'ثالث', 'تالت',
  'رابع',
  'خامس',
  'سادس',
  'سابع',
  'ثامن', 'تامن',
  'تاسع',
  'عاشر',
  'عدد',
  'حرف', 'الحروف', 'حروف',
  'كام',
  'كلمة', 'كلمه',
  'الجاسوس', 'جاسوس',
  'عدد الحروف', 'عدد الكلمات',
  'اول حرف', 'تاني حرف', 'تالت حرف', 'رابع حرف', 'خامس حرف', 'سادس حرف', 'سابع حرف', 'تامن حرف', 'تاسع حرف', 'اخر حرف',
  'اول كلمة', 'تاني كلمة',
  'كام كلمة', 'كام حرف',
  
  // Franco versions
  'nasi7a', 'nasee7a', 'nasy7a', 'nasiha',
  'talmee7', 'talmi7', 'talmih',
  'hint',
  'ma3loma', 'ma3looma', 'ma3louma',
  'awel', 'awal', 'awwal',
  'tany', 'thany', 'tani', 'thani',
  'talt', 'thalth', 'talet', 'thalet',
  'rabe3', 'rabi3',
  '5ames', 'khames',
  'sades',
  'sabe3', 'sabi3',
  'tamn', 'thaman', 'tamen', 'thamen',
  'tase3', 'tasi3',
  '3asher',
  '3adad',
  '7arf', '7orof', '7oroof', '7roof', 'harf', 'horof',
  'kam',
  'kelma', 'kilma',
  'gasos', 'gasoos', 'jasos', 'jasoos',
  '3adad el 7orof', '3adad el 7oroof', '3adad el kelmat',
  'awal 7arf', 'awel 7arf', 'tany 7arf', 'tani 7arf', 'talet 7arf', 'thalth 7arf', 'rabe3 7arf', 'rabi3 7arf', '5ames 7arf', 'khames 7arf', 'sades 7arf', 'sabe3 7arf', 'sabi3 7arf', 'tamn 7arf', 'thaman 7arf', 'tase3 7arf', 'tasi3 7arf', 'a5er 7arf', 'akher 7arf',
  'kam kelma', 'kam 7arf', 'kam 7arf',
  'awel kelma', 'awal kelma', 'tany kelma', 'tani kelma',
  
  // Franco Profanity
  'a7a', 'sharmota', 'sharmouta', 'sharmot', '3ars', 'metnak', '5ol', 'khol', 'labwa', 'manyok', 'manyouk', 'mo3ars', 'qa7ba', 'ka7ba', 'zebi', 'zeby', 'kos', 'koss', 'kosomak', 'kosomk', '5ara', 'khara', 'weskh', 'neik', 'neek', 'bedan', 'teez', 'tyz', 'dayos', 'dayouth', 'shaz', '3alq', '3alouq',
  
  // English translations
  'advice', 'hint', 'information', 'info',
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
  'number', 'count', 'letter', 'letters', 'word', 'words', 'spy',
  'how many', 'how many words', 'how many letters',
  'first letter', 'second letter', 'third letter', 'fourth letter', 'fifth letter', 'sixth letter', 'seventh letter', 'eighth letter', 'ninth letter', 'last letter',
  'first word', 'second word',
  'letter count', 'word count',
];

function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/لآ/g, "لا")
    .replace(/[ضظط]/g, "ظ") // Normalize similar sounding letters for better matching
    .replace(/[ًٌٍَُِّ]/g, ""); // Remove diacritics
}

function filterArabic(text: string): string {
  let filteredText = text;
  const normalizedInput = normalizeArabic(text);
  
  arabicWords.forEach(word => {
    const normalizedWord = normalizeArabic(word);
    // Use a regex that matches the normalized word in the normalized text
    // but applies the replacement to the original text.
    // This is tricky because indices might shift if normalization changes length.
    // However, for these simple replacements, length usually stays the same or we can just use the original word if it exists.
    
    // Simple approach: if the normalized word is in the normalized input, 
    // we try to find where it is and mask it in the original.
    // But for now, let's just use the existing regex approach with the normalized word as well.
    
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    
    if (normalizedWord !== word) {
      const normRegex = new RegExp(normalizedWord, 'gi');
      filteredText = filteredText.replace(normRegex, '*'.repeat(normalizedWord.length));
    }
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
