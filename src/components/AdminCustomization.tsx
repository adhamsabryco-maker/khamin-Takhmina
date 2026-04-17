import React, { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2, Gift, CloudRain, Disc } from 'lucide-react';
import { useAvatarConfig } from '../contexts/AvatarContext';
import { Socket } from 'socket.io-client';

export const AdminCustomization = ({ showAlert, socket, gamePolicies, setGamePolicies, luckyWheelEnabled, setLuckyWheelEnabled }: { showAlert: (msg: string, title?: string) => void, socket: Socket | null, gamePolicies: any, setGamePolicies: any, luckyWheelEnabled: boolean, setLuckyWheelEnabled: (val: boolean) => void }) => {
  const [uploading, setUploading] = useState(false);
  const { customConfig: config, refreshConfig } = useAvatarConfig();
  const [versionInput, setVersionInput] = useState(config.version || '1.0.0');

  useEffect(() => {
    if (config.version) {
      setVersionInput(config.version);
    }
  }, [config.version]);

  const dbFileInputRef = useRef<HTMLInputElement>(null);

  const handleDbUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('تحذير خطير: رفع ملف قاعدة بيانات جديد سيقوم بمسح كافة البيانات الحالية وإعادة تشغيل الخادم. هل أنت متأكد من رغبتك في المتابعة؟')) {
      if (dbFileInputRef.current) dbFileInputRef.current.value = '';
      return;
    }

    if (!socket) {
      showAlert('غير متصل بالخادم.', 'خطأ');
      return;
    }

    setUploading(true);
    
    // Request token for upload
    socket.emit('admin_request_db_download', async (res: any) => {
      if (res.success && res.token) {
        const formData = new FormData();
        formData.append('database', file);

        try {
          const response = await fetch(`/api/admin/upload-db?token=${res.token}`, {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            showAlert('تم رفع قاعدة البيانات بنجاح. سيتم إعادة تشغيل الخادم الآن...', 'نجاح');
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          } else {
            const errText = await response.text();
            showAlert(`فشل رفع قاعدة البيانات: ${errText}`, 'خطأ');
          }
        } catch (err) {
          showAlert('حدث خطأ أثناء رفع قاعدة البيانات.', 'خطأ');
        } finally {
          setUploading(false);
          if (dbFileInputRef.current) dbFileInputRef.current.value = '';
        }
      } else {
        showAlert('عذراً، لا تملك صلاحية لرفع قاعدة البيانات.', 'خطأ');
        setUploading(false);
        if (dbFileInputRef.current) dbFileInputRef.current.value = '';
      }
    });
  };

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
      showAlert('تم رفع الصورة وحفظ الإعدادات بنجاح!', 'نجاح');
    } catch (error) {
      console.error('Upload error:', error);
      showAlert('حدث خطأ أثناء رفع الصورة', 'خطأ');
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
      showAlert('تم حذف الصورة بنجاح!', 'نجاح');
    } catch (error) {
      console.error('Delete error:', error);
      showAlert('حدث خطأ أثناء حذف الصورة', 'خطأ');
    }
  };

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      <h2 className="text-2xl font-black text-main">إدارة تخصيص اللعبة</h2>

      {/* Database Backup - Moved to top for visibility */}
      <div className="box-game p-6 shadow-sm border-2 border-blue-100 bg-blue-50/30">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-900">💾 نسخة احتياطية لقاعدة البيانات</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-blue-100 shadow-sm">
            <div>
              <p className="font-bold text-blue-900">تحميل ملف players.db</p>
              <p className="text-xs text-blue-700 mt-1">يحتوي على بيانات اللاعبين، المتجر، الإعدادات، والمزيد.</p>
            </div>
            <button 
              onClick={() => {
                if (!socket) {
                  showAlert('غير متصل بالخادم.', 'خطأ');
                  return;
                }
                
                socket.emit('admin_request_db_download', (res: any) => {
                  if (res.success && res.token) {
                    window.open(`/api/admin/download-db?token=${res.token}`, '_blank');
                  } else {
                    showAlert('عذراً، لا تملك صلاحية لتحميل قاعدة البيانات.', 'خطأ');
                  }
                });
              }}
              className="btn-game bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 shadow-[0_4px_0_0_#2563eb] active:shadow-none active:translate-y-1"
            >
              تحميل الآن
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-blue-100 shadow-sm">
            <div>
              <p className="font-bold text-blue-900">تحميل ملفات الصور (uploads)</p>
              <p className="text-xs text-blue-700 mt-1">يحتوي على الأفاتار، الإطارات، الأسئلة المخصصة، والصور المرفوعة.</p>
            </div>
            <button 
              onClick={() => {
                if (!socket) {
                  showAlert('غير متصل بالخادم.', 'خطأ');
                  return;
                }
                
                socket.emit('admin_request_uploads_download', (res: any) => {
                  if (res.success && res.token) {
                    window.open(`/api/admin/download-uploads?token=${res.token}`, '_blank');
                  } else {
                    showAlert('عذراً، لا تملك صلاحية لتحميل الملفات.', 'خطأ');
                  }
                });
              }}
              className="btn-game bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-6 shadow-[0_4px_0_0_#4f46e5] active:shadow-none active:translate-y-1"
            >
              تحميل ZIP
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
            <div>
              <p className="font-bold text-red-900">رفع ملف players.db</p>
              <p className="text-xs text-red-700 mt-1">
                تحذير: سيتم مسح كافة البيانات الحالية واستبدالها بالملف المرفوع، وسيتم إعادة تشغيل الخادم.
              </p>
            </div>
            <input
              type="file"
              accept=".db,application/x-sqlite3"
              className="hidden"
              ref={dbFileInputRef}
              onChange={handleDbUpload}
            />
            <button 
              onClick={() => dbFileInputRef.current?.click()}
              disabled={uploading}
              className={`btn-game bg-red-500 hover:bg-red-600 text-white py-2 px-6 shadow-[0_4px_0_0_#dc2626] active:shadow-none active:translate-y-1 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? 'جاري الرفع...' : 'رفع الآن'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Avatars */}
        <div className="box-game p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> الأفاتار (4 مجانية + 4 حسب المستوى)</h3>
          <div className="grid grid-cols-4 gap-4">
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
                  showAlert('حدث خطأ أثناء تحديث الإعدادات', 'خطأ');
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

        {/* Event Settings */}
        <div className="box-game p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-accent-orange" />
            إعدادات الأحداث
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-orange/20 rounded-lg flex items-center justify-center">
                  <CloudRain className="w-6 h-6 text-accent-orange" />
                </div>
                <div>
                  <div className="font-black text-brown-dark">حدث مطر الهدايا</div>
                  <div className="text-xs font-bold text-brown-muted">تفعيل أو إيقاف صندوق الحدث في الصفحة الرئيسية</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const newPolicies = { ...gamePolicies, isRainGiftEnabled: !gamePolicies.isRainGiftEnabled };
                  setGamePolicies(newPolicies);
                  socket?.emit('admin_update_policies', newPolicies);
                }}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${gamePolicies?.isRainGiftEnabled ? 'bg-accent-green' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${gamePolicies?.isRainGiftEnabled ? 'translate-x-1' : 'translate-x-7'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-pink-50 rounded-xl border-2 border-pink-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-200 rounded-lg flex items-center justify-center">
                  <Disc className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <div className="font-black text-pink-900">عجلة الحظ</div>
                  <div className="text-xs font-bold text-pink-700">تفعيل أو إيقاف أيقونة عجلة الحظ في الشريط العلوي</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const newValue = !luckyWheelEnabled;
                  setLuckyWheelEnabled(newValue);
                  socket?.emit('admin_update_settings', { lucky_wheel_enabled: newValue }, (res: any) => {
                    if (res.success) showAlert('تم تحديث حالة عجلة الحظ بنجاح', 'نجاح');
                    else showAlert('حدث خطأ أثناء الحفظ', 'خطأ');
                  });
                }}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${luckyWheelEnabled ? 'bg-pink-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${luckyWheelEnabled ? 'translate-x-1' : 'translate-x-7'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* App Version Settings */}
        <div className="box-game p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">🔄 إصدار اللعبة (تحديث إجباري)</h3>
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
                    showAlert('تم تحديث إصدار اللعبة بنجاح! سيتم إجبار جميع اللاعبين على التحديث عند فتح اللعبة.', 'نجاح');
                  } catch (error) {
                    showAlert('حدث خطأ أثناء تحديث الإصدار', 'خطأ');
                  }
                }}
                className="btn-game btn-primary py-2 px-6"
              >
                حفظ
              </button>
            </div>
            <p className="text-xs text-brown-muted">
              تغيير هذا الرقم يجبر المتصفح على تحميل كافة ملفات اللعبة الجديدة والتحديثات فوراً عند فتح شاشة التحميل.
            </p>
          </div>
        </div>

        {/* Mock Ad Settings */}
        <div className="box-game p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">📺 الإعلان البديل (عند فشل إعلانات جوجل)</h3>
          <div className="space-y-4">
            <p className="text-sm font-bold text-brown-muted">قم برفع صورة تظهر للـ لاعبين عند فشل تحميل الإعلان، بحجم 1:1 (مربعة).</p>
            {(config as any).mockAdImage ? (
              <div className="space-y-4">
                <div className="relative aspect-square max-w-[250px] mx-auto border-4 border-gray-200 rounded-xl overflow-hidden bg-black/5">
                  <img src={`/uploads/${(config as any).mockAdImage}`} className="w-full h-full object-contain" />
                  <button onClick={async () => {
                     try {
                        const filename = (config as any).mockAdImage;
                        await fetch(`/api/upload/${filename}`, { method: 'DELETE' });
                        const newConfig = { ...config };
                        delete (newConfig as any).mockAdImage;
                        delete (newConfig as any).mockAdLink;
                        await fetch('/api/config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newConfig),
                        });
                        refreshConfig();
                        showAlert('تم الحذف بنجاح', 'نجاح');
                     } catch(e){
                        showAlert('حدث خطأ أثناء الحذف', 'خطأ');
                     }
                  }} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"><Trash2 className="w-4 h-4" /></button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    className="input-game flex-1 text-left"
                    placeholder="https://example.com"
                    defaultValue={(config as any).mockAdLink || ''}
                    id="mockAdLinkInput"
                  />
                  <button
                    onClick={async () => {
                      const linkInput = document.getElementById('mockAdLinkInput') as HTMLInputElement;
                      if (!linkInput) return;
                      const newConfig = { ...config, mockAdLink: linkInput.value };
                      try {
                        await fetch('/api/config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newConfig),
                        });
                        refreshConfig();
                        showAlert('تم حفظ الرابط بنجاح', 'نجاح');
                      } catch(e) {
                         showAlert('حدث خطأ أثناء حفظ الرابط', 'خطأ');
                      }
                    }}
                    className="btn-game btn-primary py-2 px-6"
                  >
                    حفظ الرابط
                  </button>
                </div>
                <p className="text-xs text-brown-muted">رابط الإحالة الذي سيتم فتحه عند ضغط اللاعبين على صورة الإعلان.</p>
              </div>
            ) : (
                <label className="aspect-square max-w-[250px] mx-auto border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 bg-gray-50 transition-colors">
                  <Upload className="w-8 h-8 text-brown-light mb-2" />
                  <span className="text-sm font-bold text-brown-light text-center px-4">رفع صورة الإعلان البديل الأساسية</span>
                  <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
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
                      const newConfig = { ...config, mockAdImage: data.filename };
                      await fetch('/api/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newConfig),
                      });
                      refreshConfig();
                      showAlert('تم رفع الصورة بنجاح!', 'نجاح');
                    } catch (error) {
                      showAlert('حدث خطأ أثناء الرفع', 'خطأ');
                    } finally {
                      setUploading(false);
                    }
                  }} disabled={uploading}/>
                </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
