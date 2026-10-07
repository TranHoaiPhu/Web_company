"use client";

import { useState, useEffect, useCallback } from "react";
import { getCookie } from "cookies-next";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import { MdOutlineStarBorder } from "react-icons/md";
import { API_BASE_URL } from "@/config/api";
import { useTranslation } from "@/lib/i18n/hooks";

interface ReviewProps {
  idPlace: string;
}

interface ReviewItem {
  idplace: string;
  name: string;
  comment: string;
  rating: number;
  idreview: string;
}

export default function Reviews({ idPlace }: ReviewProps) {
  const { t: tErrors } = useTranslation("errors");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const token = getCookie("token") as string;

  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "info",
  });
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info") => {
      setToast({
        visible: true,
        message,
        type,
      });

      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 5000);
    },
    []
  );

  const fetchReviews = useCallback(async () => {
    if (!idPlace) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`Calling API for idPlace: ${idPlace}`);
      console.log(`Using token: ${token ? "Valid token exists" : "No token"}`);

      const response = await fetch(
        `${API_BASE_URL}/place_reviews/idPlace?lookup=${encodeURIComponent(
          idPlace
        )}&skip=0&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`API response status: ${response.status}`);

      if (!response.ok) {
        showToast(
          `${tErrors("review.loadError")} ${response.status}`,
          "error"
        );
        throw new Error(`${tErrors("review.loadFailed")} ${response.status}`);
      }

      const data = await response.json();
      console.log("Received reviews data:", data);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá:", err);
      setError(tErrors("review.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [idPlace, token, showToast]);

  useEffect(() => {
    if (idPlace && token) {
      console.log("Triggering fetchReviews from useEffect");
      fetchReviews();
    } else {
      console.log("Missing idPlace or token:", { idPlace, hasToken: !!token });
    }
  }, [fetchReviews, idPlace, token]);

  const handleManualRefresh = () => {
    fetchReviews();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setSubmitError(tErrors("review.contentRequired"));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/place_reviews/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idplace: idPlace,
            name: newName,
            rating: newRating,
            comment: newComment,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || tErrors("review.submitFailed"));
        showToast(
          tErrors("review.submitError"),
          "error"
        );
      }

      setNewComment("");
      setNewRating(5);
      setShowReviewForm(false);
      showToast("Đăng tải đánh giá thành công!", "success");
      fetchReviews();
    } catch (err: unknown) {
      console.error("Lỗi khi gửi đánh giá:", err);
      let message = tErrors("review.submitFailed");
      if (err instanceof Error) {
        message = err.message;
      }
      setSubmitError(message);
      showToast(
        message ||
          tErrors("review.submitError"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <MdOutlineStarBorder key={`empty-${i}`} className="text-yellow-400" />
      );
    }

    return <div className="flex">{stars}</div>;
  };

  const renderRatingSelector = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setNewRating(star)}
            className="text-2xl focus:outline-none"
          >
            {star <= newRating ? (
              <FaStar className="text-yellow-400" />
            ) : (
              <MdOutlineStarBorder className="text-yellow-400" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Đánh giá từ khách du lịch</h3>
        <button
          onClick={handleManualRefresh}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Làm mới
        </button>
      </div>
      {!showReviewForm && (
        <button
          className="w-full mt-4 py-2 text-center border border-cyan-500 text-cyan-500 rounded-lg hover:bg-cyan-50 transition"
          onClick={() => setShowReviewForm(true)}
        >
          Viết đánh giá
        </button>
      )}
      {showReviewForm && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h4 className="font-semibold mb-3">Đánh giá của bạn</h4>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2">
                Tên của bạn:
              </label>
              <input
                type="text"
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên của bạn..."
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Xếp hạng:</label>
              {renderRatingSelector()}
            </div>
            <div className="mb-4">
              <label htmlFor="comment" className="block mb-2">
                Nhận xét:
              </label>
              <textarea
                id="comment"
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chia sẻ trải nghiệm của bạn..."
                required
              />
            </div>
            {submitError && <p className="text-red-500 mb-3">{submitError}</p>}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
                  submitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                disabled={submitting}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-4">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center">
          <p className="text-red-500 p-4">{error}</p>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Thử lại
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 p-4 text-center">
          Chưa có đánh giá nào cho địa điểm này.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.idreview}
              className="bg-white rounded-lg shadow-md p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  {review.name || "Khách du lịch"}
                </p>
                {renderStarRating(review.rating)}
              </div>
              <p className="mt-2 text-gray-600">{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      {toast.visible && (
        <div
          className={`fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border-l-4 ${
            toast.type === "success"
              ? "border-green-500"
              : toast.type === "error"
              ? "border-red-500"
              : "border-blue-500"
          } animate-slide-up`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div
                className={`flex-shrink-0 ${
                  toast.type === "success"
                    ? "text-green-500"
                    : toast.type === "error"
                    ? "text-red-500"
                    : "text-blue-500"
                }`}
              >
                {toast.type === "success" && (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {toast.type === "error" && (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                {toast.type === "info" && (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800 whitespace-pre-line">
                  {toast.message}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() =>
                    setToast((prev) => ({ ...prev, visible: false }))
                  }
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
