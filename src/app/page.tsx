"use client";

import FinalizeBookingModal from "@/components/FinalizeBookingModal";
import Image from "next/image";
import { useState } from "react";

type PackageType = "hourly" | "daily" | "monthly" | null;
type DriveType = "self" | "chauffeur" | null;
type HoursOption = 8 | 10 | 12 | null;
type MonthlyLocation = "city" | "region" | "mindanao" | null;
type MileageType = "limited" | "unli" | null;

/** Destination keys used for Unli self-drive rates */
type DestinationId =
  | "city"
  | "panabo"
  | "tagum"
  | "samal"
  | "digos"
  | "marilog"
  | "stoTomas"
  | "region"
  | "sarangani"
  | "southCotabato"
  | "bukidnon"
  | "caraga"
  | "misamisOriental"
  | "sultanKudarat"
  | "camiguin"
  | "cotabatoCity"
  | "lanao"
  | "misamisOccidental"
  | "zamboanga"
  | "barmm";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const getMinPickupDateTime = () => new Date(Date.now() + TWO_HOURS_MS);
const toDateInputValue = (d: Date) => d.toISOString().split("T")[0];
const toTimeInputValue = (d: Date) => d.toTimeString().slice(0, 5);

/** Add N calendar days to a YYYY-MM-DD date string */
const addDaysToDate = (dateStr: string, days: number): string => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
};

/** Compute return date + time from pickup + total hours */
const computeReturnFromHours = (
  pickupDate: string,
  pickupTime: string,
  totalHours: number | null,
): { returnDate: string; returnTime: string } | null => {
  if (!pickupDate || !pickupTime || totalHours == null || totalHours <= 0)
    return null;
  const start = new Date(`${pickupDate}T${pickupTime}`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + totalHours * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    returnDate: toDateInputValue(end),
    returnTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
  };
};

const isPickupValid = (date: string, time: string): boolean => {
  if (!date || !time) return false;
  const selected = new Date(`${date}T${time}`);
  return selected.getTime() >= getMinPickupDateTime().getTime();
};

interface PackageOption {
  price: number;
  kmAllowance: number;
}

interface BookingState {
  packageType: PackageType;
  driveType: DriveType;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  hours: HoursOption;
  /** Extra hours beyond the selected package duration (hourly only) */
  extraHours: number;
  monthlyLocation: MonthlyLocation;
  referralCode: string;
  mileageType: MileageType;
  destination: DestinationId | null;
}

interface Car {
  id: string;
  type: string;
  category?: string;
  seats: number;
  transmission: string;
  image: string;
  // Package totals (self-drive) – limited km
  hourlySelf8: PackageOption;
  hourlySelf12: PackageOption;
  baseDailySelf: PackageOption;
  // Hourly Unli rates (self-drive)
  hourlySelf8City: PackageOption;
  hourlySelf8PanaboTagumSamalDigosMarilogStoTomas: PackageOption;
  hourlySelf12City: PackageOption;
  hourlySelf12Region: PackageOption;
  hourlySelf12SaranganiSouthCot: PackageOption;
  hourlySelf12Bukidnon: PackageOption;
  hourlySelf12CaragaMisamisOrientalSultanKudarat: PackageOption;
  hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: PackageOption;
  hourlySelf12BARMM: PackageOption;
  // Daily Unli rates (self-drive)
  baseDailySelfUnliCity: PackageOption;
  baseDailySelfUnliRegion: PackageOption;
  baseDailySelfUnliSaranganiSouthCot: PackageOption;
  baseDailySelfUnliBukidnon: PackageOption;
  baseDailySelfUnliCaragaMisamisOrientalSultanKudarat: PackageOption;
  baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: PackageOption;
  baseDailySelfUnliBARMM: PackageOption;
  // Package totals (chauffeur)
  // hourlyChauffeur8: number;
  // hourlyChauffeur10: number;
  // hourlyChauffeur12: number;
  // baseDailyChauffeur: number;
  // Monthly rates (self-drive)
  monthlyCitySelf: number;
  monthlyRegionSelf: number;
  monthlyMindanaoSelf: number;
  // Monthly rates (chauffeur)
  // monthlyCityChauffeur: number;
  // monthlyRegionChauffeur: number;
  // monthlyMindanaoChauffeur: number;
  //Extra charges
  carwashFee: number;
  collisionDamageWaiver: number;
  features: string[];
}

/** Destination options for Unli self-drive. rateKey maps to the Car field used for pricing. */
const DESTINATION_OPTIONS: {
  id: DestinationId;
  label: string;
  group: string;
  /** Which package keys this destination supports */
  supports: {
    hourly8?: keyof Car;
    hourly12?: keyof Car;
    daily?: keyof Car;
  };
}[] = [
  {
    id: "city",
    label: "Davao City (City Drive)",
    group: "Local",
    supports: {
      hourly8: "hourlySelf8City",
      hourly12: "hourlySelf12City",
      daily: "baseDailySelfUnliCity",
    },
  },
  {
    id: "panabo",
    label: "Panabo",
    group: "Nearby",
    supports: {
      hourly8: "hourlySelf8PanaboTagumSamalDigosMarilogStoTomas",
      // 12h / daily fall under Region rates
      hourly12: "hourlySelf12Region",
      daily: "baseDailySelfUnliRegion",
    },
  },
  {
    id: "tagum",
    label: "Tagum",
    group: "Nearby",
    supports: {
      hourly8: "hourlySelf8PanaboTagumSamalDigosMarilogStoTomas",
      hourly12: "hourlySelf12Region",
      daily: "baseDailySelfUnliRegion",
    },
  },
  {
    id: "samal",
    label: "Samal",
    group: "Nearby",
    supports: {
      hourly8: "hourlySelf8PanaboTagumSamalDigosMarilogStoTomas",
      hourly12: "hourlySelf12Region",
      daily: "baseDailySelfUnliRegion",
    },
  },
  {
    id: "digos",
    label: "Digos",
    group: "Nearby",
    supports: {
      hourly8: "hourlySelf8PanaboTagumSamalDigosMarilogStoTomas",
      hourly12: "hourlySelf12Region",
      daily: "baseDailySelfUnliRegion",
    },
  },
  {
    id: "marilog",
    label: "Marilog",
    group: "Nearby",
    supports: {
      hourly8: "hourlySelf8PanaboTagumSamalDigosMarilogStoTomas",
      hourly12: "hourlySelf12Region",
      daily: "baseDailySelfUnliRegion",
    },
  },
  {
    id: "stoTomas",
    label: "Sto. Tomas",
    group: "Nearby",
    supports: {
      hourly8: "hourlySelf8PanaboTagumSamalDigosMarilogStoTomas",
      hourly12: "hourlySelf12Region",
      daily: "baseDailySelfUnliRegion",
    },
  },
  {
    id: "region",
    label: "Davao Region",
    group: "Region",
    supports: {
      hourly12: "hourlySelf12Region",
      daily: "baseDailySelfUnliRegion",
    },
  },
  {
    id: "sarangani",
    label: "Sarangani",
    group: "Farther",
    supports: {
      hourly12: "hourlySelf12SaranganiSouthCot",
      daily: "baseDailySelfUnliSaranganiSouthCot",
    },
  },
  {
    id: "southCotabato",
    label: "South Cotabato",
    group: "Farther",
    supports: {
      hourly12: "hourlySelf12SaranganiSouthCot",
      daily: "baseDailySelfUnliSaranganiSouthCot",
    },
  },
  {
    id: "bukidnon",
    label: "Bukidnon",
    group: "Farther",
    supports: {
      hourly12: "hourlySelf12Bukidnon",
      daily: "baseDailySelfUnliBukidnon",
    },
  },
  {
    id: "caraga",
    label: "Caraga",
    group: "Farther",
    supports: {
      hourly12: "hourlySelf12CaragaMisamisOrientalSultanKudarat",
      daily: "baseDailySelfUnliCaragaMisamisOrientalSultanKudarat",
    },
  },
  {
    id: "misamisOriental",
    label: "Misamis Oriental",
    group: "Farther",
    supports: {
      hourly12: "hourlySelf12CaragaMisamisOrientalSultanKudarat",
      daily: "baseDailySelfUnliCaragaMisamisOrientalSultanKudarat",
    },
  },
  {
    id: "sultanKudarat",
    label: "Sultan Kudarat",
    group: "Farther",
    supports: {
      hourly12: "hourlySelf12CaragaMisamisOrientalSultanKudarat",
      daily: "baseDailySelfUnliCaragaMisamisOrientalSultanKudarat",
    },
  },
  {
    id: "camiguin",
    label: "Camiguin",
    group: "Farther",
    supports: {
      hourly12:
        "hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga",
      daily:
        "baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga",
    },
  },
  {
    id: "cotabatoCity",
    label: "Cotabato City",
    group: "Farther",
    supports: {
      hourly12:
        "hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga",
      daily:
        "baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga",
    },
  },
  {
    id: "lanao",
    label: "Lanao",
    group: "Farther",
    supports: {
      hourly12:
        "hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga",
      daily:
        "baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga",
    },
  },
  {
    id: "misamisOccidental",
    label: "Misamis Occidental",
    group: "Farther",
    supports: {
      hourly12:
        "hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga",
      daily:
        "baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga",
    },
  },
  {
    id: "zamboanga",
    label: "Zamboanga",
    group: "Farther",
    supports: {
      hourly12:
        "hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga",
      daily:
        "baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga",
    },
  },
  {
    id: "barmm",
    label: "BARMM",
    group: "Farther",
    supports: {
      hourly12: "hourlySelf12BARMM",
      daily: "baseDailySelfUnliBARMM",
    },
  },
];

const CARS: Car[] = [
  {
    id: "compact",
    type: "Compact",
    category: "Budgetmile",
    seats: 5,
    transmission: "Automatic",
    image: "/images/cars/small-car.png",
    hourlySelf8: { price: 950, kmAllowance: 100 },
    hourlySelf12: { price: 1470, kmAllowance: 150 },
    baseDailySelf: { price: 1580, kmAllowance: 150 },
    hourlySelf8City: { price: 1400, kmAllowance: Infinity },
    hourlySelf8PanaboTagumSamalDigosMarilogStoTomas: {
      price: 1900,
      kmAllowance: Infinity,
    },
    hourlySelf12City: { price: 1900, kmAllowance: Infinity },
    hourlySelf12Region: { price: 2200, kmAllowance: Infinity },
    hourlySelf12SaranganiSouthCot: { price: 2700, kmAllowance: Infinity },
    hourlySelf12Bukidnon: { price: 2900, kmAllowance: Infinity },
    hourlySelf12CaragaMisamisOrientalSultanKudarat: {
      price: 3400,
      kmAllowance: Infinity,
    },
    hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 3900,
      kmAllowance: Infinity,
    },
    hourlySelf12BARMM: { price: 4400, kmAllowance: Infinity },
    baseDailySelfUnliCity: { price: 2000, kmAllowance: Infinity },
    baseDailySelfUnliRegion: { price: 2300, kmAllowance: Infinity },
    baseDailySelfUnliSaranganiSouthCot: { price: 2800, kmAllowance: Infinity },
    baseDailySelfUnliBukidnon: { price: 3000, kmAllowance: Infinity },
    baseDailySelfUnliCaragaMisamisOrientalSultanKudarat: {
      price: 3500,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 4000,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliBARMM: { price: 4500, kmAllowance: Infinity },
    //hourlyChauffeur8: 899,
    //hourlyChauffeur10: 1299,
    //hourlyChauffeur12: 1399,
    //baseDailyChauffeur: 1499,
    monthlyCitySelf: 30000,
    monthlyRegionSelf: 40000,
    monthlyMindanaoSelf: 55000,
    //monthlyCityChauffeur: 1000,
    //monthlyRegionChauffeur: 1300,
    //monthlyMindanaoChauffeur: 1800,
    carwashFee: 200,
    collisionDamageWaiver: 350,
    features: ["1-2 Luggage", "4 Doors", "Fuel Efficient", "AC", "Bluetooth"],
  },
  {
    id: "sedan-budget",
    type: "Sedan",
    category: "Budgetmile",
    seats: 5,
    transmission: "Automatic",
    image: "/images/cars/sedan.png",
    hourlySelf8: { price: 1050, kmAllowance: 100 },
    hourlySelf12: { price: 1680, kmAllowance: 150 },
    baseDailySelf: { price: 1790, kmAllowance: 150 },
    hourlySelf8City: { price: 1600, kmAllowance: Infinity },
    hourlySelf8PanaboTagumSamalDigosMarilogStoTomas: {
      price: 2100,
      kmAllowance: Infinity,
    },
    hourlySelf12City: { price: 2100, kmAllowance: Infinity },
    hourlySelf12Region: { price: 2700, kmAllowance: Infinity },
    hourlySelf12SaranganiSouthCot: { price: 2900, kmAllowance: Infinity },
    hourlySelf12Bukidnon: { price: 3400, kmAllowance: Infinity },
    hourlySelf12CaragaMisamisOrientalSultanKudarat: {
      price: 3900,
      kmAllowance: Infinity,
    },
    hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 4400,
      kmAllowance: Infinity,
    },
    hourlySelf12BARMM: { price: 4900, kmAllowance: Infinity },
    baseDailySelfUnliCity: { price: 2200, kmAllowance: Infinity },
    baseDailySelfUnliRegion: { price: 2800, kmAllowance: Infinity },
    baseDailySelfUnliSaranganiSouthCot: { price: 3000, kmAllowance: Infinity },
    baseDailySelfUnliBukidnon: { price: 3500, kmAllowance: Infinity },
    baseDailySelfUnliCaragaMisamisOrientalSultanKudarat: {
      price: 4000,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 4500,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliBARMM: { price: 5000, kmAllowance: Infinity },
    //hourlyChauffeur8: 999,
    //hourlyChauffeur10: 1499,
    //hourlyChauffeur12: 1599,
    //baseDailyChauffeur: 1699,
    monthlyCitySelf: 35000,
    monthlyRegionSelf: 45000,
    monthlyMindanaoSelf: 60000,
    //monthlyCityChauffeur: 1200,
    //monthlyRegionChauffeur: 1500,
    //monthlyMindanaoChauffeur: 2000,
    carwashFee: 200,
    collisionDamageWaiver: 350,
    features: ["Spacious", "Family Friendly", "AC"],
  },
  {
    id: "sedan-primo",
    type: "Sedan",
    category: "Primo",
    seats: 5,
    transmission: "Automatic",
    image: "/images/cars/sedan.png",
    hourlySelf8: { price: 1100, kmAllowance: 100 },
    hourlySelf12: { price: 1700, kmAllowance: 150 },
    baseDailySelf: { price: 1890, kmAllowance: 150 },
    hourlySelf8City: { price: 1700, kmAllowance: Infinity },
    hourlySelf8PanaboTagumSamalDigosMarilogStoTomas: {
      price: 2200,
      kmAllowance: Infinity,
    },
    hourlySelf12City: { price: 2200, kmAllowance: Infinity },
    hourlySelf12Region: { price: 2800, kmAllowance: Infinity },
    hourlySelf12SaranganiSouthCot: { price: 3000, kmAllowance: Infinity },
    hourlySelf12Bukidnon: { price: 3500, kmAllowance: Infinity },
    hourlySelf12CaragaMisamisOrientalSultanKudarat: {
      price: 4000,
      kmAllowance: Infinity,
    },
    hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 4500,
      kmAllowance: Infinity,
    },
    hourlySelf12BARMM: { price: 5000, kmAllowance: Infinity },
    baseDailySelfUnliCity: { price: 2300, kmAllowance: Infinity },
    baseDailySelfUnliRegion: { price: 2900, kmAllowance: Infinity },
    baseDailySelfUnliSaranganiSouthCot: { price: 3100, kmAllowance: Infinity },
    baseDailySelfUnliBukidnon: { price: 3600, kmAllowance: Infinity },
    baseDailySelfUnliCaragaMisamisOrientalSultanKudarat: {
      price: 4100,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 4600,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliBARMM: { price: 5100, kmAllowance: Infinity },
    //hourlyChauffeur8: 1099,
    //hourlyChauffeur10: 1599,
    //hourlyChauffeur12: 1699,
    //baseDailyChauffeur: 1799,
    monthlyCitySelf: 38000,
    monthlyRegionSelf: 48000,
    monthlyMindanaoSelf: 63000,
    //monthlyCityChauffeur: 1200,
    //monthlyRegionChauffeur: 1500,
    //monthlyMindanaoChauffeur: 2000,
    carwashFee: 200,
    collisionDamageWaiver: 350,
    features: ["Premium Interior", "Comfort", "AC"],
  },
  {
    id: "sedan-premium",
    type: "Sedan",
    category: "Premium",
    seats: 5,
    transmission: "Automatic",
    image: "/images/cars/sedan.png",
    hourlySelf8: { price: 1200, kmAllowance: 100 },
    hourlySelf12: { price: 1800, kmAllowance: 150 },
    baseDailySelf: { price: 2000, kmAllowance: 150 },
    hourlySelf8City: { price: 0, kmAllowance: Infinity },
    hourlySelf8PanaboTagumSamalDigosMarilogStoTomas: {
      price: 0,
      kmAllowance: Infinity,
    },
    hourlySelf12City: { price: 0, kmAllowance: Infinity },
    hourlySelf12Region: { price: 0, kmAllowance: Infinity },
    hourlySelf12SaranganiSouthCot: { price: 0, kmAllowance: Infinity },
    hourlySelf12Bukidnon: { price: 0, kmAllowance: Infinity },
    hourlySelf12CaragaMisamisOrientalSultanKudarat: {
      price: 0,
      kmAllowance: Infinity,
    },
    hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 0,
      kmAllowance: Infinity,
    },
    hourlySelf12BARMM: { price: 0, kmAllowance: Infinity },
    baseDailySelfUnliCity: { price: 0, kmAllowance: Infinity },
    baseDailySelfUnliRegion: { price: 0, kmAllowance: Infinity },
    baseDailySelfUnliSaranganiSouthCot: { price: 0, kmAllowance: Infinity },
    baseDailySelfUnliBukidnon: { price: 0, kmAllowance: Infinity },
    baseDailySelfUnliCaragaMisamisOrientalSultanKudarat: {
      price: 0,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 0,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliBARMM: { price: 0, kmAllowance: Infinity },
    //hourlyChauffeur8: 1199,
    //hourlyChauffeur10: 1699,
    //hourlyChauffeur12: 1799,
    //baseDailyChauffeur: 1899,
    monthlyCitySelf: 38000,
    monthlyRegionSelf: 48000,
    monthlyMindanaoSelf: 63000,
    //monthlyCityChauffeur: 1200,
    //monthlyRegionChauffeur: 1500,
    //monthlyMindanaoChauffeur: 2000,
    carwashFee: 200,
    collisionDamageWaiver: 350,
    features: ["Premium Interior", "Comfort", "AC"],
  },
  {
    id: "wagon-budget",
    type: "Wagon",
    category: "Budgetmile",
    seats: 7,
    transmission: "Automatic",
    image: "/images/cars/wagon.png",
    hourlySelf8: { price: 1580, kmAllowance: 100 },
    hourlySelf12: { price: 2210, kmAllowance: 150 },
    baseDailySelf: { price: 2310, kmAllowance: 150 },
    hourlySelf8City: { price: 2100, kmAllowance: Infinity },
    hourlySelf8PanaboTagumSamalDigosMarilogStoTomas: {
      price: 2600,
      kmAllowance: Infinity,
    },
    hourlySelf12City: { price: 2600, kmAllowance: Infinity },
    hourlySelf12Region: { price: 3100, kmAllowance: Infinity },
    hourlySelf12SaranganiSouthCot: { price: 3800, kmAllowance: Infinity },
    hourlySelf12Bukidnon: { price: 3800, kmAllowance: Infinity },
    hourlySelf12CaragaMisamisOrientalSultanKudarat: {
      price: 4300,
      kmAllowance: Infinity,
    },
    hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 4800,
      kmAllowance: Infinity,
    },
    hourlySelf12BARMM: { price: 5300, kmAllowance: Infinity },
    baseDailySelfUnliCity: { price: 2700, kmAllowance: Infinity },
    baseDailySelfUnliRegion: { price: 3200, kmAllowance: Infinity },
    baseDailySelfUnliSaranganiSouthCot: { price: 3900, kmAllowance: Infinity },
    baseDailySelfUnliBukidnon: { price: 3900, kmAllowance: Infinity },
    baseDailySelfUnliCaragaMisamisOrientalSultanKudarat: {
      price: 4400,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 4900,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliBARMM: { price: 5400, kmAllowance: Infinity },
    //hourlyChauffeur8: 1500,
    //hourlyChauffeur10: 1999,
    //hourlyChauffeur12: 2099,
    //baseDailyChauffeur: 2199,
    monthlyCitySelf: 42000,
    monthlyRegionSelf: 52000,
    monthlyMindanaoSelf: 67000,
    //monthlyCityChauffeur: 2200,
    //monthlyRegionChauffeur: 1850,
    //monthlyMindanaoChauffeur: 2350,
    carwashFee: 250,
    collisionDamageWaiver: 500,
    features: ["Premium", "4x4 Ready", "Leather Seats"],
  },
  {
    id: "mpv-budget",
    type: "MPV",
    category: "Budgetmile",
    seats: 8,
    transmission: "Automatic",
    image: "/images/cars/mpv.png",
    hourlySelf8: { price: 1580, kmAllowance: 100 },
    hourlySelf12: { price: 2310, kmAllowance: 150 },
    baseDailySelf: { price: 2420, kmAllowance: 150 },
    hourlySelf8City: { price: 2200, kmAllowance: Infinity },
    hourlySelf8PanaboTagumSamalDigosMarilogStoTomas: {
      price: 2700,
      kmAllowance: Infinity,
    },
    hourlySelf12City: { price: 2700, kmAllowance: Infinity },
    hourlySelf12Region: { price: 3200, kmAllowance: Infinity },
    hourlySelf12SaranganiSouthCot: { price: 3900, kmAllowance: Infinity },
    hourlySelf12Bukidnon: { price: 3900, kmAllowance: Infinity },
    hourlySelf12CaragaMisamisOrientalSultanKudarat: {
      price: 4400,
      kmAllowance: Infinity,
    },
    hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 4800,
      kmAllowance: Infinity,
    },
    hourlySelf12BARMM: { price: 5400, kmAllowance: Infinity },
    baseDailySelfUnliCity: { price: 2800, kmAllowance: Infinity },
    baseDailySelfUnliRegion: { price: 3300, kmAllowance: Infinity },
    baseDailySelfUnliSaranganiSouthCot: { price: 4000, kmAllowance: Infinity },
    baseDailySelfUnliBukidnon: { price: 4000, kmAllowance: Infinity },
    baseDailySelfUnliCaragaMisamisOrientalSultanKudarat: {
      price: 4500,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 5000,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliBARMM: { price: 5500, kmAllowance: Infinity },
    //hourlyChauffeur8: 1500,
    //hourlyChauffeur10: 2199,
    //hourlyChauffeur12: 2199,
    //baseDailyChauffeur: 2299,
    monthlyCitySelf: 50000,
    monthlyRegionSelf: 60000,
    monthlyMindanaoSelf: 75000,
    //monthlyCityChauffeur: 1500,
    //monthlyRegionChauffeur: 1850,
    //monthlyMindanaoChauffeur: 2350,
    carwashFee: 250,
    collisionDamageWaiver: 500,
    features: ["Group Travel", "Luggage Space", "AC"],
  },
  {
    id: "mpv",
    type: "MPV",
    category: "Primo",
    seats: 8,
    transmission: "Automatic",
    image: "/images/cars/mpv.png",
    hourlySelf8: { price: 1790, kmAllowance: 100 },
    hourlySelf12: { price: 2520, kmAllowance: 150 },
    baseDailySelf: { price: 2630, kmAllowance: 150 },
    hourlySelf8City: { price: 2400, kmAllowance: Infinity },
    hourlySelf8PanaboTagumSamalDigosMarilogStoTomas: {
      price: 2900,
      kmAllowance: Infinity,
    },
    hourlySelf12City: { price: 2900, kmAllowance: Infinity },
    hourlySelf12Region: { price: 3400, kmAllowance: Infinity },
    hourlySelf12SaranganiSouthCot: { price: 4100, kmAllowance: Infinity },
    hourlySelf12Bukidnon: { price: 4100, kmAllowance: Infinity },
    hourlySelf12CaragaMisamisOrientalSultanKudarat: {
      price: 4600,
      kmAllowance: Infinity,
    },
    hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 5000,
      kmAllowance: Infinity,
    },
    hourlySelf12BARMM: { price: 5600, kmAllowance: Infinity },
    baseDailySelfUnliCity: { price: 3000, kmAllowance: Infinity },
    baseDailySelfUnliRegion: { price: 3500, kmAllowance: Infinity },
    baseDailySelfUnliSaranganiSouthCot: { price: 4200, kmAllowance: Infinity },
    baseDailySelfUnliBukidnon: { price: 4200, kmAllowance: Infinity },
    baseDailySelfUnliCaragaMisamisOrientalSultanKudarat: {
      price: 4700,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 5200,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliBARMM: { price: 5700, kmAllowance: Infinity },
    //hourlyChauffeur8: 1700,
    //hourlyChauffeur10: 2399,
    //hourlyChauffeur12: 2399,
    //baseDailyChauffeur: 2499,
    monthlyCitySelf: 50000,
    monthlyRegionSelf: 60000,
    monthlyMindanaoSelf: 75000,
    //monthlyCityChauffeur: 1500,
    //monthlyRegionChauffeur: 1850,
    //monthlyMindanaoChauffeur: 2350,
    carwashFee: 250,
    collisionDamageWaiver: 500,
    features: ["Group Travel", "Luggage Space", "AC"],
  },
  {
    id: "suv-budget",
    type: "SUV",
    category: "Budgetmile",
    seats: 7,
    transmission: "Automatic",
    image: "/images/cars/suv.png",
    hourlySelf8: { price: 2630, kmAllowance: 100 },
    hourlySelf12: { price: 3370, kmAllowance: 150 },
    baseDailySelf: { price: 3470, kmAllowance: 150 },
    hourlySelf8City: { price: 3200, kmAllowance: Infinity },
    hourlySelf8PanaboTagumSamalDigosMarilogStoTomas: {
      price: 3700,
      kmAllowance: Infinity,
    },
    hourlySelf12City: { price: 3700, kmAllowance: Infinity },
    hourlySelf12Region: { price: 4200, kmAllowance: Infinity },
    hourlySelf12SaranganiSouthCot: { price: 4400, kmAllowance: Infinity },
    hourlySelf12Bukidnon: { price: 4900, kmAllowance: Infinity },
    hourlySelf12CaragaMisamisOrientalSultanKudarat: {
      price: 5400,
      kmAllowance: Infinity,
    },
    hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 5900,
      kmAllowance: Infinity,
    },
    hourlySelf12BARMM: { price: 6400, kmAllowance: Infinity },
    baseDailySelfUnliCity: { price: 3800, kmAllowance: Infinity },
    baseDailySelfUnliRegion: { price: 4300, kmAllowance: Infinity },
    baseDailySelfUnliSaranganiSouthCot: { price: 4500, kmAllowance: Infinity },
    baseDailySelfUnliBukidnon: { price: 5000, kmAllowance: Infinity },
    baseDailySelfUnliCaragaMisamisOrientalSultanKudarat: {
      price: 5500,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 6000,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliBARMM: { price: 6500, kmAllowance: Infinity },
    //hourlyChauffeur8: 2500,
    //hourlyChauffeur10: 3199,
    //hourlyChauffeur12: 3199,
    //baseDailyChauffeur: 3299,
    monthlyCitySelf: 60000,
    monthlyRegionSelf: 65000,
    monthlyMindanaoSelf: 85000,
    //monthlyCityChauffeur: 2000,
    //monthlyRegionChauffeur: 2350,
    //monthlyMindanaoChauffeur: 2850,
    carwashFee: 300,
    collisionDamageWaiver: 500,
    features: ["Powerful", "Comfort", "Safety"],
  },
  {
    id: "suv-primo",
    type: "SUV",
    category: "Primo",
    seats: 7,
    transmission: "Automatic",
    image: "/images/cars/suv.png",
    hourlySelf8: { price: 2840, kmAllowance: 100 },
    hourlySelf12: { price: 3580, kmAllowance: 150 },
    baseDailySelf: { price: 3680, kmAllowance: 150 },
    hourlySelf8City: { price: 0, kmAllowance: Infinity },
    hourlySelf8PanaboTagumSamalDigosMarilogStoTomas: {
      price: 0,
      kmAllowance: Infinity,
    },
    hourlySelf12City: { price: 0, kmAllowance: Infinity },
    hourlySelf12Region: { price: 0, kmAllowance: Infinity },
    hourlySelf12SaranganiSouthCot: { price: 0, kmAllowance: Infinity },
    hourlySelf12Bukidnon: { price: 0, kmAllowance: Infinity },
    hourlySelf12CaragaMisamisOrientalSultanKudarat: {
      price: 0,
      kmAllowance: Infinity,
    },
    hourlySelf12CamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 0,
      kmAllowance: Infinity,
    },
    hourlySelf12BARMM: { price: 0, kmAllowance: Infinity },
    baseDailySelfUnliCity: { price: 4000, kmAllowance: Infinity },
    baseDailySelfUnliRegion: { price: 4500, kmAllowance: Infinity },
    baseDailySelfUnliSaranganiSouthCot: { price: 4700, kmAllowance: Infinity },
    baseDailySelfUnliBukidnon: { price: 5200, kmAllowance: Infinity },
    baseDailySelfUnliCaragaMisamisOrientalSultanKudarat: {
      price: 5700,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliCamiguinCotabatoCityLanaoMisamisOccidentalZamboanga: {
      price: 6200,
      kmAllowance: Infinity,
    },
    baseDailySelfUnliBARMM: { price: 6700, kmAllowance: Infinity },
    //hourlyChauffeur8: 2700,
    //hourlyChauffeur10: 3199,
    //hourlyChauffeur12: 3399,
    //baseDailyChauffeur: 3499,
    monthlyCitySelf: 60000,
    monthlyRegionSelf: 65000,
    monthlyMindanaoSelf: 85000,
    //monthlyCityChauffeur: 2000,
    //monthlyRegionChauffeur: 2350,
    //monthlyMindanaoChauffeur: 2850,
    carwashFee: 300,
    collisionDamageWaiver: 500,
    features: ["Powerful", "Comfort", "Safety"],
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
    extraHours: 0,
    monthlyLocation: null,
    referralCode: "",
    mileageType: null,
    destination: null,
  });

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const update = <K extends keyof BookingState>(
    key: K,
    value: BookingState[K],
  ) => {
    setBooking((prev) => ({ ...prev, [key]: value }));
  };

  /** For hourly: set return date/time from pickup + hours + extraHours */
  const syncHourlyReturn = (
    pickupDate: string,
    pickupTime: string,
    hours: HoursOption,
    extraHours: number,
  ) => {
    const total = (hours || 0) + (extraHours || 0);
    const result = computeReturnFromHours(pickupDate, pickupTime, total);
    if (result) {
      setBooking((prev) => ({
        ...prev,
        returnDate: result.returnDate,
        returnTime: result.returnTime,
      }));
    }
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
        if (booking.packageType === "monthly") {
          if (!booking.pickupDate || !booking.monthlyLocation) return false;
          // Return date must be at least 30 days after start
          if (!booking.returnDate) return false;
          const minReturn = addDaysToDate(booking.pickupDate, 30);
          if (booking.returnDate < minReturn) return false;
          return true;
        }
        if (!isPickupValid(booking.pickupDate, booking.pickupTime)) {
          return false;
        }
        if (booking.packageType === "daily") {
          // Return time is auto-synced to pickup time
          if (!booking.returnDate || !booking.returnTime) return false;
          const pickup = new Date(
            `${booking.pickupDate}T${booking.pickupTime}`,
          );
          const ret = new Date(`${booking.returnDate}T${booking.returnTime}`);
          if (!(ret > pickup)) return false;
        } else if (booking.packageType === "hourly") {
          if (!booking.hours) return false;
        }
        // Self-drive hourly/daily require mileage choice + destination when Unli
        if (
          booking.driveType === "self" &&
          (booking.packageType === "hourly" || booking.packageType === "daily")
        ) {
          if (!booking.mileageType) return false;
          if (booking.mileageType === "unli" && !booking.destination)
            return false;
        }
        return true;
      case 4:
        return !!selectedCar;
      default:
        return false;
    }
  };

  const getHourOptions = (): HoursOption[] => {
    if (booking.driveType === "chauffeur") return [8, 10, 12];
    return [8, 12];
  };

  /** Destinations that have a valid rate key for the current package/hours */
  const getAvailableDestinations = () => {
    if (booking.packageType === "hourly" && booking.hours === 8) {
      return DESTINATION_OPTIONS.filter((d) => !!d.supports.hourly8);
    }
    if (booking.packageType === "hourly" && booking.hours === 12) {
      return DESTINATION_OPTIONS.filter((d) => !!d.supports.hourly12);
    }
    if (booking.packageType === "daily") {
      return DESTINATION_OPTIONS.filter((d) => !!d.supports.daily);
    }
    return [];
  };

  const getUnliRateKey = (): keyof Car | null => {
    if (!booking.destination) return null;
    const dest = DESTINATION_OPTIONS.find((d) => d.id === booking.destination);
    if (!dest) return null;
    if (booking.packageType === "hourly" && booking.hours === 8) {
      return dest.supports.hourly8 ?? null;
    }
    if (booking.packageType === "hourly" && booking.hours === 12) {
      return dest.supports.hourly12 ?? null;
    }
    if (booking.packageType === "daily") {
      return dest.supports.daily ?? null;
    }
    return null;
  };

  /** Price for a single self-drive hourly package block (limited or unli) */
  const getSelfHourlyBlockPrice = (car: Car, hrs: 8 | 12): number => {
    if (booking.mileageType === "unli") {
      if (!booking.destination) return 0;
      const dest = DESTINATION_OPTIONS.find(
        (d) => d.id === booking.destination,
      );
      if (!dest) return 0;
      const key = hrs === 8 ? dest.supports.hourly8 : dest.supports.hourly12;
      if (!key) return 0;
      const opt = car[key] as PackageOption;
      return opt?.price ?? 0;
    }
    if (hrs === 8) return car.hourlySelf8.price;
    if (hrs === 12) return car.hourlySelf12.price;
    return 0;
  };

  const calculatePrice = (car: Car): number => {
    if (booking.packageType === "hourly" && booking.hours) {
      if (booking.driveType === "self") {
        // Base package
        let total = getSelfHourlyBlockPrice(car, booking.hours as 8 | 12);
        // Additional full package (same rates): 8h or 12h only
        if (booking.extraHours === 8 || booking.extraHours === 12) {
          total += getSelfHourlyBlockPrice(car, booking.extraHours as 8 | 12);
        }
        return total;
      }
      // Chauffeur: no locked price — sales confirms on call
      return 0;
    }

    if (booking.packageType === "daily") {
      const pickup = new Date(`${booking.pickupDate}T${booking.pickupTime}`);
      const ret = new Date(`${booking.returnDate}T${booking.returnTime}`);
      const ms = Math.max(ret.getTime() - pickup.getTime(), 0);
      const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));

      if (booking.driveType === "self") {
        if (booking.mileageType === "unli") {
          const key = getUnliRateKey();
          if (!key) return 0;
          const opt = car[key] as PackageOption;
          return (opt?.price ?? 0) * days;
        }
        return car.baseDailySelf.price * days;
      }
      // Chauffeur: no locked price
      return 0;
    }

    if (booking.packageType === "monthly" && booking.monthlyLocation) {
      if (booking.driveType === "self") {
        if (booking.monthlyLocation === "city") return car.monthlyCitySelf;
        if (booking.monthlyLocation === "region") return car.monthlyRegionSelf;
        return car.monthlyMindanaoSelf;
      }
      // Chauffeur: no locked price
      return 0;
    }

    return 0;
  };

  /** Returns km allowance label for display on vehicle cards (self-drive only) */
  const getKmLabel = (car: Car): string | null => {
    if (booking.driveType !== "self") return null;
    if (booking.packageType === "hourly" && booking.hours) {
      if (booking.mileageType === "unli") return "Unlimited km";
      if (booking.hours === 8) return `${car.hourlySelf8.kmAllowance} km incl.`;
      if (booking.hours === 12)
        return `${car.hourlySelf12.kmAllowance} km incl.`;
    }
    if (booking.packageType === "daily") {
      if (booking.mileageType === "unli") return "Unlimited km";
      return `${car.baseDailySelf.kmAllowance} km incl.`;
    }
    return null;
  };

  const formatPHP = (n: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(n);

  const progress = ((step + 1) / STEPS.length) * 100;

  const currentCar = CARS.find((c) => c.id === selectedCar);
  const totalPrice =
    currentCar && booking.driveType === "self"
      ? formatPHP(calculatePrice(currentCar))
      : booking.driveType === "chauffeur"
        ? "To be confirmed"
        : "";

  const handleFinalSubmit = (data: any) => {
    console.log("Final booking data:", {
      ...booking,
      car: currentCar,
      total: totalPrice,
      isReferred: booking.referralCode.trim().length > 0,
      additionalDetails: data,
    });

    alert(
      `Booking submitted successfully!\n\nVehicle: ${currentCar?.type}\nTotal: ${totalPrice}\n\nWe will contact you shortly to confirm.`,
    );
    setShowFinalizeModal(false);
  };

  // Filter cars: hide when calculated price is 0
  const availableCars = CARS.filter((c) => {
    if (booking.driveType === "chauffeur") {
      // Show all cars for chauffeur — rate confirmed by sales
      return true;
    }
    if (booking.packageType === "monthly") {
      return c.monthlyCitySelf > 0;
    }
    return calculatePrice(c) > 0;
  });

  const availableDestinations = getAvailableDestinations();

  // Group destinations for cleaner UI
  const destGroups = availableDestinations.reduce(
    (acc, d) => {
      if (!acc[d.group]) acc[d.group] = [];
      acc[d.group].push(d);
      return acc;
    },
    {} as Record<string, typeof DESTINATION_OPTIONS>,
  );

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

                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Hourly */}
                  <button
                    onClick={() => {
                      update("packageType", "hourly");
                      update("mileageType", null);
                      update("destination", null);
                      update("extraHours", 0);
                    }}
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
                      errands.
                    </p>
                    {booking.packageType === "hourly" && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#c9a227] flex items-center justify-center text-black text-sm font-bold">
                        ✓
                      </div>
                    )}
                  </button>

                  {/* Daily */}
                  <button
                    onClick={() => {
                      update("packageType", "daily");
                      update("mileageType", null);
                      update("destination", null);
                      update("extraHours", 0);
                    }}
                    className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                      booking.packageType === "daily"
                        ? "border-[#c9a227] bg-[#c9a227]/10 shadow-lg shadow-[#c9a227]/10"
                        : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#c9a227]/50"
                    }`}
                  >
                    <div className="text-3xl mb-3">📅</div>
                    <h3 className="text-xl font-semibold text-white">Daily</h3>
                    <p className="text-sm text-[#a3a3a3] mt-1">
                      Ideal for multi-day trips, weekends, or extended stays.
                    </p>
                    {booking.packageType === "daily" && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#c9a227] flex items-center justify-center text-black text-sm font-bold">
                        ✓
                      </div>
                    )}
                  </button>

                  {/* Monthly – with Save more badge */}
                  <button
                    onClick={() => {
                      update("packageType", "monthly");
                      update("mileageType", null);
                      update("destination", null);
                      update("extraHours", 0);
                    }}
                    className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                      booking.packageType === "monthly"
                        ? "border-[#c9a227] bg-[#c9a227]/10 shadow-lg shadow-[#c9a227]/10"
                        : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#c9a227]/50"
                    }`}
                  >
                    {/* Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-[#c9a227] to-[#e8c547] text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                        Save more
                      </span>
                    </div>

                    <div className="text-3xl mb-3 mt-1">📆</div>
                    <h3 className="text-xl font-semibold text-white">
                      Monthly
                    </h3>
                    <p className="text-sm text-[#a3a3a3] mt-1">
                      Best value for long-term needs. City, Region or Mindanao
                      rates.
                    </p>
                    {booking.packageType === "monthly" && (
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
                    onClick={() => {
                      update("driveType", "self");
                      update("mileageType", null);
                      update("destination", null);
                    }}
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
                    onClick={() => {
                      update("driveType", "chauffeur");
                      update("mileageType", null);
                      update("destination", null);
                    }}
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

                {/* Referral input */}
                {booking.packageType === "monthly" &&
                  booking.driveType === "chauffeur" && (
                    <div className="pt-2">
                      <label className="block text-sm font-medium text-[#c9a227] mb-1.5">
                        Referral Code{" "}
                        <span className="text-[#a3a3a3] font-normal">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={booking.referralCode}
                        onChange={(e) =>
                          update("referralCode", e.target.value.toUpperCase())
                        }
                        placeholder="Enter code if referred"
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition"
                      />
                      <p className="text-xs text-[#a3a3a3] mt-1.5">
                        Have a referral from a hotel, casa or partner? Enter the
                        code for special rates.
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* STEP 3: Schedule */}
            {step === 3 && (
              <div className="flex-1 space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">
                    {booking.packageType === "monthly"
                      ? "Monthly Start & Location"
                      : booking.packageType === "daily"
                        ? "Pickup & Return"
                        : "Pickup Details"}
                  </h2>
                  <p className="text-[#a3a3a3] mt-2">
                    {booking.packageType === "monthly"
                      ? "Select start date, coverage area, and return (min. 30 days)"
                      : booking.packageType === "daily"
                        ? "Select pickup date/time and return date (return time matches pickup)"
                        : "Choose your pickup date, time, and duration"}
                  </p>
                  {booking.packageType !== "monthly" && (
                    <p className="text-xs text-[#c9a227] mt-1">
                      Bookings must be made at least 2 hours in advance
                    </p>
                  )}
                </div>

                <div className="space-y-5 max-w-lg mx-auto">
                  {/* Pickup / Start Date */}
                  <div
                    className={
                      booking.packageType === "monthly"
                        ? ""
                        : "grid sm:grid-cols-2 gap-4"
                    }
                  >
                    <div>
                      <label className="block text-sm font-medium text-[#c9a227] mb-1.5">
                        {booking.packageType === "monthly"
                          ? "Start Date"
                          : "Pickup Date"}
                      </label>
                      <input
                        type="date"
                        value={booking.pickupDate}
                        onChange={(e) => {
                          const date = e.target.value;
                          update("pickupDate", date);
                          if (
                            booking.packageType !== "monthly" &&
                            booking.pickupTime &&
                            !isPickupValid(date, booking.pickupTime)
                          ) {
                            update("pickupTime", "");
                            if (booking.packageType === "daily") {
                              update("returnTime", "");
                            }
                          }
                          // Daily: keep return date valid (>= pickup)
                          if (booking.packageType === "daily" && date) {
                            if (
                              !booking.returnDate ||
                              booking.returnDate < date
                            ) {
                              update("returnDate", date);
                            }
                            if (booking.pickupTime) {
                              update("returnTime", booking.pickupTime);
                            }
                          }
                          // Monthly: default return = start + 30 days
                          if (booking.packageType === "monthly" && date) {
                            const minReturn = addDaysToDate(date, 30);
                            if (
                              !booking.returnDate ||
                              booking.returnDate < minReturn
                            ) {
                              update("returnDate", minReturn);
                            }
                          }
                          // Hourly: compute return from pickup + duration
                          if (booking.packageType === "hourly" && date) {
                            const time = booking.pickupTime;
                            if (time && booking.hours) {
                              // update pickupDate first via the update above, then sync
                              const total =
                                (booking.hours || 0) +
                                (booking.extraHours || 0);
                              const result = computeReturnFromHours(
                                date,
                                time,
                                total,
                              );
                              if (result) {
                                update("returnDate", result.returnDate);
                                update("returnTime", result.returnTime);
                              }
                            }
                          }
                        }}
                        min={
                          booking.packageType === "monthly"
                            ? undefined
                            : toDateInputValue(getMinPickupDateTime())
                        }
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition"
                      />
                    </div>

                    {booking.packageType !== "monthly" && (
                      <div>
                        <label className="block text-sm font-medium text-[#c9a227] mb-1.5">
                          Pickup Time
                        </label>
                        <input
                          type="time"
                          value={booking.pickupTime}
                          onChange={(e) => {
                            const time = e.target.value;
                            update("pickupTime", time);
                            // Daily: return time always mirrors pickup time
                            if (booking.packageType === "daily") {
                              update("returnTime", time);
                            }
                            // Hourly: compute return from pickup + duration
                            if (
                              booking.packageType === "hourly" &&
                              booking.pickupDate &&
                              booking.hours
                            ) {
                              const total =
                                (booking.hours || 0) +
                                (booking.extraHours || 0);
                              const result = computeReturnFromHours(
                                booking.pickupDate,
                                time,
                                total,
                              );
                              if (result) {
                                update("returnDate", result.returnDate);
                                update("returnTime", result.returnTime);
                              }
                            }
                          }}
                          min={
                            booking.pickupDate ===
                            toDateInputValue(getMinPickupDateTime())
                              ? toTimeInputValue(getMinPickupDateTime())
                              : undefined
                          }
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition"
                        />
                      </div>
                    )}
                  </div>

                  {/* Monthly location selector */}
                  {booking.packageType === "monthly" && (
                    <div>
                      <label className="block text-sm font-medium text-[#c9a227] mb-3">
                        Coverage Area
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(
                          [
                            { id: "city", label: "City Drive" },
                            { id: "region", label: "Davao Region" },
                            { id: "mindanao", label: "Mindanao" },
                          ] as const
                        ).map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => update("monthlyLocation", loc.id)}
                            className={`py-3 px-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                              booking.monthlyLocation === loc.id
                                ? "border-[#c9a227] bg-[#c9a227]/15 text-[#e8c547]"
                                : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#c9a227]/50"
                            }`}
                          >
                            {loc.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly return date (default +30 days, min start+30) */}
                  {booking.packageType === "monthly" && (
                    <div>
                      <label className="block text-sm font-medium text-[#c9a227] mb-1.5">
                        Return Date
                      </label>
                      <input
                        type="date"
                        value={booking.returnDate}
                        onChange={(e) => update("returnDate", e.target.value)}
                        min={
                          booking.pickupDate
                            ? addDaysToDate(booking.pickupDate, 30)
                            : undefined
                        }
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition"
                      />
                      <p className="text-xs text-[#a3a3a3] mt-1.5">
                        Defaults to 30 days from start. You may choose a later
                        date (minimum 30 days).
                      </p>
                      {booking.pickupDate &&
                        booking.returnDate &&
                        booking.returnDate <
                          addDaysToDate(booking.pickupDate, 30) && (
                          <p className="text-sm text-red-400 mt-1">
                            Return must be at least 30 days after start date.
                          </p>
                        )}
                    </div>
                  )}

                  {/* Daily return: date editable, time auto = pickup time */}
                  {booking.packageType === "daily" && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#c9a227] mb-1.5">
                          Return Date
                        </label>
                        <input
                          type="date"
                          value={booking.returnDate}
                          onChange={(e) => {
                            update("returnDate", e.target.value);
                            // Keep return time locked to pickup time
                            if (booking.pickupTime) {
                              update("returnTime", booking.pickupTime);
                            }
                          }}
                          min={
                            booking.pickupDate ||
                            toDateInputValue(getMinPickupDateTime())
                          }
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#c9a227] mb-1.5">
                          Return Time
                          <span className="text-[#a3a3a3] font-normal ml-1">
                            (same as pickup)
                          </span>
                        </label>
                        <input
                          type="time"
                          value={booking.returnTime}
                          readOnly
                          disabled
                          className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#a3a3a3] cursor-not-allowed"
                        />
                        <p className="text-xs text-[#a3a3a3] mt-1.5">
                          Automatically matches your pickup time.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hourly duration */}
                  {booking.packageType === "hourly" && (
                    <div>
                      <label className="block text-sm font-medium text-[#c9a227] mb-3">
                        Duration
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {getHourOptions().map((h) => (
                          <button
                            key={h}
                            onClick={() => {
                              update("hours", h);
                              update("extraHours", 0);
                              // Reset destination if switching hours (available set changes)
                              update("destination", null);
                              // Recalc return for hourly
                              if (
                                booking.packageType === "hourly" &&
                                booking.pickupDate &&
                                booking.pickupTime
                              ) {
                                const result = computeReturnFromHours(
                                  booking.pickupDate,
                                  booking.pickupTime,
                                  h,
                                );
                                if (result) {
                                  update("returnDate", result.returnDate);
                                  update("returnTime", result.returnTime);
                                }
                              }
                            }}
                            className={`py-3 rounded-lg border-2 font-semibold transition-all ${
                              booking.hours === h
                                ? "border-[#c9a227] bg-[#c9a227]/15 text-[#e8c547]"
                                : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#c9a227]/50"
                            }`}
                          >
                            {h} hours
                          </button>
                        ))}
                      </div>

                      {/* Chauffeur: Additional hours under Duration */}
                      {booking.driveType === "chauffeur" && booking.hours && (
                        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                          <label className="block text-sm font-medium text-[#c9a227] mb-2">
                            Additional Hours
                            <span className="text-[#a3a3a3] font-normal ml-1">
                              (optional)
                            </span>
                          </label>
                          <p className="text-xs text-[#a3a3a3] mb-3">
                            Need longer than {booking.hours}h? Add another full
                            block — rate confirmed by our team on call.
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                update("extraHours", 0);
                                if (
                                  booking.packageType === "hourly" &&
                                  booking.pickupDate &&
                                  booking.pickupTime &&
                                  booking.hours
                                ) {
                                  const result = computeReturnFromHours(
                                    booking.pickupDate,
                                    booking.pickupTime,
                                    booking.hours,
                                  );
                                  if (result) {
                                    update("returnDate", result.returnDate);
                                    update("returnTime", result.returnTime);
                                  }
                                }
                              }}
                              className={`py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                                booking.extraHours === 0
                                  ? "border-[#c9a227] bg-[#c9a227]/15 text-[#e8c547]"
                                  : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#c9a227]/50"
                              }`}
                            >
                              None
                            </button>
                            {([8, 10, 12] as const).map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => {
                                  update("extraHours", h);
                                  if (
                                    booking.packageType === "hourly" &&
                                    booking.pickupDate &&
                                    booking.pickupTime &&
                                    booking.hours
                                  ) {
                                    const result = computeReturnFromHours(
                                      booking.pickupDate,
                                      booking.pickupTime,
                                      (booking.hours || 0) + h,
                                    );
                                    if (result) {
                                      update("returnDate", result.returnDate);
                                      update("returnTime", result.returnTime);
                                    }
                                  }
                                }}
                                className={`py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                                  booking.extraHours === h
                                    ? "border-[#c9a227] bg-[#c9a227]/15 text-[#e8c547]"
                                    : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#c9a227]/50"
                                }`}
                              >
                                +{h} hours
                              </button>
                            ))}
                          </div>
                          {booking.extraHours > 0 && (
                            <p className="text-xs text-[#a3a3a3] mt-2">
                              Total duration:{" "}
                              <span className="text-[#e8c547]">
                                {booking.hours + booking.extraHours}h
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hourly: auto-calculated return date/time */}
                  {booking.packageType === "hourly" &&
                    booking.hours &&
                    booking.pickupDate &&
                    booking.pickupTime && (
                      <div className="pt-2 border-t border-[#2a2a2a]">
                        <label className="block text-sm font-medium text-[#c9a227] mb-2">
                          Return
                          <span className="text-[#a3a3a3] font-normal ml-1">
                            (auto-calculated)
                          </span>
                        </label>
                        <p className="text-xs text-[#a3a3a3] mb-3">
                          Based on pickup +{" "}
                          {(booking.hours || 0) + (booking.extraHours || 0)}h
                          duration
                          {booking.extraHours > 0
                            ? ` (${booking.hours}h + ${booking.extraHours}h extra)`
                            : ""}
                          .
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-[#666] mb-1">
                              Return Date
                            </label>
                            <input
                              type="date"
                              value={booking.returnDate}
                              readOnly
                              disabled
                              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#a3a3a3] cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[#666] mb-1">
                              Return Time
                            </label>
                            <input
                              type="time"
                              value={booking.returnTime}
                              readOnly
                              disabled
                              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#a3a3a3] cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Self-drive: Limited vs Unlimited Mileage */}
                  {booking.driveType === "self" &&
                    (booking.packageType === "hourly" ||
                      booking.packageType === "daily") && (
                      <div className="pt-2 border-t border-[#2a2a2a]">
                        <label className="block text-sm font-medium text-[#c9a227] mb-3">
                          Mileage Option
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              update("mileageType", "limited");
                              update("destination", null);
                            }}
                            className={`py-3 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                              booking.mileageType === "limited"
                                ? "border-[#c9a227] bg-[#c9a227]/15 text-[#e8c547]"
                                : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#c9a227]/50"
                            }`}
                          >
                            Limited km
                            <span className="block text-[10px] font-normal text-[#a3a3a3] mt-0.5">
                              Included allowance
                            </span>
                          </button>
                          <button
                            onClick={() => update("mileageType", "unli")}
                            className={`py-3 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                              booking.mileageType === "unli"
                                ? "border-[#c9a227] bg-[#c9a227]/15 text-[#e8c547]"
                                : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#c9a227]/50"
                            }`}
                          >
                            Unlimited km
                            <span className="block text-[10px] font-normal text-[#a3a3a3] mt-0.5">
                              Based on destination
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Self-drive: Additional hours (hourly only, after mileage) */}
                  {booking.driveType === "self" &&
                    booking.packageType === "hourly" &&
                    booking.hours && (
                      <div className="pt-2 border-t border-[#2a2a2a]">
                        <label className="block text-sm font-medium text-[#c9a227] mb-2">
                          Additional Hours
                          <span className="text-[#a3a3a3] font-normal ml-1">
                            (optional)
                          </span>
                        </label>
                        <p className="text-xs text-[#a3a3a3] mb-3">
                          Need longer than {booking.hours}h? Add another full
                          package at the same rates.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              update("extraHours", 0);
                              if (
                                booking.packageType === "hourly" &&
                                booking.pickupDate &&
                                booking.pickupTime &&
                                booking.hours
                              ) {
                                const result = computeReturnFromHours(
                                  booking.pickupDate,
                                  booking.pickupTime,
                                  booking.hours,
                                );
                                if (result) {
                                  update("returnDate", result.returnDate);
                                  update("returnTime", result.returnTime);
                                }
                              }
                            }}
                            className={`py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                              booking.extraHours === 0
                                ? "border-[#c9a227] bg-[#c9a227]/15 text-[#e8c547]"
                                : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#c9a227]/50"
                            }`}
                          >
                            None
                          </button>
                          {([8, 12] as const)
                            .filter((h) => {
                              // Limited: both always available
                              if (booking.mileageType !== "unli") return true;
                              // Unli: only if destination supports that hour block
                              if (!booking.destination) return true;
                              const dest = DESTINATION_OPTIONS.find(
                                (d) => d.id === booking.destination,
                              );
                              if (!dest) return true;
                              return h === 8
                                ? !!dest.supports.hourly8
                                : !!dest.supports.hourly12;
                            })
                            .map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => {
                                  update("extraHours", h);
                                  if (
                                    booking.packageType === "hourly" &&
                                    booking.pickupDate &&
                                    booking.pickupTime &&
                                    booking.hours
                                  ) {
                                    const result = computeReturnFromHours(
                                      booking.pickupDate,
                                      booking.pickupTime,
                                      (booking.hours || 0) + h,
                                    );
                                    if (result) {
                                      update("returnDate", result.returnDate);
                                      update("returnTime", result.returnTime);
                                    }
                                  }
                                }}
                                className={`py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                                  booking.extraHours === h
                                    ? "border-[#c9a227] bg-[#c9a227]/15 text-[#e8c547]"
                                    : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#c9a227]/50"
                                }`}
                              >
                                +{h} hours
                              </button>
                            ))}
                        </div>
                        {booking.extraHours > 0 && (
                          <p className="text-xs text-[#a3a3a3] mt-2">
                            Total duration:{" "}
                            <span className="text-[#e8c547]">
                              {booking.hours + booking.extraHours}h
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                  {/* Destination selector for Unli self-drive */}
                  {booking.driveType === "self" &&
                    booking.mileageType === "unli" &&
                    (booking.packageType === "hourly" ||
                      booking.packageType === "daily") && (
                      <div>
                        <label className="block text-sm font-medium text-[#c9a227] mb-3">
                          Destination Area
                        </label>
                        {availableDestinations.length === 0 ? (
                          <p className="text-sm text-[#a3a3a3] text-center py-4">
                            {booking.packageType === "hourly" && !booking.hours
                              ? "Select duration first to see available destinations."
                              : "No unlimited rates available for this selection."}
                          </p>
                        ) : (
                          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                            {Object.entries(destGroups).map(
                              ([group, dests]) => (
                                <div key={group}>
                                  <p className="text-[10px] uppercase tracking-wider text-[#555] mb-2">
                                    {group}
                                  </p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {dests.map((d) => (
                                      <button
                                        key={d.id}
                                        onClick={() => {
                                          update("destination", d.id);
                                          // Reset extra if new dest doesn't support it
                                          if (
                                            booking.extraHours === 8 &&
                                            !d.supports.hourly8
                                          ) {
                                            update("extraHours", 0);
                                          }
                                          if (
                                            booking.extraHours === 12 &&
                                            !d.supports.hourly12
                                          ) {
                                            update("extraHours", 0);
                                          }
                                        }}
                                        className={`py-2.5 px-2 rounded-lg border-2 font-medium text-xs sm:text-sm transition-all ${
                                          booking.destination === d.id
                                            ? "border-[#c9a227] bg-[#c9a227]/15 text-[#e8c547]"
                                            : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#c9a227]/50"
                                        }`}
                                      >
                                        {d.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  {/* Validation message */}
                  {booking.packageType !== "monthly" &&
                    booking.pickupDate &&
                    booking.pickupTime &&
                    !isPickupValid(booking.pickupDate, booking.pickupTime) && (
                      <p className="text-sm text-red-400 text-center">
                        Pickup must be at least 2 hours from now.
                      </p>
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
                        ? `${(booking.hours || 0) + (booking.extraHours || 0)}-hour`
                        : booking.packageType === "monthly"
                          ? "monthly"
                          : "daily"}
                    </span>{" "}
                    {booking.driveType === "self" ? "self-drive" : "chauffeur"}{" "}
                    package
                    {booking.packageType === "monthly" &&
                      booking.monthlyLocation && (
                        <>
                          {" "}
                          ·{" "}
                          <span className="text-[#c9a227]">
                            {booking.monthlyLocation === "city"
                              ? "City Drive"
                              : booking.monthlyLocation === "region"
                                ? "Davao Region"
                                : "Mindanao"}
                          </span>
                        </>
                      )}
                    {booking.mileageType === "unli" && booking.destination && (
                      <>
                        {" "}
                        ·{" "}
                        <span className="text-[#c9a227]">
                          Unli ·{" "}
                          {DESTINATION_OPTIONS.find(
                            (d) => d.id === booking.destination,
                          )?.label ?? booking.destination}
                        </span>
                      </>
                    )}
                    {booking.mileageType === "limited" && (
                      <>
                        {" "}
                        · <span className="text-[#c9a227]">Limited km</span>
                      </>
                    )}
                  </p>
                </div>

                {availableCars.length === 0 ? (
                  <p className="text-center text-[#a3a3a3] py-12">
                    No vehicles available for this selection. Try a different
                    package, destination, or mileage option.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                    {availableCars.map((car) => {
                      const price = calculatePrice(car);
                      const isSelected = selectedCar === car.id;
                      const kmLabel = getKmLabel(car);

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
                            <div className="text-4xl shrink-0">
                              <Image
                                src={car.image}
                                alt={car.id || "Car image"}
                                width={40}
                                height={40}
                                className="shrink-0 object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-white truncate">
                                    {car.type}
                                    {car.category && (
                                      <span className="text-xs text-[#a3a3a3] font-normal ml-1.5">
                                        · {car.category}
                                      </span>
                                    )}
                                  </h3>
                                  <p className="text-xs text-[#a3a3a3]">
                                    {car.seats} seats · {car.transmission}
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
                              <div className="mt-3 flex items-baseline justify-between gap-2">
                                <div className="text-lg font-bold text-[#e8c547]">
                                  {booking.driveType === "chauffeur" ? (
                                    <span className="text-sm font-medium text-amber-400">
                                      Rate confirmed on call
                                    </span>
                                  ) : (
                                    <>
                                      {formatPHP(price)}
                                      <span className="text-xs font-normal text-[#a3a3a3] ml-1">
                                        {booking.packageType === "hourly"
                                          ? `for ${
                                              (booking.hours || 0) +
                                              (booking.extraHours || 0)
                                            }h`
                                          : booking.packageType === "monthly"
                                            ? "/ month"
                                            : "total"}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {kmLabel && (
                                  <span className="text-[10px] text-[#a3a3a3] shrink-0">
                                    {kmLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
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
                  setShowFinalizeModal(true);
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

        {/* Summary strip */}
        {step > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-[#a3a3a3]">
            {booking.packageType && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                {booking.packageType === "hourly"
                  ? "Hourly"
                  : booking.packageType === "daily"
                    ? "Daily"
                    : "Monthly"}
              </span>
            )}
            {booking.driveType && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                {booking.driveType === "self" ? "Self-Drive" : "Chauffeur"}
              </span>
            )}
            {booking.packageType === "hourly" && booking.hours && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                {booking.hours}
                {booking.extraHours > 0 ? `+${booking.extraHours}` : ""} hours
              </span>
            )}
            {booking.mileageType === "limited" && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                Limited km
              </span>
            )}
            {booking.mileageType === "unli" && (
              <span className="px-3 py-1 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/40 text-[#e8c547]">
                Unlimited km
              </span>
            )}
            {booking.destination && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                {DESTINATION_OPTIONS.find((d) => d.id === booking.destination)
                  ?.label ?? booking.destination}
              </span>
            )}
            {booking.packageType === "monthly" && booking.monthlyLocation && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                {booking.monthlyLocation === "city"
                  ? "City Drive"
                  : booking.monthlyLocation === "region"
                    ? "Davao Region"
                    : "Mindanao"}
              </span>
            )}
            {booking.referralCode && (
              <span className="px-3 py-1 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/40 text-[#e8c547]">
                Referral: {booking.referralCode}
              </span>
            )}
            {booking.pickupDate && (
              <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                {booking.packageType === "monthly" ? "Start" : "Pickup"}:{" "}
                {booking.pickupDate}
                {booking.pickupTime ? ` ${booking.pickupTime}` : ""}
              </span>
            )}
            {booking.returnDate &&
              (booking.packageType === "daily" ||
                booking.packageType === "monthly" ||
                booking.packageType === "hourly") && (
                <span className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                  Return: {booking.returnDate}
                  {booking.returnTime ? ` ${booking.returnTime}` : ""}
                </span>
              )}
          </div>
        )}
      </main>

      {/* Footer */}
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

      <FinalizeBookingModal
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        bookingType={booking.driveType === "self" ? "self-drive" : "chauffeur"}
        carType={currentCar?.type || ""}
        totalPrice={totalPrice}
        onSubmit={handleFinalSubmit}
        pickupDate={booking.pickupDate || ""}
        pickupTime={booking.pickupTime || ""}
        returnDate={booking.returnDate || ""}
        returnTime={booking.returnTime || ""}
        packageType={booking.packageType}
        hours={booking.hours}
        monthlyLocation={booking.monthlyLocation}
        referralCode={booking.referralCode}
        mileageType={booking.mileageType}
        destinationLabel={
          booking.destination
            ? (DESTINATION_OPTIONS.find((d) => d.id === booking.destination)
                ?.label ?? booking.destination)
            : null
        }
        extraHours={booking.extraHours}
        carwashFee={currentCar?.carwashFee ?? 0}
        cdwFee={currentCar?.collisionDamageWaiver ?? 0}
      />
    </div>
  );
}
