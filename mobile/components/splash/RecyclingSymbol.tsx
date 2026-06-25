import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RecyclingSymbolProps {
  size?: number;
  color?: string;
}

export default function RecyclingSymbol({ size = 48, color = '#2E7D32' }: RecyclingSymbolProps) {
  return <MaterialCommunityIcons name="recycle" size={size} color={color} />;
}
