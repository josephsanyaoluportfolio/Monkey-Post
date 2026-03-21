import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
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
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <View
          style={[
            s.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: isDark ? "#000" : "#0f172a",
            },
          ]}
        >
          <View style={s.iconRow}>
            <View
              style={[
                s.iconCircle,
                {
                  backgroundColor: confirmDestructive
                    ? "#fef2f2"
                    : isDark
                    ? "#14532d30"
                    : "#dcfce7",
                },
              ]}
            >
              <Feather
                name={confirmDestructive ? "alert-triangle" : "help-circle"}
                size={24}
                color={confirmDestructive ? "#ef4444" : colors.tint}
              />
            </View>
          </View>

          <Text style={[s.title, { color: colors.text }]}>{title}</Text>
          <Text style={[s.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          <View style={s.btnRow}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                s.btn,
                s.cancelBtn,
                {
                  backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={[s.btnText, { color: colors.textSecondary }]}>
                {cancelText}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                s.btn,
                s.confirmBtn,
                {
                  backgroundColor: confirmDestructive ? "#ef4444" : colors.tint,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[s.btnText, { color: "#fff" }]}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  iconRow: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  confirmBtn: {},
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
