import React, { useEffect, useState, useRef } from "react";
import Gallery from "./Gallery";
import { io } from "socket.io-client";
import { ImageCardProps } from "./imageCardProps";
import DiagramGallery from "./DiagramGallery";
import {
  ZONES,
  INTIMACY_LEVELS,
  ZoneId,
  IntimacyId,
  folderConfig,
} from "../config/folderConfig";

const socket = io("dancingwai-11f115b681e2.herokuapp.com");

function cloudinaryQuality(
  url: string,
  width: number,
  quality: number,
): string {
  if (!url.includes("cloudinary.com")) return url;
  return url.replace(
    /\/upload\//,
    `/upload/w_${Math.round(width)},q_${quality},c_fill/`,
  );
}

/**
 * Reassembles a title that was split across Cloudinary context keys.
 *
 * When a title exceeds 1000 chars it is stored as:
 *   caption              → first chunk
 *   title_continuation_1 → second chunk
 *   title_continuation_2 → third chunk  …etc
 *
 * This helper stitches them back into one string.
 * It also accepts a plain string so callers can always run any title through it.
 */
function reassembleTitle(
  context: Record<string, string> | undefined | null,
): string {
  if (!context) return "";

  const first = (context.caption ?? "").trim();
  if (!first) return "";

  const continuations: string[] = [];
  let i = 1;
  while (context[`title_continuation_${i}`]) {
    continuations.push(context[`title_continuation_${i}`].trim());
    i++;
  }

  return continuations.length > 0
    ? `${first} ${continuations.join(" ")}`.trim()
    : first;
}

/**
 * Normalises a raw item coming from /api/cloudinary/recent so that
 * ImageCardProps.title always contains the full, reassembled title.
 */
function normaliseItem(
  item: ImageCardProps & { context?: Record<string, string> },
): ImageCardProps {
  const fullTitle = reassembleTitle(item.context);
  return {
    ...item,
    title: fullTitle || item.title || "",
  };
}

export function Upload({ folder = "utopias" }: { folder?: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const textArea = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploadLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [succes, setSucces] = useState(false);
  const [isFetchingRecent, setIsFetchingRecent] = useState(false);
  const [error, setError] = useState<string>("");
  const [news, setNews] = useState<ImageCardProps[]>([]);
  const [loadIndex, setLoadIndex] = useState<number>(0);
  const [remixedPrompt, setRemixedPrompt] = useState("");

  const [selectedImages, setSelectedImages] = useState<ImageCardProps[]>([]);
  const [collagedImage, setCollagedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [selectedParentIds, setSelectedParentIDs] = useState<string[]>([]);

  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [selectedIntimacy, setSelectedIntimacy] = useState<IntimacyId | null>(
    null,
  );
  const [aiSuggestedZone, setAiSuggestedZone] = useState<ZoneId | null>(null);
  const [aiSuggestedIntimacy, setAiSuggestedIntimacy] =
    useState<IntimacyId | null>(null);

  // validation flash state for zone/intimacy pickers
  const [zoneError, setZoneError] = useState(false);
  const [intimacyError, setIntimacyError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);

  // remixer panel collapsed state (desktop only)
  const [remixerCollapsed, setRemixerCollapsed] = useState(false);

  const config = folderConfig[folder] ?? folderConfig["utopias"];
  const isDiagram = config.galleryType === "diagram";

  const containerRef = useRef<HTMLDivElement>(null);

  const snapToPane = (pane: "uploader" | "diagram" | "remixer") => {
    if (!containerRef.current) return;
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    const children = containerRef.current.children;
    const idx = pane === "uploader" ? 0 : pane === "diagram" ? 1 : 2;
    const el = children[idx] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "start" });
  };

  useEffect(() => {
    loadContent();
  }, [folder]); // ← re-fetch when folder changes

  useEffect(() => {
    setNews([]);
    setCursor(null);
    setHasMore(true);
    fetchRecentImages({ reset: true });
  }, [folder]);

  const loadContent = async () => {
    await fetchRecentImages({ reset: true });
  };

  const toggleSelection = (image: ImageCardProps) => {
    setSelectedImages((prev) =>
      prev.some((img) => img.url === image.url)
        ? prev.filter((img) => img.url !== image.url)
        : [...prev, image],
    );

    console.log(selectedImages);
  };

  useEffect(() => {
    let storedUserId = sessionStorage.getItem("userId");
    if (!storedUserId) {
      storedUserId = Math.random().toString(36).substring(7);
      sessionStorage.setItem("userId", storedUserId);
    }
    socket.on("receiveMessage", (message) =>
      console.log("gets io message", message),
    );
    socket.on("connect", () => console.log("connects"));
    socket.on("hello", (msg) => console.log("hello", msg));
    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  const [cursor, setCursor] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [tagSearch, setTagSearch] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchRecentImages = async (opts?: {
    reset?: boolean;
    sort?: "asc" | "desc";
    search?: string | null;
  }) => {
    const reset = opts?.reset ?? false;
    const sort = opts?.sort ?? sortOrder;
    const search = opts?.search ?? tagSearch;
    setIsFetchingRecent(true);
    try {
      const qs = new URLSearchParams({ limit: "1000", sort, folder });
      if (!reset && cursor) qs.set("cursor", cursor);
      if (search) qs.set("search", search);
      const response = await fetch(`/api/cloudinary/recent?${qs.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch");

      // Reassemble any titles that were split across continuation context keys
      const normalisedItems: ImageCardProps[] = (
        data.items as (ImageCardProps & { context?: Record<string, string> })[]
      ).map(normaliseItem);

      if (reset) {
        setNews(normalisedItems);
        console.log("has images", normalisedItems);
      } else {
        setNews((prev) => [...prev, ...normalisedItems]);
      }
      setCursor(data.nextCursor);
      setHasMore(Boolean(data.nextCursor));
    } finally {
      setIsFetchingRecent(false);
    }
  };

  const resetAndReload = async (
    nextSort: "asc" | "desc",
    nextSearch: string | null,
  ) => {
    setCursor(null);
    setNews([]);
    setHasMore(true);
    setSortOrder(nextSort);
    setTagSearch(nextSearch);
    await fetchRecentImages({
      reset: true,
      sort: nextSort,
      search: nextSearch,
    });
  };

  const handleToggleSort = async () => {
    const next = sortOrder === "asc" ? "desc" : "asc";
    await resetAndReload(next, tagSearch);
  };

  const handleTagClick = async (tag: string) => {
    await resetAndReload(sortOrder, tag);
  };

  const showSucces = (duration = 1500) => {
    setSucces(true);
    setTimeout(() => setSucces(false), duration);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === " " ||
      e.keyCode === 32 ||
      e.keyCode === 0 ||
      e.key === "Enter"
    ) {
      e.preventDefault();
      if (currentWord.trim()) {
        setWords([...words, currentWord.trim()]);
        setCurrentWord("");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(" ") || value.endsWith("\n")) {
      if (currentWord.trim()) {
        setWords([...words, currentWord.trim()]);
        setCurrentWord("");
      }
    } else {
      setCurrentWord(value);
    }
  };

  const joinWithComma = (words: string[]): string => words.join(", ");

  const generateRemix = async () => {
    setLoading(true);
    setCollagedImage(null);

    if (selectedImages.length > 1) {
      try {
        let prompts = [];
        let tags = [];
        let ids = [];
        for (let index = 0; index < selectedImages.length; index++) {
          const element = selectedImages[index];
          prompts.push(element.description);
          ids.push(element.url);
          for (let index = 0; index < element.tags.length; index++) {
            const tag = element.tags[index];
            tags.push(tag);
          }
        }

        setSelectedParentIDs(ids);

        // user's own description takes priority — prepend it to the source prompts
        const userText = textArea.current?.value?.trim() ?? "";
        const combinedPrompt = userText
          ? `${userText}. inspired by: ${joinWithComma(prompts)}`
          : joinWithComma(prompts) || "utopias";

        const response = await fetch(
          `/api/generateImage?prompt=${encodeURIComponent(combinedPrompt)}&adjectives=${encodeURIComponent(joinWithComma(tags) || "")}&remixed=yes`,
        );
        const data = await response.json();

        setText(data.remixedPrompt);
        setWords(tags);

        // suggest zone/intimacy from the most common values across selected images
        const zoneCounts = new Map<string, number>();
        const intimacyCounts = new Map<string, number>();
        for (const el of selectedImages) {
          const z = el.tags.find((t) => t.startsWith("zoneofinterest"));
          const l = el.tags.find((t) => t.startsWith("intimacylevel"));
          if (z) zoneCounts.set(z, (zoneCounts.get(z) ?? 0) + 1);
          if (l) intimacyCounts.set(l, (intimacyCounts.get(l) ?? 0) + 1);
        }
        const topZone = Array.from(zoneCounts.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0]?.[0];
        const topIntimacy = Array.from(intimacyCounts.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0]?.[0];
        if (topZone) setAiSuggestedZone(topZone as ZoneId);
        if (topIntimacy) setAiSuggestedIntimacy(topIntimacy as IntimacyId);

        if (!response.ok) throw new Error(data.error || "Generation failed");
        setGeneratedImage(data.imageUrl);
      } catch (err) {
        // setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const generateCollage = async () => {
    if (selectedImages.length < 2) return;
    setLoading(true);
    setGeneratedImage(null); // ensure we only preview one at a time
    try {
      const ids = selectedImages.map((i) => i.url);
      setSelectedParentIDs(ids);

      const dataUrl = (await mosaicBlend(ids, {
        size: 1024,
        block: 32,
        returnType: "dataURL",
        seed: undefined, // set a number for reproducible output, e.g., 42
      })) as string;

      // combine aiTitle values from selected images as the description
      if (!text) {
        const combinedTitles = selectedImages
          .map((i) => i.aiTitle ?? i.title ?? "")
          .filter(Boolean)
          .join(" · ");
        setText(combinedTitles || "collage of fragments");
      }
      if (words.length === 0) {
        const tags = selectedImages.flatMap((i) => i.tags || []);
        setWords(tags);
      }

      setCollagedImage(dataUrl);
      setGeneratedImage(dataUrl); // also set generatedImage so uploader panel shows it
    } catch (e) {
      console.error("Collage failed", e);
    } finally {
      setLoading(false);
    }
  };
  const generateImage = async () => {
    setLoading(true);
    const promptText = textArea.current?.value ?? "";
    if (promptText !== "" || words.length > 0) {
      try {
        const response = await fetch(
          `/api/generateImage?prompt=${encodeURIComponent(promptText || "utopias")}&remixed=yes&adjectives=${encodeURIComponent(joinWithComma(words) || "")}`,
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Generation failed");
        setImage(null);
        setGeneratedImage(data.imageUrl);
        setRemixedPrompt(data.remixedPrompt);
        setText(data.prompt);

        // ✦ AI SUGGESTION POINT 2: classify the generated image's prompt
        // Ask the generateAndUploadImage endpoint for zone+intimacy hints
        // We do a cheap text-only classify via the generateImage prompt text
        try {
          const classRes = await fetch(`/api/classifyImage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: data.remixedPrompt || promptText }),
          });
          if (classRes.ok) {
            const classData = await classRes.json();
            if (classData.zoneofinterest)
              setAiSuggestedZone(classData.zoneofinterest as ZoneId);
            if (classData.intimacylevel)
              setAiSuggestedIntimacy(classData.intimacylevel as IntimacyId);
          }
        } catch {
          // classify is best-effort, ignore failures
        }
      } catch {
        setError("that didnt work");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Alchymist, you need to describe your utopia fragment");
      setLoading(false);
    }
  };

  const upLoadImage = async (_image: string) => {
    try {
      setUploadLoading(true);
      const promptText = textArea.current?.value ?? "";
      if (_image != null) {
        let tags = joinWithComma(words);
        const diagramTags: string[] = [];
        if (selectedZone) diagramTags.push(selectedZone);
        if (selectedIntimacy) diagramTags.push(selectedIntimacy);
        if (diagramTags.length > 0) {
          tags = tags
            ? `${tags}, ${diagramTags.join(", ")}`
            : diagramTags.join(", ");
        }
        const response = await fetch(`/api/cloudinary/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: _image,
            title: promptText || "_",
            tags,
            folder,
            zoneHint: selectedZone,
            intimacyHint: selectedIntimacy,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError("sorry Alchemist, this image is bad");
          setUploadLoading(false);
          throw new Error(data.error || "Upload failed");
        } else {
          // The upload API returns the full title in data.title (already
          // reassembled server-side), so no chunking stitching needed here.
          const _imageCardProp: ImageCardProps = {
            title: data.title,
            url: data.url,
            tags: data.tags,
            aiCaption: data.caption,
            description: data.alt || "Untitled",
            aiTitle: data.ai_title,
            aiVibe: data.ai_vibe,
            aiPolitics: data.ai_political_state,
            aiObjects: data.ai_objects,
            aiStory: data.ai_extended_story,
            id: data.id,
            parentIds: data.parentIds,
          };
          shareImageToSocket(_imageCardProp);
          poorImageIntoCouldron(_imageCardProp);
        }
      } else {
        setError("Alchymist, you need to invent a scene");
      }
    } catch {
      setError("sorry Alchemist, this image is bad");
      setUploadLoading(false);
    } finally {
      setLoading(false);
      setUploadLoading(false);
      setShowUpload(false);
      setImage(null);
      setText("");
      setWords([]);
      setGeneratedImage(null);
      setCollagedImage(null);
      setSelectedImages([]);
    }
  };

  const handleRemoveWord = (index: number) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const shareImageToSocket = (_image: ImageCardProps) => {
    socket.emit("hello", _image);
  };

  const poorImageIntoCouldron = (_image: ImageCardProps) => {
    setNews((prev) => [_image, ...prev]);
    setLoading(false);
    setUploadLoading(false);
    setShowUpload(false);
    showSucces();
    setImage(null);
    setGeneratedImage(null);
    setCollagedImage(null); // ← clear mosaic
    setSelectedImages([]); // ← clear remix selections (removes active REMIX btn state)
    setShowGallery(false);
    setText("");
    setWords([]);
    setSelectedZone(null);
    setSelectedIntimacy(null);
    setAiSuggestedZone(null);
    setAiSuggestedIntimacy(null);
  };

  // ── ✦ AI ZONE/INTIMACY SUGGESTION ENTRY POINT ────────────────────────────
  // Suggestions are set in three places:
  //   1. generateRemix() — derives most-common zone/intimacy from selected images' existing tags
  //   2. generateImage() — after image creation, calls /api/classifyImage to suggest zone+intimacy
  //   3. (future) could also be set from upload API response if we want post-upload correction
  // The suggestions appear as purple-highlighted buttons in the picker via .ai-suggested class.
  // User can click any button to override; clicking an ai-suggested button selects it normally.
  // ─────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // require zone and intimacy selections for diagram uploads
    if (isDiagram) {
      const promptText = textArea.current?.value?.trim() ?? "";
      const missingDescription = !promptText;
      const missingZone = !selectedZone;
      const missingIntimacy = !selectedIntimacy;
      if (missingDescription || missingZone || missingIntimacy) {
        if (missingDescription) {
          setDescriptionError(true);
          setTimeout(() => setDescriptionError(false), 1800);
        }
        if (missingZone) {
          setZoneError(true);
          setTimeout(() => setZoneError(false), 1800);
        }
        if (missingIntimacy) {
          setIntimacyError(true);
          setTimeout(() => setIntimacyError(false), 1800);
        }
        return;
      }
    }

    setLoading(true);
    if (image) {
      upLoadImage(image);
    } else if (generatedImage) {
      upLoadImage(generatedImage);
    }
  };

  // ── shared uploader form fields ───────────────────────────────────────────
  const uploaderFormContent = (
    <>
      <div className="uploaderButtons">
        <label
          htmlFor="image-upload"
          className={
            !loading
              ? "imgUploadBtn active super-default"
              : "imgUploadBtn passive super-default"
          }
        >
          {image ? "upload another image" : "upload new image"}
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="sr-only"
        />
        <button
          disabled={loading}
          type="button"
          className={
            !loading ? "active super-default" : "passive super-default"
          }
          onClick={() => generateImage()}
        >
          {generatedImage ? "recreate image" : "create image"}
        </button>
      </div>

      <div className="imageResultContainer">
        <div className="imageResult">
          {loading ? (
            <img src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1742059296/brewing_ruxhpm.gif" />
          ) : image ? (
            <>
              <button
                className="closebtn"
                type="button"
                onClick={() => setImage(null)}
              >
                X
              </button>
              <img src={image} alt="Preview" />
            </>
          ) : generatedImage ? (
            <>
              <button
                className="closebtn"
                type="button"
                onClick={() => setGeneratedImage(null)}
              >
                X
              </button>
              <img src={generatedImage} alt="Generated" />
            </>
          ) : uploading ? (
            <div className="loaderAnim" />
          ) : null}
        </div>
      </div>

      <div
        className={`textinputs${error !== "" || descriptionError ? " error" : ""}`}
      >
        <p>
          describe your utopia{" "}
          <span style={{ color: "#ff4444", fontSize: "9px" }}>*required</span>
        </p>
        <textarea
          ref={textArea}
          id="text"
          value={text}
          autoCorrect="false"
          onChange={(e) => setText(e.target.value)}
          placeholder="in my utopia there is..."
        />
      </div>

      <div className={error !== "" ? "wordinputs error" : "wordinputs"}>
        <p>adjectives</p>
        <input
          type="text"
          value={currentWord}
          autoCorrect="false"
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="tag the image"
        />
        <div className="flex-row-wrap adjButtons">
          {words.map((word, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleRemoveWord(index)}
              className="adjBtn super-default"
            >
              {word} ✖
            </button>
          ))}
        </div>
      </div>

      {isDiagram && (
        <div className="diagram-pickers">
          <div
            className={`diagram-picker-group ${zoneError ? "picker-error" : ""}`}
          >
            <p className="diagram-picker-label">
              zone of interest
              {aiSuggestedZone && (
                <span className="ai-suggestion">
                  {" "}
                  — AI suggests:{" "}
                  <button
                    type="button"
                    className="ai-suggest-btn"
                    onClick={() => setSelectedZone(aiSuggestedZone)}
                  >
                    {ZONES.find((z) => z.id === aiSuggestedZone)?.label}
                  </button>
                </span>
              )}
            </p>
            <div className="diagram-picker-options">
              {ZONES.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  className={`diagram-pick-btn ${selectedZone === zone.id ? "selected" : ""} ${aiSuggestedZone === zone.id && selectedZone !== zone.id ? "ai-suggested" : ""}`}
                  onClick={() =>
                    setSelectedZone(selectedZone === zone.id ? null : zone.id)
                  }
                >
                  {zone.label}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`diagram-picker-group ${intimacyError ? "picker-error" : ""}`}
          >
            <p className="diagram-picker-label">
              intimacy level
              {aiSuggestedIntimacy && (
                <span className="ai-suggestion">
                  {" "}
                  — AI suggests:{" "}
                  <button
                    type="button"
                    className="ai-suggest-btn"
                    onClick={() => setSelectedIntimacy(aiSuggestedIntimacy)}
                  >
                    {
                      INTIMACY_LEVELS.find((l) => l.id === aiSuggestedIntimacy)
                        ?.label
                    }
                  </button>
                </span>
              )}
            </p>
            <div className="diagram-picker-options">
              {INTIMACY_LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  className={`diagram-pick-btn ${selectedIntimacy === lvl.id ? "selected" : ""} ${aiSuggestedIntimacy === lvl.id && selectedIntimacy !== lvl.id ? "ai-suggested" : ""}`}
                  onClick={() =>
                    setSelectedIntimacy(
                      selectedIntimacy === lvl.id ? null : lvl.id,
                    )
                  }
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="uploaderButtons right">
        <button
          type="submit"
          disabled={loading || (!image && !generatedImage)}
          className={
            loading || (!image && !generatedImage)
              ? "passive super-default"
              : "active super-default"
          }
        >
          {loading ? "uploading..." : "pour into potion"}
        </button>
      </div>
    </>
  );

  // ── diagram layout: 3-column desktop / 3-page swipe mobile ───────────────
  if (isDiagram) {
    return (
      <div className="mainContainer" ref={containerRef}>
        {/* PAGE 1 / LEFT: Upload */}
        <form onSubmit={handleSubmit} className="diagram-uploader">
          {uploading && <div className="panel-uploading-overlay" />}
          <img
            className="logoinline"
            style={{ maxWidth: "calc(100% - 0px)" }}
            src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1741868576/logo_efs6jc.gif"
          />
          <p className="panel-title">contribute a fragment</p>
          {uploaderFormContent}
          <div className="mobile-nav-hint">
            <button
              type="button"
              className="mobile-nav-btn"
              onClick={() => snapToPane("diagram")}
            >
              view diagram →
            </button>
          </div>
          {succes && (
            <div className="succes">
              <p>fragment added</p>
            </div>
          )}
          {error !== "" && (
            <div
              className="succes error"
              onClick={() => {
                setError("");
                setLoading(false);
              }}
            >
              <p>{error}</p>
            </div>
          )}
        </form>

        {/* PAGE 2 / CENTER: Diagram */}
        <div className="diagram-center">
          <DiagramGallery
            news={news}
            onTagClick={handleTagClick}
            onClose={() => {}}
            selectedImages={selectedImages}
            onRemix={(img) => {
              toggleSelection(img);
              snapToPane("remixer");
            }}
          />
          <div className="mobile-nav-hint diagram-mobile-nav">
            <button
              type="button"
              className="mobile-nav-btn"
              onClick={() => snapToPane("uploader")}
            >
              ← upload
            </button>
            <button
              type="button"
              className="mobile-nav-btn"
              onClick={() => snapToPane("remixer")}
            >
              remix →
            </button>
          </div>
        </div>

        <aside
          className={`diagram-remixer${remixerCollapsed ? " remixer-collapsed" : ""}`}
        >
          {uploading && <div className="panel-uploading-overlay" />}

          {/* collapse toggle — desktop only */}
          <button
            type="button"
            className="remixer-collapse-btn"
            onClick={() => setRemixerCollapsed((v) => !v)}
            title={remixerCollapsed ? "open remixer" : "collapse remixer"}
          >
            {remixerCollapsed ? "◁ remix" : "▷"}
          </button>

          {!remixerCollapsed && (
            <>
              <img
                className="logoinline"
                style={{ maxWidth: "calc(100% - 0px)" }}
                src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1741868576/logo_efs6jc.gif"
              />
              <p className="panel-title">remix fragments</p>

              {/* action buttons — active only with 2+ selections */}
              <div className="uploaderButtons galleryUploaderButtons">
                <button
                  disabled={loading || selectedImages.length < 2}
                  type="button"
                  className={
                    selectedImages.length >= 2 && !loading
                      ? "active super-default"
                      : "passive super-default"
                  }
                  onClick={() => generateRemix()}
                >
                  {generatedImage ? "recreate AI vision" : "AI remix"}
                </button>
                <button
                  disabled={loading || selectedImages.length < 2}
                  type="button"
                  className={
                    selectedImages.length >= 2 && !loading
                      ? "active super-default"
                      : "passive super-default"
                  }
                  onClick={() => generateCollage()}
                >
                  {collagedImage ? "reblend mosaic" : "mosaic blend"}
                </button>
              </div>

              {/* preview */}
              <div className="imageResultContainer">
                <div className="imageResult">
                  {loading ? (
                    <img src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1742059296/brewing_ruxhpm.gif" />
                  ) : generatedImage ? (
                    <img src={generatedImage} alt="Generated" />
                  ) : collagedImage ? (
                    <img src={collagedImage} alt="Mosaic" />
                  ) : (
                    <>
                      {selectedImages.length > 0 ? (
                        <div
                          className="remix-selected-grid"
                          style={
                            {
                              "--thumb-size": `calc((80% - ${(Math.ceil(Math.sqrt(selectedImages.length)) - 1) * 6}px) / ${Math.ceil(Math.sqrt(selectedImages.length))})`,
                            } as React.CSSProperties
                          }
                        >
                          {selectedImages.map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              className="remix-selected-thumb"
                              onClick={() => toggleSelection(img)}
                              title="click to remove"
                            >
                              <img
                                src={cloudinaryQuality(img.url, 160, 50)}
                                alt={img.aiTitle ?? ""}
                              />
                              <span className="remix-thumb-remove">×</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="remix-placeholder">
                          pick some utopias to remix
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* upload once we have a result */}
              {(generatedImage || collagedImage) && (
                <div className="uploaderButtons right">
                  <p
                    className="remix-placeholder desktop-only"
                    style={{ textAlign: "right", padding: 0 }}
                  >
                    ↑ image ready in uploader
                  </p>
                  <button
                    type="button"
                    className="super-default mobile-only"
                    onClick={() => snapToPane("uploader")}
                  >
                    tag &amp; pour into diagram →
                  </button>
                </div>
              )}

              {/* Mobile nav */}
              <div className="mobile-nav-hint">
                <button
                  type="button"
                  className="mobile-nav-btn"
                  onClick={() => snapToPane("diagram")}
                >
                  ← back to diagram
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    );
  }

  // ── standard brew-container layout (utopias folder) ──────────────────────
  return (
    <div className="brew-container">
      <video
        className={showGallery ? "couldron openCouldronVideo" : "couldron"}
        src="https://res.cloudinary.com/dmwpm8iiw/video/upload/v1741863927/loopcouldron_svu0rw.mp4?q_auto:eco"
        autoPlay
        loop
        muted
        playsInline
      />
      <div
        className={showGallery ? "GalleryContainer" : "GalleryContainer hidden"}
      >
        <div className="gallerySearch sortOrder">
          <button
            disabled={isFetchingRecent}
            onClick={handleToggleSort}
            className="tagBtn"
          >
            {isFetchingRecent
              ? "..."
              : `Sort: ${sortOrder.toUpperCase() === "ASC" ? "oldest" : "newest"}`}
          </button>
        </div>
        <div className="tags gallerySearch">
          {[
            { label: "we share a meal", tag: "table" },
            { label: "we live with nature", tag: "nature" },
            { label: "the sun sets", tag: "sunset" },
            { label: "we feel connected", tag: "connection" },
            { label: "the broccoli rules", tag: "broccoli" },
          ].map(({ label, tag }) => (
            <button
              key={tag}
              disabled={isFetchingRecent}
              onClick={() => handleTagClick(tag)}
              className="Button"
            >
              {label}
            </button>
          ))}
        </div>
        <Gallery
          news={news}
          poorRemixedImageIntoCouldron={poorImageIntoCouldron}
          shareImageToSocket={shareImageToSocket}
          onTagClick={handleTagClick}
        />
        <button
          disabled={isFetchingRecent || !hasMore}
          onClick={() => fetchRecentImages()}
          className="Button Loadmore"
        >
          {isFetchingRecent
            ? "expanding..."
            : !hasMore
              ? "no more fragments"
              : "load more utopia fragments"}
        </button>
      </div>

      <div className="buttons">
        <button
          className={`btn ${showUpload ? "lil" : ""}`}
          onClick={() => {
            setText("");
            if (showGallery) {
              setShowGallery(false);
              setTimeout(() => setShowUpload(true), 2000);
            } else {
              setShowUpload(!showUpload);
            }
          }}
        >
          add utopia fragment
        </button>
        {!showGallery && (
          <button
            className={`btn ${showUpload ? "lil" : ""}`}
            onClick={() => setShowGallery(!showGallery)}
          >
            dive into the potion
          </button>
        )}
      </div>

      <img
        className={showGallery ? "overlay openCouldron" : "overlay"}
        src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1741865808/couldronoverlay_bg8osp.png"
      />
      <div
        className={showGallery ? "expand desktopborder1" : "desktopborder1"}
      />

      {showUpload && (
        <>
          <div className="backdrop">
            {uploading && (
              <img
                className="loadingAnim"
                src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1755241109/uploader_oxznq4.png"
              />
            )}
          </div>
          <form
            onSubmit={handleSubmit}
            className={uploading ? "uploading uploader" : "uploader"}
          >
            <button className="closebtn" onClick={() => setShowUpload(false)}>
              X
            </button>
            <div className="uploaderButtons">
              <label
                htmlFor="image-upload2"
                className={
                  !loading ? "imgUploadBtn active" : "imgUploadBtn passive"
                }
              >
                {image ? "upload another image" : "upload new image"}
              </label>
              <input
                id="image-upload2"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />
              <button
                disabled={loading}
                className={!loading ? "active" : "passive"}
                onClick={() => generateImage()}
              >
                {generatedImage ? "recreate image" : "create image"}
              </button>
            </div>
            <div className="imageResult">
              {loading ? (
                <img
                  className="loaderGif"
                  src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1742059296/brewing_ruxhpm.gif"
                />
              ) : image ? (
                <div>
                  <button className="closebtn" onClick={() => setImage(null)}>
                    X
                  </button>
                  <img src={image} alt="Preview" className="subImage" />
                </div>
              ) : generatedImage ? (
                <div>
                  <button
                    className="closebtn"
                    onClick={() => setGeneratedImage(null)}
                  >
                    X
                  </button>
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full rounded-lg"
                  />
                </div>
              ) : null}
            </div>
            <div className={error !== "" ? "textinputs error" : "textinputs"}>
              <textarea
                ref={textArea}
                id="text"
                value={text}
                autoCorrect="false"
                onChange={(e) => setText(e.target.value)}
                placeholder="in my utopia there is... "
              />
            </div>
            <div className={error !== "" ? "wordinputs error" : "wordinputs"}>
              <input
                type="text"
                value={currentWord}
                autoCorrect="false"
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="or describe it with adjectives"
              />
              <div className="flex-row-wrap adjButtons">
                {words.map((word, index) => (
                  <button
                    key={index}
                    onClick={() => handleRemoveWord(index)}
                    className="adjBtn"
                  >
                    {word} ✖
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className={
                loading
                  ? "passive"
                  : generatedImage
                    ? "active"
                    : image
                      ? "active"
                      : "passive"
              }
            >
              {loading ? "loading content" : "pour into potion"}
            </button>
          </form>
        </>
      )}

      {succes && (
        <div className="success">
          <img src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1742061490/giphy_knfko7.gif" />
          <p>*sympoetic thanx u*</p>
        </div>
      )}
      {error !== "" && (
        <div
          className="errorMessage"
          onClick={() => {
            setError("");
            setLoading(false);
          }}
        >
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

type ImgSource = string | HTMLImageElement;

interface MosaicOptions {
  size?: number; // default 1024
  block?: number; // default 32
  seed?: number | null; // optional seed
  returnType?: "canvas" | "dataURL" | "blob";

  // NEW – soft overlays
  overlayPatchesPerImage?: number; // default 5
  overlaySizeRange?: [number, number]; // default [48, 192]
  overlayBlendMode?: GlobalCompositeOperation; // default "overlay" (fallback: "multiply")
  overlayAlpha?: number; // default 0.6
}

async function mosaicBlend(
  sources: ImgSource[],
  opts: MosaicOptions = {},
): Promise<HTMLCanvasElement | string | Blob> {
  const size = opts.size ?? 1024;
  const block = 64 * 2;
  const returnType = opts.returnType ?? "canvas";
  if (size % block !== 0) throw new Error("size must be divisible by block");
  if (!sources.length) throw new Error("No images provided");

  // Seedable RNG (Mulberry32)
  let rng = Math.random;
  if (opts.seed != null) {
    let s = opts.seed >>> 0 || 1;
    rng = () => {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const randInt = (min: number, max: number) =>
    Math.floor(rng() * (max - min + 1)) + min;
  const randFloat = (min: number, max: number) => rng() * (max - min) + min;

  // Load & normalize each source to size×size (cover fit)
  const prepared = await Promise.all(
    sources.map(async (src) => {
      const img = await loadImage(src);
      const cnv = document.createElement("canvas");
      cnv.width = size;
      cnv.height = size;
      const ctx = cnv.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";

      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const dx = (size - w) / 2;
      const dy = (size - h) / 2;
      ctx.drawImage(img, dx, dy, w, h);
      return cnv;
    }),
  );

  // Output canvas
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const octx = out.getContext("2d")!;

  // ---- base mosaic (32×32 blocks by default)
  const tiles = size / block;
  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const srcIdx = Math.floor(rng() * prepared.length);
      const src = prepared[srcIdx];
      const sx = tx * block;
      const sy = ty * block;
      octx.drawImage(src, sx, sy, block, block, sx, sy, block, block);
    }
  }

  // ---- soft overlays (random rects from each image, drawn back at same coords)
  const patchesPerImage = opts.overlayPatchesPerImage ?? 5;
  const [minSide, maxSide] = opts.overlaySizeRange ?? [64 * 2, 64 * 5];
  const blend: GlobalCompositeOperation = (opts.overlayBlendMode ??
    "overlay") as GlobalCompositeOperation;
  const alpha = opts.overlayAlpha ?? 0.6;

  // save state
  const prevOp = octx.globalCompositeOperation;
  const prevAlpha = octx.globalAlpha;

  // If "overlay" misbehaves in your target browser, switch to "multiply"
  octx.globalCompositeOperation = blend;
  octx.globalAlpha = alpha;

  for (const src of prepared) {
    for (let i = 0; i < patchesPerImage; i++) {
      // random size & aspect
      const w = randInt(minSide, maxSide);
      const h = randInt(minSide, maxSide * 1.25); // slight aspect variety
      const sx = randInt(0, Math.max(0, size - w));
      const sy = randInt(0, Math.max(0, size - h));

      // draw back at the *same* location (sx, sy)
      octx.drawImage(src, sx, sy, w, h, sx, sy, w, h);
    }
  }

  // restore
  octx.globalCompositeOperation = prevOp;
  octx.globalAlpha = prevAlpha;

  if (returnType === "canvas") return out;
  if (returnType === "dataURL") return out.toDataURL("image/png");
  if (returnType === "blob")
    return await new Promise<Blob>(
      (res) => out.toBlob((b) => res(b!), "image/png")!,
    );
  return out;
}

function loadImage(src: ImgSource): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof src !== "string") {
      if (src.complete && src.naturalWidth) return resolve(src);
      src.onload = () => resolve(src);
      src.onerror = reject;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
