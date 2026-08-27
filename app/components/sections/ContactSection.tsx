"use client";
// app/components/sections/ContactSection.tsx

import { useRef, useState } from "react";
import { SectionLabel } from "@/app/components/SectionLabel";

const WA_NUMBER = "6285156964766";
const EMAIL = "fauzymuhamad43@gmail.com";

export function ContactSection() {
    const [form, setForm] = useState({ name: "", message: "" });
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const messageRef = useRef<HTMLTextAreaElement>(null);

    // Checked when the button is pressed rather than by greying it out, so
    // the reader is told which field is missing instead of guessing.
    const missing = () => {
        if (!form.name.trim()) {
            setError("Add your name.");
            nameRef.current?.focus();
            return true;
        }
        if (!form.message.trim()) {
            setError("Write your message first.");
            messageRef.current?.focus();
            return true;
        }
        setError(null);
        return false;
    };

    const handleWA = () => {
        if (missing()) return;
        const text = encodeURIComponent(
        `Halo, nama saya ${form.name}.\n\n${form.message}`
        );
        window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank");
        setSent(true);
    };

    const handleEmail = () => {
        if (missing()) return;
        const subject = encodeURIComponent(`Pesan dari ${form.name} — Portfolio`);
        const body = encodeURIComponent(form.message);
        window.open(`mailto:${EMAIL}?subject=${subject}&body=${body}`, "_blank");
        setSent(true);
    };

    // Same underlined field as the guest notes directly below this section,
    // which was already in the page's own idiom while this one was still in
    // boxes.
    const fieldClass =
        "w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-2 text-[13px] leading-[2] text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg transition-colors duration-200";

    const actionClass =
        "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200 disabled:text-fg-muted disabled:no-underline disabled:cursor-not-allowed";

    return (
        <section data-spot id="contact" className="w-full py-24 border-t border-border">
        <div data-reveal className="container mx-auto px-6 max-w-[720px]">
            <SectionLabel note="Open for collaboration, freelance, or just a chat.">
                Get in touch
            </SectionLabel>

            {sent ? (
            <div className="max-w-[520px]">
                <p className="text-[13px] leading-[2] text-fg">Message sent.</p>
                <p className="text-[13px] leading-[2] text-fg-body">
                I will get back to you shortly.
                </p>
                <button
                onClick={() => { setSent(false); setForm({ name: "", message: "" }); }}
                className={`mt-4 text-[13px] ${actionClass}`}
                >
                Send another
                </button>
            </div>
            ) : (
            <div className="max-w-[520px] space-y-6">
                <div>
                <label htmlFor="contact-name" className="text-[11px] leading-[1.6] text-fg-muted block">
                    Name
                </label>
                <input
                    ref={nameRef}
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className={fieldClass}
                />
                </div>

                <div>
                <label htmlFor="contact-message" className="text-[11px] leading-[1.6] text-fg-muted block">
                    Message
                </label>
                <textarea
                    ref={messageRef}
                    id="contact-message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="What's on your mind?"
                    className={`${fieldClass} resize-none`}
                />
                </div>

                {error && (
                <p role="alert" className="text-[13px] leading-[2] text-fg">
                    {error}
                </p>
                )}

                <div className="flex gap-5 pt-1 text-[13px]">
                <button onClick={handleWA} className={actionClass}>
                    Send on WhatsApp →
                </button>
                <button onClick={handleEmail} className={actionClass}>
                    Send by email →
                </button>
                </div>
            </div>
            )}
        </div>
        </section>
    );
}
