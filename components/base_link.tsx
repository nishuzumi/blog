import { Link, useConfig } from "nextra-theme-docs";

export function BaseLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  let { docsRepositoryBase } = useConfig();
  if (!docsRepositoryBase.endsWith("/")) docsRepositoryBase += "/";

  return <Link href={(docsRepositoryBase += href)}>{children}</Link>;
}
