export {};

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, any>) => void;
      identify: (sessionData: Record<string, any>) => void;
    };
  }
}
