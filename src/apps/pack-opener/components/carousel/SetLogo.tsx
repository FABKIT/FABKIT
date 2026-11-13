import { Package } from "lucide-react";
import { useState } from "react";

interface SetLogoProps {
	logoUrl: string | null;
	name: string;
}

/** The slot is a fixed height whether or not the logo has arrived, and the
 * set's name stands in until it does, so stepping through sets never leaves a
 * blank gap where the logo will be. These are Legend Story Studios' own
 * full-resolution logo files, served from their CDN at up to 2500x1768 for
 * something drawn 64px tall, and they take between a third of a second and
 * nearly two seconds to arrive the first time. Preloading the neighbours (see
 * hooks/useNeighbourLogoPreload.ts) covers the common case of stepping one set
 * at a time; this covers the rest.
 *
 * Remembers WHICH logo finished loading rather than whether one has, so a new
 * set's logo counts as not loaded without anything having to reset it. The
 * stand-in positions itself against the carousel's pill, which is `relative`. */
export function SetLogo({ logoUrl, name }: SetLogoProps) {
	const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
	const loaded = logoUrl !== null && loadedUrl === logoUrl;

	return (
		<div className="flex h-16 w-56 shrink-0 items-center justify-center">
			{logoUrl ? (
				<img
					key={logoUrl}
					src={logoUrl}
					alt={name}
					decoding="async"
					onLoad={() => setLoadedUrl(logoUrl)}
					className={`h-16 w-auto max-w-56 object-contain transition-opacity duration-200 ${
						loaded ? "opacity-100" : "opacity-0"
					}`}
				/>
			) : null}
			{!loaded && (
				<div className="absolute flex items-center gap-2 px-1">
					<Package className="h-8 w-8 text-muted" aria-hidden="true" />
					<span className="text-sm font-semibold text-heading">{name}</span>
				</div>
			)}
		</div>
	);
}
