"use client";

import FinalizeBookingModal from "@/components/FinalizeBookingModal";
import Image from "next/image";
import { useState } from "react";

type PackageType = "hourly" | "daily" | null;
type DriveType = "self" | "chauffeur" | null;
type HoursOption = 8 | 10 | 12 | 24 | null;

interface BookingState {
  packageType: PackageType;
  driveType: DriveType;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  hours: HoursOption;
}

interface Car {
  id: string;
  name: string;
  type: string;
  seats: number;
  transmission: string;
  image: string;
  baseDailySelf: number;
  baseDailyChauffeur: number;
  baseHourlySelf: number;
  baseHourlyChauffeur: number;
  features: string[];
}

const CARS: Car[] = [
  {
    id: "vios",
    name: "Toyota Vios",
    type: "Sedan",
    seats: 5,
    transmission: "Automatic",
    image: "🚗",
    baseDailySelf: 2200,
    baseDailyChauffeur: 3200,
    baseHourlySelf: 180,
    baseHourlyChauffeur: 280,
    features: ["Fuel Efficient", "AC", "Bluetooth"],
  },
  {
    id: "innova",
    name: "Toyota Innova",
    type: "MPV",
    seats: 7,
    transmission: "Automatic",
    image: "🚙",
    baseDailySelf: 3500,
    baseDailyChauffeur: 4800,
    baseHourlySelf: 280,
    baseHourlyChauffeur: 420,
    features: ["Spacious", "Family Friendly", "AC"],
  },
  {
    id: "fortuner",
    name: "Toyota Fortuner",
    type: "SUV",
    seats: 7,
    transmission: "Automatic",
    image: "🏎️",
    baseDailySelf: 5500,
    baseDailyChauffeur: 7200,
    baseHourlySelf: 450,
    baseHourlyChauffeur: 650,
    features: ["Premium", "4x4 Ready", "Leather Seats"],
  },
  {
    id: "hiace",
    name: "Toyota Hiace",
    type: "Van",
    seats: 12,
    transmission: "Manual",
    image: "🚐",
    baseDailySelf: 4800,
    baseDailyChauffeur: 6200,
    baseHourlySelf: 380,
    baseHourlyChauffeur: 550,
    features: ["Group Travel", "Luggage Space", "AC"],
  },
  {
    id: "montero",
    name: "Mitsubishi Montero Sport",
    type: "SUV",
    seats: 7,
    transmission: "Automatic",
    image: "🚙",
    baseDailySelf: 5200,
    baseDailyChauffeur: 6800,
    baseHourlySelf: 420,
    baseHourlyChauffeur: 600,
    features: ["Powerful", "Comfort", "Safety"],
  },
  {
    id: "wigo",
    name: "Toyota Wigo",
    type: "Hatchback",
    seats: 5,
    transmission: "Automatic",
    image: "🚗",
    baseDailySelf: 1800,
    baseDailyChauffeur: 2800,
    baseHourlySelf: 150,
    baseHourlyChauffeur: 240,
    features: ["Economy", "Easy Parking", "AC"],
  },
];

const STEPS = [
  "Welcome",
  "Package",
  "Drive Type",
  "Schedule",
  "Vehicles",
] as const;

export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingState>({
    packageType: null,
    driveType: null,
    pickupDate: "",
    pickupTime: "",
    returnDate: "",
    returnTime: "",
    hours: null,
  });

  // Modal state
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const update = <K extends keyof BookingState>(
    key: K,
    value: BookingState[K],
  ) => {
    setBooking((prev) => ({ ...prev, [key]: value }));
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const canProceed = () => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return !!booking.packageType;
      case 2:
        return !!booking.driveType;
      case 3:
        if (booking.packageType === "daily") {
          return (
            booking.pickupDate &&
            booking.pickupTime &&
            booking.returnDate &&
            booking.returnTime
          );
        }
        return booking.pickupDate && booking.pickupTime && !!booking.hours;
      case 4:
        return !!selectedCar;
      default:
        return false;
    }
  };

  const getHourOptions = (): HoursOption[] => {
    if (booking.driveType === "chauffeur") return [8, 10, 12, 24];
    return [8, 12, 24];
  };

  const calculatePrice = (car: Car): number => {
    if (booking.packageType === "hourly" && booking.hours) {
      const rate =
        booking.driveType === "self"
          ? car.baseHourlySelf
          : car.baseHourlyChauffeur;
      return rate * booking.hours;
    }
    if (booking.packageType === "daily") {
      const pickup = new Date(`${booking.pickupDate}T${booking.pickupTime}`);
      const ret = new Date(`${booking.returnDate}T${booking.returnTime}`);
      const ms = Math.max(ret.getTime() - pickup.getTime(), 0);
      const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
      const rate =
        booking.driveType === "self"
          ? car.baseDailySelf
          : car.baseDailyChauffeur;
      return rate * days;
    }
    return 0;
  };

  const formatPHP = (n: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(n);

  const progress = ((step + 1) / STEPS.length) * 100;

  // Get current car info for modal
  const currentCar = CARS.find((c) => c.id === selectedCar);
  const totalPrice = currentCar ? formatPHP(calculatePrice(currentCar)) : "";

  const handleFinalSubmit = (data: any) => {
    console.log("Final booking data:", {
      ...booking,
      car: currentCar,
      total: totalPrice,
      additionalDetails: data,
    });

    // You can replace this alert later with API call / WhatsApp / email
    alert(
      `Booking submitted successfully!\n\nVehicle: ${currentCar?.name}\nTotal: ${totalPrice}\n\nWe will contact you shortly to confirm.`,
    );
    setShowFinalizeModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a227' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-[#2a2a2a] bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/portrait_white_logo.png"
              alt="J-Mave Cars"
              className="h-10 w-auto object-contain"
              width={242}
              height={65}
            />
            <div>
              <h1 className="text-lg font-semibold tracking-wide text-[#e8c547]">
                J-MAVE CARS
              </h1>
              <p className="text-[10px] text-[#a3a3a3] uppercase tracking-widest">
                Convenience & Quality Combined
              </p>
            </div>
          </div>
          <a
            href="tel:+639190737627"
            className="hidden sm:flex items-center gap-2 text-sm text-[#c9a227] hover:text-[#e8c547] transition"
          >
            <span className="w-8 h-8 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
              📞
            </span>
            +63 919 073 7627
          </a>
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`text-xs font-medium transition-colors ${
                i <= step ? "text-[#c9a227]" : "text-[#555]"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#a6841a] to-[#e8c547] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
          {/* Step content */}
          <div className="p-6 sm:p-10 min-h-[420px] flex flex-col">
            {/* STEP 0: Welcome */}
            {step === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-30 h-30 rounded-full flex items-center justify-center text-3xl">
                  <Image
                    src="/logos/portrait_white_logo.png"
                    alt="J-Mave Cars"
                    className="object-contain"
                    width={242}
                    height={65}
                  />
                </div>
                <div>
                  <p className="text-[#c9a227] text-sm font-medium tracking-widest uppercase mb-2">
                    Your Trusted Car Rental
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    Welcome to Jmave Cars
                    <br />
                    <span className="text-[#e8c547]">Booking System</span>
                  </h2>
                </div>
                <p className="text-[#a3a3a3] max-w-md leading-relaxed">
                  Explore Davao with confidence. Choose your package, pick your
                  preferred vehicle, and hit the road — self-drive or with a
                  professional chauffeur.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm text-[#a3a3a3]">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#c9a227]">★</span> 5 Star Service
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#c9a227]">⏱</span> 5+ Years
                    Experience
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#c9a227]">📍</span> Davao City
                  </span>
                </div>
              </div>
            )}

            {/* STEP 1: Package */}
            {step === 1 && (
              <div className="flex-1 space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">
                    Choose Your Package
                  </h2>
                  <p className="text-[#a3a3a3] mt-2">
                    How long will you need the vehicle?
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => update("packageType", "hourly")}
                    className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                      booking.packageType === "hourly"
                        ? "border-[#c9a227] bg-[#c9a227]/10 shadow-lg shadow-[#c9a227]/10"
                        : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#c9a227]/50"
                    }`}
                  >
                    <div className="text-3xl mb-3">⏱️</div>
                    <h3 className="text-xl font-semibold text-white">Hourly</h3>
                    <p className="text-sm text-[#a3a3a3] mt-1">
                      Perfect for short trips, airport transfers, or city
                      errands. Flexible duration.
                    </p>
                    {booking.packageType === "hourly" && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#c9a227] flex items-center justify-center text-black text-sm font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => update("packageType", "daily")}
                    className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                      booking.packageType === "daily"
                        ? "border-[#c9a227] bg-[#c9a227]/10 shadow-lg shadow-[#c9a227]/10"
                        : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#c9a227]/50"
                    }`}
                  >
                    <div className="text-3xl mb-3">📅</div>
                    <h3 className="text-xl font-semibold text-white">Daily</h3>
                    <p className="text-sm text-[#a3a3a3] mt-1">
                      Ideal for multi-day trips, weekends, or extended stays
                      around Davao and beyond.
                    </p>
                    {booking.packageType === "daily" && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#c9a227] flex items-center justify-center text-black text-sm font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Drive Type */}
            {step === 2 && (
              <div className="flex-1 space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">
                    How Will You Drive?
                  </h2>
                  <p className="text-[#a3a3a3] mt-2">
                    Self-drive freedom or sit back with a professional driver
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => update("driveType", "self")}
                    className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                      booking.driveType === "self"
                        ? "border-[#c9a227] bg-[#c9a227]/10 shadow-lg shadow-[#c9a227]/10"
                        : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#c9a227]/50"
                    }`}
                  >
                    <div className="text-3xl mb-3">🔑</div>
                    <h3 className="text-xl font-semibold text-white">
                      Self-Driven
                    </h3>
                    <p className="text-sm text-[#a3a3a3] mt-1">
                      You take the wheel. Full control and the open road at your
                      pace.
                    </p>
                    {booking.driveType === "self" && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#c9a227] flex items-center justify-center text-black text-sm font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => update("driveType", "chauffeur")}
                    className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                      booking.driveType === "chauffeur"
                        ? "border-[#c9a227] bg-[#c9a227]/10 shadow-lg shadow-[#c9a227]/10"
                        : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#c9a227]/50"
                    }`}
                  >
                    <div className="text-3xl mb-3">👨‍✈️</div>
                    <h3 className="text-xl font-semibold text-white">
                      Chauffeur Driven
                    </h3>
                    <p className="text-sm text-[#a3a3a3] mt-1">
                      Professional driver included. Relax and enjoy the journey.
                    </p>
                    {booking.driveType === "chauffeur" && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#c9a227] flex items-center justify-center text-black text-sm font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Schedule */}
            {step === 3 && (
              <div className="flex-1 space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">
                    {booking.packageType === "daily"
                      ? "Pickup & Return"
                      : "Pickup Details"}
                  </h2>
                  <p className="text-[#a3a3a3] mt-2">
                    {booking.packageType === "daily"
                      ? "Select when you need the vehicle and when you’ll return it"
                      : "Choose your pickup date, time, and duration"}
                  </p>
                </div>

                <div className="space-y-5 max-w-lg mx-auto">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#c9a227] mb-1.5">
                        Pickup Date
                      </label>
                      <input
                        type="date"
                        value={booking.pickupDate}
                        onChange={(e) => update("pickupDate", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#c9a227] mb-1.5">
                        Pickup Time
                      </label>
                      <input
                        type="time"
                        value={booking.pickupTime}
                        onChange={(e) => update("pickupTime", e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition"
                      />
                    </div>
                  </div>

                  {booking.packageType === "daily" ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#c9a227] mb-1.5">
                          Return Date
                        </label>
                        <input
                          type="date"
                          value={booking.returnDate}
                          onChange={(e) => update("returnDate", e.target.value)}
                          min={
                            booking.pickupDate ||
                            new Date().toISOString().split("T")[0]
                          }
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#c9a227] mb-1.5">
                          Return Time
                        </label>
                        <input
                          type="time"
                          value={booking.returnTime}
                          onChange={(e) => update("returnTime", e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-[#c9a227] mb-3">
                        Duration (Hours)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {getHourOptions().map((h) => (
                          <button
                            key={h}
                            onClick={() => update("hours", h)}
                            className={`py-3 rounded-lg border-2 font-semibold transition-all ${
                              booking.hours === h
                                ? "border-[#c9a227] bg-[#c9a227]/15 text-[#e8c547]"
                                : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#c9a227]/50"
                            }`}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-[#a3a3a3] mt-2">
                        {booking.driveType === "chauffeur"
                          ? "Available: 8, 10, 12 or 24 hours (chauffeur)"
                          : "Available: 8, 12 or 24 hours (self-drive)"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Vehicles */}
            {step === 4 && (
              <div className="flex-1 space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">
                    Available Vehicles
                  </h2>
                  <p className="text-[#a3a3a3] mt-2">
                    Prices calculated for your{" "}
                    <span className="text-[#c9a227]">
                      {booking.packageType === "hourly"
                        ? `${booking.hours}-hour`
                        : "daily"}
                    </span>{" "}
                    {booking.driveType === "self" ? "self-drive" : "chauffeur"}{" "}
                    package
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                  {CARS.map((car) => {
                    const price = calculatePrice(car);
                    const isSelected = selectedCar === car.id;
                    return (
                      <button
                        key={car.id}
                        onClick={() => setSelectedCar(car.id)}
                        className={`relative text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-[#c9a227] bg-[#c9a227]/10 shadow-lg shadow-[#c9a227]/10"
                            : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#c9a227]/40"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-4xl shrink-0">{car.image}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-white truncate">
                                  {car.name}
                                </h3>
                                <p className="text-xs text-[#a3a3a3]">
                                  {car.type} · {car.seats} seats ·{" "}
                                  {car.transmission}
                                </p>
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 rounded-full bg-[#c9a227] flex items-center justify-center text-black text-sm font-bold shrink-0">
                                  ✓
                                </div>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {car.features.map((f) => (
                                <span
                                  key={f}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a2a2a] text-[#a3a3a3]"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                            <div className="mt-3 text-lg font-bold text-[#e8c547]">
                              {formatPHP(price)}
                              <span className="text-xs font-normal text-[#a3a3a3] ml-1">
                                {booking.packageType === "hourly"
                                  ? `for ${booking.hours}h`
                                  : "total"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer navigation */}
          <div className="border-t border-[#2a2a2a] bg-[#0f0f0f] px-6 sm:px-10 py-5 flex items-center justify-between gap-4">
            <button
              onClick={back}
              disabled={step === 0}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                step === 0
                  ? "text-[#555] cursor-not-allowed"
                  : "text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              ← Back
            </button>

            <div className="text-xs text-[#555] hidden sm:block">
              Step {step + 1} of {STEPS.length}
            </div>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                disabled={!canProceed()}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
                  canProceed()
                    ? "bg-[#c9a227] text-black hover:bg-[#e8c547] shadow-md shadow-[#c9a227]/20"
                    : "bg-[#2a2a2a] text-[#555] cursor-not-allowed"
                }`}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!selectedCar) return;
                  setShowFinalizeModal(true); // ← Opens the modal
                }}
                disabled={!canProceed()}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
                  canProceed()
                    ? "bg-[#c9a227] text-black hover:bg-[#e8c547] shadow-md shadow-[#c9a227]/20"
                    : "bg-[#2a2a2a] text-[#555] cursor-not-allowed"
                }`}
              >
                Confirm Booking
              </button>
            )}
          </div>
        </div>

        {/* Summary strip when past step 0 */}
        {step > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-[#a3a3a3]">
            {booking.packageType && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                {booking.packageType === "hourly" ? "Hourly" : "Daily"}
              </span>
            )}
            {booking.driveType && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                {booking.driveType === "self" ? "Self-Drive" : "Chauffeur"}
              </span>
            )}
            {booking.packageType === "hourly" && booking.hours && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                {booking.hours} hours
              </span>
            )}
            {booking.pickupDate && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                Pickup: {booking.pickupDate} {booking.pickupTime}
              </span>
            )}
          </div>
        )}
      </main>

      {/* Footer note */}
      <footer className="relative z-10 text-center py-8 text-xs text-[#555]">
        <p>
          © {new Date().getFullYear()} J-Mave Cars · Davao City ·{" "}
          <a
            href="tel:+639190737627"
            className="text-[#c9a227] hover:underline"
          >
            +63 919 073 7627
          </a>
        </p>
      </footer>

      {/* ========== FINALIZE BOOKING MODAL ========== */}
      <FinalizeBookingModal
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        bookingType={booking.driveType === "self" ? "self-drive" : "chauffeur"}
        carName={currentCar?.name || ""}
        totalPrice={totalPrice}
        onSubmit={handleFinalSubmit}
      />
    </div>
  );
}
