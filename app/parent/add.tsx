import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/store';
import { SUBJECTS, SUBJECT_ICONS } from '@/types';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/components/useTheme';

const XP_OPTIONS = [50, 100, 150, 200];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(20, 0, 0, 0);
  return d;
};

export default function AddTaskScreen() {
  const { c } = useTheme();
  const addTask = useAppStore((s) => s.addTask);
  const children = useAppStore((s) => s.children);

  const [subject, setSubject] = useState<string>('Математика');
  const [description, setDescription] = useState('');
  const [xpReward, setXpReward] = useState<number>(100);
  const [customXp, setCustomXp] = useState('');
  const [deadline, setDeadline] = useState<Date>(tomorrow());
  const [showPicker, setShowPicker] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);

  useEffect(() => {
    if (!childId && children.length > 0) setChildId(children[0].id);
  }, [children, childId]);

  const onChangeDate = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (date) setDeadline(date);
  };

  const handleSave = async () => {
    if (!childId) {
      Alert.alert(
        'Нет ребёнка',
        'Сначала пригласите ребёнка во вкладке «Семья», потом ставьте задания',
      );
      return;
    }
    if (!description.trim()) {
      Alert.alert('Опиши задание', 'Добавь описание, чтобы ребёнок понял, что делать');
      return;
    }
    const xp = customXp ? parseInt(customXp, 10) || xpReward : xpReward;
    const task = await addTask({
      subject,
      description: description.trim(),
      deadline: deadline.toISOString(),
      xpReward: xp,
      childId,
    });
    if (!task) {
      Alert.alert('Не сохранилось', 'Проверь интернет и попробуй ещё раз');
      return;
    }
    Alert.alert('Готово!', 'Задание создано и отправлено герою', [
      {
        text: 'Ок',
        onPress: () => {
          setDescription('');
          setCustomXp('');
          setXpReward(100);
          setDeadline(tomorrow());
          router.replace('/parent');
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.safe, { backgroundColor: c.bg }]}
    >
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {children.length > 1 && (
          <>
            <Text style={[styles.label, { color: c.text }]}>Кому задание</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.sm, paddingVertical: 4 }}
            >
              {children.map((ch) => {
                const active = childId === ch.id;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    onPress={() => setChildId(ch.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? Palette.parent.primary : c.card,
                        borderColor: active ? Palette.parent.primary : c.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="person"
                      size={14}
                      color={active ? '#fff' : c.text}
                    />
                    <Text
                      style={[styles.chipText, { color: active ? '#fff' : c.text }]}
                    >
                      {ch.displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        <Text
          style={[
            styles.label,
            { color: c.text, marginTop: children.length > 1 ? Spacing.lg : 0 },
          ]}
        >
          Предмет
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.sm, paddingVertical: 4 }}
        >
          {SUBJECTS.map((s) => {
            const active = s === subject;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSubject(s)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? Palette.parent.primary : c.card,
                    borderColor: active ? Palette.parent.primary : c.border,
                  },
                ]}
              >
                <Ionicons
                  name={(SUBJECT_ICONS[s] || 'book') as never}
                  size={14}
                  color={active ? '#fff' : c.text}
                />
                <Text
                  style={[styles.chipText, { color: active ? '#fff' : c.text }]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.label, { color: c.text, marginTop: Spacing.lg }]}>Описание</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Например: упражнение 142, стр. 78"
          placeholderTextColor={c.textMuted}
          style={[
            styles.textarea,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              color: c.text,
            },
          ]}
        />

        <Text style={[styles.label, { color: c.text, marginTop: Spacing.lg }]}>Награда XP</Text>
        <View style={styles.xpRow}>
          {XP_OPTIONS.map((opt) => {
            const active = !customXp && opt === xpReward;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  setXpReward(opt);
                  setCustomXp('');
                }}
                style={[
                  styles.xpChip,
                  {
                    backgroundColor: active ? Palette.child.primary : c.card,
                    borderColor: active ? Palette.child.primary : c.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : c.text }]}>
                  +{opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput
          value={customXp}
          onChangeText={(v) => setCustomXp(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          placeholder="Свой XP"
          placeholderTextColor={c.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              color: c.text,
              marginTop: Spacing.sm,
            },
          ]}
        />

        <Text style={[styles.label, { color: c.text, marginTop: Spacing.lg }]}>Дедлайн</Text>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            },
          ]}
        >
          <Ionicons name="calendar-outline" size={20} color={c.text} />
          <Text style={{ color: c.text, fontSize: 15 }}>
            {deadline.toLocaleDateString('ru-RU', {
              weekday: 'short',
              day: '2-digit',
              month: 'long',
            })}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={deadline}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
            minimumDate={new Date()}
          />
        )}

        <TouchableOpacity style={styles.save} onPress={handleSave}>
          <Ionicons name="rocket" size={20} color="#fff" />
          <Text style={styles.saveText}>Отправить квест герою</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  textarea: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  xpRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  xpChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
  },
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.parent.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    marginTop: Spacing.xl,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
