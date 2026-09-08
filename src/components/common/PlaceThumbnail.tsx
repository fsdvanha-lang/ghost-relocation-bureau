import React from 'react';
import castleImg from '../../assets/locations/place-1-castle.png';
import lighthouseImg from '../../assets/locations/place-2-lighthouse.png';
import libraryImg from '../../assets/locations/place-3-library.png';
import theaterImg from '../../assets/locations/place-4-theater.png';
import basementImg from '../../assets/locations/place-5-basement.png';
import cryptImg from '../../assets/locations/place-6-crypt.png';
import observatoryImg from '../../assets/locations/place-7-observatory.png';
import lakeMansionImg from '../../assets/locations/place-8-lake-mansion.png';

interface PlaceThumbnailProps {
  placeType?: string;
  placeId?: string;
  name?: string;
  className?: string;
}

const PLACE_ID_IMAGES: Record<string, string> = {
  'place-1': castleImg,
  'place-2': lighthouseImg,
  'place-3': libraryImg,
  'place-4': theaterImg,
  'place-5': basementImg,
  'place-6': cryptImg,
  'place-7': observatoryImg,
  'place-8': lakeMansionImg,
};

export const PlaceThumbnail: React.FC<PlaceThumbnailProps> = ({
  placeType = '',
  placeId = '',
  name = '',
  className = 'w-12 h-12 rounded-xl'
}) => {
  // Resolve image directly from id or by type/name matching
  let imageSrc = placeId ? PLACE_ID_IMAGES[placeId] : null;

  if (!imageSrc) {
    const lowerType = placeType.toLowerCase();
    const lowerName = name.toLowerCase();

    if (lowerType.includes('замок') || lowerName.includes('замок')) {
      imageSrc = castleImg;
    } else if (lowerType.includes('маяк') || lowerName.includes('маяк')) {
      imageSrc = lighthouseImg;
    } else if (lowerType.includes('библиотека') || lowerName.includes('библиотека')) {
      imageSrc = libraryImg;
    } else if (lowerType.includes('театр') || lowerName.includes('театр')) {
      imageSrc = theaterImg;
    } else if (lowerType.includes('подвал') || lowerType.includes('подземелье') || lowerName.includes('подвал')) {
      imageSrc = basementImg;
    } else if (lowerType.includes('склеп') || lowerName.includes('склеп')) {
      imageSrc = cryptImg;
    } else if (lowerType.includes('обсерватория') || lowerName.includes('обсерватория')) {
      imageSrc = observatoryImg;
    } else if (lowerType.includes('особняк') || lowerName.includes('особняк')) {
      imageSrc = lakeMansionImg;
    } else {
      imageSrc = castleImg;
    }
  }

  return (
    <div className={`relative overflow-hidden shrink-0 bg-[#0d1424] border border-[#1d2b45] shadow-md ${className}`}>
      <img
        src={imageSrc}
        alt={name || placeType || 'Локация'}
        className="w-full h-full object-cover scale-105 filter contrast-105 brightness-100"
        loading="lazy"
      />
    </div>
  );
};
