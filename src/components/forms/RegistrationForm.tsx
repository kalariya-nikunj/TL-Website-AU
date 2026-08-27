"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

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
import { createRegistration } from "@/app/actions/registrations";
import { useAuth } from "@/lib/auth/AuthProvider";

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
  /** Lets the dialog close and the parent re-check registration state. */
  onSuccess?: () => void | Promise<void>;
};

export function RegistrationForm({
  eventSlug,
  eventTitle,
  onSuccess,
}: RegistrationFormProps) {
  const { user, getIdToken } = useAuth();
  const [pending, startTransition] = useTransition();
  const [department, setDepartment] = useState<string>("");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await createRegistration(await getIdToken(), {
            eventSlug,
            name: String(form.get("name") ?? ""),
            studentId: String(form.get("studentId") ?? ""),
            department,
            phone: String(form.get("phone") ?? ""),
          });

          if (result.ok) {
            toast.success(`Registered for ${eventTitle}`);
            await onSuccess?.();
          } else {
            toast.error(result.error);
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-name">Full name</Label>
          <Input
            id="reg-name"
            name="name"
            required
            autoComplete="name"
            defaultValue={user?.displayName ?? ""}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-email">University email</Label>
          {/* Read-only on purpose: the server takes the address from the
              verified ID token, so an editable field here would imply a choice
              that does not exist. */}
          <Input
            id="reg-email"
            value={user?.email ?? ""}
            readOnly
            aria-describedby="reg-email-hint"
            className="bg-primary-tint"
          />
          <p id="reg-email-hint" className="text-sm text-muted">
            From the account you are signed in with.
          </p>
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
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger id="reg-department" className="w-full">
            <SelectValue placeholder="Select a department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Registering…" : "Confirm registration"}
      </Button>
    </form>
  );
}
