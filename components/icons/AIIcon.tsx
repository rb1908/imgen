
import React from 'react';

export const AIIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            {/* Box with gap */}
            <path
                d="M16 3H8C5.23858 3 3 5.23858 3 8V16C3 18.7614 5.23858 21 8 21H16C18.7614 21 21 18.7614 21 16V9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />

            {/* 'A' - Sans Serif Style */}
            <path
                d="M7 16L10 8L13 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.5 13.5H11.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />

            {/* 'i' - Sans Serif Style */}
            <path
                d="M16 11V16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle cx="16" cy="8.5" r="1.5" fill="currentColor" />

            {/* Sparkle (Top Right) */}
            <path
                d="M21 0L22.5 3.5L26 5L22.5 6.5L21 10L19.5 6.5L16 5L19.5 3.5L21 0Z"
                fill="currentColor"
                transform="translate(-2 1) scale(0.8)"
            />
        </svg>
    );
};
