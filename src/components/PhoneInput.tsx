'use client';

import React from 'react';
import PhoneInputWithCountrySelect from 'react-phone-number-input';
import { cn } from '@/lib/utils';
import 'react-phone-number-input/style.css';

type PhoneInputProps = {
  value: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
};

export function PhoneInput({
  value,
  onChange,
  placeholder = 'Phone number',
  disabled,
  className,
  id,
  'aria-label': ariaLabel,
}: PhoneInputProps) {
  return (
    <PhoneInputWithCountrySelect
      id={id}
      international
      countryCallingCodeEditable={false}
      defaultCountry="IL"
      placeholder={placeholder}
      value={value || undefined}
      onChange={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'flex h-11 w-full rounded-lg border border-input bg-background ring-offset-background',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:min-w-0 [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:outline-none',
        '[&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelect]:border-0 [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:pr-2',
        className
      )}
    />
  );
}
