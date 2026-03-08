import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAvatarConfig } from '../contexts/AvatarContext';

export const AdminCustomization = () => {
  const [uploading, setUploading] = useState(false);
  const { customConfig: config, refreshConfig } = useAvatarConfig();
  const [versionInput, setVersionInput] = useState(config.version || '1.0.0');

  useEffect(() => {
    if (config.version) {
      setVersionInput(config.version);
    }
  }, [config.version]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string, level?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      const newConfig = { ...config };
      if (type === 'avatar') {
        (newConfig.avatars as any)[level!] = data.filename;
      } else if (type === 'frame') {
        (newConfig.frames as any)[level!] = data.filename;
      } else if (type === 'star') {
        (newConfig.stars as any)[level!] = data.filename;
      }
      
      // Ensure aiBotEnabled is preserved if it exists
      const finalConfig = { ...newConfig, aiBotEnabled: config.aiBotEnabled ?? false };
      
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalConfig),
      });
      refreshConfig();
      alert('تم رفع الصورة وحفظ الإعدادات بنجاح!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (type: string, level: number) => {
    const filename = (config as any)[type + 's'][level];
    if (!filename) return;

    try {
      await fetch(`/api/upload/${filename}`, { method: 'DELETE' });
      const newConfig = { ...config };
      delete (newConfig as any)[type + 's'][level];
      
      // Ensure aiBotEnabled is preserved if it exists
      const finalConfig = { ...newConfig, aiBotEnabled: config.aiBotEnabled ?? false };
      
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalConfig),
      });
      refreshConfig();
      alert('تم حذف الصورة بنجاح!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('حدث خطأ أثناء حذف الصورة');
    }
  };

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      <h2 className="text-2xl font-black text-main">إدارة تخصيص اللعبة</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Avatars */}
        <div className="box-game p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> الأفاتار (4 مجانية + 4 حسب المستوى)</h3>
          <div className="grid grid-cols-2 gap-4">
            {['free-boy-1', 'free-boy-2', 'free-boy-3', 'free-boy-4', 'free-girl-1', 'free-girl-2', 'free-girl-3', 'free-girl-4', 'boy-10', 'girl-10', 'boy-20', 'girl-20', 'boy-30', 'girl-30', 'boy-40', 'girl-40'].map((level) => (
              <div key={level} className="space-y-2">
                <span className="font-bold text-sm">{level.replace('-', ' ')}</span>
                {(config.avatars as any)[level] ? (
                  <div className="relative aspect-square border-2 border-gray-200 rounded-xl overflow-hidden">
                    <img src={`/uploads/${(config.avatars as any)[level]}`} className="w-full h-full object-cover" />
                    <button onClick={() => handleDelete('avatar', level as any)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-purple-400">
                    <Upload className="w-6 h-6 text-brown-light" />
                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'avatar', level as any)} />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Frames */}
        <div className="box-game p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> الإطارات (حسب المستوى)</h3>
          <div className="space-y-2">
            {[10, 20, 30, 40, 50].map((level) => (
              <div key={level} className="flex items-center justify-between p-2 border border-gray-100 rounded-xl">
                <span className="font-bold">مستوى {level}</span>
                {(config.frames as any)[level] ? (
                  <div className="flex items-center gap-2">
                    <img src={`/uploads/${(config.frames as any)[level]}`} className="w-10 h-10 object-contain" />
                    <button onClick={() => handleDelete('frame', level)} className="bg-red-500 text-white p-1 rounded-full"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="btn-game btn-secondary py-1 px-3 cursor-pointer">
                    رفع
                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'frame', level)} />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stars */}
        <div className="box-game p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> النجوم (حسب المستوى)</h3>
          <div className="space-y-2">
            {[10, 20, 30, 40, 50].map((level) => (
              <div key={level} className="flex items-center justify-between p-2 border border-gray-100 rounded-xl">
                <span className="font-bold">مستوى {level}</span>
                {(config.stars as any)[level] ? (
                  <div className="flex items-center gap-2">
                    <img src={`/uploads/${(config.stars as any)[level]}`} className="w-10 h-10 object-contain" />
                    <button onClick={() => handleDelete('star', level)} className="bg-red-500 text-white p-1 rounded-full"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="btn-game btn-secondary py-1 px-3 cursor-pointer">
                    رفع
                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'star', level)} />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Bot Settings */}
        <div className="box-game p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">🤖 بوت الذكاء الاصطناعي</h3>
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <div>
              <p className="font-bold text-purple-900">تفعيل البوت</p>
            </div>
            <button 
              onClick={async () => {
                const newConfig = { ...config, aiBotEnabled: !config.aiBotEnabled };
                try {
                  await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newConfig),
                  });
                  refreshConfig();
                } catch (error) {
                  alert('حدث خطأ أثناء تحديث الإعدادات');
                }
              }}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${config.aiBotEnabled ? 'bg-purple-600' : 'bg-gray-300'}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${config.aiBotEnabled ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>

        {/* App Version Settings */}
        <div className="box-game p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">🔄 إصدار التطبيق (لتحديث الأيقونة)</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={versionInput} 
                onChange={(e) => setVersionInput(e.target.value)}
                className="input-game"
                placeholder="مثلاً: 1.0.1"
              />
              <button 
                onClick={async () => {
                  const newConfig = { ...config, version: versionInput };
                  try {
                    await fetch('/api/config', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newConfig),
                    });
                    refreshConfig();
                    alert('تم تحديث إصدار التطبيق بنجاح! سيتم تحديث الأيقونة عند المستخدمين تلقائياً.');
                  } catch (error) {
                    alert('حدث خطأ أثناء تحديث الإصدار');
                  }
                }}
                className="btn-game btn-primary py-2 px-6"
              >
                حفظ
              </button>
            </div>
            <p className="text-xs text-brown-muted">
              تغيير هذا الرقم يجبر المتصفح على تحميل الأيقونة الجديدة (`icon.svg`) حتى لو كانت مخزنة في الذاكرة المؤقتة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
