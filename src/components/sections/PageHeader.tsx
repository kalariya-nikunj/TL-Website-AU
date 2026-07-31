import { Container } from "@/components/layout/Container";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

/** The top band of every interior page. Keeps page titles identical site-wide. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="border-b py-10 md:py-14">
      <Container>
        {eyebrow && (
          <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="mt-1 max-w-3xl font-heading text-3xl font-semibold md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </div>
  );
}
