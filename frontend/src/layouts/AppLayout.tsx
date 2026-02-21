import React from "react";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full overflow-x-hidden overflow-y-auto flex justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {children}
            </div>
        </div>
    );
}

