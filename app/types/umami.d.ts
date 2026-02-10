export {};

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, unknown>) => void;
      identify: (sessionData: Record<string, unknown>) => void;
    };
  }
}
