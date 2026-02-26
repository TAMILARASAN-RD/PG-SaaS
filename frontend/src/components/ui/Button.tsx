'use client'

import React, { useState, MouseEvent } from 'react';

interface Ripple {
    x: number;
    y: number;
    id: number;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    className?: string;
}

export function Button({
    children,
    variant = 'primary',
    className = '',
    onClick,
    disabled,
    ...props
}: ButtonProps) {
    const [ripples, setRipples] = useState<Ripple[]>([]);

    const addRipple = (e: MouseEvent<HTMLButtonElement>) => {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();

        // Calculate relative click coordinates
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = { x, y, id: Date.now() };
        setRipples((prev) => [...prev, newRipple]);

        // Clean up ripple after animation (600ms match with CSS)
        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);

        if (onClick) onClick(e);
    };

    const baseClasses = "relative overflow-hidden font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        outline: "border border-gray-200 text-gray-700 hover:bg-gray-50",
        ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        danger: "bg-red-600 text-white hover:bg-red-700"
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            onClick={addRipple}
            disabled={disabled}
            {...props}
        >
            {children}
            {ripples.map((ripple) => (
                <span
                    key={ripple.id}
                    className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        transform: 'translate(-50%, -50%)',
                        width: '100px', // Set fixed size for the animation origin
                        height: '100px'
                    }}
                />
            ))}
        </button>
    );
}
