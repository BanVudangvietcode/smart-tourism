'use client';

import React, { useState } from 'react';
import { askAi } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import FormattedAiText from '@/components/common/FormattedAiText';

interface PoiAiTabProps {
  poiId: number | string | null;
  poiName?: string;
}

export default function PoiAiTab({ poiId, poiName }: PoiAiTabProps) {
  const { language, tk } = useLanguage();

  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiFollowUps, setAiFollowUps] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAskAi = async (q?: string) => {
    const question = q || aiQuestion;
    if (!question.trim() || !poiId) return;

    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await askAi({
        question,
        poiId: Number(poiId),
      });
      setAiAnswer(res.answer);
      setAiFollowUps(res.suggestedFollowUps || []);
      if (!q) setAiQuestion('');
    } catch (err) {
      console.error('Error asking AI:', err);
      setAiAnswer(
        language === 'en'
          ? 'Sorry, AI assistant is temporarily busy. Please try again shortly!'
          : 'Xin lỗi, trợ lý AI đang bận. Vui lòng thử lại sau giây lát!'
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">✨</span>
          <h4 className="text-xs font-black uppercase tracking-wider">{tk('poi_ai_title')}</h4>
        </div>
        <p className="text-xs text-purple-100">
          {language === 'en'
            ? `Ask anything about the history, ingredients, or specialty dishes of ${poiName || 'this spot'}.`
            : `Hỏi bất cứ điều gì về lịch sử, nguồn gốc nguyên liệu, các món ăn đặc sắc nhất của quán ${poiName || 'này'}.`}
        </p>
      </div>

      {/* Input câu hỏi */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          placeholder={tk('poi_ai_placeholder')}
          onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
          className="flex-1 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 bg-white"
        />
        <button
          type="button"
          onClick={() => handleAskAi()}
          disabled={aiLoading || !aiQuestion.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          {aiLoading ? tk('poi_ai_thinking') : tk('poi_ai_btn')}
        </button>
      </div>

      {/* Gợi ý câu hỏi nhanh */}
      <div className="flex flex-wrap gap-1.5">
        {(language === 'en'
          ? [
              'Which dish is the best-seller?',
              'What should 2 people order?',
              'Any non-spicy options?',
            ]
          : [
              'Món nào là Best-seller?',
              'Đi 2 người nên gọi gì?',
              'Quán có món gì cho người không ăn cay?',
            ]
        ).map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleAskAi(chip)}
            className="text-[11px] bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-full transition cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Câu trả lời AI */}
      {aiAnswer && (
        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
            <span>{tk('poi_ai_answer')}</span>
          </div>
          <FormattedAiText content={aiAnswer} />

          {aiFollowUps.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{tk('poi_ai_followup')}</p>
              <div className="flex flex-wrap gap-1">
                {aiFollowUps.map((fu, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskAi(fu)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition cursor-pointer"
                  >
                    {fu}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
