import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/ui/Button';
import GoogleAuthButton from '../components/GoogleAuthButton';
import TextField from '../components/ui/TextField';
import AuthScreenShell, { useAuthCompact } from '../components/auth/AuthScreenShell';
import AuthHero from '../components/auth/AuthHero';
import AuthModeTabs, { AuthMode } from '../components/auth/AuthModeTabs';
import { authStyles } from '../components/auth/authStyles';
import {
  formatPeruPhone,
  isValidEmail,
  phoneDigits,
} from '../components/auth/authUtils';
import { loginUser, loginPhone, loginGoogle, checkApiHealth } from '../services/api';
import { API_BASE_URL } from '../services/config';
import { setAuthSession } from '../services/auth';
import { createLocalDemoSession, USB_SETUP_HINT } from '../services/demoAuth';
import { ONBOARDING_STORAGE_KEY } from '../constants/onboarding';
import { DISTRITO_FOCO } from '../constants/santaAnita';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const LOGIN_BENEFITS = [
  { icon: 'star' as const, text: 'Puntos reales' },
  { icon: 'location' as const, text: DISTRITO_FOCO },
  { icon: 'gift' as const, text: 'Premios locales' },
];

export default function LoginScreen() {
  const router = useRouter();
  const compact = useAuthCompact();

  const [mode, setMode] = useState<AuthMode>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  useEffect(() => {
    checkApiHealth().then(setServerOk);
  }, []);

  const emailError = useMemo(() => {
    if (mode !== 'email' || !touched || !email.trim()) return undefined;
    return isValidEmail(email) ? undefined : 'Correo no válido';
  }, [email, mode, touched]);

  const phoneError = useMemo(() => {
    if (mode !== 'phone' || !touched || !phone.trim()) return undefined;
    const digits = phoneDigits(phone);
    return digits.length >= 9 ? undefined : 'Ingresa 9 dígitos';
  }, [mode, phone, touched]);

  const passwordError = useMemo(() => {
    if (!touched || !password) return undefined;
    return password.length >= 6 ? undefined : 'Mínimo 6 caracteres';
  }, [password, touched]);

  async function goAfterLogin() {
    const done = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    router.replace(done === 'true' ? '/(tabs)' : '/onboarding');
  }

  async function handleLogin() {
    setTouched(true);
    if (mode === 'email' && (!email.trim() || !isValidEmail(email))) {
      Alert.alert('Correo', 'Ingresa un correo válido.');
      return;
    }
    if (mode === 'phone' && phoneDigits(phone).length < 9) {
      Alert.alert('Teléfono', 'Ingresa un número de 9 dígitos.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Contraseña', 'Ingresa tu contraseña.');
      return;
    }

    setLoading(true);
    try {
      const res =
        mode === 'email'
          ? await loginUser(email.trim(), password)
          : await loginPhone(phoneDigits(phone), password);
      await setAuthSession(res);
      await goAfterLogin();
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleToken(googleToken: string) {
    setLoading(true);
    try {
      const res = await loginGoogle(googleToken);
      await setAuthSession(res);
      await goAfterLogin();
    } catch (e: unknown) {
      Alert.alert('Google', (e as Error).message || 'No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setLoading(true);
    try {
      const res = await loginUser('demo@kawsaqeco.com', 'demo1234');
      await setAuthSession(res);
      await goAfterLogin();
    } catch (e: unknown) {
      const msg = (e as Error).message || 'Error de conexión';
      Alert.alert(
        'No hay conexión al backend',
        msg + '\n\n' + USB_SETUP_HINT,
        [
          { text: 'Reintentar', onPress: () => handleDemoLogin() },
          {
            text: 'Demo offline',
            onPress: async () => {
              await setAuthSession(createLocalDemoSession());
              await goAfterLogin();
            },
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenShell>
      <AuthHero
        badge={`Programa piloto · ${DISTRITO_FOCO}`}
        title="Bienvenido de vuelta"
        subtitle={`Recicla, actúa, da vida en ${DISTRITO_FOCO}`}
        benefits={LOGIN_BENEFITS}
      />

      <View style={[authStyles.card, compact && authStyles.cardCompact]}>
        {serverOk === false ? (
          <View style={[styles.serverBanner, compact && styles.serverBannerCompact]}>
            <Text style={styles.serverBannerTitle}>Sin conexión al servidor</Text>
            {!compact && (
              <Text style={styles.serverBannerText}>
                {API_BASE_URL} — ejecuta npm run start:all con USB conectado
              </Text>
            )}
          </View>
        ) : null}

        <Text style={[authStyles.cardTitle, compact && authStyles.cardTitleCompact]}>Inicia sesión</Text>
        {!compact && <Text style={authStyles.cardHint}>Elige cómo quieres entrar a tu cuenta</Text>}

        <AuthModeTabs mode={mode} onChange={setMode} compact={compact} />

        {mode === 'email' ? (
          <TextField
            dense={compact}
            label="Correo electrónico"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched(true)}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="tu@correo.com"
            error={emailError}
          />
        ) : (
          <TextField
            dense={compact}
            label="Teléfono celular"
            icon="call-outline"
            value={phone}
            onChangeText={(v) => setPhone(formatPeruPhone(v))}
            onBlur={() => setTouched(true)}
            keyboardType="phone-pad"
            placeholder="987 654 321"
            hint={compact ? undefined : 'Perú (+51) · 9 dígitos'}
            error={phoneError}
          />
        )}

        <TextField
          dense={compact}
          label="Contraseña"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched(true)}
          secureTextEntry={!showPassword}
          autoComplete="password"
          placeholder="••••••••"
          error={passwordError}
          trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
          onTrailingPress={() => setShowPassword((v) => !v)}
        />

        <Button
          label="Entrar a KawsaqEco"
          icon="log-in-outline"
          onPress={handleLogin}
          loading={loading}
          fullWidth
        />

        <View style={[authStyles.divider, compact && authStyles.dividerCompact]}>
          <View style={authStyles.dividerLine} />
          <Text style={authStyles.dividerText}>o</Text>
          <View style={authStyles.dividerLine} />
        </View>

        <GoogleAuthButton
          label={compact ? 'Google' : 'Continuar con Google'}
          loading={loading}
          onToken={handleGoogleToken}
          onError={(msg) => Alert.alert('Google', msg)}
        />

        <TouchableOpacity style={[styles.demoLink, compact && styles.demoLinkCompact]} onPress={handleDemoLogin} disabled={loading}>
          <Text style={styles.demoLinkText}>Probar cuenta demo</Text>
        </TouchableOpacity>
      </View>

      <View style={[authStyles.footer, compact && authStyles.footerCompact]}>
        <Text style={authStyles.footerText}>¿Primera vez aquí?</Text>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={authStyles.link}>Crear cuenta gratis</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  serverBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  serverBannerCompact: {
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  serverBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.earth,
  },
  serverBannerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  demoLink: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  demoLinkCompact: { marginTop: SPACING.xs, paddingVertical: SPACING.xs },
  demoLinkText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
});
