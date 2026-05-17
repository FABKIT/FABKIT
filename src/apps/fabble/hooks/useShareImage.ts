import { snapdom } from "@zumer/snapdom";
import { useRef, useState } from "react";

const USERNAME_KEY = "fabble:shareUsername";

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
	const [username, setUsernameState] = useState<string>(
		() => localStorage.getItem(USERNAME_KEY) ?? "",
	);

	function setUsername(value: string) {
		const trimmed = value.slice(0, 20);
		setUsernameState(trimmed);
		if (trimmed) {
			localStorage.setItem(USERNAME_KEY, trimmed);
		} else {
			localStorage.removeItem(USERNAME_KEY);
		}
	}

	async function shareImage(): Promise<void> {
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
				setTimeout(() => URL.revokeObjectURL(url), 1000);
			}
		} catch (err) {
			if (err instanceof DOMException && err.name === "AbortError") return;
			console.error("[Fabble] Share image failed:", err);
		} finally {
			setCapturing(false);
		}
	}

	return { cardRef, username, setUsername, capturing, shareImage };
}

