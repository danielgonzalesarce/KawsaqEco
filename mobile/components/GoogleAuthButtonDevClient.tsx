import Button from './ui/Button';
import { useGoogleSignInDevClient } from '../hooks/useGoogleSignInDevClient';

interface GoogleAuthButtonDevClientProps {
  clientId: string;
  label: string;
  loading: boolean;
  onToken: (idToken: string) => void | Promise<void>;
  onError: (message: string) => void;
}

export default function GoogleAuthButtonDevClient({
  clientId,
  label,
  loading,
  onToken,
  onError,
}: GoogleAuthButtonDevClientProps) {
  const { signInWithGoogle, googleReady } = useGoogleSignInDevClient(clientId);

  async function handlePress() {
    try {
      const token = await signInWithGoogle();
      await onToken(token);
    } catch (e: unknown) {
      onError((e as Error).message || 'No se pudo conectar con Google');
    }
  }

  return (
    <Button
      label={label}
      icon="logo-google"
      variant="outline"
      onPress={handlePress}
      loading={loading}
      disabled={!googleReady || loading}
      fullWidth
    />
  );
}
