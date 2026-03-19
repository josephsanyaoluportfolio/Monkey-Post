import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[
            styles.dialog,
            { backgroundColor: colors.card, shadowColor: "#000" },
          ]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          ) : null}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={onCancel}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>
                {cancelText}
              </Text>
            </Pressable>
            <View style={[styles.btnDivider, { backgroundColor: colors.border }]} />
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={onConfirm}
            >
              <Text
                style={[
                  styles.btnText,
                  styles.btnConfirm,
                  confirmDestructive
                    ? { color: colors.danger }
                    : { color: colors.tint },
                ]}
              >
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  dialog: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 18,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    paddingTop: 22,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    lineHeight: 20,
  },
  divider: { height: 1 },
  buttons: { flexDirection: "row" },
  btnDivider: { width: 1 },
  btn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  btnConfirm: {
    fontFamily: "Inter_700Bold",
  },
});
