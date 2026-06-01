import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReminders, deleteReminder } from "../api";

export default function HomeScreen({ navigation }) {
  const [reminders, setReminders] = useState([]);
  const [phone, setPhone] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadReminders = useCallback(async () => {
    try {
      const savedPhone = await AsyncStorage.getItem("userPhone");
      if (savedPhone) {
        setPhone(savedPhone);
        const data = await getReminders(savedPhone);
        setReminders(data);
      }
    } catch (err) {
      console.error("Failed to load reminders:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Reminder", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReminder(id);
            setReminders((prev) => prev.filter((r) => r.id !== id));
          } catch (err) {
            Alert.alert("Error", "Failed to delete reminder");
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.sent ? styles.cardSent : null]}>
      <View style={styles.cardContent}>
        <Text style={styles.cardMessage}>{item.message}</Text>
        <Text style={styles.cardTime}>{formatDate(item.remind_at)}</Text>
        {item.sent ? (
          <Text style={styles.sentBadge}>Sent</Text>
        ) : (
          <Text style={styles.pendingBadge}>Pending</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.deleteBtnText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Reminders</Text>
      {phone ? (
        <Text style={styles.subtitle}>For: {phone}</Text>
      ) : (
        <Text style={styles.subtitle}>
          Add a reminder to set your phone number
        </Text>
      )}

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No reminders yet. Tap + to add one!
          </Text>
        }
        contentContainerStyle={reminders.length === 0 && styles.emptyContainer}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddReminder")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSent: {
    opacity: 0.6,
  },
  cardContent: {
    flex: 1,
  },
  cardMessage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },
  sentBadge: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  pendingBadge: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "600",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF5252",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 40,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4A90D9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4A90D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 30,
  },
  empty: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
});
