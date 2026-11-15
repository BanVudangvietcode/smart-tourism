'use client';

import React, { useState } from 'react';
import { ReviewPageResponse } from '@/types';
import { postReview, fetchPoiReviews } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface PoiReviewsTabProps {
  poiId: number | string | null;
  reviewsData: ReviewPageResponse | null;
  setReviewsData: React.Dispatch<React.SetStateAction<ReviewPageResponse | null>>;
}

export default function PoiReviewsTab({
  poiId,
  reviewsData,
  setReviewsData,
}: PoiReviewsTabProps) {
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const { language, tk } = useLanguage();

  const [userRating, setUserRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [reviewIsPublic, setReviewIsPublic] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !poiId) return;

    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    setSubmittingReview(true);
    setReviewSuccess(false);
    try {
      await postReview(Number(poiId), {
        rating: userRating,
        comment: commentText.trim(),
        isAnonymous: !reviewIsPublic,
      });
      setReviewSuccess(true);
      setCommentText('');
      const revs = await fetchPoiReviews(Number(poiId));
      setReviewsData(revs);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('smart_tourism_poi_updated'));
      }
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      console.error('Error posting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Khối yêu cầu đăng nhập nếu chưa đăng nhập */}
      {!isAuthenticated ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✍️</span>
            <div>
              <h4 className="text-xs font-black text-slate-800">Đăng nhập để đánh giá &amp; bình luận</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chia sẻ trải nghiệm và cảm nhận ẩm thực của bạn với cộng đồng du khách.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openLoginModal}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20"
          >
            Đăng nhập ngay
          </button>
        </div>
      ) : (
        /* Form viết đánh giá khi đã đăng nhập */
        <form onSubmit={handleSubmitReview} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800">{tk('poi_review_title')}</h4>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setUserRating(star)}
              className={`text-xl transition cursor-pointer ${star <= userRating ? 'text-amber-400' : 'text-slate-200'}`}
            >
              ★
            </button>
          ))}
          <span className="text-xs font-bold text-slate-600 ml-2">{userRating} {tk('poi_review_stars')}</span>
        </div>

        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={tk('poi_review_placeholder')}
          rows={2}
          className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-slate-50"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500">{tk('poi_review_mode')}</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setReviewIsPublic(true)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  reviewIsPublic ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🌐 {tk('poi_review_public')}
              </button>
              <button
                type="button"
                onClick={() => setReviewIsPublic(false)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  !reviewIsPublic ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🔒 {tk('poi_review_private')}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <span className="text-[10px] text-slate-400">
              {tk('poi_review_post_as')} <b className="text-slate-600">{reviewIsPublic ? (user?.displayName || tk('poi_reviewer_default')) : tk('poi_reviewer_anon')}</b>
            </span>
            <button
              type="submit"
              disabled={submittingReview || !commentText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {submittingReview ? tk('poi_review_submitting') : tk('poi_review_submit')}
            </button>
          </div>
        </div>

        {reviewSuccess && (
          <p className="text-[11px] text-emerald-600 font-bold">{tk('poi_review_success')}</p>
        )}
      </form>
      )}

      {/* Khối tóm tắt điểm đánh giá */}
      {reviewsData && reviewsData.totalCount > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-amber-600">
              {(
                reviewsData.items.reduce((acc, r) => acc + r.rating, 0) / (reviewsData.items.length || 1)
              ).toFixed(1)}
            </div>
            <div>
              <div className="flex text-amber-400 text-sm">
                {'★'.repeat(
                  Math.round(
                    reviewsData.items.reduce((acc, r) => acc + r.rating, 0) / (reviewsData.items.length || 1)
                  )
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                Dựa trên {reviewsData.totalCount} đánh giá từ du khách
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200">
            ✓ Đã xác thực
          </span>
        </div>
      )}

      {/* Danh sách đánh giá */}
      <div className="space-y-3">
        {reviewsData && reviewsData.items.length > 0 ? (
          reviewsData.items.map((rev) => (
            <div key={rev.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {rev.userDisplayName ? rev.userDisplayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{rev.userDisplayName || tk('poi_reviewer_fallback')}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex text-amber-400 text-xs">
                  {'★'.repeat(rev.rating)}
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            {tk('poi_review_empty')}
          </div>
        )}
      </div>
    </div>
  );
}
