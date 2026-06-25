import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LeavesToBinScene from './LeavesToBinScene';
import { COLORS } from '../../constants/theme';

interface AppLoadingScreenProps {
  message?: string;
}

export default function AppLoadingScreen({ message = 'Cargando...' }: AppLoadingScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LeavesToBinScene bottomInset={insets.bottom} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B7E4C7',
  },
  text: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 15,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
});
