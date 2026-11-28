import LightRays from '../ui/LightRays';
import { MoveRight } from 'lucide-react';
import Image from 'next/image';

export const Hero = () => {
    return (
        // Main wrapper: relative positioning, min-height, and dark background fallback
        <section className="relative isolate min-h-screen w-full overflow-hidden px-6 py-20 lg:px-8">

            {/* LightRays Background: absolute, covers entire screen, sits behind */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <LightRays
                    raysOrigin="top-left"
                    raysColor="#FFE6A6"
                    raysSpeed={1}
                    lightSpread={0.5}
                    rayLength={3}
                    glow={0.4}
                    haze={0.25}
                    followMouse
                    mouseInfluence={0.1}
                    rayDensity={1}
                    tilt={0}
                    raySharpness={0.5}
                    atmosphere={1}
                    intensity={1}
                    fadeDistance={1}
                    saturation={1}
                    noiseAmount={0}
                    distortion={0}
                    pulsating={false}
                    cursorShadow
                    clickPulse
                    intro
                    lightMode={false}
                />
            </div>

            {/* Foreground Content: relative and z-10 to sit above the rays */}
            <div className="relative z-10 main-layout">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-2xl md:text-4xl lg:text-6xl font-raleway font-medium text-neutral-900 dark:text-white">
                        Run Your Online Store <span className="hero-shimmer bg-clip-text text-transparent">Faster</span>.
                        <br />
                        Eliminate Costly <span className="hero-shimmer bg-clip-text text-transparent">Fake Orders</span>.
                    </h1>
                    <p className="mt-6 font-inter font-light text-sm leading-7 text-neutral-600 md:text-base lg:text-lg sm:leading-8 dark:text-neutral-400">
                        Stop juggling Facebook Messenger, spreadsheets, and courier dashboards. Centralize your orders, customer conversations, inventory, and delivery tracking in a single, high-performance workspace.
                    </p>
                </div>

                {/* Visual Area with Floating Cards */}
                <div className="relative mt-16 flex justify-center">
                    {/* Left Card (Classic Sprint) */}
                    <div className="absolute top-0 left-20 z-0 hidden w-44 -rotate-6 rounded-xl bg-white/80 backdrop-blur-md p-3.5 shadow-[0_28px_60px_-30px_rgba(15,23,42,0.45)] ring-1 ring-black/8 lg:block dark:bg-neutral-900/80 dark:ring-white/12">
                        <p className="flex items-center gap-2 text-xs font-semibold">
                            <span className="size-2 rounded-full primary-clr"></span> Interactive Dashboard
                        </p>
                        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                            <div className="space-y-1">
                                <div className="h-1 w-6 rounded-full bg-emerald-500/70"></div>
                                <div className="h-5 rounded bg-neutral-100 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/10"></div>
                                <div className="h-5 rounded bg-neutral-100 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/10"></div>
                            </div>
                            <div className="space-y-1">
                                <div className="h-1 w-6 rounded-full bg-emerald-500/70"></div>
                                <div className="h-5 rounded bg-neutral-100 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/10"></div>
                                <div className="h-5 rounded bg-neutral-100 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/10"></div>
                            </div>
                            <div className="space-y-1">
                                <div className="h-1 w-6 rounded-full bg-emerald-500/70"></div>
                                <div className="h-5 rounded bg-neutral-100 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/10"></div>
                                <div className="h-5 rounded bg-neutral-100 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/10"></div>
                            </div>
                        </div>
                        <p className="mt-2.5 text-[11px] text-neutral-500 dark:text-white/50">60% Sales</p>
                    </div>

                    {/* Left Card (Icebreaker) */}
                    <div className="absolute bottom-0 left-20 z-20 hidden w-48 rotate-5 rounded-xl bg-white/80 backdrop-blur-md p-3.5 shadow-[0_28px_60px_-30px_rgba(15,23,42,0.45)] ring-1 ring-black/8 lg:block dark:bg-neutral-900/80 dark:ring-white/12">
                        <p className="text-[11px] font-semibold text-neutral-500 dark:text-white/50">Manage your orders</p>
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                            <div className="rounded-lg bg-neutral-50 px-2 py-2.5 text-center text-xs font-medium ring-1 ring-black/5 dark:bg-white/6 dark:ring-white/8">Approved</div>
                            <div className="rounded-lg bg-[#fff3ec] px-2 py-2.5 text-center text-xs font-medium ring-2 ring-orange-500 dark:bg-[#ff6f42]/12">Cancel</div>
                        </div>
                        <p className="mt-2 text-center text-[11px] text-[#d05d36] dark:text-[#ff946f]">Spot fake orders</p>
                    </div>

                    {/* Right Card (Microsoft Teams) */}
                    <div className="absolute top-2 right-15 z-20 hidden w-52 rotate-6 rounded-xl bg-white/80 backdrop-blur-md p-3.5 shadow-[0_28px_60px_-30px_rgba(15,23,42,0.45)] ring-1 ring-black/8 lg:block dark:bg-neutral-900/80 dark:ring-white/12">
                        <p className="flex items-center gap-2 text-xs font-semibold">
                            <span className="grid size-5 place-items-center rounded-md primary-clr text-[10px] font-bold text-white"></span> One Unified Workspace
                        </p>
                        <p className="mt-2 text-xs/5 text-neutral-600 dark:text-white/60">Say goodbye to scattered chats.</p>
                        <span className="mt-2.5 inline-flex items-center gap-1 rounded-lg primary-clr px-2.5 py-1 text-[11px] font-semibold text-white">
                            Chat Now
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3">
                                <path d="M5 12h14"></path>
                                <path d="m12 5 7 7-7 7"></path>
                            </svg>
                        </span>
                    </div>

                    {/* Right Card (AI client) */}
                    <div className="absolute right-15 bottom-2 z-20 hidden w-52 -rotate-3 rounded-xl bg-neutral-950/90 backdrop-blur-md p-3.5 shadow-[0_28px_60px_-30px_rgba(15,23,42,0.55)] ring-1 ring-white/12 lg:block">
                        <p className="flex items-center gap-2 text-xs font-semibold text-white/70">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-[#ff946f]">
                                <path d="M12 8V4H8"></path>
                                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                                <path d="M2 14h2"></path>
                                <path d="M20 14h2"></path>
                                <path d="M15 13v2"></path>
                                <path d="M9 13v2"></path>
                            </svg>
                            AI client
                        </p>
                        <p className="mt-2 text-[11px]/4 text-white/50">
                            Seamlessly track the entire order lifecycle from initial confirmation to successful courier drop-off.
                        </p>
                    </div>

                    {/* Central Image Card */}
                    <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                        <Image
                            src="https://cdn.21st.dev/assets/mirror/a9/a9c7043f8f41ca34d70f771cba29b4ba6d11ef8f5f51c90d21f220fea109d6af.png"
                            alt="Retro board interface"
                            width={1000}
                            height={700}
                            className="h-auto w-full object-cover"
                            priority
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <button className="btn-primary flex items-center gap-2">
                        Start Smart Seller OS
                        <MoveRight className="size-4" />
                    </button>
                    <button className="btn-sec flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500"></span>
                        Dashboard
                    </button>
                </div>

                <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    Guests join free from the board link
                </p>
            </div>
        </section>
    );
};