const USERNAME_KEY = "fabble:shareUsername";

export function getUsername(): string {
	try {
		return localStorage.getItem(USERNAME_KEY) ?? "";
	} catch (err) {
		console.warn("[usernameStorage] getUsername failed:", err);
		return "";
	}
}

export function setUsername(value: string): void {
	try {
		if (value) {
			localStorage.setItem(USERNAME_KEY, value);
		} else {
			localStorage.removeItem(USERNAME_KEY);
		}
	} catch (err) {
		console.warn("[usernameStorage] setUsername failed:", err);
	}
}
