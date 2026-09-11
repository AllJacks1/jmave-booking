import { useState } from "react";

type BookingType = "self-drive" | "chauffeur";

interface FinalizeBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingType: BookingType;
  carName: string;
  totalPrice: string;
  packageType?: "hourly" | "daily" | null;
  hours?: number | null;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  onSubmit: (data: any) => void;
}

const getLocationFee = (locationName: string): number => {
  if (!locationName) return 0;
  if (
    locationName.toLowerCase().includes("main office") ||
    locationName.toLowerCase().includes("bajada")
  ) {
    return 0;
  }

  for (const group of locationOptions) {
    const found = group.locations.find((loc) => loc.name === locationName);
    if (found) return found.fee;
  }
  return 0;
};

const locationOptions = [
  {
    category: "North Davao Area",
    locations: [
      { name: "Bunawan Proper, Davao City", fee: 720 },
      { name: "Mahayag, Davao City", fee: 660 },
      { name: "Barangay Tibungco, Davao City", fee: 605 },
      { name: "Malagamot, Davao City", fee: 560 },
      { name: "Ilang, Davao City", fee: 535 },
      { name: "Barangay Panacan, Davao City", fee: 445 },
      { name: "Barangay Sasa, Davao City", fee: 400 },
      { name: "Barangay Pampanga, Davao City", fee: 320 },
      { name: "Lanang, Davao City", fee: 285 },
    ],
  },
  {
    category: "Buhangin District",
    locations: [
      { name: "Indangan, Davao City", fee: 585 },
      { name: "Communal, Davao City", fee: 455 },
      { name: "Barangay Cabantian, Davao City", fee: 395 },
      { name: "Barangay Callawa, Davao City", fee: 705 },
      { name: "Barangay Mandug, Davao City", fee: 480 },
      { name: "Barangay Tigatto, Davao City", fee: 400 },
      { name: "Buhangin, Diversion Road, Davao City", fee: 320 },
      { name: "Davao International Airport", fee: 415 },
    ],
  },
  {
    category: "Poblacion District",
    locations: [
      { name: "Barangay R. Castillo, Davao City", fee: 310 },
      { name: "Agdao District", fee: 310 },
      { name: "Ramon Magsaysay Avenue (Uyanguren), Davao City", fee: 330 },
      { name: "Monteverde, Davao City", fee: 320 },
      { name: "JP Laurel Avenue, Davao City", fee: 310 },
      { name: "Bacaca Road, Davao City", fee: 320 },
      { name: "Gaisano Mall, Davao City", fee: 330 },
      { name: "Roxas Avenue, Davao City", fee: 355 },
      { name: "Acacia Street (C. Bangoy), Davao City", fee: 345 },
      { name: "San Pedro Street, Davao City", fee: 365 },
      { name: "Boulevard, Davao City", fee: 365 },
      { name: "Bankerohan, Davao City", fee: 365 },
    ],
  },
  {
    category: "South Davao",
    locations: [
      { name: "Barangay 76-A (Bucana), Davao City", fee: 400 },
      { name: "Sandawa, Davao City", fee: 400 },
      { name: "Marfori, Davao City", fee: 365 },
      { name: "McArthur Highway (AdDU), Davao City", fee: 410 },
      { name: "Ecoland, Davao City", fee: 455 },
      { name: "Barangay Ma-a, Davao City", fee: 470 },
      { name: "Barangay Langub, Davao City", fee: 385 },
      { name: "Matina, Davao City", fee: 435 },
      { name: "Barangay Matina Aplaya, Davao City", fee: 490 },
      { name: "Barangay Matina Pangi, Davao City", fee: 525 },
      { name: "Barangay Catalunan Grande, Davao City", fee: 620 },
      { name: "Bangkal, Davao City", fee: 620 },
      { name: "Crossing Ulas, Davao City", fee: 550 },
      { name: "Barangay Catalunan Pequeño, Davao City", fee: 630 },
      { name: "Mintal, Davao City", fee: 735 },
      { name: "Calinan, Davao City", fee: 1080 },
    ],
  },
  {
    category: "Toril District",
    locations: [
      { name: "Barangay Bago Aplaya", fee: 595 },
      { name: "Barangay Bago Gallera", fee: 655 },
      { name: "Barangay Dumoy", fee: 645 },
      { name: "Barangay Baliok", fee: 690 },
      { name: "Toril, Davao City", fee: 710 },
      { name: "Barangay Lizada, Davao City", fee: 770 },
    ],
  },
];

export default function FinalizeBookingModal({
  isOpen,
  onClose,
  bookingType,
  carName,
  totalPrice,
  packageType,
  hours,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  onSubmit,
}: FinalizeBookingModalProps) {
  const [step, setStep] = useState<"form" | "review">("form");

  const [formData, setFormData] = useState({
    // Self-drive
    birthday: "",
    phone: "",
    email: "",
    destination: "",
    pickupLocation: "",
    dropoffLocation: "",
    alternativeContact: "",
    driversLicenseNo: "",
    // Chauffeur
    companyName: "",
    pickupAddress: "",
    dropoffAddress: "",
    itinerary: "",
    passengers: "",
    luggages: "",
    specialRequests: "",
    driverStandby: "no",
    paymentMode: "",
  });

  const [files, setFiles] = useState({
    driversLicense: null as File | null,
    govId1: null as File | null,
    govId2: null as File | null,
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof files,
  ) => {
    if (e.target.files?.[0]) {
      setFiles((prev) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  // Form → Review
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("review");
  };

  // Final confirmation
  const handleFinalConfirm = () => {
    onSubmit({ ...formData, files });
  };

  const handleClose = () => {
    setStep("form"); // reset for next open
    onClose();
  };

  const isMainOffice = (location: string) =>
    location.toLowerCase().includes("main office") ||
    location.toLowerCase().includes("bajada");

  // Helper to show file name or “Not uploaded”
  const fileLabel = (file: File | null) =>
    file ? file.name : "— Not uploaded —";

  const pickupLoc =
    bookingType === "self-drive"
      ? formData.pickupLocation
      : formData.pickupAddress;

  const dropoffLoc =
    bookingType === "self-drive"
      ? formData.dropoffLocation
      : formData.dropoffAddress;

  const pickupFee = getLocationFee(pickupLoc);
  const dropoffFee = getLocationFee(dropoffLoc);

  // Parse the vehicle price (remove ₱ and commas)
  const vehiclePrice = Number(totalPrice.replace(/[^\d]/g, "")) || 0;

  const grandTotal = vehiclePrice + pickupFee + dropoffFee;

  const formatPHP = (n: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#333] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-[#e8c547]">
              {step === "form" ? "Finalize Your Booking" : "Review & Confirm"}
            </h2>
            <p className="text-sm text-[#a3a3a3] mt-0.5">
              {carName} · {totalPrice} ·{" "}
              {bookingType === "self-drive" ? "Self-Drive" : "With Driver"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#a3a3a3] hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* ──────────────────── FORM STEP ──────────────────── */}
        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
            {bookingType === "self-drive" ? (
              <>
                {/* Personal Info */}
                <section>
                  <h3 className="text-sm font-medium text-[#e8c547] mb-3 uppercase tracking-wider">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Birthday
                      </label>
                      <input
                        type="date"
                        name="birthday"
                        required
                        value={formData.birthday}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="+63 9XX XXX XXXX"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      />
                    </div>
                  </div>
                </section>

                {/* Trip Details */}
                <section>
                  <h3 className="text-sm font-medium text-[#e8c547] mb-3 uppercase tracking-wider">
                    Trip Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Destination
                      </label>
                      <input
                        type="text"
                        name="destination"
                        required
                        value={formData.destination}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#a3a3a3] mb-1">
                          Pick-up Location
                          {isMainOffice(formData.pickupLocation) && (
                            <span className="ml-2 text-xs text-green-400">
                              (Free)
                            </span>
                          )}
                        </label>
                        <select
                          name="pickupLocation"
                          required
                          value={formData.pickupLocation}
                          onChange={handleChange}
                          className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                        >
                          <option value="">Select pick-up location</option>
                          <option value="Main Office (Bajada)">
                            Main Office (Bajada) — Free
                          </option>

                          {locationOptions.map((group) => (
                            <optgroup
                              key={group.category}
                              label={group.category}
                            >
                              {group.locations.map((loc) => (
                                <option key={loc.name} value={loc.name}>
                                  {loc.name} — ₱{loc.fee}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <p className="text-xs text-[#666] mt-1">
                          Free if pick-up is at Main Office (Bajada)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm text-[#a3a3a3] mb-1">
                          Drop-off Location
                          {isMainOffice(formData.dropoffLocation) && (
                            <span className="ml-2 text-xs text-green-400">
                              (Free)
                            </span>
                          )}
                        </label>
                        <select
                          name="dropoffLocation"
                          required
                          value={formData.dropoffLocation}
                          onChange={handleChange}
                          className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                        >
                          <option value="">Select drop-off location</option>
                          <option value="Main Office (Bajada)">
                            Main Office (Bajada) — Free
                          </option>

                          {locationOptions.map((group) => (
                            <optgroup
                              key={group.category}
                              label={group.category}
                            >
                              {group.locations.map((loc) => (
                                <option key={loc.name} value={loc.name}>
                                  {loc.name} — ₱{loc.fee}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <p className="text-xs text-[#666] mt-1">
                          Free if drop-off is at Main Office (Bajada)
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Additional Info */}
                <section>
                  <h3 className="text-sm font-medium text-[#e8c547] mb-3 uppercase tracking-wider">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Alternative Contact Person
                      </label>
                      <input
                        type="text"
                        name="alternativeContact"
                        value={formData.alternativeContact}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Driver’s License No.
                      </label>
                      <input
                        type="text"
                        name="driversLicenseNo"
                        required
                        value={formData.driversLicenseNo}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      />
                    </div>
                  </div>
                </section>

                {/* Document Uploads */}
                <section>
                  <h3 className="text-sm font-medium text-[#e8c547] mb-3 uppercase tracking-wider">
                    Required Documents
                  </h3>
                  <p className="text-sm text-[#a3a3a3] mb-4">
                    Please upload advance copies of your 2 valid government IDs
                    and driver’s license for verification.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Driver’s License
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        required
                        onChange={(e) => handleFileChange(e, "driversLicense")}
                        className="w-full text-sm text-[#a3a3a3] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#c9a227] file:text-black file:font-medium hover:file:bg-[#e8c547]"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#a3a3a3] mb-1">
                          Government ID 1
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          required
                          onChange={(e) => handleFileChange(e, "govId1")}
                          className="w-full text-sm text-[#a3a3a3] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#c9a227] file:text-black file:font-medium hover:file:bg-[#e8c547]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#a3a3a3] mb-1">
                          Government ID 2
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          required
                          onChange={(e) => handleFileChange(e, "govId2")}
                          className="w-full text-sm text-[#a3a3a3] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#c9a227] file:text-black file:font-medium hover:file:bg-[#e8c547]"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              /* ========== CHAUFFEUR / WITH DRIVER ========== */
              <>
                <section>
                  <h3 className="text-sm font-medium text-[#e8c547] mb-3 uppercase tracking-wider">
                    Contact & Company
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="+63 9XX XXX XXXX"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-medium text-[#e8c547] mb-3 uppercase tracking-wider">
                    Trip Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Pick-up Address
                        {isMainOffice(formData.pickupAddress) && (
                          <span className="ml-2 text-xs text-green-400">
                            (Free)
                          </span>
                        )}
                      </label>
                      <select
                        name="pickupAddress"
                        required
                        value={formData.pickupAddress}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      >
                        <option value="">Select pick-up location</option>
                        <option value="Main Office (Bajada)">
                          Main Office (Bajada) — Free
                        </option>
                        {locationOptions.map((group) => (
                          <optgroup key={group.category} label={group.category}>
                            {group.locations.map((loc) => (
                              <option key={loc.name} value={loc.name}>
                                {loc.name} — ₱{loc.fee}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Drop-off Address
                        {isMainOffice(formData.dropoffAddress) && (
                          <span className="ml-2 text-xs text-green-400">
                            (Free)
                          </span>
                        )}
                      </label>
                      <select
                        name="dropoffAddress"
                        required
                        value={formData.dropoffAddress}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      >
                        <option value="">Select drop-off location</option>
                        <option value="Main Office (Bajada)">
                          Main Office (Bajada) — Free
                        </option>
                        {locationOptions.map((group) => (
                          <optgroup key={group.category} label={group.category}>
                            {group.locations.map((loc) => (
                              <option key={loc.name} value={loc.name}>
                                {loc.name} — ₱{loc.fee}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Full Itinerary / Route Plan
                      </label>
                      <textarea
                        name="itinerary"
                        required
                        rows={3}
                        value={formData.itinerary}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227] resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#a3a3a3] mb-1">
                          Number of Passengers
                        </label>
                        <input
                          type="number"
                          name="passengers"
                          min="1"
                          required
                          value={formData.passengers}
                          onChange={handleChange}
                          className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#a3a3a3] mb-1">
                          Number of Luggages
                        </label>
                        <input
                          type="number"
                          name="luggages"
                          min="0"
                          value={formData.luggages}
                          onChange={handleChange}
                          className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Special Requests
                      </label>
                      <textarea
                        name="specialRequests"
                        rows={2}
                        value={formData.specialRequests}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227] resize-none"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-medium text-[#e8c547] mb-3 uppercase tracking-wider">
                    Additional Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Do you need the driver to wait/standby?
                      </label>
                      <select
                        name="driverStandby"
                        value={formData.driverStandby}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#a3a3a3] mb-1">
                        Mode of Payment
                      </label>
                      <select
                        name="paymentMode"
                        required
                        value={formData.paymentMode}
                        onChange={handleChange}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#c9a227]"
                      >
                        <option value="">Select payment method</option>
                        <option value="cash">Cash</option>
                        <option value="gcash">GCash</option>
                        <option value="bank-transfer">Bank Transfer</option>
                        <option value="credit-card">Credit Card</option>
                      </select>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#333]">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 rounded-lg border border-[#444] text-[#a3a3a3] hover:bg-[#222] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 rounded-lg bg-[#c9a227] text-black font-semibold hover:bg-[#e8c547] transition"
              >
                Review Booking →
              </button>
            </div>
          </form>
        )}

        {/* ──────────────────── REVIEW STEP ──────────────────── */}
        {step === "review" && (
          <div className="p-6 space-y-6">
            {/* Booking Summary + Cost Breakdown */}
            <section className="bg-[#111] border border-[#333] rounded-xl p-5">
              <h3 className="text-sm font-medium text-[#e8c547] mb-4 uppercase tracking-wider">
                Booking Summary
              </h3>

              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
                <div>
                  <span className="text-[#666]">Vehicle</span>
                  <p className="text-white font-medium">{carName}</p>
                </div>
                <div>
                  <span className="text-[#666]">Type</span>
                  <p className="text-white">
                    {bookingType === "self-drive" ? "Self-Drive" : "Chauffeur"}
                  </p>
                </div>
                <div>
                  <span className="text-[#666]">Package</span>
                  <p className="text-white">
                    {packageType === "hourly" ? `${hours} hours` : "Daily"}
                  </p>
                </div>
                <div>
                  <span className="text-[#666]">Pickup</span>
                  <p className="text-white">
                    {pickupDate} {pickupTime}
                  </p>
                </div>
                {packageType === "daily" && (
                  <div>
                    <span className="text-[#666]">Return</span>
                    <p className="text-white">
                      {returnDate} {returnTime}
                    </p>
                  </div>
                )}
              </div>

              {/* ─── COST BREAKDOWN ─── */}
              <div className="border-t border-[#333] pt-4">
                <h4 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-3">
                  Cost Breakdown
                </h4>

                <div className="space-y-2 text-sm">
                  {/* Vehicle */}
                  <div className="flex justify-between">
                    <span className="text-[#a3a3a3]">
                      Vehicle Rental
                      {packageType === "hourly" && hours ? ` (${hours}h)` : ""}
                    </span>
                    <span className="text-white">
                      {formatPHP(vehiclePrice)}
                    </span>
                  </div>

                  {/* Pickup fee */}
                  <div className="flex justify-between">
                    <span className="text-[#a3a3a3]">
                      Pickup Fee
                      {pickupLoc && (
                        <span className="block text-xs text-[#666] mt-0.5">
                          {pickupLoc}
                        </span>
                      )}
                    </span>
                    <span
                      className={
                        pickupFee === 0 ? "text-green-400" : "text-white"
                      }
                    >
                      {pickupFee === 0 ? "Free" : formatPHP(pickupFee)}
                    </span>
                  </div>

                  {/* Drop-off fee */}
                  <div className="flex justify-between">
                    <span className="text-[#a3a3a3]">
                      Drop-off Fee
                      {dropoffLoc && (
                        <span className="block text-xs text-[#666] mt-0.5">
                          {dropoffLoc}
                        </span>
                      )}
                    </span>
                    <span
                      className={
                        dropoffFee === 0 ? "text-green-400" : "text-white"
                      }
                    >
                      {dropoffFee === 0 ? "Free" : formatPHP(dropoffFee)}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#333] my-3" />

                  {/* Grand Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-[#e8c547] font-semibold">
                      Grand Total
                    </span>
                    <span className="text-[#e8c547] font-bold text-xl">
                      {formatPHP(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Customer Details */}
            <section className="bg-[#111] border border-[#333] rounded-xl p-5">
              <h3 className="text-sm font-medium text-[#e8c547] mb-4 uppercase tracking-wider">
                Your Details
              </h3>

              {bookingType === "self-drive" ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[#666]">Birthday</span>
                      <p className="text-white">{formData.birthday || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[#666]">Phone</span>
                      <p className="text-white">{formData.phone || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#666]">Email</span>
                    <p className="text-white">{formData.email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[#666]">Destination</span>
                    <p className="text-white">{formData.destination || "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[#666]">Pick-up</span>
                      <p className="text-white">
                        {formData.pickupLocation || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#666]">Drop-off</span>
                      <p className="text-white">
                        {formData.dropoffLocation || "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#666]">Driver’s License No.</span>
                    <p className="text-white">
                      {formData.driversLicenseNo || "—"}
                    </p>
                  </div>
                  {formData.alternativeContact && (
                    <div>
                      <span className="text-[#666]">Alternative Contact</span>
                      <p className="text-white">
                        {formData.alternativeContact}
                      </p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#333]">
                    <span className="text-[#666]">Documents</span>
                    <ul className="mt-1 space-y-1 text-white">
                      <li>
                        Driver’s License: {fileLabel(files.driversLicense)}
                      </li>
                      <li>Gov ID 1: {fileLabel(files.govId1)}</li>
                      <li>Gov ID 2: {fileLabel(files.govId2)}</li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* Chauffeur review */
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[#666]">Phone</span>
                      <p className="text-white">{formData.phone || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[#666]">Company</span>
                      <p className="text-white">
                        {formData.companyName || "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#666]">Pick-up Address</span>
                    <p className="text-white">
                      {formData.pickupAddress || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#666]">Drop-off Address</span>
                    <p className="text-white">
                      {formData.dropoffAddress || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#666]">Itinerary</span>
                    <p className="text-white whitespace-pre-wrap">
                      {formData.itinerary || "—"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[#666]">Passengers</span>
                      <p className="text-white">{formData.passengers || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[#666]">Luggages</span>
                      <p className="text-white">{formData.luggages || "—"}</p>
                    </div>
                  </div>
                  {formData.specialRequests && (
                    <div>
                      <span className="text-[#666]">Special Requests</span>
                      <p className="text-white">{formData.specialRequests}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[#666]">Driver Standby</span>
                      <p className="text-white capitalize">
                        {formData.driverStandby}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#666]">Payment</span>
                      <p className="text-white capitalize">
                        {formData.paymentMode.replace("-", " ") || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Final Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="flex-1 px-4 py-3 rounded-lg border border-[#444] text-[#a3a3a3] hover:bg-[#222] transition"
              >
                ← Edit Details
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="flex-1 px-4 py-3 rounded-lg bg-[#c9a227] text-black font-semibold hover:bg-[#e8c547] transition"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
