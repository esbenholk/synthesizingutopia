"use client";
import { useEffect, useState } from "react";
import "../../index.css";
import { Upload } from "../../components/Upload";

export default function GefionPage() {
  const [windowHeight, setWindowHeight] = useState<number>(0);
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <main className="brew-container">
      <video
        className={"couldron"}
        src={
          "https://res.cloudinary.com/dmwpm8iiw/video/upload/v1741863927/loopcouldron_svu0rw.mp4?q_auto:eco"
        }
        autoPlay
        loop
        muted
        playsInline
      />

      <img
        className={"overlay"}
        src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1741865808/couldronoverlay_bg8osp.png"
      />
      <Upload folder="gefion" />
    </main>
  );
}
