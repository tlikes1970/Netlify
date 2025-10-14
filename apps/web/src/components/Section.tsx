export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="px-4 py-4">
      <div className="w-full">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>{title}</h2>
        <div className="rounded-2xl p-4 md:p-5" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
          {children}
        </div>
      </div>
    </section>
  );
}
