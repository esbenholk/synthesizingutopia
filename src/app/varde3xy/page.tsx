"use client";
import { useEffect, useState } from "react";
import "../../index.css";
import { Upload } from "../../components/Upload";

export default function NextPage() {
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
      <Upload folder="varde3xy" />
    </main>
  );
}
