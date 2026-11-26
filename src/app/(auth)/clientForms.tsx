"use client";

import dynamic from "next/dynamic";

/**
 * The auth forms read sessionStorage (pendingRound, the handed-off email)
 * on their first render, so they render in the browser only.
 */
export const LoginForm = dynamic(() => import("./login/LoginForm").then((m) => m.LoginForm), { ssr: false });
export const SignupForm = dynamic(() => import("./signup/SignupForm").then((m) => m.SignupForm), { ssr: false });
export const ForgotForm = dynamic(() => import("./forgot/ForgotForm").then((m) => m.ForgotForm), { ssr: false });
export const ResetForm = dynamic(() => import("./reset-password/ResetForm").then((m) => m.ResetForm), { ssr: false });
