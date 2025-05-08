import React from "react";
import {
  Grape,
  Fish as FishIcon,
  Drumstick as DrumstickIcon,
  Egg as EggIcon,
  Coffee,
  Salad as SaladIcon,
} from "lucide-react-native";
import { SvgProps } from "react-native-svg";

// Export icons with the expected names
export const AppleIcon = (props: SvgProps) => <Grape {...props} />;
export const Fish = (props: SvgProps) => <FishIcon {...props} />;
export const Drumstick = (props: SvgProps) => <DrumstickIcon {...props} />;
export const Egg = (props: SvgProps) => <EggIcon {...props} />;
export const Milk = (props: SvgProps) => <Coffee {...props} />;
export const Salad = (props: SvgProps) => <SaladIcon {...props} />;
