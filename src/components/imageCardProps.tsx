export interface ImageCardProps {
  url: string;
  title: string;
  tags: string[];
  id: string;
  aiCaption: string;
  description: string;
  aiTitle: string;
  aiVibe: string;
  aiPolitics: string;
  aiObjects: string;
  aiStory: string;
  parentIds: string;

  // the raw text the user originally typed into the uploader textarea,
  // reassembled from Cloudinary's source_title / source_title_continuation_N
  sourceTitle?: string;

  parentIds?: string[] | string;
  // ...whatever else is already there
}
