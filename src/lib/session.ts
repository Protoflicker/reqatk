import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import type { Role } from "./definitions";

/**
 * Modul ini bebas dependensi Node sehingga aman dipakai di Edge Middleware
 * maupun di Server Components / Server Actions.
 */

export const SESSION_COOKIE = "pinjamatk_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 jam kerja

export interface SessionPayload {
  id: number;
  nip: string;
  nama: string;
  role: Role;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET belum diatur (minimal 16 karakter). Lihat .env.example."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.id !== "number" ||
      typeof payload.nip !== "string" ||
      typeof payload.nama !== "string" ||
      (payload.role !== "admin" && payload.role !== "user")
    ) {
      return null;
    }
    return {
      id: payload.id,
      nip: payload.nip,
      nama: payload.nama,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
