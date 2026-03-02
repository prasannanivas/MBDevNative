import React from 'react';
import Svg, { Path } from 'react-native-svg';

const BellIcon = ({ width = 24, height = 24, color = "#202020", ...props }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
      <Path 
        d="M12 3C10.3431 3 9 4.34315 9 6V7.29078C7.84614 7.88672 7 9.04098 7 10.3846V14.8824C7 15.5121 6.77544 16.1168 6.37061 16.5941L5.51645 17.5941C4.56872 18.6959 5.35614 20.5 6.76471 20.5H17.2353C18.6439 20.5 19.4313 18.6959 18.4835 17.5941L17.6294 16.5941C17.2246 16.1168 17 15.5121 17 14.8824V10.3846C17 9.04098 16.1539 7.88672 15 7.29078V6C15 4.34315 13.6569 3 12 3Z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Path 
        d="M10.5 20.5C10.5 21.6046 11.3954 22.5 12.5 22.5C13.6046 22.5 14.5 21.6046 14.5 20.5" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default BellIcon;
