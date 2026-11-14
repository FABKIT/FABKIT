/** Arrow keys belong to whatever else is using them: a modified arrow is the
 * browser's (Alt+Left is Back), an open dialog owns the keyboard, and the set
 * dropdown uses them to move between its options. Dialogs are checked globally
 * rather than through the event target because focus can sit outside one while
 * it is open, and acting behind a dialog is what this exists to stop. */
export function arrowKeyBelongsElsewhere(event: KeyboardEvent): boolean {
	if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
		return true;
	}
	if (document.querySelector('[role="dialog"]')) return true;
	return (
		event.target instanceof Element &&
		event.target.closest('[role="listbox"]') !== null
	);
}
