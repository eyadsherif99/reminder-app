import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createReminder } from "../api";

export default function AddReminderScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("userPhone").then((saved) => {
      if (saved) setPhone(saved);
    });
  }, []);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDate(newDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const handleSubmit = async () => {
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter your WhatsApp phone number");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Error", "Please enter a reminder message");
      return;
    }
    if (date <= new Date()) {
      Alert.alert("Error", "Please pick a time in the future");
      return;
    }

    setLoading(true);
    try {
      // Save phone for future use
      await AsyncStorage.setItem("userPhone", phone.trim());

      await createReminder(phone.trim(), message.trim(), date.toISOString());
      Alert.alert("Success", "Reminder created!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Error", "Failed to create reminder. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    d.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatTime = (d) =>
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>New Reminder</Text>

        <Text style={styles.label}>WhatsApp Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 14155551234 (country code, no +)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Remind me to...</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder="e.g. Call mom, Take medicine, Submit report"
          value={message}
          onChangeText={setMessage}
          multiline
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>When?</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateBtnText}>{formatDate(date)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateBtnText}>{formatTime(date)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker value={date} mode="time" onChange={onTimeChange} />
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? "Creating..." : "Set Reminder"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scroll: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    color: "#1a1a2e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateBtnText: {
    fontSize: 15,
    color: "#4A90D9",
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#4A90D9",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    shadowColor: "#4A90D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
});
