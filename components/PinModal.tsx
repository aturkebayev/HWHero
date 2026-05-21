import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from './useTheme';

type Props = {
  visible: boolean;
  expectedPin: string;
  onSuccess: () => void;
  onClose: () => void;
};

export const PinModal: React.FC<Props> = ({ visible, expectedPin, onSuccess, onClose }) => {
  const { c } = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = () => {
    if (pin === expectedPin) {
      reset();
      onSuccess();
    } else {
      setError('Неверный PIN. Попробуй ещё раз.');
      setPin('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        reset();
        onClose();
      }}
    >
      <KeyboardAvoidingView
        style={[styles.backdrop, { backgroundColor: c.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <Text style={[styles.title, { color: c.text }]}>Вход для родителя</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            Введите 4-значный PIN
          </Text>

          <TextInput
            value={pin}
            onChangeText={(v) => {
              setError(null);
              setPin(v.replace(/\D/g, '').slice(0, 4));
            }}
            keyboardType="number-pad"
            secureTextEntry
            autoFocus
            style={[
              styles.input,
              {
                borderColor: error ? Palette.status.rejected : c.border,
                color: c.text,
                backgroundColor: c.surface,
              },
            ]}
            placeholder="••••"
            placeholderTextColor={c.textMuted}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />

          {error && (
            <Text style={[styles.error, { color: Palette.status.rejected }]}>{error}</Text>
          )}

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, { borderColor: c.border }]}
              onPress={() => {
                reset();
                onClose();
              }}
            >
              <Text style={[styles.btnText, { color: c.text }]}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleSubmit}
            >
              <Text style={[styles.btnText, { color: '#fff' }]}>Войти</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  card: { borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center' },
  input: {
    borderWidth: 2,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  error: { fontSize: 13, textAlign: 'center' },
  row: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  btn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: Palette.parent.primary,
    borderColor: Palette.parent.primary,
  },
  btnText: { fontSize: 15, fontWeight: '600' },
});
