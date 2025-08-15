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

          console.log("has url array", parsed);
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

  return (
    <>
      <div>
        <img src={data.url} alt={data.description} />
      </div>
      <div className="Info">
        {data.aiTitle && <p className="title"> "{data.aiTitle}"</p>}
        {data.aiPolitics && <p className="politics"> {data.aiPolitics}</p>}

        {data.aiStory && <p className="story"> "{data.aiStory}"</p>}

        {data.title && parentIds.length == 0 ? (
          <div className="input">
            <p>user input:</p>
            <p>{data.title === "_" ? "original image" : data.title}</p>
          </div>
        ) : parentIds.length > 0 ? (
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
              <>
                {" "}
                {index < 20 && (
                  <span key={index}>
                    {tag}
                    {/* {index !== tags.length - 1 && "--"} */}
                  </span>
                )}
              </>
            ))}
        </div>
      </div>
    </>
  );
};
