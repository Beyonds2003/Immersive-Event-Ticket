export type PosterConfig = {
  title: string[];
  titleFontFamily?: string;
  titleFontSize?: number;
  titleColor?: string;
  titleLineHeight?: number;
  subtitle?: string;
  subtitleFontSize?: number;
  subtitleFontFamily?: string;
  subtitleLetterSpacing?: number;
  subtitleColor?: string;
  margin?: number;
  padding?: number;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  responsive?: boolean;
};

export const posterConfigs: Record<string, PosterConfig> = {
  "/login": {
    title: ["DISCOVER EVENT"],
    titleFontFamily: "Dingos-ExtraBold",
    titleFontSize: 160,
    titleColor: "#FFFFFF",
    titleLineHeight: 1,

    subtitle: "YOUR GATEWAY TO UNIVERSITY EVENTS",
    subtitleFontSize: 15,
    subtitleFontFamily: "Inter",
    subtitleLetterSpacing: 1,
    subtitleColor: "#FFFFFF",

    margin: -10,
    padding: 5,
    textAlign: "left",
    textBaseline: "top",
    responsive: true,
  },
  "/": {
    title: ["EXPLORE"],
    titleFontFamily: "Dingos-ExtraBold",
    titleFontSize: 160,
    titleColor: "#000000",
    titleLineHeight: 1,

    padding: 5,
    textAlign: "left",
    textBaseline: "top",
    responsive: true,
  },
  "/detail": {
    title: ["TICKET DETAIL"],
    titleFontFamily: "Dingos-ExtraBold",
    titleFontSize: 100,
    titleColor: "#000000",
    titleLineHeight: 1,

    padding: 100,
    textAlign: "center",
    textBaseline: "top",
    responsive: true,
  },
  "/nfc": {
    title: ["NFC STICKER"],
    titleFontFamily: "Dingos-ExtraBold",
    titleFontSize: 100,
    titleColor: "#000000",
    titleLineHeight: 1,

    subtitle: "TAP YOUR WAY INTO CAMPUS EVENTS AND EXPERIENCES",
    subtitleFontSize: 10,
    subtitleFontFamily: "Inter",
    subtitleLetterSpacing: 1,
    subtitleColor: "#000000",

    margin: -10,
    padding: 20,
    textAlign: "left",
    textBaseline: "top",
    responsive: true,
  },
};
