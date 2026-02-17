import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { registerUser } from "../services/authService";
import { ApiError } from "../lib/api";
import { validateRegistrationForm } from "../utils/validators";
import styles from "./SignUp.module.css";

export default function SignUp() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate form
    const validation = validateRegistrationForm({
      firstName,
      lastName,
      email,
      organizationName,
      legalName,
      taxId,
      street,
      city,
      country,
      postalCode,
      password,
      confirmPassword,
      phone,
    });

    if (!validation.isValid) {
      setError(validation.message || "Validation failed");
      return;
    }

    setLoading(true);

    try {
      // Build payload matching API documentation: organization + owner
      const payload = {
        organization: {
          name: organizationName,
          legalName: legalName || undefined,
          email: email,
          phone: phone || undefined,
          taxId: taxId,
          address: {
            street,
            city,
            country,
            postalCode,
          },
        },
        owner: {
          email: email,
          password: password,
          phone: phone || undefined,
          name: {
            firstName: firstName,
            secondName: undefined,
            firstSurname: lastName || "",
            secondSurname: undefined,
          },
        },
      };

      const response = await registerUser(payload);

      if (response.status === "success") {
        // Success - navigate to login
        alert("Account created successfully. Please log in.");
        navigate("/login");
      }
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Network error. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />

      <main className="flex-grow flex flex-col md:flex-row">
        {/* Left Section - Desktop Only */}
        <div
          className={`hidden md:flex md:w-1/2 ${styles.bgOverlay} p-12 lg:p-20 flex-col justify-center relative border-r border-zinc-800 z-0`}
        >
          <div className="z-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-12">
              <div className="bg-yellow-400 p-2 rounded-lg shadow-lg">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white italic">
                Lend<span className="text-yellow-400">Event</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl text-white lg:text-6xl font-extrabold mb-6 leading-tight">
              Create your account
              <br />
              <span className="text-yellow-400">for Business</span>
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-lg max-w-md mb-12 leading-relaxed">
              Join the companies already transforming their events with our cutting-edge technology.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <span className="text-yellow-400 text-xl font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white">
                    Instant Setup
                  </p>
                  <p className="text-sm text-gray-400">
                    Access your dashboard in less than 2 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-8 bg-black relative z-10 overflow-y-auto">
          <div className="w-full max-w-md py-12">
            <h2 className="text-4xl font-extrabold mb-2">Get Started</h2>
            <p className="text-gray-400 mb-10">
              Create your Lend Event account today
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Nombre */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Apellido */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Organization Name */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="Your Company Inc."
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Legal Name (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Legal Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Your Company S.A."
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* NIT / Tax ID */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  NIT / Tax ID
                </label>
                <input
                  type="text"
                  placeholder="123-456-789"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Phone <span className="text-gray-600">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Calle 123"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Bogotá"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Country
                </label>
                <input
                  type="text"
                  placeholder="Colombia"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  placeholder="110111"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="text-xs text-gray-400 mb-2">
                  Minimum 8 characters, 1 uppercase letter, 1 number and 1 special
                  character (!@#$%^&*)
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                  <input
                    type="password"
                    placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} mt-4 shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            {/* Link a Login */}
            <p className="text-center text-sm text-gray-500 mt-8">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-yellow-400 font-bold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
