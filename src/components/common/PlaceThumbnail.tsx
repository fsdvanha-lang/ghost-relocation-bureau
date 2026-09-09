import React from 'react';
import castleImg from '../../assets/locations/place-1-castle.jpg';
import lighthouseImg from '../../assets/locations/place-2-lighthouse.jpg';
import libraryImg from '../../assets/locations/place-3-library.jpg';
import theaterImg from '../../assets/locations/place-4-theater.jpg';
import basementImg from '../../assets/locations/place-5-basement.jpg';
import cryptImg from '../../assets/locations/place-6-crypt.jpg';
import observatoryImg from '../../assets/locations/place-7-observatory.jpg';
import lakeMansionImg from '../../assets/locations/place-8-lake-mansion.jpg';

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

  // Specific hover animation classes based on location personality (Requirement 9)
  let hoverEffectClass = 'group-hover:scale-105';
  if (placeId === 'place-2' || placeType.toLowerCase().includes('маяк')) {
    hoverEffectClass = 'group-hover:brightness-125 group-hover:scale-105';
  } else if (placeId === 'place-3' || placeType.toLowerCase().includes('библиотека')) {
    hoverEffectClass = 'group-hover:contrast-115 group-hover:scale-103';
  } else if (placeId === 'place-4' || placeType.toLowerCase().includes('театр')) {
    hoverEffectClass = 'group-hover:brightness-110 group-hover:scale-105';
  }

  return (
    <div className={`group relative overflow-hidden shrink-0 bg-[#0d1424] border border-[#1d2b45] shadow-md transition-all duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}>
      <img
        src={imageSrc}
        alt={name || placeType || 'Локация'}
        className={`w-full h-full object-cover scale-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${hoverEffectClass}`}
        loading="lazy"
      />
      {/* Subtle sheen overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40 group-hover:opacity-10 transition-opacity duration-220 pointer-events-none" />
    </div>
  );
};
