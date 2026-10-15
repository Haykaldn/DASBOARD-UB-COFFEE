"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initial: LoginState = { error: null, email: "" };

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-navy">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className="h-11 w-full rounded-xl border border-line bg-page px-3.5 text-[15px] outline-none focus:border-navy focus:bg-white focus:ring-2 focus:ring-navy/15"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-navy">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 w-full rounded-xl border border-line bg-page px-3.5 text-[15px] outline-none focus:border-navy focus:bg-white focus:ring-2 focus:ring-navy/15"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-navy font-bold text-white shadow-[0_6px_14px_-8px_rgb(15_60_107/0.7)] hover:bg-navy-hover disabled:opacity-60"
      >
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
