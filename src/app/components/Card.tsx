"use client";

import { ImageCardProps } from "@/components/imageCardProps";
import { useEffect, useState } from "react";

export const Card: React.FC<{
  data: ImageCardProps;
  onTagClick?: (tag: string) => void;
}> = ({ data, onTagClick }) => {
  const [parentIds, setParentIds] = useState<string[]>([]);

  useEffect(() => {
    if (data.parentIds != null) {
      if (typeof data.parentIds === "string" && data.parentIds !== "") {
        try {
          const parsed = JSON.parse(data.parentIds);
          if (Array.isArray(parsed)) setParentIds(parsed);
        } catch (err) {
          setParentIds([]);
          console.error("Invalid parentIds JSON:", err);
        }
      } else {
        setParentIds([]);
      }
    } else {
      setParentIds([]);
    }
  }, [data]);

  // IMPORTANT: don’t mutate props (you were doing data.tags = ...)
  const tags = Array.isArray(data.tags) ? data.tags.slice(0, 20) : [];

  return (
    <>
      <div>
        <img src={data.url} alt={data.description} />
      </div>

      <div className="Info">
        {data.aiTitle && <p className="title"> "{data.aiTitle}"</p>}
        {data.aiPolitics && <p className="politics"> {data.aiPolitics}</p>}
        {data.aiStory && <p className="story"> "{data.aiStory}"</p>}

        {data.title &&
        data.title !== "_" &&
        data.title !== data.aiTitle &&
        parentIds.length === 0 ? (
          <div className="input">
            <p>{data.title}</p>
          </div>
        ) : parentIds.length > 0 ? (
          <div className="input">
            {parentIds.map((element, index) => (
              <img key={index} src={element} />
            ))}
          </div>
        ) : null}

        {data.description && data.description.toLowerCase() !== "untitled" && (
          <div className="description">
            <p>desc*:</p>
            <p>{data.description}</p>
          </div>
        )}

        <div className="tags">
          {tags.map((tag, index) => (
            <button
              key={`${tag}-${index}`}
              type="button"
              className="tagBtn" // add styling in css if you want
              onClick={() => onTagClick?.(tag)}
              disabled={!onTagClick}
              title={`Load tag: ${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
