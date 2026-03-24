import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CreditCard, Smartphone, Loader2 } from 'lucide-react';

interface CheckoutPageProps {
  item: any;
  onBack: () => void;
  onPay: (paymentMethod: 'wallet' | 'card', details: any) => void;
  isProcessing: boolean;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ item, onBack, onPay, isProcessing }) => {
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPay(paymentMethod, { name, email, phone });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 bg-[#f5f5f5] z-[10000] overflow-y-auto"
      dir="rtl"
    >
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative pb-20">
        {/* Header */}
        <div className="bg-accent-orange text-white p-4 sticky top-0 z-10 shadow-md flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black">إتمام الشراء</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-100">
            <h2 className="text-lg font-black text-main mb-4">ملخص الطلب</h2>
            <div className="flex justify-between items-center mb-2">
              <span className="text-brown-muted font-bold">{item?.name}</span>
              <span className="font-black text-accent-orange">{item?.price} ج.م</span>
            </div>
            <div className="h-px bg-orange-200 my-3"></div>
            <div className="flex justify-between items-center">
              <span className="font-black text-main">الإجمالي</span>
              <span className="font-black text-xl text-accent-orange">{item?.price} ج.م</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h2 className="text-lg font-black text-main mb-4">طريقة الدفع</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'wallet' 
                    ? 'border-accent-purple bg-purple-50 text-accent-purple' 
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-8 h-8" />
                <span className="font-black text-sm">محفظة إلكترونية</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-accent-purple bg-purple-50 text-accent-purple' 
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-8 h-8" />
                <span className="font-black text-sm">بطاقة بنكية</span>
              </button>
            </div>
          </div>

          {/* Customer Details Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-black text-main mb-4">بيانات الدفع</h2>
            
            <div>
              <label className="block text-sm font-bold text-brown-muted mb-1">الاسم بالكامل</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الثلاثي"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-accent-purple transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-brown-muted mb-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-accent-purple transition-colors text-left"
                dir="ltr"
              />
            </div>

            {paymentMethod === 'wallet' && (
              <div>
                <label className="block text-sm font-bold text-brown-muted mb-1">رقم المحفظة الإلكترونية</label>
                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010xxxxxxx"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-accent-purple transition-colors text-left"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1 font-bold">فودافون كاش، اتصالات كاش، أورانج كاش، وي باي</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isProcessing}
              className="w-full bg-accent-purple hover:bg-accent-purple-dark text-white font-black text-lg py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  دفع {item?.price} ج.م
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
