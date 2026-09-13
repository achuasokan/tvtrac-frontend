import React, { useCallback, useEffect, useState, useRef } from "react";

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
}) => {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  const minValRef = useRef(value[0]);
  const maxValRef = useRef(value[1]);
  const trackRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external value if it changes
  useEffect(() => {
    setMinVal(value[0]);
    setMaxVal(value[1]);
    minValRef.current = value[0];
    maxValRef.current = value[1];
  }, [value]);

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(event.target.value), maxVal);
    setMinVal(v);
    minValRef.current = v;
    onChange([v, maxVal]);
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(event.target.value), minVal);
    setMaxVal(v);
    maxValRef.current = v;
    onChange([minVal, v]);
  };

  // Calculate percentage to position the active track
  const getPercent = useCallback(
    (v: number) => Math.round(((v - min) / (max - min)) * 100),
    [min, max]
  );

  const handleTrackClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = clickX / rect.width;
    const clickedValue = Math.round(min + percent * (max - min));
    
    const distToMin = Math.abs(clickedValue - minVal);
    const distToMax = Math.abs(clickedValue - maxVal);
    
    // Move the thumb that is closer to the click
    if (distToMin <= distToMax) {
      const v = Math.min(clickedValue, maxVal);
      setMinVal(v);
      minValRef.current = v;
      onChange([v, maxVal]);
    } else {
      const v = Math.max(clickedValue, minVal);
      setMaxVal(v);
      maxValRef.current = v;
      onChange([minVal, v]);
    }
  };

  const isFullRange = minVal === min && maxVal === max;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex justify-between items-center text-xs font-medium text-zinc-400 px-1">
        <span>{isFullRange ? "Any Year" : minVal}</span>
        {!isFullRange && <span>{maxVal}</span>}
      </div>
      <div 
        ref={trackRef}
        className="relative flex items-center h-4 w-full cursor-pointer"
        onPointerDown={handleTrackClick}
      >
        {/* Track Background */}
        <div className="absolute w-full h-1.5 bg-zinc-800 rounded-full z-0" />
        
        {/* Active Track Highlight */}
        <div 
          className="absolute h-1.5 bg-[#2dd4bf] rounded-full z-10 transition-all duration-75 shadow-[0_0_8px_rgba(45,212,191,0.4)]"
          style={{ 
            left: `${getPercent(minVal)}%`, 
            width: `${getPercent(maxVal) - getPercent(minVal)}%` 
          }}
        />

        {/* Inputs */}
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          onChange={handleMinChange}
          className="absolute w-full h-full appearance-none bg-transparent pointer-events-none z-20 outline-none
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#2dd4bf]
            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(45,212,191,0.5)] [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 
            [&::-moz-range-thumb]:border-[#2dd4bf] [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
          style={{ zIndex: minVal > max - 10 ? 30 : 20 }} // Bring thumb to front if they overlap near max
        />
        
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute w-full h-full appearance-none bg-transparent pointer-events-none z-20 outline-none
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#2dd4bf]
            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(45,212,191,0.5)] [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 
            [&::-moz-range-thumb]:border-[#2dd4bf] [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
        />
      </div>
    </div>
  );
};
