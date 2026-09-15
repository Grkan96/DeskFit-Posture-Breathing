import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useThemeColors } from '../lib/theme';

export default function NameScreen({ onSubmit }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [name, setName] = useState('');
  const trimmed = name.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.emoji}>🧘</Text>
      <Text style={styles.title}>Hoş geldin!</Text>
      <Text style={styles.subtitle}>
        Hatırlatmaları kişiselleştirebilmemiz için sana nasıl seslenelim?
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="İsmin"
        placeholderTextColor={colors.faint}
        style={styles.input}
        autoFocus
        maxLength={24}
        returnKeyType="done"
        onSubmitEditing={() => trimmed && onSubmit(trimmed)}
      />

      <Pressable
        onPress={() => trimmed && onSubmit(trimmed)}
        disabled={!trimmed}
        style={({ pressed }) => [
          styles.button,
          !trimmed && styles.buttonDisabled,
          pressed && trimmed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>Devam Et</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emoji: {
      fontSize: 40,
      marginBottom: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 20,
    },
    input: {
      marginTop: 28,
      alignSelf: 'stretch',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    button: {
      marginTop: 16,
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: colors.borderStrong,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
