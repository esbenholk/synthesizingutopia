'use client';

import {Card} from '../app/components/Card';



type ImageCardProps = {
  url: string;
  title: string;

};




export default function Gallery({ news }: { news: ImageCardProps[] }) {

  

  return (


    <>
      {news.length > 0 && (
        <>
          {news.map((card, index) => (
            <div className="Card" key={index}>
                <Card 
                  url={card.url}
                  title={card.title}
           
                />
              </div>
            ))}
        </>
      )}

    </>
  );
}