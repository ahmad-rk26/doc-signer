'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

import 'swiper/css'
import 'swiper/css/pagination'

export default function LandingPage() {
    return (
        <main className="pt-20">

            {/* HERO */}
            <section className="relative overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f"
                    alt="hero"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60" />

                <div className="relative max-w-7xl mx-auto px-4 py-32 text-center text-white">
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold leading-tight"
                    >
                        Sign Documents in Minutes — Not Days
                    </motion.h1>

                    <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto text-gray-200">
                        Secure. Fast. Legally binding digital signatures with full audit trail.
                    </p>

                </div>
            </section>

            {/* TRUST BAR */}
            <section className="py-14 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-10 items-center opacity-70">
                    {[
                        'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
                        'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
                        'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
                        'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
                    ].map((logo, i) => (
                        <Image key={i} src={logo} alt="logo" width={120} height={40} className="mx-auto" />
                    ))}
                </div>
            </section>

            {/* FEATURE SPLIT */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">

                    <Image
                        src="https://images.unsplash.com/photo-1586281380349-632531db7ed4"
                        alt="dashboard"
                        width={600}
                        height={400}
                        className="rounded-xl shadow-xl"
                    />

                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Everything you need to sign & send documents
                        </h2>

                        <ul className="mt-8 space-y-4 text-lg text-gray-600">
                            <li>✔ Upload & place signature anywhere</li>
                            <li>✔ Email verification for signers</li>
                            <li>✔ Real-time document tracking</li>
                            <li>✔ Tamper-proof audit logs</li>
                        </ul>
                    </div>
                </div>
            </section>

        </main>
    )
}