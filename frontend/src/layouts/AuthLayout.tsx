import React from "react";

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div
            className="
        min-h-screen
        w-full
        overflow-x-hidden
        overflow-y-auto
        bg-gradient-to-br from-[#eef5ff] via-white to-[#e6f0ff]
        dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
      "
        >
            {children}
        </div>
    );
}
