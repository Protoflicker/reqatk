import { Icon } from "./icon";

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
      className={`animate-fade-up mb-6 flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 text-sm font-medium ${
        isError
          ? "border-[rgba(224,62,62,0.3)] bg-[rgba(224,62,62,0.1)] text-danger"
          : "border-[rgba(26,174,57,0.3)] bg-[rgba(26,174,57,0.12)] text-success"
      }`}
    >
      <Icon
        name={isError ? "alert" : "check"}
        className="mt-0.5 shrink-0 text-base"
      />
      <span className="text-text">{children}</span>
    </div>
  );
}
