import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
    return (
        <View style={styles.container}>
            <Image
                source={{ uri: 'https://via.placeholder.com/100' }}
                style={styles.avatar}
            />
            <Text style={styles.name}>Jerald Peritos</Text>
            <Text style={styles.email}>jerald@example.com</Text>
            <View style={styles.infoBox}>
                <Text style={styles.label}>Role:</Text>
                <Text style={styles.value}>Janitor</Text>
            </View>
            <View style={styles.infoBox}>
                <Text style={styles.label}>Joined:</Text>
                <Text style={styles.value}>March 2025</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', padding: 30, backgroundColor: '#fff', flex: 1 },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
    name: { fontSize: 20, fontWeight: 'bold' },
    email: { fontSize: 14, color: 'gray', marginBottom: 20 },
    infoBox: {
        flexDirection: 'row',
        marginVertical: 5,
    },
    label: { fontWeight: '600', marginRight: 5 },
    value: { color: '#333' },
});
