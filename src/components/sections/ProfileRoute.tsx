"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { UserProfile } from "@/types";
import { completeMyProfile, getMyProfile } from "@/app/actions/profile";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { MyProjects } from "@/components/sections/MyProjects";
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
import { useAuth } from "@/lib/auth/AuthProvider";

type ProfileRouteProps = { page: "onboarding" | "dashboard" };
type LoadState = "loading" | "ready" | "error";
const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
  "Other",
];

export function ProfileRoute({ page }: ProfileRouteProps) {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [department, setDepartment] = useState("");

  const fetchProfile = useCallback(async () => {
    return getMyProfile(await getIdToken());
  }, [getIdToken]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=/${page}`);
      return;
    }
    let cancelled = false;
    void fetchProfile().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setState("error");
      } else {
        setProfile(result.data);
        setState("ready");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loading, user, page, router, fetchProfile]);

  useEffect(() => {
    if (state !== "ready") return;
    if (page === "dashboard" && !profile) router.replace("/onboarding");
    if (page === "onboarding" && profile?.profileCompleted) router.replace("/dashboard");
  }, [page, profile, router, state]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const selectedDepartment = department || profile?.department || "";
    if (!selectedDepartment) {
      setError("Select your department.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await completeMyProfile(await getIdToken(), {
        name: String(values.get("name") ?? ""),
        enrollmentNumber: String(values.get("enrollmentNumber") ?? ""),
        department: selectedDepartment,
        branch: String(values.get("branch") ?? ""),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setProfile(result.data);
      router.replace("/dashboard");
    });
  }

  if (loading || !user || state === "loading") {
    return <div aria-live="polite" className="h-28 animate-pulse rounded-lg bg-primary-tint" />;
  }

  if (state === "error") {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <StatusMessage status="error">{error}</StatusMessage>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setState("loading");
            setError("");
            void fetchProfile().then((result) => {
              if (!result.ok) {
                setError(result.error);
                setState("error");
              } else {
                setProfile(result.data);
                setState("ready");
              }
            });
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (page === "onboarding") {
    if (profile?.profileCompleted) return null;
    return (
      <form onSubmit={submit} className="flex max-w-xl flex-col gap-5 rounded-lg border border-border bg-surface p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-name">Name</Label>
          <Input id="profile-name" name="name" required maxLength={100} defaultValue={profile?.name || user.displayName || ""} autoComplete="name" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={user.email ?? ""} readOnly className="bg-primary-tint" />
          <p className="text-sm text-muted">From your signed-in university account.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-enrollment">Enrollment number</Label>
          <Input id="profile-enrollment" name="enrollmentNumber" required maxLength={40} defaultValue={profile?.enrollmentNumber ?? ""} autoComplete="off" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-department">Department</Label>
          <Select value={department || profile?.department || ""} onValueChange={setDepartment}>
            <SelectTrigger id="profile-department" className="w-full" aria-label="Department">
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-branch">Branch</Label>
          <Input id="profile-branch" name="branch" required maxLength={100} defaultValue={profile?.branch ?? ""} />
        </div>
        {error && <StatusMessage status="error">{error}</StatusMessage>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving profile…" : "Complete profile"}
        </Button>
      </form>
    );
  }

  if (!profile) return null;
  return (
    <div className="max-w-4xl">
      <div className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <h2 className="font-display text-h4">Your profile</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <ProfileValue label="Name" value={profile.name} />
          <ProfileValue label="Email" value={profile.email} />
          <ProfileValue label="Enrollment number" value={profile.enrollmentNumber} />
          <ProfileValue label="Department" value={profile.department} />
          <ProfileValue label="Branch" value={profile.branch} />
        </dl>
        <p className="mt-6 text-small text-muted">Profile status: {profile.profileCompleted ? "Complete" : "Incomplete"}</p>
      </div>
      <MyProjects />
    </div>
  );
}

function ProfileValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-small text-muted">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}
