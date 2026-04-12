import { Link } from "@tanstack/react-router";

export function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-20 text-center">
			<h1 className="text-8xl text-primary">404 Not Found</h1>
			<p className="text-4xl">The requested page could not be found.</p>
			<p className="text-4xl">
				You can go back{" "}
				<Link className="text-primary hover:underline" to="/">
					Home
				</Link>
				?
			</p>
		</div>
	);
}
