import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../../lib/firebaseBootstrap";
import { clearBillingCache } from "../../lib/proStatus";
import { t, useLanguage } from "../../lib/language";

export default function AdminFullAccess() {
  useLanguage();
  const [target, setTarget] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    target: string;
    granted: boolean;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const update = async (grant: boolean) => {
    if (!target.trim() || pending) return;
    setPending(true);
    setResult(null);
    setFailed(false);
    try {
      const manage = httpsCallable<
        { target: string; isPro: boolean },
        { userId: string; email: string; granted: boolean }
      >(functions, "manageProStatus");
      const response = await manage({ target: target.trim(), isPro: grant });
      if (response.data.userId === auth.currentUser?.uid) {
        clearBillingCache();
        window.dispatchEvent(new Event("billing:changed"));
      }
      setResult({
        target: response.data.email || response.data.userId,
        granted: response.data.granted,
      });
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };
  return (
    <section
      className="space-y-4 p-4 rounded border"
      style={{ borderColor: "var(--line)" }}
    >
      <h2 className="text-xl font-semibold">{t("adminAccessTitle")}</h2>
      <p>{t("adminAccessCopy")}</p>
      <label className="block" htmlFor="admin-access-target">
        {t("adminAccessTarget")}
      </label>
      <input
        id="admin-access-target"
        className="w-full min-w-0 px-3 py-3 rounded border"
        style={{ background: "var(--bg)", borderColor: "var(--line)" }}
        value={target}
        disabled={pending}
        onChange={(event) => {
          setTarget(event.target.value);
          setResult(null);
          setFailed(false);
        }}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="px-4 py-3 rounded border"
          disabled={pending || !auth.currentUser}
          onClick={() => {
            setTarget(auth.currentUser?.uid || "");
            setResult(null);
            setFailed(false);
          }}
        >
          {t("adminAccessSelf")}
        </button>
        <button
          type="button"
          className="px-4 py-3 rounded border"
          disabled={pending || !target.trim()}
          onClick={() => {
            void update(true);
          }}
        >
          {t("adminAccessGrant")}
        </button>
        <button
          type="button"
          className="px-4 py-3 rounded border"
          disabled={pending || !target.trim()}
          onClick={() => {
            void update(false);
          }}
        >
          {t("adminAccessRevoke")}
        </button>
      </div>
      <div role="status" aria-live="polite">
        {pending
          ? t("adminAccessSaving")
          : result
            ? t(result.granted ? "adminAccessGranted" : "adminAccessRevoked", {
                target: result.target,
              })
            : ""}
      </div>
      {failed && <p role="alert">{t("adminAccessError")}</p>}
    </section>
  );
}
