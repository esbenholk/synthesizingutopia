import React, { useEffect, useState } from 'react';
// import { emitImageUpdate } from '../socket';
import Gallery from './Gallery';
import { motion, AnimatePresence } from "framer-motion";

type ImageCardProps = {
  url: string;
  title: string;

};

export function Upload() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploadLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [succes, setSucces] = useState(false);


  const [isFetchingRecent, setIsFetchingRecent] = useState(false);
  const [error, setError] = useState<string>("");
  const [news, setNews] = useState<ImageCardProps[]>([]);
  const [loadIndex, setLoadIndex] = useState<number>(0);


    // Run fetchRecentImages on component mount
  useEffect(() => {
      console.log("renders comp");
      loadContent();
  }, []);

  const loadContent = async () =>{
    await fetchRecentImages();
  }

  const fetchRecentImages = async () => {
    setIsFetchingRecent(true);
    // setError(null);
    
    try {
      const response = await fetch(`/api/cloudinary/recent?skip=${loadIndex}limit=${10}`);
      const data = await response.json();
      let _tempNews = news;

      console.log("has images", data, data.length);
      
      if(data){
        for (let index = 0; index < data.length; index++) {
          const element = data[index];  
          
          const _imageCardProp: ImageCardProps = {
            title: element.title,
            url: element.url,
       
          };
          _tempNews.push(_imageCardProp);
        }
        // if(news.length > 0){
        //   for (let index = 0; index < news.length; index++) {
        //     _tempNews.push(news[index]);
        //   }
        // }


        setNews(_tempNews);
        setLoadIndex(loadIndex+10)
      } else {
        setIsFetchingRecent(false);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent images');
    } finally {
      setIsFetchingRecent(false);
    }
  };
  const showSucces= (duration = 1500) => {
    setSucces(true); // Show the div
    setTimeout(() => {
      setSucces(false); // Hide it after `duration` ms
    }, duration);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") {
      e.preventDefault();
      if (currentWord.trim()) {
        setWords([...words, currentWord.trim()]);
        setCurrentWord("");
      }
    }
  };

  const joinWithComma = (words: string[]): string => {
    return words.join(", ");
  };
  const generateImage = async () => {
    setLoading(true);


    if(text != "" || words.length > 0 ){
      try {
        const response = await fetch(`/api/generateImage?prompt=${encodeURIComponent(text||"utopias")}&adjectives=${encodeURIComponent(joinWithComma(words)||"")}`);
        const data = await response.json();
        

        console.log("data from gen", data);
        
        if (!response.ok) throw new Error(data.error || 'Generation failed');
        setImage(null);
        setGeneratedImage(data.imageUrl);     
        // setText(data.prompt);
  
      } catch (err) {
        // setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
       
      }
    } else {
        setError("wizard, u need to declare the generation");
        setLoading(false);
    }

  };
  const upLoadImage = async (_image: string) =>{
    try {
      setUploadLoading(true);
      console.log("uploads image file", _image, text);
      const response = await fetch(`/api/cloudinary/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: _image,
          sentence: text || "utopias",
          alt: text || "utopias",
          title: text || "utopias",
          tags: joinWithComma(words)
        }),

    
      });
  
      console.log("cloud res", response);
      
  
      if (!response.ok) {
        const data = await response.json();
        console.log("fails upload to cloud", data);
        setUploadLoading(false);
        throw new Error(data.error || 'Upload failed');
  
      } 

      const _imageCardProp: ImageCardProps = {
        title: text,
        url: _image,
   
      };

      poorImageIntoCouldron(_imageCardProp);
   
      



    } catch (err) {
      console.log("fails upload to cloud", err);
      setUploadLoading(false);
    } finally {
      console.log("ends upload to cloud");

      
      setLoading(false);
      setUploadLoading(false);
      setShowUpload(false);
      showSucces();
      setImage(null);
      setText("");
      setWords([]);
      setGeneratedImage(null);
 

    }


  }

  const handleRemoveWord = (index: number) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const poorImageIntoCouldron = (_image : ImageCardProps) => {

    let tempnews = news;
    tempnews.unshift(_image);
    setNews(tempnews);

    console.log(tempnews);
    setLoading(false);
    setUploadLoading(false);
    setShowUpload(false);
    showSucces();
    setImage(null);
    setGeneratedImage(null);
    setShowGallery(false);
    setLoading(false);
    setUploadLoading(false);
    setShowUpload(false);
    showSucces();
    setImage(null);
    setText("");
    setWords([]);
    setGeneratedImage(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("tries to submit image", image);
    
    if(image ){
      upLoadImage(image);
    } else if(generatedImage) {
      upLoadImage(generatedImage);
    
    } else {
      console.log("make error message");
      
    }

  };





  return (
    <div className="brew-container">
      <video 
            className={showGallery ? 'couldron openCouldronVideo' : 'couldron'}
            src={"https://res.cloudinary.com/dmwpm8iiw/video/upload/v1741863927/loopcouldron_svu0rw.mp4"} 
            autoPlay 
            loop 
            muted 
            playsInline
      />

      <div className={showGallery ? "GalleryContainer": "GalleryContainer hidden"}>
        <Gallery news={news} poorRemixedImageIntoCouldron={poorImageIntoCouldron}/>


        <button
  
          disabled={isFetchingRecent}
          onClick={()=> {
            fetchRecentImages();
            }
          }
          className="Button Loadmore"        >
          {isFetchingRecent ? 'expanding...' : 'Get more utopias'}
        </button>
      </div>

      <div className='buttons'>
        <button className={`btn ${showUpload ? 'lil' : '' }`} onClick={() => {

          console.log("check error1", error);
          
          if(showGallery){
            setShowGallery(false);
            setTimeout(() => {
                setShowUpload(true);
            }, 2000);
          } else {
            setShowUpload(!showUpload);
          }
          console.log("check error2", error);

          }}>add vision</button>
        {!showGallery && <button className={`btn ${showUpload ? 'lil' : '' }`} onClick={() => setShowGallery(!showGallery)}>explore visions</button>
      }
      </div>




      <img className={showGallery ? 'overlay openCouldron' : 'overlay'} src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1741865808/couldronoverlay_bg8osp.png"/>
      <div className='desktopborder1'></div>
      <div className='desktopborder2'></div>


      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="p-4 bg-gray-200 rounded-lg shadow-md"
          >
                  <div className="gooey-container">
           <div className={uploading ? 'shrinkgoo gooey': " gooey"}></div>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

       {showUpload && <>
        {error != "" &&
        <>
          <div className='errorMessage' onClick={()=> {
                setError("");
                setLoading(false);
                }
          }
             >
            <p>{error}</p>
          </div>
        </>}
 
        <form onSubmit={handleSubmit} className={uploading ? "uploading uploader" : "uploader"}>
        <button className="closebtn" onClick={()=> setShowUpload(false)}> X </button>
          <div className={error != "" ? 'textinputs error' : "textinputs"}>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="in my utopia there is..."
            />
          

       
          <input
            type="text"
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mt-2 p-2 border rounded-md"
            placeholder="or add some adjectives"
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
          <div className='imageResult'>
          {loading ? 
            <>
              <img src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1742059296/brewing_ruxhpm.gif"/>

            </>
            : image ? 
              <div>
                <button className="closebtn" onClick={()=> setImage(null)}> X </button>
                <img src={image} alt="Preview" className="subImage" />
              </div>
            :generatedImage ?
              <div>
                <button className="closebtn" onClick={()=> setGeneratedImage(null)}> X </button>
                <img src={generatedImage} alt="Generated" className="w-full rounded-lg" />
                  {/* <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => generateImage()}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      new vision
                    </button>
                    <button
                      onClick={() => upLoadImage()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      upload image
                    </button>
                  </div> */}
              
              </div>
            : null
            }
          </div>

          <div className='uploaderButtons'>
            <label htmlFor="image-upload" className={!loading ? 'imgUploadBtn active' : 'imgUploadBtn passive'}>
              {image ? 'change' : 'upload'}
            </label>
            <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
            />
            <button disabled={loading} className={!loading ? 'active' : 'passive'} onClick={()=> generateImage()}>{generatedImage ? 'regenerate' : 'generate'}</button>
            <button
              type="submit"
              // disabled={loading || (!text && !image)}
              className={loading ? "passive" : generatedImage ? 'active' : image ? 'active' : 'passive'}
            >
              {loading ? (
                'loading content'
              ) : (
                <>
                  poor into couldron
                </>
              )}
          </button>
          </div>

         

       
    
       
      </form>
      
      </>}
      {succes && 
       <div className='success'>
        <img src="https://res.cloudinary.com/dmwpm8iiw/image/upload/v1742061490/giphy_knfko7.gif"/>
        <p>*sympoetic thanx u*</p>
      </div>     
      }

    </div>
  );
}