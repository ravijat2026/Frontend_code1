import Image from 'next/image'
import React from 'react'
import image from '@/assets/Rectangle 25.png'
import { Star } from 'lucide-react';

const StarRating = ({ rating }: { rating: number }) => {
  const totalStars = 5;

  return (
    <div className="flex gap-1">
      {[...Array(totalStars)].map((_, index) => {
        const fillColor = index + 1 <= rating ? "#008080" : "gray"; // Teal for filled, Light gray for empty
        return <Star key={index} size={24} fill={fillColor} color={fillColor} />;
      })}
    </div>
  );
};

const HighRatedCard = () => {
  return (
    <div className='flex flex-col w-[300px] h-[300px] gap-4 p-8 bg-[#efe3d1] text-[#003F5C] rounded-2xl'>
        <Image src={image} alt='image' height={200} width={200}/>
        <p className='font-poppins text-[18px] font-medium'>Video Title Name 1</p>
        {/* ⭐ Star Rating Component */}
        <StarRating rating={3} />
    </div>
  )
}

export default HighRatedCard