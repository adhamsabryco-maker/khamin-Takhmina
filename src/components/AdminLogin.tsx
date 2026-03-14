import React from 'react';

export const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-6">دخول لوحة تحكم الإدارة</h1>
      <button
        onClick={onLogin}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
      >
        تسجيل الدخول بحساب Google
      </button>
    </div>
  );
};
