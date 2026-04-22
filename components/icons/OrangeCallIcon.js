import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const OrangeCallIcon = ({ width = 43, height = 43 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 43 43" fill="none">
      <Circle cx="21.5" cy="21.5" r="21.5" fill="#F0913A" />
      <Path 
        d="M19.5025 14.2572C19.1987 13.4979 18.4633 13 17.6455 13H14.8947C13.8483 13 13 13.8481 13 14.8945C13 23.7892 20.2108 31 29.1055 31C30.1519 31 31 30.1516 31 29.1052L31.0005 26.354C31.0005 25.5361 30.5027 24.8009 29.7434 24.4971L27.1069 23.4429C26.4249 23.1701 25.6483 23.2929 25.0839 23.7632L24.4035 24.3307C23.6089 24.9929 22.4396 24.9402 21.7082 24.2088L19.7922 22.2911C19.0608 21.5596 19.0067 20.3913 19.6689 19.5967L20.2363 18.9163C20.7066 18.352 20.8305 17.5752 20.5577 16.8931L19.5025 14.2572Z" 
        stroke="#FDFDFD" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default OrangeCallIcon;
