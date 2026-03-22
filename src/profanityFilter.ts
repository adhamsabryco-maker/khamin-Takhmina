import { Filter } from 'bad-words';

const englishFilter = new Filter();

// Basic Arabic profanity list (can be expanded)
const arabicWords = [
  'احا',
  'حضن',
  'بوسة',
  'بيتحضن',
  'بتتحضن',
  'بتنحضن',
  'بتتباس',
  'بتنباس',
  'لباس',
  'خرمان',
  'احضان',
  'لابسه',
  'لبسة',
  'لابسة',
  'مكنة',
  'بكراش',
  'بيتركب',
  'بتتركب',
  'احيه',
  'فرس',
  'شرموطة',
  'شرموط',
  'عرص',
  'متناك',
  'انيك',
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
  'امك',
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
  'نتعرف',
  'بحبك',
  'حب',
  'قلبي',
  'بتاعي',
  'زوبري',
  'زبري',
  'ذبري',
  'ذبر',
  'ذب',
  'زب',
  'كس',
  'كسك',
  'بتاعك',
  'لبسه ايه',
  'بياكلني',
  'حيحان',
  'تعبان',
  'شرقان',
  'مكنه',
  'منيوكه',
  // Game hints and cheating prevention (Arabic)
  'النصيحة', 'نصيحة', 'نصيحه', 'النصيحه',
  'التلميح', 'تلميح',
  'هينت',
  'هنت',
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
  'كاشف',
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

function getCharClass(char: string): string {
  // Normalize common Arabic characters to catch variations
  if (/[اأإآ]/.test(char)) return '[اأإآ]';
  if (/[هة]/.test(char)) return '[هة]';
  if (/[يىئ]/.test(char)) return '[يىئ]';
  if (/[وؤ]/.test(char)) return '[وؤ]';
  // Escape special regex characters
  return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function filterArabic(text: string): string {
  let filteredText = text;
  
  // Sort words by length descending to match longer phrases first
  const sortedWords = [...arabicWords].sort((a, b) => b.length - a.length);
  
  sortedWords.forEach(word => {
    // Remove spaces from the bad word itself to handle it as a continuous sequence
    const cleanWord = word.replace(/\s+/g, '');
    const chars = cleanWord.split('');
    
    // Allow spaces, punctuation, symbols, digits, and underscores between letters
    // \p{P} = Punctuation, \p{S} = Symbols, \p{Z} = Separators (spaces)
    const separator = '[\\s\\p{P}\\p{S}\\p{Z}\\d_]*';
    
    const pattern = chars.map(char => {
      return `${getCharClass(char)}+`;
    }).join(separator);
    
    const isArabic = /[\u0600-\u06FF]/.test(cleanWord);
    
    let regex;
    try {
      if (isArabic) {
        // (?<![\u0600-\u06FF]) means "not preceded by an Arabic letter"
        // (?![\u0600-\u06FF]) means "not followed by an Arabic letter"
        regex = new RegExp(`(?<![\\u0600-\\u06FF])${pattern}(?![\\u0600-\\u06FF])`, 'giu');
      } else {
        regex = new RegExp(`\\b${pattern}\\b`, 'giu');
      }
      filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    } catch (e) {
      console.error("Regex error for word:", word, e);
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

function filterEmojis(text: string): string {
  // Regex to match emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  return text.replace(emojiRegex, '');
}

export function filterProfanity(text: string): string {
  if (typeof text !== 'string') return '';
  let filtered = englishFilter.clean(text);
  filtered = filterArabic(filtered);
  filtered = filterPhoneNumbers(filtered);
  filtered = filterEmojis(filtered);
  return filtered;
}
