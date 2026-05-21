import { snapdom } from "@zumer/snapdom";
import { useCallback, useEffect, useRef, useState } from "react";
import { getUsername, setUsername as storeUsername } from "@fabkit/apps/fabble/lib/usernameStorage";

export interface UseShareImageResult {
	cardRef: React.RefObject<HTMLDivElement | null>;
	username: string;
	setUsername: (v: string) => void;
	capturing: boolean;
	shareImage: () => Promise<void>;
}

export function useShareImage(): UseShareImageResult {
	const cardRef = useRef<HTMLDivElement>(null);
	const [capturing, setCapturing] = useState(false);
	const [username, setUsernameState] = useState<string>(getUsername);

	// Track mounted state to prevent state updates after unmount
	const mountedRef = useRef(true);
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const setUsername = useCallback((value: string) => {
		const trimmed = value.slice(0, 20);
		setUsernameState(trimmed);
		storeUsername(trimmed);
	}, []);

	const shareImage = useCallback(async (): Promise<void> => {
		const el = cardRef.current;
		if (!el || capturing) return;

		setCapturing(true);
		try {
			const blob = await snapdom.toBlob(el, {
				type: "png",
				scale: 2,
				backgroundColor: "#1a1b2e",
				embedFonts: false,
				fast: true,
			});

			const file = new File([blob], "fabble.png", { type: "image/png" });

			if (navigator.canShare?.({ files: [file] })) {
				await navigator.share({ files: [file], title: "Fabble" });
			} else {
				// Desktop fallback: trigger download
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = "fabble.png";
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				// Revoke after the browser has had time to initiate the download
				const revoke = setTimeout(() => URL.revokeObjectURL(url), 1000);
				// Clean up if unmounted before timer fires
				if (!mountedRef.current) clearTimeout(revoke);
			}
		} catch (err) {
			if (err instanceof DOMException && err.name === "AbortError") return;
			console.error("[Fabble] Share image failed:", err);
		} finally {
			if (mountedRef.current) setCapturing(false);
		}
	}, [capturing]);

	return { cardRef, username, setUsername, capturing, shareImage };
}
