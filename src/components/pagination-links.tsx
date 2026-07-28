import Link from "next/link";

/**
 * Paginasi berbasis tautan untuk Server Component.
 *
 * Berbeda dengan <Pagination> yang memakai callback dan hanya bisa dipanggil
 * dari Client Component, komponen ini merender <Link> biasa sehingga aman
 * dipakai langsung di halaman server.
 */
export function PaginationLinks({
  currentPage,
  totalPages,
  basePath,
  params,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  /** Query string lain yang harus ikut dipertahankan, mis. saringan aksi. */
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (page: number) => {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) q.set(key, value);
    }
    if (page > 1) q.set("page", String(page));
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages: (number | "gap")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, "gap", totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, "gap");
    for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, "gap", currentPage - 1, currentPage, currentPage + 1, "gap", totalPages);
  }

  return (
    <nav
      aria-label="Navigasi halaman"
      className="flex items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link href={href(currentPage - 1)} className="btn px-4 py-2 text-sm">
          Sebelumnya
        </Link>
      ) : (
        <span className="btn px-4 py-2 text-sm opacity-30">Sebelumnya</span>
      )}

      {pages.map((page, idx) =>
        page === "gap" ? (
          <span key={`gap-${idx}`} className="px-1 text-text-muted">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={href(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`${
              page === currentPage ? "neu-btn-primary" : "btn"
            } tnum flex h-9 w-9 items-center justify-center !p-0 text-sm`}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link href={href(currentPage + 1)} className="btn px-4 py-2 text-sm">
          Berikutnya
        </Link>
      ) : (
        <span className="btn px-4 py-2 text-sm opacity-30">Berikutnya</span>
      )}
    </nav>
  );
}
