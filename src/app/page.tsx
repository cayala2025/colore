import { Header } from "@/components/Header";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { connection } from "next/server";
import { es } from "@/content/es";
import { todayInStudio } from "@/lib/time";

export default async function Home() {
  // Render per request so "today" is never frozen at build time.
  await connection();
  const today = todayInStudio();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-12">
        <h1 className="text-2xl font-semibold">{es.booking.pageTitle}</h1>
        <p className="mt-1 mb-6 text-sm text-muted">{es.booking.intro}</p>
        <BookingFlow today={today} />
      </main>
    </>
  );
}
