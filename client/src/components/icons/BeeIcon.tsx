interface BeeIconProps {
  className?: string;
}

const BeeIcon: React.FC<BeeIconProps> = ({ className = "h-6 w-6" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <path 
        d="M12 7C15.3137 7 18 9.68629 18 13C18 16.3137 15.3137 19 12 19C8.68629 19 6 16.3137 6 13C6 9.68629 8.68629 7 12 7Z"
        fill="currentColor"
      />
      
      {/* Wings */}
      <path
        d="M18 11C20.7614 11 23 9.65685 23 8C23 6.34315 20.7614 5 18 5C15.2386 5 13 6.34315 13 8C13 9.65685 15.2386 11 18 11Z"
        fill="currentColor"
        fillOpacity="0.7"
      />
      <path
        d="M6 11C8.76142 11 11 9.65685 11 8C11 6.34315 8.76142 5 6 5C3.23858 5 1 6.34315 1 8C1 9.65685 3.23858 11 6 11Z"
        fill="currentColor"
        fillOpacity="0.7"
      />
      
      {/* Stripes */}
      <path
        d="M10 13H14"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 16H15"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Antenna */}
      <path
        d="M9 7L7 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15 7L17 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default BeeIcon;
