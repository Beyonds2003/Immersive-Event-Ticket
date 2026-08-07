// Shared mouse state singleton — attach listeners once, read from anywhere.
export const mouse = { x: 0, y: 0, isDown: false };

if (typeof window !== "undefined") {
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("mousedown", () => {
    mouse.isDown = true;
  });
  window.addEventListener("mouseup", () => {
    mouse.isDown = false;
  });
}
