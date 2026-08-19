"use client";
// app/components/sections/ContactSection.tsx

import { useState } from "react";

const WA_NUMBER = "6285156964766";
const EMAIL = "fauzymuhamad43@gmail.com";

export function ContactSection() {
    const [form, setForm] = useState({ name: "", message: "" });
    const [sent, setSent] = useState(false);

    const handleWA = () => {
        const text = encodeURIComponent(
        `Halo, nama saya ${form.name}.\n\n${form.message}`
        );
        window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank");
        setSent(true);
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Pesan dari ${form.name} — Portfolio`);
        const body = encodeURIComponent(form.message);
        window.open(`mailto:${EMAIL}?subject=${subject}&body=${body}`, "_blank");
        setSent(true);
    };

    const isReady = form.name.trim().length > 0 && form.message.trim().length > 0;

    const fieldClass =
        "w-full bg-bg border border-border rounded-lg px-4 py-3 text-fg text-sm placeholder:text-fg-muted focus:outline-none focus:border-border-strong transition-colors";

    return (
        <section id="contact" className="w-full py-24 border-t border-border">
        <div className="container mx-auto px-6 max-w-[680px]">
            <div className="mb-10 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
                Get in touch
            </h2>
            <p className="text-sm text-fg-secondary mt-2">
                Open for collaboration, freelance, or just a chat.
            </p>
            </div>

            {sent ? (
            <div className="text-center py-16 border border-border rounded-lg bg-bg-subtle">
                <p className="text-sm font-medium">Message sent</p>
                <p className="text-sm text-fg-secondary mt-2">
                I will get back to you shortly.
                </p>
                <button
                onClick={() => { setSent(false); setForm({ name: "", message: "" }); }}
                className="mt-6 text-sm text-fg-secondary hover:text-fg transition-colors underline underline-offset-4"
                >
                Send another
                </button>
            </div>
            ) : (
            <div className="space-y-5">
                <div>
                <label htmlFor="contact-name" className="text-sm text-fg-secondary block mb-2">
                    Name
                </label>
                <input
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className={fieldClass}
                />
                </div>

                <div>
                <label htmlFor="contact-message" className="text-sm text-fg-secondary block mb-2">
                    Message
                </label>
                <textarea
                    id="contact-message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="What's on your mind?"
                    className={`${fieldClass} resize-none`}
                />
                </div>

                <div className="flex gap-3 pt-1">
                <button
                    onClick={handleWA}
                    disabled={!isReady}
                    className="flex-1 text-sm font-medium py-3 rounded-lg bg-fg text-bg hover:opacity-85 transition-opacity duration-300 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                    WhatsApp
                </button>
                <button
                    onClick={handleEmail}
                    disabled={!isReady}
                    className="flex-1 text-sm font-medium py-3 rounded-lg border border-border text-fg hover:border-border-strong transition-colors duration-300 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                    Email
                </button>
                </div>
            </div>
            )}
        </div>
        </section>
    );
}
