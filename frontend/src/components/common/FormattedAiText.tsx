'use client';

import React from 'react';

interface FormattedAiTextProps {
  content: string;
  isUser?: boolean;
}

export default function FormattedAiText({ content, isUser = false }: FormattedAiTextProps) {
  if (!content) return null;

  // Render inline formatting: **bold**, *italic*, `code`
  const renderInline = (text: string, lineKey: string | number) => {
    // Tách theo token **...** hoặc *...* hoặc `...`
    const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const boldText = part.slice(2, -2);
        return (
          <strong
            key={`${lineKey}-b-${index}`}
            className={
              isUser
                ? 'font-bold text-white'
                : 'font-extrabold text-slate-900 bg-purple-50 px-1 py-0.5 rounded text-purple-950 border border-purple-100/50'
            }
          >
            {boldText}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
        const italicText = part.slice(1, -1);
        return (
          <em
            key={`${lineKey}-i-${index}`}
            className={isUser ? 'italic text-white/90' : 'italic text-slate-700 font-medium'}
          >
            {italicText}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const codeText = part.slice(1, -1);
        return (
          <code
            key={`${lineKey}-c-${index}`}
            className={
              isUser
                ? 'bg-white/20 text-white px-1 py-0.5 rounded font-mono text-[11px]'
                : 'bg-slate-100 text-purple-800 px-1 py-0.5 rounded font-mono text-[11px]'
            }
          >
            {codeText}
          </code>
        );
      }
      // Dọn dẹp bất kỳ ký tự asterisk lẻ loi nào sót lại
      const cleaned = part.replace(/^\*\s*/, '');
      return <span key={`${lineKey}-t-${index}`}>{cleaned}</span>;
    });
  };

  const lines = content.split('\n');

  return (
    <div className={`space-y-2 text-xs sm:text-[13px] leading-relaxed ${isUser ? 'text-white' : 'text-slate-800'}`}>
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();

        // 1. Dòng trống
        if (!line) {
          return <div key={idx} className="h-1.5" />;
        }

        // 2. Đường kẻ ngang
        if (/^---+$/.test(line) || /^___+$/.test(line)) {
          return (
            <hr
              key={idx}
              className={`my-2 border-t ${isUser ? 'border-white/20' : 'border-slate-200'}`}
            />
          );
        }

        // 3. Tiêu đề Markdown (#, ##, ###)
        if (line.startsWith('#')) {
          const headingText = line.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '');
          return (
            <div
              key={idx}
              className={`font-black text-sm sm:text-base mt-2.5 mb-1 flex items-center gap-1.5 ${
                isUser ? 'text-white' : 'text-purple-900'
              }`}
            >
              <span className="w-1.5 h-4 rounded-full bg-purple-600 inline-block" />
              <span>{headingText}</span>
            </div>
          );
        }

        // 4. Mục số lớn có định dạng như "**1. Tên nhóm:**" hoặc "1. Tên nhóm"
        const sectionMatch = line.match(/^(\*\*)?(\d+)[\.\)]\s*(.*?)(\*\*)?$/);
        if (sectionMatch) {
          const num = sectionMatch[2];
          const headingText = sectionMatch[3].replace(/^\*\*|\*\*$/g, '');
          return (
            <div
              key={idx}
              className={`font-black text-xs sm:text-sm mt-3 mb-1.5 flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border ${
                isUser
                  ? 'bg-white/15 border-white/20 text-white'
                  : 'bg-purple-50/80 border-purple-200/70 text-purple-950'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-white text-purple-700'
                    : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                }`}
              >
                {num}
              </span>
              <span className="leading-snug">{headingText}</span>
            </div>
          );
        }

        // 5. Bullet items (*, -, •)
        const bulletMatch = line.match(/^[\*\-•]\s+(.*)/);
        if (bulletMatch) {
          const bulletText = bulletMatch[1];
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 sm:pl-2 py-0.5">
              <span
                className={`text-xs leading-none shrink-0 mt-1 ${
                  isUser ? 'text-white' : 'text-purple-600 font-black'
                }`}
              >
                ✦
              </span>
              <div className="flex-1 leading-relaxed">
                {renderInline(bulletText, idx)}
              </div>
            </div>
          );
        }

        // 6. Đoạn văn thường (có thể chứa **bold**)
        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(line, idx)}
          </p>
        );
      })}
    </div>
  );
}
