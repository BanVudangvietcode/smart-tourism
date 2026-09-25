'use client'; // Bắt buộc trong Next.js App Router khi component này có sử dụng State và Effect (Client Component)

import { useState, useEffect } from 'react';
import { requestOtp, verifyOtpAndLogin } from '../lib/api';

export default function LoginForm() {
  // === 1. QUẢN LÝ TRẠNG THÁI (STATE) ===
  const [phone, setPhone] = useState(''); // Lưu số điện thoại người dùng nhập
  const [otp, setOtp] = useState('');     // Lưu mã OTP 6 số người dùng nhập
  const [step, setStep] = useState<1 | 2>(1); // Quản lý luồng: Bước 1 (Nhập SĐT) -> Bước 2 (Nhập OTP)
  const [loading, setLoading] = useState(false); // Trạng thái đang gọi API (để disable nút bấm, tránh click nhiều lần)
  const [message, setMessage] = useState('');    // Hiển thị thông báo lỗi hoặc thành công cho người dùng
  const [token, setToken] = useState<string | null>(null); // Lưu mã JWT Token nếu đăng nhập thành công

  // === 2. TỰ ĐỘNG ĐĂNG NHẬP (LIFECYCLE) ===
  // Chạy một lần duy nhất khi giao diện vừa load lên
  useEffect(() => {
    // Kiểm tra trong bộ nhớ trình duyệt xem trước đó có lưu token chưa
    const savedToken = localStorage.getItem('sw_token');
    if (savedToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(savedToken); // Nếu có, cập nhật state token ngay -> Nhảy thẳng vào màn hình "Đã đăng nhập"
    }
  }, []);

  // === 3. XỬ LÝ GỬI YÊU CẦU OTP ===
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trình duyệt tự động load lại trang khi submit form
    if (!phone) return; // Nếu chưa nhập SĐT thì dừng luôn

    setLoading(true); // Bật hiệu ứng loading
    setMessage('');   // Xóa thông báo cũ (nếu có)
    
    try {
      // Gọi hàm requestOtp từ thư mục lib/api.ts (chứa logic kết nối xuống Backend)
      await requestOtp(phone);
      setStep(2); // Thành công thì chuyển sang Bước 2 (Giao diện nhập OTP)
    } catch (error: unknown) {
      // Bắt lỗi nếu Backend trả về 4xx, 5xx (ví dụ: Số điện thoại không hợp lệ)
      const err = error as Error;
      setMessage(err.message || 'Lỗi khi gửi yêu cầu OTP.');
    } finally {
      setLoading(false); // Tắt hiệu ứng loading dù thành công hay thất bại
    }
  };

  // === 4. XỬ LÝ XÁC THỰC OTP & ĐĂNG NHẬP ===
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setMessage('');
    
    try {
      // Gọi API xác thực với SĐT và mã OTP vừa nhập
      const res = await verifyOtpAndLogin(phone, otp);
      
      // Thành công -> API trả về token JWT
      setToken(res.token); // Lưu token vào state của React
      localStorage.setItem('sw_token', res.token); // Lưu cứng vào LocalStorage để F5 không bị mất
    } catch (error: unknown) {
      const err = error as Error;
      setMessage(err.message || 'Lỗi xác nhận OTP.');
    } finally {
      setLoading(false);
    }
  };

  // === 5. GIAO DIỆN (RENDER LOGIC) ===

  // TRƯỜNG HỢP A: ĐÃ ĐĂNG NHẬP (Có token)
  if (token) {
    return (
      <div className="w-full bg-white border border-[#EAEAEA] rounded-[32px] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col h-full text-center">
        <div className="w-16 h-16 bg-[#F9F9F8] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✨</span>
        </div>
        <h3 className="text-2xl font-bold text-[#111111] mb-2">Đã đăng nhập</h3>
        <p className="text-sm text-[#787774] mb-8">Trải nghiệm của bạn đã sẵn sàng.</p>
        
        {/* Nút Đăng xuất */}
        <button 
          onClick={() => { 
            setToken(null); // Xóa token khỏi State React
            localStorage.removeItem('sw_token'); // Xóa luôn khỏi bộ nhớ trình duyệt
          }} 
          className="w-full bg-[#F9F9F8] text-[#111111] py-4 rounded-full text-sm font-bold hover:bg-[#EAEAEA] transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  // TRƯỜNG HỢP B: CHƯA ĐĂNG NHẬP (Hiển thị Form)
  return (
    <div className="w-full bg-white border border-[#EAEAEA] rounded-[32px] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col h-full">
      {/* Tiêu đề chung */}
      <div className="mb-10 text-center sm:text-left">
        <h3 className="text-[26px] leading-tight font-extrabold text-[#222222] tracking-tight">
          🙌 Welcome in<br />Saigon Whispers
        </h3>
      </div>
      
      {/* Kiểm tra điều kiện: Nếu đang ở Step 1 thì hiện Form nhập SĐT, ngược lại hiện Form nhập OTP */}
      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <div className="relative">
            <input 
              type="tel" 
              className="w-full px-6 py-[18px] bg-[#FAF9F6] border-none rounded-[20px] text-[#222222] text-[13px] font-medium placeholder-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 transition-all" 
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={e => setPhone(e.target.value)} // Cập nhật state 'phone' mỗi khi gõ phím
              disabled={loading} // Khóa ô nhập khi đang tải
              required
            />
            {/* Chấm tròn trang trí giống thiết kế mẫu */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FBE4B9]"></div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FF4522] text-white py-[18px] rounded-[20px] text-[13px] font-black hover:bg-[#E63E1F] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-[0_4px_14px_rgba(255,69,34,0.3)] tracking-wider"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'SIGN IN 👈'}
          </button>
        </form>
      ) : (
        // FORM NHẬP OTP (Step 2)
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 animate-in fade-in duration-500">
          <p className="text-[13px] text-[#787774] mb-1 font-medium text-left">Mã OTP đã được gửi vào Telegram.</p>
          <div className="relative">
            <input 
              type="text" 
              className="w-full px-6 py-[18px] bg-[#FAF9F6] border-none rounded-[20px] text-[#222222] text-xl text-center font-bold placeholder-[#D1D1D1] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 transition-all tracking-[0.4em]" 
              placeholder="••••••"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              disabled={loading}
              required
              autoFocus // Tự động trỏ nhấp nháy chuột vào đây
              maxLength={6} // Giới hạn chỉ được nhập đúng 6 số
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FBE4B9]"></div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FF4522] text-white py-[18px] rounded-[20px] text-[13px] font-black hover:bg-[#E63E1F] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-[0_4px_14px_rgba(255,69,34,0.3)] tracking-wider"
          >
            {loading ? 'ĐANG XÁC THỰC...' : 'VERIFY 👈'}
          </button>
          
          {/* Nút quay lại để sửa số điện thoại */}
          <button 
            type="button" 
            onClick={() => { setStep(1); setOtp(''); setMessage(''); }} 
            className="text-[12px] font-medium text-[#888888] hover:text-[#222222] transition-colors mt-2"
          >
            Đổi số điện thoại khác
          </button>
        </form>
      )}

      {/* Hiển thị lỗi (nếu có) */}
      {message && (
        <div className="mt-4 text-center">
          <span className={`text-[12px] font-medium ${message.includes('Lỗi') ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
            {message}
          </span>
        </div>
      )}

      {/* Footer chứa điều khoản */}
      <div className="mt-auto pt-16 text-center">
        <p className="text-[10px] text-[#A1A1A1] font-medium tracking-wide">
          By signing up, you confirm our<br />
          <span className="text-[#333333] font-bold">Terms of Use</span> and <span className="text-[#333333] font-bold">Privacy policy</span>
        </p>
      </div>
    </div>
  );
}
