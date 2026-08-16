export type SphereConfig = {
  // Physics
  sphereCount: number;
  sphereRadius: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  spreadX: number;
  spreadY: number;
  spreadZ: number;
  springForce: number;
  maxDistanceThreshold: number;
  tetherStiffness: number;
  damping: number;
  restitution: number;
  substeps: number;

  // Obstacle
  obstacleState: "visible" | "invisible" | "remove";
  obstacleWidth: number;
  obstacleHeight: number;
  obstacleDepth: number;
  obstacleX: number;
  obstacleY: number;
  obstacleZ: number;

  // Squish / SoftBody
  stiffness: number;
  squishDamping: number;
  squeezeFactor: number;

  // Mouse
  mouseRadius: number;
  mouseForce: number;

  // Faces
  autoBlink: boolean;
  allowAnim: boolean;
  mouseTracking: boolean;
  breathing: boolean;
  eyeSize: number;
  eyeDistance: number;
  inkColor: string;

  // End Animation
  endAnimProgress: number;
  pushForce: number;
  delayFactor: number;

  // Fresnel Edge Blur & Sun Direction
  fresnelDark: number;
  fresnelWhite: number;
  sunX: number;
  sunY: number;
  sunZ: number;
};

export const defaultSphereConfig: SphereConfig = {
  // Physics
  sphereCount: 10,
  sphereRadius: 0.9,
  positionX: 2.2,
  positionY: -5.7,
  positionZ: -1,
  spreadX: 1.0,
  spreadY: 1.95,
  spreadZ: 0.25,
  springForce: 0.004,
  maxDistanceThreshold: 3.5,
  tetherStiffness: 0.04,
  damping: 0.98,
  restitution: 0.35,
  substeps: 6,

  // Obstacle
  obstacleState: "invisible",
  obstacleWidth: 6.3,
  obstacleHeight: 1,
  obstacleDepth: 2.2,
  obstacleX: 2,
  obstacleY: -0.4,
  obstacleZ: -0.6,

  // Squish / SoftBody
  stiffness: 70.0,
  squishDamping: 0.82,
  squeezeFactor: 0.6,

  // Mouse
  mouseRadius: 1.6,
  mouseForce: 0.03,

  // Faces
  autoBlink: true,
  allowAnim: false,
  mouseTracking: true,
  breathing: true,
  eyeSize: 0.36,
  eyeDistance: 0.8,
  inkColor: "#111115",

  // End Animation
  endAnimProgress: 0,
  pushForce: 4.0,
  delayFactor: 0.04,

  // Fresnel Edge Blur & Sun Direction
  fresnelDark: 0.11,
  fresnelWhite: 0.66,
  sunX: 0.0,
  sunY: 0.0,
  sunZ: 1.0,
};

export const pageSphere: Record<string, Partial<SphereConfig> | undefined> = {
  Login: {
    ...defaultSphereConfig,
    positionX: 2.2,
    positionY: -5.7,
  },
  Detail: {
    ...defaultSphereConfig,
    positionX: -6.3,
    positionY: -3.5,
    spreadY: 1.15,
    sphereCount: 6,
    sphereRadius: 1,
    obstacleState: "remove",
  },
  Detail2: {
    ...defaultSphereConfig,
    positionX: 6.3,
    positionY: -3.5,
    spreadY: 1.1,
    sphereCount: 6,
    sphereRadius: 1,
    obstacleState: "remove",
  },
  Nfc1: {
    ...defaultSphereConfig,
    positionX: -7,
    positionY: -4,
    positionZ: -2,
    spreadX: 3,
    spreadY: 0.05,
    sphereCount: 5,
    sphereRadius: 1.2,
    obstacleState: "remove",
  },
  Nfc2: {
    ...defaultSphereConfig,
    positionX: 7.2,
    positionY: -4,
    positionZ: -2,
    spreadX: 3,
    spreadY: 0.05,
    sphereCount: 5,
    sphereRadius: 1.2,
    obstacleState: "remove",
  },
  Nfc: {
    ...defaultSphereConfig,
    positionX: 0.4,
    positionY: -4,
    positionZ: -3,
    spreadX: 18,
    spreadY: 0.05,
    sphereCount: 18,
    sphereRadius: 1.25,
    obstacleState: "remove",
  },
  // Home is intentionally left undefined
};

export const routeSphereMap: Record<string, string> = {
  "/": "Home",
  "/login": "Login",
  "/detail": "Detail",
};
