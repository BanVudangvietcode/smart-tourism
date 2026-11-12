'use client';

import React, { useState } from 'react';
import { generateMultilingualAudio, adminUploadPoiAudio } from '@/services/api';

interface AdminAudioModalProps {
  poiId: number;
  poiName?: string;
  onClose: () => void;
  onSuccess: () => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function AdminAudioModal({
  poiId,
  poiName,
  onClose,
  onSuccess,
  showNotification,
}: AdminAudioModalProps) {
  const [audioTab, setAudioTab] = useState<'ai' | 'upload'>('ai');

  // AI Multilingual States
  const [audioAiTitle, setAudioAiTitle] = useState(poiName ? `Thuyết minh ${poiName}` : '');
  const [audioAiScript, setAudioAiScript] = useState('');
  const [audioTargetLangs, setAudioTargetLangs] = useState<string[]>(['en', 'zh', 'ja', 'ko', 'fr']);
  const [audioGenerating, setAudioGenerating] = useState(false);

  // Manual Upload States
  const [newAudioTitle, setNewAudioTitle] = useState(poiName ? `Thuyết minh ${poiName}` : 'Thuyết minh chuẩn Sài Gòn');
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [newAudioScript, setNewAudioScript] = useState('');
  const [uploading, setUploading] = useState(false);

  // Handle AI Multilingual Generation
  const handleGenerateMultilingualAudio = async () => {
    if (!audioAiScript.trim()) {
      showNotification('error', 'Vui lòng nhập nội dung văn bản kịch bản gốc!');
      return;
    }
    setAudioGenerating(true);
    try {
      const res = await generateMultilingualAudio({
        poiId,
        title: audioAiTitle.trim() || undefined,
        transcript: audioAiScript.trim(),
        targetLanguages: audioTargetLangs,
      });
      showNotification('success', `🎉 ${res.message || 'Đã sinh thành công bộ audio đa ngôn ngữ!'}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      showNotification('error', `Lỗi sinh audio đa ngôn ngữ: ${err.message}`);
    } finally {
      setAudioGenerating(false);
    }
  };

  // Handle Manual Upload
  const handleUploadAudio = async () => {
    if (!newAudioFile) {
      showNotification('error', 'Vui lòng chọn file âm thanh MP3!');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', newAudioFile);
      formData.append('title', newAudioTitle);
      formData.append('script', newAudioScript);

      await adminUploadPoiAudio(poiId, formData);
      showNotification('success', 'Đã tải lên audio thuyết minh thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      showNotification('error', `Lỗi tải audio: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>🎧</span>
              <span>Quản Lý Audio Thuyết Minh {poiName ? `— ${poiName}` : `POI #${poiId}`}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tự động dịch đa ngôn ngữ bằng AI hoặc tải lên tệp âm thanh thu âm tùy chỉnh
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* TAB SELECTOR: AI Multilingual vs Manual Upload */}
        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAudioTab('ai')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              audioTab === 'ai' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>✨</span>
            <span>AI Dịch & Sinh Đa Ngôn Ngữ</span>
          </button>
          <button
            type="button"
            onClick={() => setAudioTab('upload')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              audioTab === 'upload' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📁</span>
            <span>Tải File MP3 Thủ Công</span>
          </button>
        </div>

        {/* TAB 1: AI MULTILINGUAL */}
        {audioTab === 'ai' && (
          <div className="space-y-3 text-xs animate-fadeIn">
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3 text-[11px] text-purple-900 space-y-1">
              <p className="font-extrabold flex items-center gap-1.5">
                <span>💡</span>
                <span>Quy trình 1-Chạm: Nhập tiếng Việt → AI tự dịch sang 5 thứ tiếng phổ biến:</span>
              </p>
              <p className="text-purple-800 text-[10px]">
                Hệ thống sẽ dùng Gemini AI dịch chuẩn giọng du lịch và gọi Google TTS để tạo file âm thanh kèm phụ đề chạy chữ song ngữ.
              </p>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Tiêu đề bài thuyết minh gốc (Tiếng Việt)</label>
              <input
                type="text"
                value={audioAiTitle}
                onChange={(e) => setAudioAiTitle(e.target.value)}
                placeholder="Ví dụ: Thuyết minh Quán Ốc Oanh"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold shadow-2xs focus:bg-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">
                Nội dung kịch bản văn bản gốc (Tiếng Việt) *
              </label>
              <textarea
                rows={4}
                value={audioAiScript}
                onChange={(e) => setAudioAiScript(e.target.value)}
                placeholder="Nhập nội dung thuyết minh đầy đủ bằng tiếng Việt (giới thiệu quán, món ăn signature, lịch sử, văn hóa...). AI sẽ tự động đọc tiếng Việt và dịch sang các thứ tiếng khác..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-2xs focus:bg-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1.5">Các ngôn ngữ đích cần sinh:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { code: 'en', flag: '🇬🇧', label: 'English' },
                  { code: 'zh', flag: '🇨🇳', label: '中文' },
                  { code: 'ja', flag: '🇯🇵', label: '日本語' },
                  { code: 'ko', flag: '🇰🇷', label: '한국어' },
                  { code: 'fr', flag: '🇫🇷', label: 'Français' },
                ].map((langItem) => {
                  const checked = audioTargetLangs.includes(langItem.code);
                  return (
                    <label
                      key={langItem.code}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition ${
                        checked ? 'bg-purple-50 border-purple-300 text-purple-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAudioTargetLangs([...audioTargetLangs, langItem.code]);
                          } else {
                            setAudioTargetLangs(audioTargetLangs.filter((c) => c !== langItem.code));
                          }
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>{langItem.flag}</span>
                      <span>{langItem.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleGenerateMultilingualAudio}
                disabled={audioGenerating || !audioAiScript.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {audioGenerating ? <span className="animate-spin">🔄</span> : '✨'}
                <span>{audioGenerating ? 'AI Đang Dịch & Sinh Giọng Nói...' : 'Sinh Bộ Audio Đa Ngôn Ngữ'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL MP3 UPLOAD */}
        {audioTab === 'upload' && (
          <div className="space-y-3 text-xs animate-fadeIn">
            <div>
              <label className="text-slate-600 font-bold block mb-1">Tiêu đề bài thuyết minh</label>
              <input
                type="text"
                value={newAudioTitle}
                onChange={(e) => setNewAudioTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-600 font-bold block mb-1">File âm thanh MP3 *</label>
              <input
                type="file"
                accept="audio/mp3,audio/*"
                onChange={(e) => setNewAudioFile(e.target.files?.[0] || null)}
                className="w-full text-slate-700 bg-slate-50 border border-slate-300 rounded-xl p-2 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-600 font-bold block mb-1">Lời thuyết minh (Script)</label>
              <textarea
                rows={3}
                value={newAudioScript}
                onChange={(e) => setNewAudioScript(e.target.value)}
                placeholder="Nhập nội dung lời đọc nếu có..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer hover:bg-slate-200"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleUploadAudio}
                disabled={uploading || !newAudioFile}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {uploading ? 'Đang tải lên...' : 'Tải Lên MP3'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
