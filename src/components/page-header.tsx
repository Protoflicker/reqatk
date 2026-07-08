export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8 pb-6">
      <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-text md:text-4xl" style={{
        letterSpacing: '-0.02em'
      }}>
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-text-muted">{description}</p>
      )}
    </header>
  );
}
