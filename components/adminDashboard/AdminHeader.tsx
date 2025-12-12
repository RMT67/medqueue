import { Shield } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

export function AdminHeader({
  title,
  subtitle,
  icon = <Shield className="w-7 h-7 md:w-8 md:h-8 text-primary" />,
}: AdminHeaderProps) {
  return (
    <section className="relative bg-linear-to-br from-primary/10 via-accent/5 to-secondary/5 py-8 lg:py-10 border-b border-border overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23000000' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              {icon}
              <span dangerouslySetInnerHTML={{ __html: title }} />
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
