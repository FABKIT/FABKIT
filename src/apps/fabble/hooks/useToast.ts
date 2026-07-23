import { useEffect, useRef, useState } from "react";

const TOAST_DURATION_MS = 3000;

/** Transient status message that clears itself; the pending timeout is
 * replaced on repeat calls and cleaned up on unmount. */
export function useToast(): {
	toast: string | null;
	showToast: (message: string) => void;
} {
	const [toast, setToast] = useState<string | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => () => clearTimeout(timerRef.current), []);

	const showToast = (message: string) => {
		clearTimeout(timerRef.current);
		setToast(message);
		timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
	};

	return { toast, showToast };
}
