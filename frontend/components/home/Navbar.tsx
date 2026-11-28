"use client";

import { useState, useEffect } from "react";
import GooeyNav from "../ui/GooeyNav";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Globe, Menu, X } from "lucide-react";

const items = [
    { label: "Home", href: "#" },
    { label: "Work", href: "#" },
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
];

export const Navbar = () => {
    const t = useTranslations("Navbar");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => setMounted(true), []);

    const toggleLanguage = () => {
        const nextLocale = locale === "en" ? "bn" : "en";
        const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
        router.push(newPath);
    };

    // Reusable glass styles for both desktop pills and mobile menu
    const pillClasses = "flex items-center gap-2 rounded-full p-1.5 px-4 backdrop-blur-[20px] backdrop-saturate-[1.6] border transition-colors duration-300";
    const themeClasses = theme === "dark"
        ? "bg-[rgba(38,35,46,0.66)] border-[rgba(255,255,255,0.08)] text-white shadow-[0_22px_44px_-20px_rgba(0,0,0,0.8)]"
        : "bg-[rgba(240,240,243,0.8)] border-[rgba(24,24,27,0.07)] text-neutral-900 shadow-[0_22px_44px_-22px_rgba(24,24,27,0.3)]";

    return (
        <>
            <div className="fixed top-0 left-0 w-full z-50 pointer-events-none pt-6 px-6 flex justify-between items-center">

                {/* Left: Logo */}
                <div className={`pointer-events-auto ${pillClasses} ${themeClasses} h-12`}>
                    <span className="font-heading font-bold text-lg tracking-wide">
                        Ordexa<span className="text-orange-500">.</span>
                    </span>
                </div>

                {/* Center: GooeyNav (Desktop Only) */}
                <div className="pointer-events-auto hidden md:block">
                    <GooeyNav
                        items={items}
                        color="#FF6900"
                        initialActiveIndex={0}
                        theme={theme === "dark" ? "dark" : "light"}
                        size="md"
                        frame
                        particleCount={15}
                        spread={56}
                        animationTime={600}
                        timeVariance={300}
                        gooeyness={0.5}
                        wobble={0.5}
                        hoverEffect
                        onChange={(index, item) => console.log(index, item.label)}
                    />
                </div>

                {/* Right: Toggles & Hamburger */}
                <div className={`pointer-events-auto ${pillClasses} ${themeClasses} h-12 gap-1 md:gap-2`}>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        {mounted && (theme === "dark" ? <Sun size={18} /> : <Moon size={18} />)}
                    </button>

                    <div className="w-px h-4 bg-current opacity-20" />

                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1.5 p-1.5 px-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-sm font-semibold uppercase"
                    >
                        <Globe size={16} />
                        <span className="hidden sm:block">{locale === "en" ? "BN" : "EN"}</span>
                    </button>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-1.5 ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden pointer-events-none pt-24 px-6">
                    <div
                        className={`pointer-events-auto w-full rounded-3xl p-6 flex flex-col gap-4 ${themeClasses} border backdrop-blur-[20px]`}
                    >
                        {items.map((item, index) => (
                            <a
                                key={index}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-lg font-medium p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};