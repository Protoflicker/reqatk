"use client";

import { useActionState, useState } from "react";
import { changePassword } from "@/lib/actions";
import type { ActionState } from "@/lib/definitions";

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
    if (password.length < 6) return { strength: 25, label: "Sangat Lemah", color: "bg-red-600" };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

    if (strength < 40) return { strength, label: "Lemah", color: "bg-orange-600" };
    if (strength < 70) return { strength, label: "Sedang", color: "bg-yellow-500" };
    return { strength, label: "Kuat", color: "bg-green-600" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="user_id" value={userId} />

      {state.error && (
        <div className="neu-inset border-2 border-red-500 p-3 text-xs font-bold text-red-600">
          ⚠ {state.error}
        </div>
      )}

      {state.success && (
        <div className="neu-inset border-2 border-green-500 p-3 text-xs font-bold text-green-600">
          ✓ {state.success}
        </div>
      )}

      <div>
        <label htmlFor="old_password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
          Kata Sandi Lama
        </label>
        <input
          id="old_password"
          name="old_password"
          type={showPassword ? "text" : "password"}
          required
          className="neu-input w-full text-sm text-dark"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="new_password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
          Kata Sandi Baru
        </label>
        <input
          id="new_password"
          name="new_password"
          type={showPassword ? "text" : "password"}
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="neu-input w-full text-sm text-dark"
          placeholder="••••••••"
          minLength={6}
        />
        
        {/* Password Strength Meter */}
        {newPassword && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Kekuatan:</span>
              <span className={`font-bold ${
                passwordStrength.strength < 40 ? "text-red-600" :
                passwordStrength.strength < 70 ? "text-yellow-600" :
                "text-green-600"
              }`}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg">
              <div
                className={`h-full transition-all ${passwordStrength.color}`}
                style={{ width: `${passwordStrength.strength}%` }}
              />
            </div>
          </div>
        )}
        
        <p className="mt-1 text-xs text-text-muted">
          Minimal 6 karakter. Gunakan kombinasi huruf, angka, dan simbol.
        </p>
      </div>

      <div>
        <label htmlFor="confirm_password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
          Konfirmasi Kata Sandi Baru
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type={showPassword ? "text" : "password"}
          required
          className="neu-input w-full text-sm text-dark"
          placeholder="••••••••"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show_password"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
          className="h-4 w-4 cursor-pointer"
        />
        <label htmlFor="show_password" className="text-xs text-text-muted cursor-pointer">
          Tampilkan kata sandi
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="neu-btn-primary w-full py-2 text-sm font-bold disabled:opacity-50"
      >
        {pending ? "Mengubah..." : "Ubah Kata Sandi"}
      </button>
    </form>
  );
}
