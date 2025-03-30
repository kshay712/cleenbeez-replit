import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  SquareSlash, 
  ShieldCheck, 
  Droplets, 
  CloudOff, 
  Beaker, 
  AlertOctagon, 
  Ban
} from "lucide-react";

export type FeatureType = 
  | "organic" 
  | "bpafree" 
  | "phthalate-free" 
  | "paraben-free" 
  | "oxybenzone-free" 
  | "formaldehyde-free" 
  | "sulfates-free" 
  | "fdc-free"
  | "features";

interface FeatureBadgeProps {
  type: FeatureType;
  className?: string;
  showIcon?: boolean;
  small?: boolean;
}

const featureInfo = {
  "organic": {
    label: "Organic",
    icon: Leaf,
    className: "bg-green-100 text-green-800 hover:bg-green-100"
  },
  "bpafree": {
    label: "BPA-Free",
    icon: SquareSlash,
    className: "bg-primary-100 text-primary-800 hover:bg-primary-100"
  },
  "phthalate-free": {
    label: "Phthalate-Free",
    icon: ShieldCheck,
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100"
  },
  "paraben-free": {
    label: "Paraben-Free",
    icon: Droplets,
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100"
  },
  "oxybenzone-free": {
    label: "Oxybenzone-Free",
    icon: CloudOff,
    className: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100"
  },
  "formaldehyde-free": {
    label: "Formaldehyde-Free",
    icon: Beaker,
    className: "bg-red-100 text-red-800 hover:bg-red-100"
  },
  "sulfates-free": {
    label: "Sulfates-Free",
    icon: AlertOctagon,
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100"
  },
  "fdc-free": {
    label: "FDC-Free",
    icon: Ban,
    className: "bg-lime-100 text-lime-800 hover:bg-lime-100"
  },
  "features": {
    label: "Features",
    icon: ShieldCheck,
    className: "bg-neutral-100 text-neutral-800 hover:bg-neutral-100"
  }
};

const FeatureBadge: React.FC<FeatureBadgeProps> = ({ 
  type, 
  className = "", 
  showIcon = true,
  small = false
}) => {
  const info = featureInfo[type] || featureInfo["features"];
  const Icon = info.icon;
  
  if (small) {
    return (
      <Badge className={`${info.className} px-1.5 py-px text-xs font-normal ${className}`}>
        {showIcon && <Icon className="mr-1 h-2.5 w-2.5" />}
        {info.label}
      </Badge>
    );
  }
  
  return (
    <Badge className={`${info.className} ${className}`}>
      {showIcon && <Icon className="mr-1 h-3.5 w-3.5" />}
      {info.label}
    </Badge>
  );
};

export default FeatureBadge;
