import type { ReactElement } from 'react';

interface JoinButtonProps {
  readonly disabled: boolean;
}

export const JoinButton = ({ disabled }: JoinButtonProps): ReactElement => (
  <button
    type="submit"
    disabled={disabled}
    className="h-11 w-full rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
  >
    Join
  </button>
);
