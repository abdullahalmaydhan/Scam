"use client";

import dynamic from "next/dynamic";

/** The game reads sessionStorage on its first render, so it runs in the browser only. */
export const GameLoader = dynamic(() => import("./Game").then((m) => m.Game), { ssr: false });
