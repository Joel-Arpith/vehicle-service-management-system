import BookingCalendar from "@/components/ui/booking-calendar";
import OnboardingDialog from "@/components/ui/onboarding-dialog";
import { Button } from "@/components/ui/button";

export default function Bookings() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a date to see bay availability, or start a new booking.
          </p>
        </div>
        <OnboardingDialog trigger={<Button variant="accent">New booking</Button>} />
      </header>
      <BookingCalendar />
    </div>
  );
}
