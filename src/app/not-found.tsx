import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center py-16">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        That page does not exist — it may have moved, or the link may be wrong.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </Container>
  );
}
