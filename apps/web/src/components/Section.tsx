import React from "react";

interface SectionProps {
  title: string | React.ReactNode;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  inlineHeaderAction?: boolean; // If true, render headerAction inline with title
}

export default function Section({
  title,
  children,
  headerAction,
  inlineHeaderAction = false,
}: SectionProps) {
  const ariaLabel = typeof title === "string" ? title : undefined;

  return (
    <section aria-label={ariaLabel} className="px-4 py-4">
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text)" }}
          >
            {inlineHeaderAction && headerAction ? (
              <>
                {title} {headerAction}
              </>
            ) : (
              title
            )}
          </h2>
          {!inlineHeaderAction && headerAction && (
            <div className="ml-2">{headerAction}</div>
          )}
        </div>
        <div
          className="rounded-2xl p-4 md:p-5"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
