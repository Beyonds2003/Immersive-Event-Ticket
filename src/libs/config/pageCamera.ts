export type CameraConfig = {
  position: [number, number, number];
  fov: number;
};

export const pageCamera: Record<string, CameraConfig> = {
  Home: { position: [0, 0, 5], fov: 75 },
  Login: { position: [0, 0, 15], fov: 30 },
  Detail: { position: [0, 0, 15], fov: 30 },
  Nfc: { position: [0, 0, 15], fov: 30 },
  Faq: { position: [0, 0, 15], fov: 30 },
};

export const routeCameraMap: Record<string, keyof typeof pageCamera> = {
  "/": "Home",
  "/login": "Login",
  "/detail": "Detail",
  "/nfc": "Nfc",
  "/faq": "Faq",
};
