"use client";

import { useActionState, useState } from "react";
import { changePassword } from "@/lib/actions";
import type { ActionState } from "@/lib/definitions";
import { Icon } from "./icon";

interface PasswordChangeFormProps {
  userId: number;
}

const initialState: ActionState = {};

export function PasswordChangeForm({ userId }: PasswordChangeFormProps) {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 6)
      return { strength: 25, label: "Sangat Lemah", color: "bg-danger" };

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

    if (strength < 40) return { strength, label: "Lemah", color: "bg-danger" };
    if (strength < 70) return { strength, label: "Sedang", color: "bg-warning" };
    return { strength, label: "Kuat", color: "bg-success" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="user_id" value={userId} />

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--radius)] border border-[rgba(224,62,62,0.3)] bg-[rgba(224,62,62,0.1)] p-3 text-sm font-medium text-danger"
        >
          <Icon name="alert" className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-[var(--radius)] border border-[rgba(26,174,57,0.3)] bg-[rgba(26,174,57,0.12)] p-3 text-sm font-medium text-success"
        >
          <Icon name="check" className="mt-0.5 shrink-0" />
          <span>{state.success}</span>
        </div>
      )}

      <div>
        <label htmlFor="old_password" className="label">
          Kata Sandi Lama
        </label>
        <input
          id="old_password"
          name="old_password"
          type={showPassword ? "text" : "password"}
          required
          className="input text-sm"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="new_password" className="label">
          Kata Sandi Baru
        </label>
        <input
          id="new_password"
          name="new_password"
          type={showPassword ? "text" : "password"}
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input text-sm"
          placeholder="••••••••"
          minLength={6}
        />

        {/* Password Strength Meter */}
        {newPassword && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Kekuatan:</span>
              <span
                className={`font-bold ${
                  passwordStrength.strength < 40
                    ? "text-danger"
                    : passwordStrength.strength < 70
                      ? "text-warning"
                      : "text-success"
                }`}
              >
                {passwordStrength.label}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-mid">
              <div
                className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                style={{ width: `${passwordStrength.strength}%` }}
              />
            </div>
          </div>
        )}

        <p className="helper">
          Minimal 6 karakter. Gunakan kombinasi huruf, angka, dan simbol.
        </p>
      </div>

      <div>
        <label htmlFor="confirm_password" className="label">
          Konfirmasi Kata Sandi Baru
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type={showPassword ? "text" : "password"}
          required
          className="input text-sm"
          placeholder="••••••••"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show_password"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
        />
        <label htmlFor="show_password" className="cursor-pointer text-xs text-text-muted">
          Tampilkan kata sandi
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="neu-btn-primary w-full py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Mengubah..." : "Ubah Kata Sandi"}
      </button>
    </form>
  );
}
