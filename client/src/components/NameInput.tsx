import type { ReactElement } from 'react';

interface NameInputProps {
  readonly value: string;
  readonly error: string;
  readonly onChange: (value: string) => void;
}

export const NameInput = ({ value, error, onChange }: NameInputProps): ReactElement => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
    <input
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      maxLength={30}
      placeholder="Enter your name"
      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      aria-invalid={error.length > 0}
      aria-describedby={error.length > 0 ? 'name-error' : undefined}
    />
    {error.length > 0 ? (
      <p id="name-error" className="mt-2 text-sm text-red-600">
        {error}
      </p>
    ) : null}
  </label>
);
