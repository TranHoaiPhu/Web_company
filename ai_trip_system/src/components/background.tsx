import React from 'react'

function Background() {
  return (
    <div className="fixed w-full h-full -z-10">
      <div className="absolute top-14 left-24 text-white opacity-50 text-[10rem] animate-float-1">✈️</div>
      <div className="absolute top-4 right-14 text-white opacity-50 text-[10rem] animate-float-2">🏝️</div>
      <div className="absolute bottom-30 left-14 text-white opacity-50 text-[9rem] animate-float-3">🧳</div>
      <div className="absolute bottom-28 right-28 text-white opacity-50 text-[9rem] animate-float-5">🗺️</div>
      <div className="absolute top-4 left-1/3 text-white opacity-50 text-[9rem] animate-float-6">🚗</div>
      <div className="absolute bottom-48 right-1/3 text-white opacity-30 text-[9rem] animate-float-7">🏨</div>
      <div className="absolute top-72 left-58 text-white opacity-50 text-[9rem] animate-float-8">🌴</div>
      <div className="absolute bottom-72 right-52 text-white opacity-50 text-[9rem] animate-float-9">🚢</div>
      <div className="absolute bottom-0 left-0 right-0 flex text-white text-center"></div>
    </div>
  )
}

export default Background;