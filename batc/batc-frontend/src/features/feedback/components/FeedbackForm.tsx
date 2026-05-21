import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, AlertTriangle } from "lucide-react";
import { feedbackApi, type IssueType, ISSUE_TYPE_LABELS, QUALITY_ISSUE_TYPES } from "../api/feedback.api";
import { getApiErrorMessage } from "@/lib/errors";

interface Props {
  distributionId?: number;
  onSaved?: () => void;
}

export function FeedbackForm({ distributionId, onSaved }: Props) {
  const qc = useQueryClient();
  const [rating, setRating]       = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [comment, setComment]     = useState("");
  const [issueType, setIssueType] = useState<IssueType>("GENERAL");

  const isQualityIssue = QUALITY_ISSUE_TYPES.includes(issueType);

  const mut = useMutation({
    mutationFn: () => feedbackApi.create({
      distribution: distributionId,
      issue_type:   issueType,
      rating,
      comment,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback-mine"] });
      // m-12: quality issues also appear in the staff panel's quality-alert count
      // and the feedback list — invalidate both so staff see it immediately.
      qc.invalidateQueries({ queryKey: ["feedback"] });
      if (isQualityIssue) {
        qc.invalidateQueries({ queryKey: ["feedback-quality-count"] });
      }
      toast.success("Thank you for your feedback. Our team will review it shortly.");
      setRating(0);
      setComment("");
      setIssueType("GENERAL");
      onSaved?.();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Submission failed.")),
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Leave Feedback</h3>

      {/* Issue type */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Type of feedback</label>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value as IssueType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]"
        >
          {(Object.entries(ISSUE_TYPE_LABELS) as [IssueType, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Quality issue warning */}
      {isQualityIssue && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 leading-relaxed">
            This will be flagged as a <strong>quality issue</strong> and immediately alerted to our staff for urgent review.
          </p>
        </div>
      )}

      {/* Star rating */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="transition-colors">
              <Star
                size={22}
                className={(hovered || rating) >= star ? "text-amber-400 fill-amber-400" : "text-gray-300"}
              />
            </button>
          ))}
          {rating > 0 && <span className="ml-2 text-xs text-gray-500 self-center">{rating} / 5</span>}
        </div>
      </div>

      {/* Comment */}
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
        placeholder={isQualityIssue
          ? "Please describe the issue in detail (e.g. type of damage, condition on arrival)…"
          : "Share your experience (optional)…"}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922] resize-none" />

      <button
        onClick={() => mut.mutate()}
        disabled={rating === 0 || mut.isPending}
        className="w-full py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
        style={{ backgroundColor: isQualityIssue ? "#dc2626" : "#3B6D11" }}>
        {mut.isPending ? "Submitting…" : isQualityIssue ? "Submit Quality Issue Report" : "Submit Feedback"}
      </button>
    </div>
  );
}
