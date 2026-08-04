import { useEffect } from "react";
import Stats from "stats.js";

export const useShowFps = () => {
  useEffect(() => {
    const panels = [0].map((panel, i) => {
      const s = new Stats();
      s.showPanel(panel);
      s.dom.style.position = "absolute";
      s.dom.style.left = `${i * 80}px`;
      s.dom.style.left = `auto`;
      document.body.appendChild(s.dom);
      return s;
    });

    let raf: number;

    const loop = () => {
      panels.forEach((s) => {
        s.begin();
        s.end();
      });
      raf = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(raf);
      panels.forEach((s) => s.dom.remove());
    };
  }, []);
};
