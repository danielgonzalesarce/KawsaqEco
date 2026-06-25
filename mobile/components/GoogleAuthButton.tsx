import { lazy, Suspense, useEffect, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Button from './ui/Button';
import { getAuthConfig } from '../services/api';
import { GOOGLE_WEB_CLIENT_ID } from '../constants/googleOAuth';

interface GoogleAuthButtonProps {
  label: string;
  loading: boolean;
  onToken: (idToken: string) => void | Promise<void>;
  onError: (message: string) => void;
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const EXPO_GO_MESSAGE =
  'Google no funciona en Expo Go.\n\nUsa la app KawsaqEco instalada (development build), no Expo Go.\n\nCompila con: npm run android:dev';

const LazyDevClientButton = lazy(() => import('./GoogleAuthButtonDevClient'));

export default function GoogleAuthButton(props: GoogleAuthButtonProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    getAuthConfig()
      .then((cfg) => {
        if (!mounted) return;
        const id = cfg.google_web_client_id || GOOGLE_WEB_CLIENT_ID;
        if (!id) {
          setStatus('error');
          setErrorMsg('Google no configurado');
          return;
        }
        setClientId(id);
        setStatus('ready');
      })
      .catch(() => {
        if (!mounted) return;
        if (GOOGLE_WEB_CLIENT_ID) {
          setClientId(GOOGLE_WEB_CLIENT_ID);
          setStatus('ready');
          return;
        }
        setStatus('error');
        setErrorMsg('Sin conexión al servidor para Google');
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (status === 'loading') {
    return (
      <Button
        label="Preparando Google…"
        icon="logo-google"
        variant="outline"
        disabled
        onPress={() => {}}
        fullWidth
      />
    );
  }

  if (status === 'error' || !clientId) {
    return (
      <Button
        label={errorMsg || 'Google no disponible'}
        icon="logo-google"
        variant="outline"
        disabled
        onPress={() => props.onError(errorMsg || 'Google no disponible')}
        fullWidth
      />
    );
  }

  if (isExpoGo) {
    return (
      <Button
        label="Google (requiere app nativa)"
        icon="logo-google"
        variant="outline"
        onPress={() => props.onError(EXPO_GO_MESSAGE)}
        loading={props.loading}
        disabled={props.loading}
        fullWidth
      />
    );
  }

  return (
    <Suspense
      fallback={
        <Button
          label="Preparando Google…"
          icon="logo-google"
          variant="outline"
          disabled
          onPress={() => {}}
          fullWidth
        />
      }>
      <LazyDevClientButton clientId={clientId} {...props} />
    </Suspense>
  );
}
