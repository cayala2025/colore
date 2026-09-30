import { Header } from "@/components/Header";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { es } from "@/content/es";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-12">
        <h1 className="text-2xl font-semibold">{es.booking.pageTitle}</h1>
        <p className="mt-1 mb-6 text-sm text-muted">{es.booking.intro}</p>
        <BookingFlow />
      </main>
    </>
  );
}
