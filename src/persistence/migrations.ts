export interface Migration {
    /** The app version that introduced this schema change. */
    version: string;
    migrate: (state: unknown) => unknown;
}