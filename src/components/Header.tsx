import { es } from "@/content/es";

export function Header() {
  return (
    <header className="mx-auto w-full max-w-md px-4 pt-8 pb-4 text-center">
      {/* Placeholder wordmark until brand assets arrive. */}
      <p className="text-4xl font-semibold tracking-tight text-accent" aria-label={es.brand.name}>
        {es.brand.name}
      </p>
      <p className="mt-1 text-sm text-muted">{es.brand.tagline}</p>
    </header>
  );
}
