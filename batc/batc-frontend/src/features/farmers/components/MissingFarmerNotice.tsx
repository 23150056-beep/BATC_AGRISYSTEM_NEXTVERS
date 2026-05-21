import { AlertTriangle } from "lucide-react";

interface Props {
  /** Override the default action copy if you want to nudge a different next step. */
  description?: string;
}

/**
 * Friendly empty-state shown on every client page (programs, claims, feedback)
 * when the logged-in CLIENT user has no linked farmer profile.
 *
 * Background: an admin can create a CLIENT user directly via /users/ POST
 * without simultaneously creating a farmer profile (the self-registration
 * endpoint creates both atomically, but the admin path doesn't). When that
 * happens, every client API call that needs the farmer FK (apply, leave
 * feedback, see distributions) returns an error. This notice replaces those
 * cryptic backend errors with a clear, single-source message that tells the
 * farmer what to do next.
 */
export function MissingFarmerNotice({ description }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-center">
      <AlertTriangle className="mx-auto text-amber-500 mb-2" size={28} aria-hidden="true" />
      <p className="text-sm font-semibold text-amber-800 mb-1">
        Your account is not linked to a farmer profile yet
      </p>
      <p className="text-xs text-amber-700 leading-relaxed max-w-sm mx-auto">
        {description ?? (
          <>
            Visit your barangay encoder or the BATC office to complete your farmer registration.
            Once linked, you'll be able to apply for programs, see your claims, and send feedback
            from this app.
          </>
        )}
      </p>
    </div>
  );
}
