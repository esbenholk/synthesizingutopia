"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { ImageCardProps } from "./imageCardProps";
import {
  ZONES,
  INTIMACY_LEVELS,
  ZoneId,
  IntimacyId,
} from "../config/folderConfig";

// ── helpers ───────────────────────────────────────────────────────────────────

function getZone(tags: string[]): ZoneId | null {
  const lower = tags.map((t) => t.trim().toLowerCase());
  for (const z of ZONES) if (lower.includes(z.id)) return z.id;
  return null;
}

function getIntimacy(tags: string[]): IntimacyId | null {
  const lower = tags.map((t) => t.trim().toLowerCase());
  for (const lvl of INTIMACY_LEVELS) if (lower.includes(lvl.id)) return lvl.id;
  return null;
}

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

function qualityForZoom(zoom: number): { q: number; w: number } {
  if (zoom < 1.2) return { q: 30, w: 80 };
  if (zoom < 2.5) return { q: 55, w: 160 };
  if (zoom < 5) return { q: 75, w: 320 };
  return { q: 90, w: 640 };
}

// ── constants ─────────────────────────────────────────────────────────────────

const GREEN = "#00ff00";
const RING_INNER_RATIO = [0.18, 0.45, 0.72];
const RING_OUTER_RATIO = [0.42, 0.7, 0.97];
const BASE_STROKE = 0.8;
const MAX_ZOOM = 80;
const ROTATION_OFFSET = 0; // no rotation — zone 0 (Ecology) boundary at 12 o'clock

// ── component ─────────────────────────────────────────────────────────────────

export default function DiagramGallery({
  news,
  onTagClick,
  onClose,
  onRemix,
  selectedImages = [],
}: {
  news: ImageCardProps[];
  onTagClick?: (tag: string) => void;
  onClose?: () => void;
  onRemix?: (img: ImageCardProps) => void;
  selectedImages?: ImageCardProps[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const currentZoomRef = useRef<number>(1);
  const selectedImagesRef = useRef<ImageCardProps[]>(selectedImages);
  // maps image.url → the src string currently loaded in the SVG (reused by detail card)
  const cachedSrcRef = useRef<Map<string, string>>(new Map());

  // Keep ref in sync with prop
  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  // Fixed overlay card
  const [selected, setSelected] = useState<ImageCardProps | null>(null);

  // ── build cell map ────────────────────────────────────────────────────────
  const cells: ImageCardProps[][][] = ZONES.map(() =>
    INTIMACY_LEVELS.map(() => []),
  );

  for (const img of news) {
    const zoneId = getZone(img.tags);
    const intimacyId = getIntimacy(img.tags);
    if (zoneId && intimacyId) {
      const zi = ZONES.findIndex((z) => z.id === zoneId);
      const ri = INTIMACY_LEVELS.findIndex((l) => l.id === intimacyId);
      cells[zi][ri].push(img);
    } else {
      console.warn(
        "[DiagramGallery] unplaced image",
        img.aiTitle,
        "| tags:",
        img.tags,
        "| zoneId:",
        zoneId,
        "| intimacyId:",
        intimacyId,
      );
    }
  }

  // ── draw ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;

    const el = svgRef.current;
    const W = el.parentElement?.clientWidth || window.innerWidth;
    const H = el.parentElement?.clientHeight || window.innerHeight;
    const size = Math.min(W, H) * 0.92;
    const cx = W / 2;
    const cy = H / 2;
    const outerR = size * 0.42;

    const svg = d3.select(el);
    svg.selectAll("*").remove();
    svg
      .attr("width", W)
      .attr("height", H)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .style("cursor", "grab");

    const zoomG = svg.append("g").attr("class", "zoom-g");
    const g = zoomG.append("g").attr("transform", `translate(${cx},${cy})`);
    // buttons are appended to this group AFTER all arcs+images so they're always on top
    const btnLayer = zoomG
      .append("g")
      .attr("class", "btn-layer")
      .attr("transform", `translate(${cx},${cy})`);

    const numZones = ZONES.length;
    const sliceAngle = (2 * Math.PI) / numZones;
    const startAngle = (i: number) =>
      -Math.PI / 2 + ROTATION_OFFSET + i * sliceAngle;

    type AnySelection = d3.Selection<any, unknown, null, undefined>;
    const strokeEls: AnySelection[] = [];
    const addStroke = (sel: AnySelection) => {
      strokeEls.push(sel);
      return sel;
    };
    const imageEls = new Map<
      string,
      { sel: AnySelection; img: ImageCardProps; w: number }
    >();

    // ── cells ─────────────────────────────────────────────────────────────
    ZONES.forEach((_zone, zi) => {
      INTIMACY_LEVELS.forEach((_lvl, ri) => {
        const innerR = outerR * RING_INNER_RATIO[ri];
        const outerRing = outerR * RING_OUTER_RATIO[ri];
        const cellImages = cells[zi][ri];

        const arcGen = d3
          .arc<unknown>()
          .innerRadius(innerR)
          .outerRadius(outerRing)
          .startAngle(startAngle(zi))
          .endAngle(startAngle(zi) + sliceAngle)
          .padAngle(0.018)
          .padRadius(outerR * 0.5)
          .cornerRadius(2);

        g.append("path")
          .attr("d", arcGen(null as unknown) as string)
          .attr("fill", GREEN)
          .attr("fill-opacity", 0.025 + ri * 0.015);

        addStroke(
          g
            .append("path")
            .attr("d", arcGen(null as unknown) as string)
            .attr("fill", "none")
            .attr("stroke", GREEN)
            .attr("stroke-opacity", 1)
            .attr("stroke-width", BASE_STROKE),
        );

        if (cellImages.length === 0) return;

        const midAngle = startAngle(zi) + sliceAngle / 2;
        const midR = (innerR + outerRing) / 2;

        // deterministic seeded RNG per cell so layout is stable across renders
        const seed = zi * 100 + ri;
        let s = seed + 1;
        const rng = () => {
          s = Math.imul(s ^ (s >>> 15), s | 1);
          s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
          return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff;
        };

        const radialSpan = (outerRing - innerR) * 0.75;
        const angularSpan = sliceAngle * midR * 0.72;
        const n = cellImages.length;
        const cols = Math.max(
          1,
          Math.round(Math.sqrt(n * (angularSpan / radialSpan))),
        );
        const rows = Math.ceil(n / cols);
        const thumb = Math.min(angularSpan / cols, radialSpan / rows);
        const gap = thumb * 0.06;
        const tw = thumb - gap * 2;
        // jitter up to 30% of thumb size in each axis
        const jitter = tw * 0.3;

        // Build a regular grid of candidate slot centres in arc-local coords
        // then scatter each image within its slot
        const gridW = cols * thumb;
        const gridH = rows * thumb;

        cellImages.forEach((img, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);

          // slot centre in rotated arc coords (u=angular, v=radial)
          const u =
            -gridW / 2 + col * thumb + thumb / 2 + (rng() - 0.5) * jitter;
          const v =
            -gridH / 2 + row * thumb + thumb / 2 + (rng() - 0.5) * jitter;

          // convert arc-local (u along arc tangent, v along radius) to cartesian
          // arc tangent direction is perpendicular to midAngle radius
          const tx = Math.cos(midAngle + Math.PI / 2); // tangent x
          const ty = Math.sin(midAngle + Math.PI / 2); // tangent y
          const rx = Math.cos(midAngle); // radial x
          const ry = Math.sin(midAngle); // radial y

          const ix = midR * rx + u * tx + v * rx;
          const iy = midR * ry + u * ty + v * ry;

          const { q, w } = qualityForZoom(1);
          const initialSrc = cloudinaryQuality(img.url, w, q);
          cachedSrcRef.current.set(img.url, initialSrc);

          // image
          const imgEl = g
            .append("image")
            .attr("href", initialSrc)
            .attr("x", ix - tw / 2)
            .attr("y", iy - tw / 2)
            .attr("width", tw)
            .attr("height", tw)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("opacity", "0.85")
            .on("mouseenter", function () {
              d3.select(this).style("opacity", "1");
            })
            .on("mouseleave", function () {
              d3.select(this).style("opacity", "0.85");
            });

          imageEls.set(`${zi}-${ri}-${idx}`, {
            sel: imgEl as AnySelection,
            img,
            w: tw,
          });

          // ── SVG buttons at bottom-right of each image ──────────────────
          // Sized in diagram units — proportional to thumb size
          const btnW = tw * 0.05; // 5% of image width
          const btnH = btnW * 0.45;
          const btnGap = btnW * 0.08;
          const fontSize = btnH * 0.52;
          const bx = ix + tw / 2;
          const by = iy + tw / 2;

          // OPEN button
          const openBtn = btnLayer.append("g").style("cursor", "pointer");

          openBtn
            .append("rect")
            .attr("x", bx - btnW)
            .attr("y", by - btnH * 2 - btnGap)
            .attr("width", btnW)
            .attr("height", btnH)
            .attr("fill", "#6508ff")
            .attr("stroke", GREEN)
            .attr("stroke-width", tw * 0.0015)
            .attr("stroke-opacity", 1)
            .attr("rx", btnH * 0.5);

          openBtn
            .append("text")
            .attr("x", bx - btnW / 2)
            .attr("y", by - btnH * 2 - btnGap + btnH / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", GREEN)
            .attr("font-size", fontSize)
            .attr("font-family", "'Courier New', monospace")
            .attr("letter-spacing", "0.06em")
            .attr("pointer-events", "none")
            .text("OPEN");

          openBtn.on("click", (event: MouseEvent) => {
            event.stopPropagation();
            console.log("[DiagramGallery] OPEN clicked", {
              title: img.aiTitle,
              url: img.url,
              tags: img.tags,
              zone: getZone(img.tags),
              intimacy: getIntimacy(img.tags),
              description: img.title,
            });
            setSelected(img);
          });

          // REMIX button
          const isSelected = () =>
            selectedImagesRef.current.some((i) => i.url === img.url);
          const remixBtn = btnLayer.append("g").style("cursor", "pointer");

          remixBtn
            .append("rect")
            .attr("x", bx - btnW)
            .attr("y", by - btnH - btnGap / 2)
            .attr("width", btnW)
            .attr("height", btnH)
            .attr("fill", isSelected() ? GREEN : "#6508ff")
            .attr("stroke", GREEN)
            .attr("stroke-width", tw * 0.0015)
            .attr("stroke-opacity", 1)
            .attr("rx", btnH * 0.5)
            .attr("class", `remix-rect-${zi}-${ri}-${idx}`);

          remixBtn
            .append("text")
            .attr("x", bx - btnW / 2)
            .attr("y", by - btnH - btnGap / 2 + btnH / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", isSelected() ? "#000" : GREEN)
            .attr("font-size", fontSize)
            .attr("font-family", "'Courier New', monospace")
            .attr("letter-spacing", "0.06em")
            .attr("pointer-events", "none")
            .attr("class", `remix-text-${zi}-${ri}-${idx}`)
            .text("REMIX");

          remixBtn.on("click", (event: MouseEvent) => {
            event.stopPropagation();
            const nowSelected = !selectedImagesRef.current.some(
              (i) => i.url === img.url,
            );
            console.log("[DiagramGallery] REMIX clicked", {
              title: img.aiTitle,
              selected: nowSelected,
              zone: getZone(img.tags),
              intimacy: getIntimacy(img.tags),
            });
            // Live visual toggle — no redraw needed
            d3.select(`.remix-rect-${zi}-${ri}-${idx}`).attr(
              "fill",
              nowSelected ? GREEN : "#6508ff",
            );
            d3.select(`.remix-text-${zi}-${ri}-${idx}`).attr(
              "fill",
              nowSelected ? "#000" : GREEN,
            );
            onRemix?.(img);
          });
        });
      });
    });

    // ── rings ─────────────────────────────────────────────────────────────
    [...RING_OUTER_RATIO, RING_INNER_RATIO[0]].forEach((ratio, i) => {
      addStroke(
        g
          .append("circle")
          .attr("r", outerR * ratio)
          .attr("fill", "none")
          .attr("stroke", GREEN)
          .attr("stroke-opacity", i === RING_OUTER_RATIO.length ? 0.12 : 0.2)
          .attr("stroke-width", BASE_STROKE),
      );
    });

    // ── zone labels ───────────────────────────────────────────────────────
    ZONES.forEach((zone, zi) => {
      const labelR = outerR * 1.075;
      const midAngle = startAngle(zi) + sliceAngle / 2;
      g.append("text")
        .attr("x", Math.cos(midAngle) * labelR)
        .attr("y", Math.sin(midAngle) * labelR)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", GREEN)
        .attr("font-size", size * 0.021)
        .attr("font-family", "'Courier New', monospace")
        .attr("letter-spacing", "0.07em")
        .text(zone.label.toUpperCase());
    });

    // ── intimacy labels ───────────────────────────────────────────────────
    INTIMACY_LEVELS.forEach((lvl, ri) => {
      const midR =
        (outerR * RING_INNER_RATIO[ri] + outerR * RING_OUTER_RATIO[ri]) / 2;
      const fontSize = size * 0.012;
      const lineHeight = fontSize * 1.3;
      const [line1, line2] = lvl.label.toUpperCase().split("/");

      const text = g
        .append("text")
        .attr("x", 0)
        .attr("y", -midR)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", GREEN)
        .attr("font-size", fontSize)
        .attr("font-family", "'Courier New', monospace")
        .attr("opacity", 1);

      if (line2) {
        text
          .append("tspan")
          .attr("x", 0)
          .attr("dy", -lineHeight / 2)
          .text(line1.trim());
        text
          .append("tspan")
          .attr("x", 0)
          .attr("dy", lineHeight)
          .text(line2.trim());
      } else {
        text.text(line1);
      }
    });

    // ── center ────────────────────────────────────────────────────────────
    addStroke(
      g
        .append("circle")
        .attr("r", outerR * RING_INNER_RATIO[0] * 0.8)
        .attr("fill", "none")
        .attr("stroke", GREEN)
        .attr("stroke-opacity", 1)
        .attr("stroke-width", BASE_STROKE),
    );
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", GREEN)
      .attr("font-size", size * 0.02)
      .attr("opacity", 1)
      .text("◎");

    // ── zoom ──────────────────────────────────────────────────────────────
    let qualityUpdateTimer: ReturnType<typeof setTimeout> | null = null;
    let snapPending = false;

    const updateImageQualities = (zoomK: number) => {
      const { q, w } = qualityForZoom(zoomK);
      const viewRect = { x: 0, y: 0, w: W, h: H };
      imageEls.forEach(({ sel, img, w: thumbW }) => {
        const imgNode = sel.node() as SVGImageElement | null;
        if (!imgNode) return;
        try {
          const bbox = imgNode.getBoundingClientRect();
          const inView =
            bbox.right > viewRect.x &&
            bbox.left < viewRect.x + viewRect.w &&
            bbox.bottom > viewRect.y &&
            bbox.top < viewRect.y + viewRect.h;
          if (inView) {
            const newSrc = cloudinaryQuality(
              img.url,
              Math.max(w, thumbW * zoomK),
              q,
            );
            sel.attr("href", newSrc);
            cachedSrcRef.current.set(img.url, newSrc);
          }
        } catch {
          sel.attr("href", cloudinaryQuality(img.url, w, q));
        }
      });
    };

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .on("start", () => {
        svg.style("cursor", "grabbing");
        snapPending = false;
      })
      .on("end", (event) => {
        svg.style("cursor", "grab");
        updateImageQualities(event.transform.k);
      })
      .on("zoom", (event) => {
        const { transform } = event;
        currentZoomRef.current = transform.k;

        if (transform.k <= 1 && !snapPending) {
          snapPending = true;
          d3.select(svgRef.current!)
            .transition()
            .duration(300)
            .call(zoom.transform, d3.zoomIdentity);
          return;
        }

        zoomG.attr("transform", transform.toString());
        const sw = BASE_STROKE / transform.k;
        strokeEls.forEach((el) => el.attr("stroke-width", sw));

        if (qualityUpdateTimer) clearTimeout(qualityUpdateTimer);
        qualityUpdateTimer = setTimeout(
          () => updateImageQualities(transform.k),
          120,
        );
      });

    zoomRef.current = zoom;
    svg.call(zoom);
    svg.on("dblclick.zoom", null);

    return () => {
      if (qualityUpdateTimer) clearTimeout(qualityUpdateTimer);
    };
  }, [news]);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(380)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  return (
    <div className="diagram-fullscreen">
      <svg ref={svgRef} className="diagram-svg-fixed" />

      {/* ── fixed overlay card ─────────────────────────────────────────── */}
      {selected && (
        <div
          className="diagram-detail-overlay"
          onClick={() => setSelected(null)}
        >
          <div
            className="diagram-detail-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="closebtn" onClick={() => setSelected(null)}>
              X
            </button>
            <img
              src={
                cachedSrcRef.current.get(selected.url) ??
                cloudinaryQuality(selected.url, 600, 85)
              }
              alt={selected.description}
              style={{ width: "100%", display: "block" }}
            />
            <div className="Info">
              {selected.description && selected.description !== "Untitled" && (
                <p className="description">"{selected.description}"</p>
              )}
              {selected.title && <p className="title">"{selected.title}"</p>}
              {selected.aiTitle && (
                <p className="title">"{selected.aiTitle}"</p>
              )}
              {selected.aiPolitics && (
                <p className="politics">{selected.aiPolitics}</p>
              )}
              {selected.aiStory && (
                <p className="story">"{selected.aiStory}"</p>
              )}
              <div className="tags">
                {selected.tags.slice(0, 20).map((tag, i) => (
                  <button
                    key={i}
                    className="tagBtn"
                    onClick={() => {
                      onTagClick?.(tag);
                      setSelected(null);
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {/* remix button inside the card */}
              <div style={{ marginTop: "12px" }}>
                <button
                  className="super-default"
                  style={{ width: "100%" }}
                  onClick={() => {
                    console.log("[DiagramGallery] REMIX from card", {
                      title: selected.aiTitle,
                      url: selected.url,
                      tags: selected.tags,
                      zone: getZone(selected.tags),
                      intimacy: getIntimacy(selected.tags),
                    });
                    onRemix?.(selected);
                    setSelected(null);
                  }}
                >
                  remix this fragment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
