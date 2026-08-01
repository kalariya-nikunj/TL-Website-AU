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
    <div className="border-b border-border bg-primary-tint py-12 md:py-16">
      <Container>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl font-display text-h2 text-primary-dark">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-body text-muted">{description}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </div>
  );
}
