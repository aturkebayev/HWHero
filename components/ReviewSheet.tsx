import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from './useTheme';
import { Task } from '@/types';

type Props = {
  task: Task | null;
  onClose: () => void;
  onApprove: (bonusCoins: number) => void;
  onReject: (comment: string) => void;
};

export const ReviewSheet: React.FC<Props> = ({ task, onClose, onApprove, onReject }) => {
  const { c } = useTheme();
  const [comment, setComment] = useState('');
  const [bonus, setBonus] = useState('');

  useEffect(() => {
    if (task) {
      setComment('');
      setBonus('');
    }
  }, [task]);

  const visible = task !== null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: c.overlay }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: c.card }]}>
          <View style={styles.grip} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.head}>
              <Text style={[styles.title, { color: c.text }]}>Проверка задания</Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            {task && (
              <>
                <Text style={[styles.subj, { color: c.text }]}>{task.subject}</Text>
                <Text style={[styles.desc, { color: c.textMuted }]}>{task.description}</Text>

                <View style={[styles.meta, { backgroundColor: c.surface }]}>
                  <Ionicons name="time-outline" size={18} color={c.textMuted} />
                  <Text style={[styles.metaText, { color: c.text }]}>
                    Потрачено времени: {Math.round(task.timeSpentSec / 60)} мин
                  </Text>
                </View>

                <Text style={[styles.label, { color: c.text }]}>Комментарий</Text>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Если возвращаете на доработку — опишите, что исправить"
                  placeholderTextColor={c.textMuted}
                  multiline
                  style={[
                    styles.input,
                    {
                      borderColor: c.border,
                      color: c.text,
                      backgroundColor: c.surface,
                      minHeight: 80,
                    },
                  ]}
                />

                <Text style={[styles.label, { color: c.text }]}>Бонусные монеты</Text>
                <TextInput
                  value={bonus}
                  onChangeText={(v) => setBonus(v.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0"
                  placeholderTextColor={c.textMuted}
                  keyboardType="number-pad"
                  style={[
                    styles.input,
                    {
                      borderColor: c.border,
                      color: c.text,
                      backgroundColor: c.surface,
                    },
                  ]}
                />

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.btn,
                      { borderColor: Palette.status.rejected, borderWidth: 2 },
                    ]}
                    onPress={() => {
                      if (!comment.trim()) {
                        setComment((s) => s);
                      }
                      onReject(comment.trim() || 'Доделай, пожалуйста.');
                    }}
                  >
                    <Ionicons name="arrow-undo" size={20} color={Palette.status.rejected} />
                    <Text style={[styles.btnText, { color: Palette.status.rejected }]}>
                      Вернуть
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: Palette.status.approved }]}
                    onPress={() => onApprove(parseInt(bonus, 10) || 0)}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={[styles.btnText, { color: '#fff' }]}>Одобрить</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: '88%',
  },
  grip: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '700' },
  subj: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  desc: { fontSize: 14, marginBottom: Spacing.md, lineHeight: 19 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  metaText: { fontSize: 14, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    marginBottom: Spacing.md,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  btnText: { fontSize: 15, fontWeight: '700' },
});
