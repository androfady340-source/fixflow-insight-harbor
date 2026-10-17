import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground" aria-label="FixFlow home">
      <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <circle cx="5" cy="6" r="2" />
          <circle cx="19" cy="18" r="2" />
          <path d="M7 6h5a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3" />
        </svg>
      </span>
      FixFlow
    </Link>
  );
}
