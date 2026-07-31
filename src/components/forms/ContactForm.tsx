"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Phase 1: structure only. Phase 4 wires `action` to a Server Action that writes
 * to the `contactSubmissions` collection and raises a toast on success.
 */
export function ContactForm() {
  return (
    <form className="flex max-w-xl flex-col gap-4">
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
        <Button type="submit" disabled>
          Send message
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">
          Sending is enabled in Phase 4, once Firestore is connected.
        </p>
      </div>
    </form>
  );
}
