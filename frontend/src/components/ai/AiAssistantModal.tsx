'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { askAi, recommendDishesByBudget } from '@/services/api';
import { AiRecommendDishResponse } from '@/types';
import FormattedAiText from '@/components/common/FormattedAiText';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPoi?: (poiId: number) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  followUps?: string[];
}

const QUICK_QUESTIONS = [
  '🔥 Quán ốc nào ngon & đông nhất Vĩnh Khánh?',
  '🏛️ Bến Nhà Rồng mở cửa khung giờ nào?',
  '🥣 Phá lấu bò Cô Thảo có gì đặc biệt?',
  '🌙 Gợi ý quán ăn đêm nổi tiếng Quận 4',
  '📸 Cầu Mống chụp ảnh lúc nào đẹp nhất?',
];

export default function AiAssistantModal({ isOpen, onClose, onSelectPoi }: AiAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'budget'>('chat');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Chào bạn! Mình là Trợ lý AI Du Lịch & Ẩm Thực Quận 4 (Saigon Whispers). Bạn muốn tìm quán ốc ngon, hỏi về lịch sử Bến Nhà Rồng hay tìm món ăn hợp túi tiền hôm nay? Cứ hỏi mình nhé! 🌟',
      time: 'Vừa xong',
      followUps: [
        'Quán ốc nào ngon nhất Vĩnh Khánh?',
        'Bến Nhà Rồng mở cửa mấy giờ?',
        'Quận 4 có món gì đặc sản?',
      ],
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Budget State
  const [budget, setBudget] = useState<number>(100000);
  const [groupSize, setGroupSize] = useState<number>(2);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AiRecommendDishResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeTab === 'chat' && isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, isOpen]);

  if (!isOpen || !mounted) return null;

  // Xử lý gửi câu hỏi chat
  const handleSendQuestion = async (textToSend?: string) => {
    const q = (textToSend || inputQuestion).trim();
    if (!q || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setChatLoading(true);

    try {
      const res = await askAi({ question: q });
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        followUps: res.suggestedFollowUps,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: err.message || 'Trợ lý AI đang có chút trục trặc kết nối, bạn vui lòng thử lại nhé!',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Xử lý tính toán combo ngân sách
  const handleGetRecommendation = async () => {
    setBudgetLoading(true);
    try {
      const res = await recommendDishesByBudget({
        budget,
        groupSize,
      });
      setRecommendation(res);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tính toán gợi ý');
    } finally {
      setBudgetLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[88vh] max-h-[720px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/20">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">Trợ Lý AI Saigon Whispers</h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-400 text-green-950 uppercase tracking-wider">
                  Trực tuyến
                </span>
              </div>
              <p className="text-xs text-purple-100">Hỏi đáp ẩm thực & di tích lịch sử Quận 4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-purple-700 shadow-xs border border-purple-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <span>💬</span>
            <span>Hỏi Đáp Trực Tiếp</span>
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'budget'
                ? 'bg-white text-purple-700 shadow-xs border border-purple-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <span>💰</span>
            <span>Gợi Ý Theo Ví Tiền</span>
          </button>
        </div>

        {/* TAB 1: CHAT VỚI AI */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/40">
            {/* Quick Suggestions */}
            <div className="p-2.5 bg-purple-50/60 border-b border-purple-100/60 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuestion(q)}
                  disabled={chatLoading}
                  className="whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-semibold bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 hover:border-purple-300 transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    <FormattedAiText content={m.text} isUser={m.sender === 'user'} />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>

                  {/* Gợi ý follow-up */}
                  {m.followUps && m.followUps.length > 0 && (
                    <div className="mt-2 space-y-1 w-full max-w-[85%]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Gợi ý hỏi tiếp:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.followUps.map((fu, fi) => (
                          <button
                            key={fi}
                            onClick={() => handleSendQuestion(fu)}
                            disabled={chatLoading}
                            className="text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-2.5 py-1 rounded-lg text-left transition cursor-pointer"
                          >
                            ↳ {fu}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {chatLoading && (
                <div className="flex items-center gap-2 text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">AI đang suy nghĩ...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200/80 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuestion();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Hỏi về quán ốc, di tích, giờ mở cửa..."
                  disabled={chatLoading}
                  className="flex-1 text-xs sm:text-sm bg-slate-100 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3.5 py-2.5 outline-hidden transition"
                />
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || chatLoading}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Gửi</span>
                  <span>➤</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: GỢI Ý THEO NGÂN SÁCH */}
        {activeTab === 'budget' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Controls */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Ngân sách dự kiến:</label>
                <span className="text-sm font-black text-purple-700">
                  {budget.toLocaleString()} VNĐ
                </span>
              </div>
              <input
                type="range"
                min="30000"
                max="500000"
                step="10000"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>30.000đ</span>
                <span>250.000đ</span>
                <span>500.000đ</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700">Số lượng người:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 4, 6].map((size) => (
                    <button
                      key={size}
                      onClick={() => setGroupSize(size)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        groupSize === size
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {size} người
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGetRecommendation}
                disabled={budgetLoading}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-purple-500/20 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {budgetLoading ? 'AI đang phân tích thực đơn...' : '✨ Tạo Gợi Ý Món Ăn Tối Ưu'}
              </button>
            </div>

            {/* Results */}
            {recommendation && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl">
                  <p className="text-xs font-bold text-purple-900">{recommendation.summary}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] font-semibold text-purple-800">
                    <span>💰 Tổng cộng: <b>{recommendation.totalEstimatedPrice.toLocaleString()}đ</b></span>
                    <span>💵 Dư: <b>{recommendation.budgetRemaining.toLocaleString()}đ</b></span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Món gợi ý chọn lọc
                  </h4>
                  {recommendation.dishes.map((dish) => (
                    <div
                      key={dish.dishId}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-purple-300 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {dish.imageUrl ? (
                          <img
                            src={dish.imageUrl}
                            alt={dish.dishName}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
                            🍽️
                          </div>
                        )}
                        <div className="min-w-0">
                          <h5 className="text-xs font-extrabold text-slate-900 truncate">
                            {dish.dishName}
                          </h5>
                          <p className="text-[10px] text-slate-500 truncate">📍 {dish.poiName}</p>
                          <p className="text-[10px] text-purple-700 italic truncate mt-0.5">
                            {dish.reason}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-purple-700">
                          {dish.price.toLocaleString()}đ
                        </p>
                        {onSelectPoi && (
                          <button
                            onClick={() => {
                              onSelectPoi(dish.poiId);
                              onClose();
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:underline mt-1 block"
                          >
                            Xem quán →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {recommendation.tips && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-xs">
                    💡 <b>Mẹo từ thổ địa:</b> {recommendation.tips}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
