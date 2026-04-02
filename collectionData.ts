export interface CollectionStage {
  stage: number;
  images: string[];
  reward: {
    xp: number;
    frame?: string;
  };
}

export interface CategoryCollection {
  id: string;
  icon: string;
  name: string;
  stages: CollectionStage[];
}

export const COLLECTION_DATA: CategoryCollection[] = [
  {
    id: 'animals',
    icon: '🐘',
    name: 'حيوانات',
    stages: [
      {
        stage: 1,
        images: ['أسد', 'باندا', 'ثعلب', 'زرافة', 'غوريلا', 'فيل'],
        reward: { xp: 2500 }
      },
      {
        stage: 2,
        images: ['تنين كومودو', 'حصان', 'حمار وحشي', 'كنغر', 'كوبرا', 'نمر'],
        reward: { xp: 5000 }
      },
      {
        stage: 3,
        images: ['أخطبوط', 'تمساح', 'حرباية', 'ضبع', 'قرش', 'كوالا'],
        reward: { xp: 10000, frame: 'animals-category-frame-gift.png' }
      }
    ]
  },
  {
    id: 'birds',
    icon: '🦜',
    name: 'طيور',
    stages: [
      {
        stage: 1,
        images: ['صقر', 'بومة', 'بطريق', 'ببغاء', 'غراب', 'توقان'],
        reward: { xp: 2500 }
      },
      {
        stage: 2,
        images: ['عصفور', 'طاووس', 'حمامة', 'بطة', 'فلامنجو', 'بلبل'],
        reward: { xp: 5000 }
      },
      {
        stage: 3,
        images: ['نسر', 'يمامة', 'فرخة', 'هدهد', 'نورس', 'وزة'],
        reward: { xp: 10000, frame: 'birds-category-frame-gift.png' }
      }
    ]
  },
  {
    id: 'food',
    icon: '🍕',
    name: 'أكلات',
    stages: [
      {
        stage: 1,
        images: ['ستيك', 'جمبري', 'تاكو', 'بيتزا', 'برجر', 'أندومي'],
        reward: { xp: 2500 }
      },
      {
        stage: 2,
        images: ['كبدة', 'كباب', 'سوشي', 'سوسيس', 'سمك', 'تبولة'],
        reward: { xp: 5000 }
      },
      {
        stage: 3,
        images: ['مندي', 'مقلوبة', 'محشي', 'كوزي', 'كبة', 'فتة'],
        reward: { xp: 10000, frame: 'food-category-frame-gift.png' }
      }
    ]
  },
  {
    id: 'people',
    icon: '👥',
    name: 'أشخاص',
    stages: [
      {
        stage: 1,
        images: ['امير كرارة', 'أحمد حلمي', 'نانسي عجرم', 'احمد العوضي', 'ياسمين عبد العزيز', 'احمد السقا'],
        reward: { xp: 2500 }
      },
      {
        stage: 2,
        images: ['يسرا', 'عمر الشريف', 'عادل إمام', 'سمير غانم', 'اسعاد يونس', 'أحمد زكي'],
        reward: { xp: 5000 }
      },
      {
        stage: 3,
        images: ['عمرو دياب', 'يسرا اللوزي', 'رامز جلال', 'شيرين عبد الوهاب', 'تامر عاشور', 'تامر حسني'],
        reward: { xp: 10000, frame: 'people-category-frame-gift.png' }
      }
    ]
  },
  {
    id: 'objects',
    icon: '📦',
    name: 'جماد',
    stages: [
      {
        stage: 1,
        images: ['ساعة', 'خلاط', 'ثلاجة', 'تليفزيون', 'ترابيزة', 'باب'],
        reward: { xp: 2500 }
      },
      {
        stage: 2,
        images: ['مروحة', 'كنبة', 'غسالة', 'سلم', 'تيشيرت', 'بنطلون'],
        reward: { xp: 5000 }
      },
      {
        stage: 3,
        images: ['ميكرويف', 'موبايل', 'مكنسة', 'كوتشي', 'دولاب', 'جاكيت'],
        reward: { xp: 10000, frame: 'objects-category-frame-gift.png' }
      }
    ]
  },
  {
    id: 'plants',
    icon: '🌿',
    name: 'نبات',
    stages: [
      {
        stage: 1,
        images: ['جوافة', 'تفاح', 'بطيخ', 'باذنجان', 'اناناس', 'افوكادو'],
        reward: { xp: 2500 }
      },
      {
        stage: 2,
        images: ['رمان', 'جزر', 'تين', 'بطاطس', 'بروكلي', 'برتقال'],
        reward: { xp: 5000 }
      },
      {
        stage: 3,
        images: ['موز', 'مانجو', 'كرنب', 'فول حراتي', 'سبانخ', 'ذرة'],
        reward: { xp: 10000, frame: 'plants-category-frame-gift.png' }
      }
    ]
  },
  {
    id: 'insects',
    icon: '🐞',
    name: 'حشرات',
    stages: [
      {
        stage: 1,
        images: ['دعسوقة', 'دبور', 'دبانة', 'خنفسة', 'جرادة', 'ابو دقيق'],
        reward: { xp: 2500 }
      },
      {
        stage: 2,
        images: ['فراشة', 'عنكبوت', 'عقرب', 'صرصار', 'صرصار الليل', 'دودة'],
        reward: { xp: 5000 }
      },
      {
        stage: 3,
        images: ['يراعة', 'نملة', 'نحلة', 'مايو', 'فرس النبي', 'عصوية'],
        reward: { xp: 10000, frame: 'insects-category-frame-gift.png' }
      }
    ]
  },
  {
    id: 'football',
    icon: '⚽',
    name: 'كرة القدم',
    stages: [
      {
        stage: 1,
        images: ['عماد متعب', 'محمد بركات', 'ليونيل ميسي', 'محمد ابو تريكه', 'كريستيانو رونالدو', 'محمد صلاح'],
        reward: { xp: 2500 }
      },
      {
        stage: 2,
        images: ['يورجن كلوب', 'محمود الخطيب', 'حفيظ دراجي', 'حسن شحاتة', 'بيب جوارديولا', 'أحمد شوبير'],
        reward: { xp: 5000 }
      },
      {
        stage: 3,
        images: ['نيمار جونيور', 'كيليان مبابي', 'زلاتان إبراهيموفيتش', 'تريزيجيه', 'إيرلينج هالاند', 'أشرف حكيمي'],
        reward: { xp: 10000, frame: 'football-category-frame-gift.png' }
      }
    ]
  }
];
