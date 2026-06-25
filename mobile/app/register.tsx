import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import GoogleAuthButton from '../components/GoogleAuthButton';
import TextField from '../components/ui/TextField';
import AuthScreenShell, { useAuthCompact } from '../components/auth/AuthScreenShell';
import AuthHero from '../components/auth/AuthHero';
import AuthModeTabs, { AuthMode } from '../components/auth/AuthModeTabs';
import { authStyles } from '../components/auth/authStyles';
import {
  formatPeruPhone,
  getPasswordStrength,
  isValidEmail,
  phoneDigits,
} from '../components/auth/authUtils';
import { registerUser, registerPhone, loginGoogle } from '../services/api';
import { setAuthSession } from '../services/auth';
import { DISTRITO_FOCO } from '../constants/santaAnita';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const REGISTER_BENEFITS = [
  { icon: 'star' as const, text: 'Gana puntos' },
  { icon: 'camera' as const, text: 'Escanea residuos' },
  { icon: 'gift' as const, text: 'Canjea premios' },
];

const STEPS = ['Nombre', 'Contacto', 'Clave', 'Confirmar', 'Términos'];

export default function RegisterScreen() {
  const router = useRouter();
  const compact = useAuthCompact();

  const [mode, setMode] = useState<AuthMode>('email');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [touched, setTouched] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  const formProgress = useMemo(() => {
    let steps = 0;
    if (nombre.trim().length >= 2) steps++;
    if (mode === 'email' ? isValidEmail(email) : phoneDigits(phone).length >= 9) steps++;
    if (password.length >= 6) steps++;
    if (passwordsMatch) steps++;
    if (acceptedTerms) steps++;
    return steps;
  }, [acceptedTerms, email, mode, nombre, password.length, passwordsMatch, phone]);

  const progressLabel = STEPS[Math.max(0, formProgress - 1)] ?? 'Empecemos';

  async function handleRegister() {
    setTouched(true);
    if (!nombre.trim() || nombre.trim().length < 2) {
      Alert.alert('Nombre', 'Ingresa tu nombre completo.');
      return;
    }
    if (mode === 'email' && !isValidEmail(email)) {
      Alert.alert('Correo', 'Ingresa un correo válido.');
      return;
    }
    if (mode === 'phone' && phoneDigits(phone).length < 9) {
      Alert.alert('Teléfono', 'Ingresa un número de 9 dígitos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'Usa al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Contraseñas', 'Las contraseñas no coinciden.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Términos', 'Acepta los términos para continuar.');
      return;
    }

    setLoading(true);
    try {
      const res =
        mode === 'email'
          ? await registerUser({
              nombre: nombre.trim(),
              email: email.trim(),
              password,
              distrito: DISTRITO_FOCO,
            })
          : await registerPhone({
              nombre: nombre.trim(),
              telefono: phoneDigits(phone),
              password,
              distrito: DISTRITO_FOCO,
            });
      await setAuthSession(res);
      router.replace('/onboarding');
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message || 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleToken(googleToken: string) {
    setLoading(true);
    try {
      const res = await loginGoogle(googleToken, nombre.trim() || undefined);
      await setAuthSession(res);
      router.replace('/onboarding');
    } catch (e: unknown) {
      Alert.alert('Google', (e as Error).message || 'No se pudo registrar con Google');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenShell topInset="sm" compact>
      <TouchableOpacity
        style={[authStyles.backBtn, compact && authStyles.backBtnCompact]}
        onPress={() => router.back()}
        accessibilityLabel="Volver"
      >
        <Icon name="arrow-back" size={22} color={COLORS.primary} />
        <Text style={authStyles.backText}>Volver</Text>
      </TouchableOpacity>

      <AuthHero
        badge="Únete al piloto"
        title="Crea tu cuenta"
        subtitle={`Recicla y canjea en ${DISTRITO_FOCO}`}
        benefits={compact ? undefined : REGISTER_BENEFITS}
        compact
      />

      <View style={[authStyles.card, authStyles.cardCompact]}>
        <View style={styles.cardHead}>
          <View style={styles.cardHeadText}>
            <Text style={[authStyles.cardTitle, authStyles.cardTitleCompact]}>Tus datos</Text>
            <Text style={[authStyles.cardHint, authStyles.cardHintCompact, styles.cardHintInline]}>
              {formProgress}/5 · {progressLabel}
            </Text>
          </View>
          <View style={styles.progressRow}>
            {[1, 2, 3, 4, 5].map(step => (
              <View
                key={step}
                style={[styles.progressDot, formProgress >= step && styles.progressDotActive]}
              />
            ))}
          </View>
        </View>

        <AuthModeTabs mode={mode} onChange={setMode} compact />

        <TextField
          dense
          label="Nombre completo"
          icon="person-outline"
          value={nombre}
          onChangeText={setNombre}
          onBlur={() => setTouched(true)}
          autoCapitalize="words"
          placeholder="Ej. María Quispe"
          error={touched && nombre.trim().length > 0 && nombre.trim().length < 2 ? 'Mínimo 2 caracteres' : undefined}
        />

        {mode === 'email' ? (
          <TextField
            dense
            label="Correo electrónico"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched(true)}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="tu@correo.com"
            error={touched && email.trim() && !isValidEmail(email) ? 'Correo no válido' : undefined}
          />
        ) : (
          <TextField
            dense
            label="Teléfono celular"
            icon="call-outline"
            value={phone}
            onChangeText={(v) => setPhone(formatPeruPhone(v))}
            onBlur={() => setTouched(true)}
            keyboardType="phone-pad"
            placeholder="987 654 321"
            hint={compact ? undefined : 'Perú (+51) · 9 dígitos'}
            error={
              touched && phone.trim() && phoneDigits(phone).length < 9
                ? 'Ingresa 9 dígitos'
                : undefined
            }
          />
        )}

        <TextField
          dense
          label="Contraseña"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="Mínimo 6 caracteres"
          trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
          onTrailingPress={() => setShowPassword((v) => !v)}
        />

        {password.length > 0 && (
          <View style={styles.strengthWrap}>
            <View style={styles.strengthTrack}>
              <View
                style={[styles.strengthFill, { width: strength.width, backgroundColor: strength.color }]}
              />
            </View>
            {!compact && (
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            )}
          </View>
        )}

        <TextField
          dense
          label="Confirmar contraseña"
          icon="shield-checkmark-outline"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showConfirm}
          placeholder="Repite tu contraseña"
          error={passwordsMismatch ? 'No coinciden' : undefined}
          trailingIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
          onTrailingPress={() => setShowConfirm((v) => !v)}
        />

        {passwordsMatch && !compact && (
          <View style={styles.matchRow}>
            <Icon name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.matchOk}>Las contraseñas coinciden</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAcceptedTerms(v => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
            {acceptedTerms && <Icon name="checkmark" size={14} color={COLORS.white} />}
          </View>
          <Text style={styles.termsText}>
            Acepto el programa KawsaqEco en {DISTRITO_FOCO}
          </Text>
        </TouchableOpacity>

        <Button
          label="Crear mi cuenta"
          icon="checkmark-circle"
          onPress={handleRegister}
          loading={loading}
          disabled={!acceptedTerms}
          fullWidth
        />

        <View style={[authStyles.divider, authStyles.dividerCompact]}>
          <View style={authStyles.dividerLine} />
          <Text style={authStyles.dividerText}>o</Text>
          <View style={authStyles.dividerLine} />
        </View>

        <GoogleAuthButton
          label="Google"
          loading={loading}
          onToken={handleGoogleToken}
          onError={(msg) => Alert.alert('Google', msg)}
        />
      </View>

      <View style={[authStyles.footer, authStyles.footerCompact]}>
        <Text style={authStyles.footerText}>¿Ya tienes cuenta?</Text>
        <TouchableOpacity onPress={() => router.replace('/login')}>
          <Text style={authStyles.link}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  cardHeadText: { flex: 1 },
  cardHintInline: { marginBottom: 0, marginTop: 2 },
  progressRow: { flexDirection: 'row', gap: 4, width: 72, marginTop: 4 },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  progressDotActive: { backgroundColor: COLORS.accent },
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: -4,
    marginBottom: SPACING.xs,
  },
  strengthTrack: {
    flex: 1,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: '800', minWidth: 52 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
    marginBottom: SPACING.sm,
  },
  matchOk: { fontSize: 13, color: COLORS.success, fontWeight: '700' },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  termsText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
});
