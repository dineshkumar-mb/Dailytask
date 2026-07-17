import { View, Text, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function AddTask() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a New Task</Text>
      <Text style={styles.subtitle}>This screen is presented as a modal!</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          color="gray"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    marginVertical: 10,
    width: '100%',
  }
});
