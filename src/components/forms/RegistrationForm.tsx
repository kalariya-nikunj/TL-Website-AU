"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
  "Other",
];

type RegistrationFormProps = {
  eventSlug: string;
  eventTitle: string;
};

/**
 * Phase 1: structure only. Phase 4 requires a signed-in user, wires `action` to a
 * Server Action writing to `registrations`, and enforces capacity.
 */
export function RegistrationForm({
  eventSlug,
  eventTitle,
}: RegistrationFormProps) {
  return (
    <form className="flex max-w-xl flex-col gap-4">
      <input type="hidden" name="eventSlug" value={eventSlug} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-name">Full name</Label>
          <Input id="reg-name" name="name" required autoComplete="name" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-email">University email</Label>
          <Input
            id="reg-email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-student-id">Student ID</Label>
          <Input id="reg-student-id" name="studentId" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-phone">Phone</Label>
          <Input id="reg-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-department">Department</Label>
        <Select name="department">
          <SelectTrigger id="reg-department" className="w-full">
            <SelectValue placeholder="Select a department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Button type="submit" disabled>
          Register for {eventTitle}
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">
          Registration is enabled in Phase 4, once sign-in and Firestore are connected.
        </p>
      </div>
    </form>
  );
}
