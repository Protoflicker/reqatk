export function Alert({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: React.ReactNode;
}) {
  const isError = variant === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-6 flex items-start gap-3 border-2 p-3 text-xs font-bold uppercase tracking-[0.06em] ${
        isError
          ? "border-red bg-red text-paper"
          : "border-ink bg-ink text-paper"
      }`}
    >
      <span aria-hidden="true">{isError ? "!!" : "OK"}</span>
      <span className="normal-case tracking-normal">{children}</span>
    </div>
  );
}
