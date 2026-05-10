import { SourceMapConsumer } from "source-map-js";

// ─── Consumer Cache ───────────────────────────────────────────────────────────

const consumerCache = new Map<string, SourceMapConsumer | null>();

async function fetchConsumer(
	scriptUrl: string,
): Promise<SourceMapConsumer | null> {
	if (consumerCache.has(scriptUrl)) return consumerCache.get(scriptUrl) || null;

	try {
		const res = await fetch(`${scriptUrl}.map`);
		if (!res.ok) {
			consumerCache.set(scriptUrl, null);
			return null;
		}
		const raw = await res.json();
		const consumer = new SourceMapConsumer(raw);
		consumerCache.set(scriptUrl, consumer);
		return consumer;
	} catch {
		consumerCache.set(scriptUrl, null);
		return null;
	}
}

// ─── Stack Remapper ───────────────────────────────────────────────────────────

// Matches V8 frames in two forms:
//   at funcName (https://…/file.js:line:col)
//   at https://…/file.js:line:col
const FRAME_RE = /^\s+at (?:(.+?) \((.+):(\d+):(\d+)\)|(.+):(\d+):(\d+))$/;

async function remapStack(stack: string): Promise<string> {
	const lines = stack.split("\n");
	const remapped = await Promise.all(
		lines.map(async (line) => {
			const m = FRAME_RE.exec(line);
			if (!m) return line;

			const [
				,
				namedFn,
				namedUrl,
				namedLine,
				namedCol,
				anonUrl,
				anonLine,
				anonCol,
			] = m;
			const url = namedUrl ?? anonUrl;
			const lineNum = Number(namedLine ?? anonLine);
			const colNum = Number(namedCol ?? anonCol);
			const fn = namedFn ?? null;

			if (!url.startsWith("http")) return line;

			const consumer = await fetchConsumer(url);
			if (!consumer) return line;

			const pos = consumer.originalPositionFor({
				line: lineNum,
				column: colNum,
			});
			if (!pos.source) return line;

			const name = pos.name ?? fn ?? "<anonymous>";
			return `    at ${name} (${pos.source}:${pos.line}:${pos.column})`;
		}),
	);

	return remapped.join("\n");
}

// ─── Public API ───────────────────────────────────────────────────────────────

interface RemappableEntry {
	stack?: string;
}

interface RemappableBoundaryError {
	stack?: string;
}

interface RemappableReport {
	console: RemappableEntry[];
	boundaryError?: RemappableBoundaryError | null;
}

export async function remapStacks<T extends RemappableReport>(
	report: T,
): Promise<T> {
	const [consoleEntries, boundaryStack] = await Promise.all([
		Promise.all(
			report.console.map(async (entry) => {
				if (!entry.stack) return entry;
				return { ...entry, stack: await remapStack(entry.stack) };
			}),
		),
		report.boundaryError?.stack
			? remapStack(report.boundaryError.stack)
			: Promise.resolve(undefined),
	]);

	return {
		...report,
		console: consoleEntries,
		boundaryError: report.boundaryError
			? {
					...report.boundaryError,
					stack: boundaryStack ?? report.boundaryError.stack,
				}
			: report.boundaryError,
	};
}
