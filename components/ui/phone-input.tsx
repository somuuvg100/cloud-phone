"use client";

import * as React from "react";
import {
  ChevronDown,
  Search,
  Check,
  AlertCircle,
  CheckCircle2,
  X,
  Phone,
  Copy,
} from "lucide-react";
import { CountryCode } from "libphonenumber-js";
import { COUNTRIES, CountryData, DEFAULT_COUNTRY } from "@/lib/countries";
import {
  formatAsYouType,
  validateAndFormatPhone,
  PhoneValidationResult,
} from "@/lib/phone-utils";

export interface PhoneInputProps {
  value?: string;
  defaultCountryCode?: CountryCode;
  onChange?: (result: PhoneValidationResult) => void;
  onCountryChange?: (country: CountryData) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  showValidationMessage?: boolean;
  label?: string;
  id?: string;
}

export function PhoneInput({
  value = "",
  defaultCountryCode = "IN",
  onChange,
  onCountryChange,
  disabled = false,
  required = false,
  placeholder,
  className = "",
  showValidationMessage = true,
  label,
  id = "phone-input",
}: PhoneInputProps) {
  // Find initial country from defaultCountryCode
  const initialCountry = React.useMemo(() => {
    return (
      COUNTRIES.find((c) => c.code === defaultCountryCode) || DEFAULT_COUNTRY
    );
  }, [defaultCountryCode]);

  const [selectedCountry, setSelectedCountry] =
    React.useState<CountryData>(initialCountry);
  const [phoneNumber, setPhoneNumber] = React.useState(value);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isTouched, setIsTouched] = React.useState(false);

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const phoneInputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [dropdownOpen]);

  // Validation calculation
  const validationResult = React.useMemo(() => {
    return validateAndFormatPhone(
      phoneNumber,
      selectedCountry.code,
      selectedCountry.dialCode
    );
  }, [phoneNumber, selectedCountry]);

  // Sync state when external value changes
  React.useEffect(() => {
    if (value !== undefined && value !== phoneNumber) {
      const formatted = formatAsYouType(value, selectedCountry.code);
      setPhoneNumber(formatted);
    }
  }, [value, selectedCountry.code]);

  // Notify parent on change
  React.useEffect(() => {
    if (onChange) {
      onChange(validationResult);
    }
  }, [validationResult, onChange]);

  // Handle number input with AsYouType formatting
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTouched(true);
    const rawVal = e.target.value;
    // Format on the fly using libphonenumber-js
    const formatted = formatAsYouType(rawVal, selectedCountry.code);
    setPhoneNumber(formatted);
  };

  // Handle country selection
  const handleSelectCountry = (country: CountryData) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    if (onCountryChange) {
      onCountryChange(country);
    }
    // Reformat existing number according to new country rules
    if (phoneNumber) {
      const reformatted = formatAsYouType(phoneNumber, country.code);
      setPhoneNumber(reformatted);
    }
    phoneInputRef.current?.focus();
  };

  // Filter countries by name or dial code
  const filteredCountries = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Clear phone number
  const handleClear = () => {
    setPhoneNumber("");
    phoneInputRef.current?.focus();
  };

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {/* Optional Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-foreground tracking-tight"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      {/* Main Composite Input Box */}
      <div
        className={`relative flex items-center rounded-xl bg-background border transition-all duration-200 shadow-xs ${
          isTouched && phoneNumber && !validationResult.isValid
            ? "border-destructive focus-within:ring-2 focus-within:ring-destructive/30"
            : validationResult.isValid
            ? "border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/30"
            : "border-border/80 hover:border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-muted/30" : ""}`}
      >
        {/* Country Selector Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-l-xl hover:bg-muted/60 transition-colors border-r border-border/70 text-xs font-medium text-foreground select-none focus:outline-none"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label={`Select country. Current: ${selectedCountry.name} (${selectedCountry.dialCode})`}
          >
            <span className="text-lg leading-none" role="img" aria-label={selectedCountry.name}>
              {selectedCountry.flag}
            </span>
            <span className="font-mono text-xs font-semibold text-foreground">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                dropdownOpen ? "rotate-180 text-primary" : ""
              }`}
            />
          </button>

          {/* Searchable Country Popover Dropdown */}
          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-popover text-popover-foreground border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
              {/* Search Bar inside Dropdown */}
              <div className="p-2.5 border-b border-border/70 bg-muted/30">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by country or +dial code..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Popular Quick-Select Chips */}
                {!searchQuery && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 no-scrollbar text-[11px]">
                    {COUNTRIES.filter((c) => c.priority).slice(0, 5).map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCountry(c)}
                        className={`whitespace-nowrap px-2 py-0.5 rounded-lg border text-[11px] transition-colors ${
                          selectedCountry.code === c.code
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border/80 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.flag} {c.dialCode}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Country List Options */}
              <div
                className="max-h-60 overflow-y-auto divide-y divide-border/40 py-1"
                role="listbox"
              >
                {filteredCountries.map((country) => {
                  const isSelected = selectedCountry.code === country.code;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectCountry(country)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors ${
                        isSelected ? "bg-accent/70 font-semibold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{country.flag}</span>
                        <span className="truncate text-foreground">
                          {country.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {country.dialCode}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}

                {filteredCountries.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                    No country found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* National Number Input Field */}
        <input
          ref={phoneInputRef}
          id={id}
          type="tel"
          disabled={disabled}
          value={phoneNumber}
          onChange={handleNumberChange}
          onBlur={() => setIsTouched(true)}
          placeholder={placeholder || selectedCountry.example}
          className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-medium"
        />

        {/* Clear Button */}
        {phoneNumber && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 mr-1 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            aria-label="Clear input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Right Status Indicator Icon */}
        <div className="pr-3 flex items-center pointer-events-none">
          {validationResult.isValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in-50" />
          ) : isTouched && phoneNumber ? (
            <AlertCircle className="w-4 h-4 text-destructive animate-in zoom-in-50" />
          ) : null}
        </div>
      </div>

      {/* Validation & E.164 Result Display */}
      {showValidationMessage && (
        <div className="pt-0.5">
          {validationResult.isValid ? (
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                <span>Valid phone number format</span>
              </span>
              <span className="font-mono text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-700 dark:text-emerald-300">
                E.164: {validationResult.e164}
              </span>
            </div>
          ) : isTouched && phoneNumber && validationResult.error ? (
            <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationResult.error}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

