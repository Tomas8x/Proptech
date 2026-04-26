"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Cargando...",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className ?? ""}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
