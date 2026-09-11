/**
 * Heroicons' "square-2-stack" (outline, 24px), hand-carried into this repo
 * as a component rather than pulled in as a dependency — the whole
 * @heroicons/react package for one glyph, sitting next to lucide-react
 * which already covers every other icon here, would be a second icon
 * library to keep in step for no benefit. Same approach as the brand icons
 * beside this file.
 *
 * Drawn on the same 24x24 grid and 1.5 stroke weight lucide uses, so it
 * sits at the same visual weight as its neighbours in the nav. Path from
 * heroicons v2 (MIT, github.com/tailwindlabs/heroicons).
 */
export function Square2Stack({
	className,
	...rest
}: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...rest}
		>
			<path d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25" />
			<path d="M7.5 18a2.25 2.25 0 0 0 2.25 2.25H18A2.25 2.25 0 0 0 20.25 18V9.75A2.25 2.25 0 0 0 18 7.5H9.75A2.25 2.25 0 0 0 7.5 9.75V18Z" />
		</svg>
	);
}
