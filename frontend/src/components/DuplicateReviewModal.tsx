import type { DuplicatePrompt } from "../types";

interface DuplicateReviewModalProps {
  prompt?: DuplicatePrompt;
  isSubmitting?: boolean;
  onDecision: (action: "skip" | "keep" | "skip_all" | "keep_all") => void;
}

export function DuplicateReviewModal({
  prompt,
  isSubmitting,
  onDecision,
}: DuplicateReviewModalProps) {
  if (!prompt) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Exact Duplicate Found</h3>
        <p>Choose how to handle this duplicate content.</p>
        <div className="dup-grid">
          <div>
            <strong>Existing</strong>
            <div>{prompt.existingName}</div>
            {prompt.existingPreviewDataUrl ? (
              <img src={prompt.existingPreviewDataUrl} alt="Existing preview" />
            ) : (
              <div className="preview-placeholder">No preview</div>
            )}
          </div>
          <div>
            <strong>Incoming</strong>
            <div>{prompt.incomingName}</div>
            {prompt.incomingPreviewDataUrl ? (
              <img src={prompt.incomingPreviewDataUrl} alt="Incoming preview" />
            ) : (
              <div className="preview-placeholder">No preview</div>
            )}
          </div>
        </div>
        <div className="modal-actions">
          <button disabled={isSubmitting} onClick={() => onDecision("skip")}>
            {isSubmitting ? "Please wait..." : "Skip New Image"}
          </button>
          <button
            className="skip-all-button"
            disabled={isSubmitting}
            onClick={() => onDecision("skip_all")}
          >
            Skip ALL Duplicates
          </button>
          <button className="primary" disabled={isSubmitting} onClick={() => onDecision("keep")}>
            {isSubmitting ? "Please wait..." : "Keep Both"}
          </button>
          <button
            className="primary keep-all-button"
            disabled={isSubmitting}
            onClick={() => onDecision("keep_all")}
          >
            Keep ALL Duplicates
          </button>
        </div>
      </div>
    </div>
  );
}
