import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/**
 * Klien Neon diinisialisasi malas (lazy) supaya `next build` tidak gagal
 * saat DATABASE_URL belum tersedia di lingkungan build.
 */
export function db(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL belum diatur. Salin .env.example menjadi .env.local dan isi connection string Neon."
      );
    }
    client = neon(url);
  }
  return client;
}
