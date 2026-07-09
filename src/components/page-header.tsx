export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8 border-b-4 border-ink pb-4">
      <h1 className="font-display text-3xl uppercase leading-[0.95] tracking-tight md:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-[65ch] text-sm text-ink/80">{description}</p>
      )}
    </header>
  );
}
