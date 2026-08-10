/**
 * Placeholder data for the custom frames UI.
 *
 * The upload/storage layer does not exist yet — this file stands in for it so
 * the page and the picker can be reviewed visually. When the real persistence
 * lands, delete this file and swap the two imports for the storage helpers.
 */
export interface MockCustomFrame {
	id: string;
	name: string;
	/** Stock cardback art, standing in for a user-uploaded image. */
	previewUrl: string;
	createdAt: number;
}

export const MOCK_CUSTOM_FRAMES: MockCustomFrame[] = [
	{
		id: "frame-1",
		name: "Shadow Runeblade",
		previewUrl: "/cardbacks/generated/683c9f087ff25.png",
		createdAt: Date.parse("2026-07-14"),
	},
	{
		id: "frame-2",
		name: "Ashen Assassin",
		previewUrl:
			"/cardbacks/generated/assassin-nostats-1-flat-6880352873107.png",
		createdAt: Date.parse("2026-07-28"),
	},
	{
		id: "frame-3",
		name: "Bard of the Deep",
		previewUrl: "/cardbacks/generated/bard-nostats-1-dented-688034a552e91.png",
		createdAt: Date.parse("2026-08-03"),
	},
];
