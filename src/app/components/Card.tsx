'use client';

type ImageCardProps = {
    url: string;
    title: string;

  };
  
export const Card: React.FC<ImageCardProps> = ({ url, title }) => {
    return (
        <>
            <div>
                <img src={url} alt={title}/>
            </div>
            <div className="Info">
                <p>{title}</p>
                {/* <div>
                    {tags && tags.map((tag, index) => (
                        <span
                        key={index}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                        >
                        {tag} 
                        {index !== tags.length -1 && "--"}
                        </span>
                    ))}
                </div> */}
            </div>
    </>
    );
  };
  
