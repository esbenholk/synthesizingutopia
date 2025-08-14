"use client";

import { ImageCardProps } from "@/components/imageCardProps";
import { useEffect, useState } from "react";

export const Card: React.FC<{ data: ImageCardProps }> = ({ data }) => {
  const [parentIds, setParentIds] = useState<string[]>([]);

  useEffect(() => {
    if (data.parentIds != null) {
      if (typeof data.parentIds === "string" && data.parentIds !== "") {
        try {
          const parsed = JSON.parse(data.parentIds);
          if (Array.isArray(parsed)) {
            setParentIds(parsed);
          }
        } catch (err) {
          console.error("Invalid parentIds JSON:", err);
        }
      }
    }
  }, [data]);

  return (
    <>
      <div>
        <img src={data.url} alt={data.description} />
      </div>
      <div className="Info">
        {data.aiTitle && <p className="title"> "{data.aiTitle}"</p>}
        {data.aiPolitics && <p className="politics"> {data.aiPolitics}</p>}

        {data.aiStory && <p className="story"> "{data.aiStory}"</p>}

        {data.title && data.parentIds == null ? (
          <div className="input">
            <p>user input:</p>
            <p>{data.title === "_" ? "original image" : data.title}</p>
          </div>
        ) : parentIds != null ? (
          <div className="input">
            <p>user input:</p>
            {parentIds.map((element, index) => (
              <img key={index} src={element} />
            ))}
          </div>
        ) : null}

        {data.description && data.description.toLowerCase() != "untitled" && (
          <div className="description">
            <p>desc*:</p>
            <p>{data.description}</p>
          </div>
        )}

        <div className="tags">
          {data.tags &&
            data.tags.map((tag, index) => (
              <span key={index}>
                {tag}
                {/* {index !== tags.length - 1 && "--"} */}
              </span>
            ))}
        </div>
      </div>
    </>
  );
};
