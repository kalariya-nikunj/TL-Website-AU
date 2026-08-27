"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContact } from "@/app/actions/contact";

/**
 * The public contact form.
 *
 * The only unauthenticated write in the site — a prospective student asking a
 * question is exactly who it is for. Validation, throttling and the actual
 * write all happen server-side in `submitContact`; nothing here is trusted.
 */
export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      className="flex max-w-xl flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await submitContact({
            name: String(data.get("name") ?? ""),
            email: String(data.get("email") ?? ""),
            subject: String(data.get("subject") ?? ""),
            message: String(data.get("message") ?? ""),
          });

          if (result.ok) {
            toast.success("Message sent — we will get back to you.");
            formRef.current?.reset();
          } else {
            toast.error(result.error);
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" required autoComplete="name" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input id="contact-subject" name="subject" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea id="contact-message" name="message" rows={6} required />
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
