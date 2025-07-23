import React from 'react';
import { usePasswordToggle } from '../hooks/usePasswordToggle';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  "aria-describedby"?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Passwort",
  className = "",
  required = false,
  disabled = false,
  autoComplete = "current-password",
  id,
  name,
  style,
  onFocus,
  onBlur,
  "aria-describedby": ariaDescribedby,
  ...otherProps 
}) => {
  const { showPassword, togglePasswordVisibility } = usePasswordToggle();

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        id={id}
        name={name}
        style={style}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-describedby={ariaDescribedby}
        {...otherProps}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
        aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
      >
        {showPassword ? (
          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        ) : (
          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        )}
      </button>
    </div>
  );
}; 