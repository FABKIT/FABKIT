export const CardStyles = [
	"dented",
	"flat",
	// "meld",
] as const;

export type CardStyle = (typeof CardStyles)[number];
