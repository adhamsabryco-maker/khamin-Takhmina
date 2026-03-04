import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

export const AdminCustomization = () => {
  const [uploading, setUploading] = useState(false);

  const [config, setConfig] = useState({ avatars: {}, frames: {}, stars: {} });

  useEffect(() => {
    fetch('/api/config').then(res => res.json()).then(setConfig);
  }, []);

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
      
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig);
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
      
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig);
      alert('تم حذف الصورة بنجاح!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('حدث خطأ أثناء حذف الصورة');
    }
  };

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      <h2 className="text-2xl font-black text-gray-900">إدارة تخصيص اللعبة</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Avatars */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> الأفاتار (مستوى 10, 20, 30, 40)</h3>
          <div className="grid grid-cols-2 gap-4">
            {[10, 20, 30, 40].map((level) => (
              <div key={level} className="space-y-2">
                <span className="font-bold">مستوى {level}</span>
                {(config.avatars as any)[level] ? (
                  <div className="relative aspect-square border-2 border-gray-200 rounded-xl overflow-hidden">
                    <img src={`/uploads/${(config.avatars as any)[level]}`} className="w-full h-full object-cover" />
                    <button onClick={() => handleDelete('avatar', level)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-purple-400">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'avatar', level)} />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Frames */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
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
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
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
      </div>
    </div>
  );
};
