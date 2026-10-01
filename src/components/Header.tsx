import Image from "next/image";
import Link from "next/link";
import { es } from "@/content/es";
import logo from "../../public/brand/colore-logo.jpg";

export function Header() {
  return (
    <header className="mb-6 bg-brand-bg">
      <div className="mx-auto w-full max-w-md px-4 py-4 text-center">
        <Link href="/" className="mx-auto inline-block">
          {/* The logo includes the tagline ("El arte está en todas partes"). */}
          <Image src={logo} alt={es.brand.logoAlt} priority className="mx-auto h-auto w-64" sizes="256px" />
        </Link>
      </div>
    </header>
  );
}
